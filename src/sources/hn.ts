/**
 * Hacker News "Ask HN: Who is hiring?" (monthly thread posted by `whoishiring` on the 1st) via the public Algolia HN API (no key):
 *   thread:   GET https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=%22who%20is%20hiring%22&hitsPerPage=4
 *             -> hits[] { objectID, title: "Ask HN: Who is hiring? (September 2026)", created_at, num_comments }, newest first
 *   comments: GET https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_<id>&hitsPerPage=200&page=N   (newest first)
 *             -> hits[] { objectID, parent_id, story_id, author, created_at, created_at_i, comment_text }, nbHits, nbPages
 *             comment_text is HTML: entities (&#x2F; &#x27; &amp;), <p> between paragraphs (no </p>), <a href="…">shortened…</a> links.
 * Every top-level comment (parent_id == thread id) is one company's posting in free text, by convention
 * "Company (YC S26) | Role, Role | REMOTE (US, Europe) | Full-time | $150k–$200k | https://…"; replies and job seekers who paste the
 * "Who wants to be hired" template (Location:/Remote:/Willing to relocate:) are skipped. Only postings mentioning every `hn.keywords`
 * regex (default "remote") are kept – "no remote" / "ONSITE" postings still pass and are rejected by the matcher on `remote`.
 * Header parsing (first paragraph): split on "|" (a pipe-less line is split on " — " / " - " / " · "), a part that is a sentence is cut at
 * its first full stop ("Remote (US) First with offices in NYC. We’re building…" -> "Remote (US) First with offices in NYC"). The company is
 * the first part (parenthetical and URL stripped: "Enveritas (YC S18, non-profit)" -> "Enveritas"); a prose first line gives it via
 * "At X …" / "hiring at X" / "X builds …" / "X - …", else the host of the careers link ("close.com"; ATS/form hosts excluded). The title
 * is the first role-like part, else "we're hiring a Senior PM to…" in the body, else the first role-like body line ("- Rust Backend
 * Engineers", "Hiring: VIN Decode Engineer, …"), else the careers-link slug ("…/7563920-senior-data-engineer" -> "Senior Data Engineer"),
 * else the first sentence of the body. Location-like parts become `locations` and decide `remote` (remote wins over hybrid/onsite when
 * both are offered). postedAt is the comment's created_at (not the thread's, so the 7-day baseline works within the month); url = first
 * careers/ATS link, else first link (employer page), sourceUrl = the HN comment; the whole comment is the description. Startups (AI,
 * health-tech) post here that never reach the boards; the matcher's rules decide relevance.
 */
import { CONFIG } from "../config.ts";
import { decodeEntities, fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { EmploymentKind, Job, RemoteType, SearchCtx } from "../types.ts";

interface Hit { objectID: string; created_at?: string; created_at_i?: number; comment_text?: string; parent_id?: number; story_id?: number; title?: string; author?: string }

const PAGE = 200;
const URL_RE = /^(https?:\/\/|www\.)|^[\w-]+(\.[\w-]+)*\.(com|io|ai|co|dev|org|net|app|xyz|fm|us|uk|de|gg|pe|tech|health|inc|space)(\/\S*)?$/i;
const ROLE_RE = /\b(engineers?|developers?|scientists?|managers?|designers?|researchers?|analysts?|lead|head of|directors?|cto|ceo|coo|architects?|specialists?|consultants?|writers?|marketers?|recruiters?|interns?|staff|roles?|positions?|openings?|swes?|pms?|gtm|sales|ops|operations|support|success|trainers?|coordinators?|associates?|president|partners?|officers?|psychologists?|therapists?|coach(es)?|counsell?ors?|engineering|science|design|product|marketing|research|devops|sre|fde|mts|technical)\b/i;
const REM_RE = /\b(remote|on-?\s?site|hybrid|in[- ]person|anywhere|worldwide|wfh|distributed)\b/i;
const REM_START_RE = /^(√ |fully |100% |all )?(remote|on-?\s?site|hybrid|in[- ]person)\b/i;
/** "INTERNS, HYBRID/REMOTE, Zurich, Switzerland": a remote word followed by ", Country" is a location even when a role word slipped in. */
const REM_PLACE_RE = /\b(remote|hybrid|on-?\s?site)\b.*,\s*[A-Z][A-Za-z .'-]{2,}$/i;
const META_RE = /^[~$€£]|^\d[\d,.]*\s?(k\b|%|\+|x\b|hrs?\b|hours|days?|years?|yrs?|[–-]\s?[$€£]?\d)|[$€£]\s?\d|\d+ ?k\b|\b(usd|eur|gbp|cad|chf|salary|equity|compensation|comp|visa|sponsorship|relocation|profitable|pmf|seed|series [a-z]|yc ?[ws]\d\d)\b/i;
const EMP_RE = /\b(full|part)[- ]?time\b|^(ft|fulltime|parttime)$|\b(contract(or)?|freelance|b2b|intern(ship)?s?|permanent)\b|\d+ ?(hrs|hours)\s*(\/|per|a)\s*(wk|week)/i;
const PLACE_RE = /\b(us|usa|u\.s\.?a?|uk|eu|emea|apac|latam|europe|americas?|nyc|sf|bay area|canada|india|time ?zones?|overlap|global|earth)\b/i;
const CITY_RE = /^[A-Z][\w.'’&\/ -]{1,30}(, [A-Z][\w.'’ -]{1,30})?, ([A-Z]{2}|[A-Z][a-z]+(?: [A-Z][a-z]+)?)$/;
/** A role heading is short and not a sentence ("all roles fully remote, but some US-only as noted." is not a title). */
const PROSE_RE = /\b(we|our|you|your|the|but|is|are|looking|seeking|join|several)\b|[.!?]$/i;
/** "Remote (US) First with offices in NYC and SF. We’re building…" -> first sentence (>= 20 chars, so "Sr. Engineer" / "St. Jude" stay whole). */
const firstSentence = (p: string) => p.replace(/^(.{20,}?[^.\s])[.!?]\s+(?=[A-Z]).*$/s, "$1").trim();
const kindOf = (p: string) => URL_RE.test(p) ? "url" : REM_START_RE.test(p) || REM_PLACE_RE.test(p) ? "loc" : ROLE_RE.test(p) && !PROSE_RE.test(p) ? "role" : REM_RE.test(p) ? "loc" : (PROSE_RE.test(p) && p.length > 40) || p.length > 100 ? "text" : META_RE.test(p) ? "meta" : EMP_RE.test(p) ? "emp" : PLACE_RE.test(p) || CITY_RE.test(p) ? "loc" : "other";
const splitHead = (head: string, sep: RegExp) => head.split(sep).map((p) => firstSentence(p.trim())).filter(Boolean);
const stripUrls = (s: string) => s.replace(/https?:\/\/[^\s)]+|\bwww\.[^\s)]+/gi, "").replace(/\(\s*\)/g, "").replace(/\s+/g, " ").trim();
/** "Pango (YC S26)" | "Snout https://snout.com/" | "*Fastly" -> company name. */
const cleanCompany = (s: string) => stripUrls(s).replace(/\s*\([^)]*\)\s*$/, "").replace(/^[*•\-–—\s]+|[*:,\s]+$/g, "").slice(0, 80);
/** "Roles: [Engineering Manager, Robotics Lead]" | "Hiring: Senior Mobile Developer" -> the roles. */
const cleanTitle = (s: string) => stripUrls(s).replace(/^(open )?(roles?|positions?|openings?|hiring|we(?:'|’)re hiring(?: for)?)\s*:\s*/i, "").replace(/^\[(.*)\]$/, "$1").replace(/[\s:,;—–-]+$/, "").slice(0, 120);
const EMPLOYMENT: Array<[EmploymentKind, RegExp]> = [
  ["full-time", /\bfull[- ]?time\b|\bft\b|\bfulltime\b/i], ["part-time", /\bpart[- ]?time\b|\d+\s?[–-]\s?\d+ ?(hrs|hours)\s*(\/|per|a)\s*(wk|week)/i],
  ["contract", /\bcontract(or)?\b|\bb2b\b|\b1099\b/i], ["freelance", /\bfreelanc/i], ["internship", /\bintern(ship)?s?\b/i],
];
/** Job seekers sometimes paste the "Who wants to be hired" template into the hiring thread. */
const SEEKER_RE = /^\s*location:[^\n]*\n\s*remote:|\bwilling to relocate:/i;
const JOB_LINK_RE = /careers?|jobs?\b|apply|hiring|positions?|greenhouse|grnh\.se|lever\.co|ashbyhq|workable|bamboohr|teamtailor|recruitee|personio|smartrecruiters|notion\.site/i;
/** Hosts that are never the employer (ATS, forms, social) – no company name from them. */
const NOT_COMPANY_HOST_RE = /ycombinator|forms\.gle|google\.com|notion\.(site|so)|youtube|youtu\.be|linkedin|ashbyhq|greenhouse|grnh\.se|lever\.co|workable|bamboohr|teamtailor|recruitee|personio|smartrecruiters|gem\.com|curriculo|join\.com|oraclecloud|workday|jobvite|icims|rippling|breezy|applytojob|wellfound|angel\.co|github|x\.com|twitter|calendly|typeform|airtable|adp\.com|stavros|hnhiring|dover\.com|homerun|pinpointhq|jobs\.polymer|hire\.|apply\./i;

/** Remote / hybrid / on-site from the location-like parts of the first line ("HYBRID (NYC) or REMOTE" -> remote, "ONSITE (part remote)" -> hybrid). */
function remoteOf(l: string): RemoteType {
  if (!l) return "unknown";
  if (/^(√ |fully |100% |all )?remote\b|(\bor|\/|,|;|&|\band|\bopen to|\+|\||:|[–—-])\s*(fully |100% )?remote\b|\bremote[- ]first|\bfully remote|100% remote|\banywhere\b|\bworldwide\b|\bwfh\b/.test(l)) return "remote";
  if (/hybrid|part(ial(ly)?)?[ -]remote|remote (possible|ok|friendly|optional)|\d ?(days?|x)\s*(\/|per|a)?\s*(wk|week)|in[- ]office|home office/.test(l)) return "hybrid";
  if (/on-?\s?site|in[- ]person|office/.test(l)) return "onsite";
  return "unknown";
}

/** Company from a prose first line: "At Tether (https://…) we're hiring!", "We’re hiring at Langfuse — …", "Beacon AI builds …", "DuckDuckGo - all roles …". */
function companyFromProse(head: string): string {
  const name = "([A-Z][\\w.&'’-]*(?: [A-Z&][\\w.&'’-]*){0,3})";
  const m = head.match(new RegExp(`^(?:At|Join) ${name}`)) ?? head.match(new RegExp(`\\b(?:hiring|roles?|positions?|join(?:ing)?|engineers?|team) (?:at|for|with) ${name}`))
    ?? head.match(new RegExp(`^${name} (?:\\([^)]*\\) )?(?:-|–|—|·|is|are|builds?|makes|helps|provides|offers|develops|creates|was|has)\\b`));
  return m ? cleanCompany(m[1]) : "";
}

/** "https://careers.reef.pl/?utm=…" -> "reef.pl"; ATS / form / social hosts give nothing. */
function hostCompany(url: string): string {
  try { const h = new URL(url).hostname.replace(/^(www|careers?|jobs?|apply|join|boards?|work|talent|team|hiring)\./, ""); return NOT_COMPANY_HOST_RE.test(h) ? "" : h; } catch { return ""; }
}

/** "We’re hiring a Senior Product Manager to oversee…" | "Looking for extremely talented / passionate Rust developers / Backend Engineers with…" -> the role. */
function inlineRole(lines: string[]): string | undefined {
  const RE = /\b(?:[Hh]iring|[Ll]ooking for|[Ss]eeking|[Ss]earching for)(?:\s+(?:an?|for|multiple|several|two|three|\d+|extremely|very|highly|experienced|talented|passionate|exceptional|strong|great|senior|remote|full[- ]time|part[- ]time)\s*\/?)*\s+([A-Z][^.;:!?()\n]{3,120}?)(?=\s+(?:to|who|with|for|in|at|that|across|based|located)\b|\s*[.;:!?(]|$)/;
  for (const l of lines.slice(0, 12)) {
    const role = l.match(RE)?.[1]?.trim();
    if (role && ROLE_RE.test(role) && !/[.!?]$/.test(role) && !/\b(we|our|you|your|us)\b/i.test(role)) return role;
  }
  return undefined;
}

/** First body line that reads like a role heading: "- Rust Backend Engineers", "Head of Engineering — Own…", "Hiring: Senior Mobile Developer", "++ iOS Engineer [Swift]". */
function roleLine(lines: string[]): string | undefined {
  for (const raw of lines.slice(1, 40)) {
    if (/:$/.test(raw)) continue; // "Open Roles (REMOTE):" – a heading that introduces the list, not a role
    const l = firstSentence(stripUrls(raw.replace(/^[-•*+>√]+\s*|^(hiring|roles?|open roles|we(’|')re hiring( for)?):\s*/i, "").split(/\s+[—–-]\s+|:\s|\s\|\s|\s\[/)[0])).replace(/[\s:,;—–-]+$/, "");
    if (l.length > 80 && !(/,/.test(l) && !/\s(for|with|in|of|on|at|by|from|into|across)\s/i.test(l))) continue; // long: only a comma list of roles, not a sentence
    if (l.length >= 4 && l.length <= 120 && ROLE_RE.test(l) && !/[.!?]$/.test(l) && !/\b(we|our|you|your|us|is|are|the|an?|i|i(?:'|’)m|hi|hello|hey)\b/i.test(l) && !/^(open )?(roles?|positions?|openings?|hiring|jobs?)$/i.test(l.replace(/\s*\(.*\)$/, ""))) return l;
  }
  return undefined;
}

/** ".../jobs/7563920-senior-data-engineer-data-platform?x=1" -> "Senior Data Engineer Data Platform" (only when the slug has a role word). */
function slugTitle(url: string): string | undefined {
  const seg = url.split(/[?#]/)[0].split("/").filter(Boolean).pop() ?? "";
  if (/^[\w-]+\.\w+$/.test(seg) && !/-/.test(seg)) return undefined; // bare host
  const words = seg.replace(/\.[a-z]+$/i, "").replace(/[0-9a-f]{8,}/gi, "").split(/[-_+]+/).filter((w) => w && !/^\d+$/.test(w));
  const t = words.join(" ");
  return words.length >= 2 && words.length <= 8 && ROLE_RE.test(t) ? t.replace(/\b[a-z]/g, (c) => c.toUpperCase()) : undefined;
}

/** One top-level comment -> Job (null = not a posting we keep). Pure: throws only on a truly odd comment, the caller counts those. */
function parse(h: Hit, keywords: RegExp[]): Job | null | "seeker" {
  const raw = h.comment_text ?? "";
  const text = htmlToText(raw.replace(/<p>/gi, "\n")); // HN uses <p> as a separator (no </p>) – one decode pass inside htmlToText
  if (!text || !keywords.every((k) => k.test(text))) return null;
  if (SEEKER_RE.test(text)) return "seeker";
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const head = lines[0] ?? "";
  let parts = splitHead(head, /\s*\|\s*/);
  const piped = parts.length >= 2;
  if (!piped) parts = splitHead(head, /\s+[—–]\s+|\s+-\s+|\s+·\s+/); // "Software Engineer — Remote (US Only)", "DuckDuckGo - all roles fully remote…"
  const first = parts[0] ?? "", k0 = kindOf(first.replace(/\s*\([^)]*\)\s*$/, "")), rest = parts.slice(1), kinds = rest.map(kindOf);
  const roles = rest.filter((_, i) => kinds[i] === "role"), others = rest.filter((_, i) => kinds[i] === "other");
  const headRole = k0 === "role" && roles.length === 0; // "Senior Python Backend Engineer | REMOTE (EMEA/APAC)" – no company given
  const hrefs = [...raw.matchAll(/href="([^"]+)"/g)].map((m) => decodeEntities(m[1])).filter((u) => /^https?:\/\//i.test(u) && !/ycombinator\.com/i.test(u));
  const hnUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
  const url = hrefs.find((u) => JOB_LINK_RE.test(u)) ?? hrefs[0] ?? text.match(/https?:\/\/[^\s)>\]]+/)?.[0] ?? hnUrl; // hrefs first: HN shortens the visible link text with "…"
  let company = headRole ? "" : !piped ? companyFromProse(head) || (k0 === "other" && first.length <= 40 ? cleanCompany(first) : "") // prose / dash-split line: "We’re hiring at Langfuse — …"
    : k0 === "loc" || k0 === "meta" || k0 === "text" || /^https?:/i.test(first) ? cleanCompany(others.shift() ?? "") : cleanCompany(first);
  company ||= companyFromProse(head) || hostCompany(url) || hrefs.map(hostCompany).find(Boolean) || ""; // "Remote (US) Close (https://close.com) | …" – employer link beside the ATS one
  const title = cleanTitle(roles[0] ?? (headRole ? first : undefined) ?? inlineRole(lines) ?? roleLine(lines) ?? others[0] ?? slugTitle(url) ?? firstSentence(lines.find((l) => l !== head && !/^https?:/i.test(l)) ?? head));
  if (!title) return null;
  const locations = [...(k0 === "loc" ? [first] : []), ...rest.filter((_, i) => kinds[i] === "loc")].map((l) => stripUrls(l).replace(/^[√•*\s]+/, "").slice(0, 80)).filter(Boolean);
  const id = `hn:${h.objectID}`;
  return {
    source: "hn", id, url, sourceUrl: url === hnUrl ? undefined : hnUrl,
    title, company, locations, remote: remoteOf(locations.join(" | ").toLowerCase()),
    employment: EMPLOYMENT.filter(([, r]) => r.test(head)).map(([k]) => k),
    salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(h.created_at ?? h.created_at_i ?? null), description: truncate(text), tags: ["hn"],
  };
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const stories = await fetchJson<{ hits?: Hit[] }>("https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=%22who%20is%20hiring%22&hitsPerPage=4");
  const thread = (stories.hits ?? []).find((h) => /who is hiring/i.test(h.title ?? ""));
  if (!thread) throw new Error("current 'Who is hiring' thread not found");
  ctx.log(`[hn] thread: ${thread.title} (${thread.objectID}, ${toIso(thread.created_at)?.slice(0, 10)})`);
  const keywords = CONFIG.hn.keywords.map((k) => new RegExp(k, "i"));
  const out = new Map<string, Job>();
  let seen = 0, top = 0, seekers = 0, bad = 0;
  for (let page = 0; seen < CONFIG.hn.maxComments; page++) {
    let res: { hits?: Hit[]; nbPages?: number };
    try { res = await fetchJson(`https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_${thread.objectID}&hitsPerPage=${PAGE}&page=${page}`); }
    catch (e) { ctx.log(`[hn] page ${page}: ${(e as Error).message}`); break; } // keep what we have
    const hits = res.hits ?? [];
    for (const h of hits) {
      seen++;
      if (Number(h.parent_id) !== Number(thread.objectID)) continue; // only top-level postings
      top++;
      try {
        const job = parse(h, keywords);
        if (job === "seeker") seekers++;
        else if (job) out.set(job.id, job);
      } catch (e) { if (++bad === 1) ctx.log(`[hn] comment ${h.objectID}: ${(e as Error).message}`); } // one odd comment never kills the source
    }
    const oldest = hits[hits.length - 1];
    if (hits.length < PAGE || page + 1 >= (res.nbPages ?? 1)) break;
    if (oldest?.created_at && new Date(oldest.created_at) < ctx.since) break; // newest first: everything further back is before the baseline
    await sleep(600);
  }
  ctx.log(`[hn] ${seen} comments read, ${top} top-level postings, ${seekers} job-seeker templates skipped${bad ? `, ${bad} unparsable` : ""}, ${out.size} remote postings kept`);
  return [...out.values()];
}
