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
 * regex (default "remote") are kept. The first paragraph is split on "|": the company is the first part, the title the first part that
 * looks like a role (else the first role-like line of the body: "- Rust Backend Engineers", "Head of Engineering — …"), location-like
 * parts become `locations` and decide `remote`; the whole comment is the description; postedAt is the comment's created_at (not the
 * thread's, so the 7-day baseline works within the month); url = first careers/ATS link, else first link (employer page), sourceUrl = the
 * HN comment. Startups (AI, health-tech) post here that never reach the boards; the matcher's rules decide relevance.
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
const META_RE = /^[~$€£]|^\d|[$€£]\s?\d|\d+ ?k\b|\b(usd|eur|gbp|cad|chf|salary|equity|compensation|comp|visa|sponsorship|relocation|profitable|pmf|seed|series [a-z]|yc ?[ws]\d\d)\b/i;
const EMP_RE = /\b(full|part)[- ]?time\b|^(ft|fulltime|parttime)$|\b(contract(or)?|freelance|b2b|intern(ship)?s?|permanent)\b|\d+ ?(hrs|hours)\s*(\/|per|a)\s*(wk|week)/i;
const PLACE_RE = /\b(us|usa|u\.s\.?a?|uk|eu|emea|apac|latam|europe|americas?|nyc|sf|bay area|canada|india|time ?zones?|overlap|global|earth)\b/i;
const CITY_RE = /^[A-Z][\w.'’&\/ -]{1,30}(, [A-Z][\w.'’ -]{1,30})?, ([A-Z]{2}|[A-Z][a-z]+(?: [A-Z][a-z]+)?)$/;
const kindOf = (p: string) => URL_RE.test(p) ? "url" : REM_START_RE.test(p) ? "loc" : ROLE_RE.test(p) ? "role" : REM_RE.test(p) ? "loc" : META_RE.test(p) ? "meta" : EMP_RE.test(p) ? "emp" : PLACE_RE.test(p) || CITY_RE.test(p) ? "loc" : "other";
const stripUrls = (s: string) => s.replace(/https?:\/\/[^\s)]+|\bwww\.[^\s)]+/gi, "").replace(/\(\s*\)/g, "").replace(/\s+/g, " ").trim();
/** "Pango (YC S26)" | "Snout https://snout.com/" | "*Fastly" -> company name. */
const cleanCompany = (s: string) => stripUrls(s).replace(/\s*\([^)]*\)\s*$/, "").replace(/^[*•\-–—\s]+|[*:,\s]+$/g, "").slice(0, 80);
const EMPLOYMENT: Array<[EmploymentKind, RegExp]> = [
  ["full-time", /\bfull[- ]?time\b|\bft\b|\bfulltime\b/i], ["part-time", /\bpart[- ]?time\b|\d+\s?[–-]\s?\d+ ?(hrs|hours)\s*(\/|per|a)\s*(wk|week)/i],
  ["contract", /\bcontract(or)?\b|\bb2b\b|\b1099\b/i], ["freelance", /\bfreelanc/i], ["internship", /\bintern(ship)?s?\b/i],
];
/** Job seekers sometimes paste the "Who wants to be hired" template into the hiring thread. */
const SEEKER_RE = /^\s*location:[^\n]*\n\s*remote:|\bwilling to relocate:/i;
const JOB_LINK_RE = /careers?|jobs?\b|apply|hiring|positions?|greenhouse|grnh\.se|lever\.co|ashbyhq|workable|bamboohr|teamtailor|recruitee|personio|smartrecruiters|notion\.site/i;

/** Remote / hybrid / on-site from the location-like parts of the first line ("HYBRID (NYC) or REMOTE" -> remote, "ONSITE (part remote)" -> hybrid). */
function remoteOf(l: string): RemoteType {
  if (!l) return "unknown";
  if (/^(√ |fully |100% |all )?remote\b|(\bor|\/|,|&|\band|\bopen to|\+|\||:)\s*(fully |100% )?remote\b|\bremote[- ]first|\bfully remote|100% remote|\banywhere\b|\bworldwide\b|\bwfh\b/.test(l)) return "remote";
  if (/hybrid|part(ial(ly)?)?[ -]remote|remote (possible|ok|friendly|optional)|\d ?(days?|x)\s*(\/|per|a)?\s*(wk|week)|in[- ]office|home office/.test(l)) return "hybrid";
  if (/on-?\s?site|in[- ]person|office/.test(l)) return "onsite";
  return "unknown";
}

/** First body line that reads like a role heading: "- Rust Backend Engineers", "Head of Engineering — Own…", "Hiring: Senior Mobile Developer", "++ iOS Engineer [Swift]". */
function roleLine(lines: string[]): string | undefined {
  for (const raw of lines.slice(1, 40)) {
    const l = stripUrls(raw.replace(/^[-•*+>√]+\s*|^(hiring|roles?|open roles|we(’|')re hiring( for)?):\s*/i, "").split(/\s+[—–-]\s+|:\s|\s\|\s|\s\[/)[0]).replace(/[\s:,;—–-]+$/, "");
    if (l.length >= 4 && l.length <= 80 && ROLE_RE.test(l) && !/[.!?]$/.test(l) && !/\b(we|our|you|your|us|is|are|the|a)\b/i.test(l)) return l;
  }
  return undefined;
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const stories = await fetchJson<{ hits?: Hit[] }>("https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=%22who%20is%20hiring%22&hitsPerPage=4");
  const thread = (stories.hits ?? []).find((h) => /who is hiring/i.test(h.title ?? ""));
  if (!thread) throw new Error("current 'Who is hiring' thread not found");
  ctx.log(`[hn] thread: ${thread.title} (${thread.objectID}, ${toIso(thread.created_at)?.slice(0, 10)})`);
  const keywords = CONFIG.hn.keywords.map((k) => new RegExp(k, "i"));
  const out = new Map<string, Job>();
  let seen = 0, top = 0, seekers = 0;
  for (let page = 0; seen < CONFIG.hn.maxComments; page++) {
    let res: { hits?: Hit[]; nbPages?: number };
    try { res = await fetchJson(`https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_${thread.objectID}&hitsPerPage=${PAGE}&page=${page}`); }
    catch (e) { ctx.log(`[hn] page ${page}: ${(e as Error).message}`); break; } // keep what we have
    const hits = res.hits ?? [];
    for (const h of hits) {
      seen++;
      if (Number(h.parent_id) !== Number(thread.objectID)) continue; // only top-level postings
      top++;
      const raw = h.comment_text ?? "";
      const text = htmlToText(raw.replace(/<p>/gi, "\n")); // HN uses <p> as a separator (no </p>) – one decode pass inside htmlToText
      if (!text || !keywords.every((k) => k.test(text))) continue;
      if (SEEKER_RE.test(text)) { seekers++; continue; }
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const head = lines[0] ?? "";
      const parts = head.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
      const first = parts[0] ?? "", k0 = kindOf(first), rest = parts.slice(1), kinds = rest.map(kindOf);
      const roles = rest.filter((_, i) => kinds[i] === "role"), others = rest.filter((_, i) => kinds[i] === "other");
      const headRole = k0 === "role" && roles.length === 0; // "Senior Python Backend Engineer | REMOTE (EMEA/APAC)" – no company given
      const company = parts.length < 2 || headRole ? "" : k0 === "loc" || k0 === "meta" || /^https?:/i.test(first) ? cleanCompany(others.shift() ?? "") : cleanCompany(first);
      const title = stripUrls(roles[0] ?? (headRole ? first : undefined) ?? roleLine(lines) ?? others[0] ?? rest.filter((_, i) => kinds[i] !== "url").join(" | ") ?? head).slice(0, 120) || stripUrls(head).slice(0, 120);
      if (!title) continue;
      const locations = [...(k0 === "loc" ? [first] : []), ...rest.filter((_, i) => kinds[i] === "loc")].map((l) => l.replace(/^[√•*\s]+/, "").slice(0, 80));
      const hrefs = [...raw.matchAll(/href="([^"]+)"/g)].map((m) => decodeEntities(m[1])).filter((u) => /^https?:\/\//i.test(u) && !/ycombinator\.com/i.test(u));
      const hnUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
      const url = hrefs.find((u) => JOB_LINK_RE.test(u)) ?? hrefs[0] ?? text.match(/https?:\/\/[^\s)>\]]+/)?.[0] ?? hnUrl; // hrefs first: HN shortens the visible link text with "…"
      const id = `hn:${h.objectID}`;
      out.set(id, {
        source: "hn", id, url, sourceUrl: url === hnUrl ? undefined : hnUrl,
        title, company, locations, remote: remoteOf(locations.join(" | ").toLowerCase()),
        employment: EMPLOYMENT.filter(([, r]) => r.test(head)).map(([k]) => k),
        salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(h.created_at ?? h.created_at_i ?? null), description: truncate(text), tags: ["hn"],
      });
    }
    const oldest = hits[hits.length - 1];
    if (hits.length < PAGE || page + 1 >= (res.nbPages ?? 1)) break;
    if (oldest?.created_at && new Date(oldest.created_at) < ctx.since) break; // newest first: everything further back is before the baseline
    await sleep(600);
  }
  ctx.log(`[hn] ${seen} comments read, ${top} top-level postings, ${seekers} job-seeker templates skipped, ${out.size} remote postings kept`);
  return [...out.values()];
}
