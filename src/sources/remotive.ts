/**
 * Remotive (checked 26.09.2026) – two public endpoints, no key:
 *  1. GET https://remotive.com/api/remote-jobs – the free "API" is a fixed sample (~18 jobs, 24 h delay); search=, category= and limit= are
 *     ignored (every variant returns the same payload), the rest is behind the paid API. Fields: id, url, title, company_name, company_logo,
 *     category, tags[], job_type ("full_time"), publication_date (UTC without zone), candidate_required_location, salary, description (HTML).
 *     Read ONCE per run – they ask for at most ~4 calls a day.
 *  2. POST https://remotive.com/api/v2/jobs/search/ – the instantsearch proxy behind remotive.com/remote-jobs?query=… (index "remotive_unlimited",
 *     ~128k jobs, fresh, sorted by discovered_on desc). Body {requests:[{indexName, params:"query=…&hitsPerPage=50&page=N&skillsOperator=or"}],
 *     paywallProfile:"custom"}; reply {jsonrpc, result:{results:[{hits, nbHits, nbPages}]}}. hitsPerPage caps at 50 (profile "seo" gives 25 + 5/page).
 *     `is_blurred` only hides the company in the UI – the hit still carries id, title (with <em> query highlights), company_name, locations[],
 *     url (employer ATS link), remotive_com_url, salary (text | "unspecified"), category, occupation, skills[], seniority (string | false),
 *     job_type ("full-time"), discovered_on ("YYYY-MM-DD HH:MM:SS" UTC), display_logo, remotive_logo_url. No description in the hit -> detail page
 *     (SSR, ld+json JobPosting.description, no login wall) for unseen titles worth a look, capped by maxDetails. `posted=` is ignored for public users.
 * Job id = numeric suffix of the Remotive URL, NOT hit.id: the sample's jobs are also in the index under a new hit.id (2091144 -> 5958363) but keep
 * their legacy /remote-jobs/…-2091144 URL, while native index jobs live at /remote/jobs/…-<hit.id>. Keying on the URL suffix dedups both to one card
 * (verified 26.09.2026: "Content Reviewer – TELUS" sample row = hit 5958363). Verified the same day: proxy 200 via Node fetch, nbHits/nbPages/hits
 * as described, pages disjoint and strictly date-sorted, 47/50 hits is_blurred with company_name still present, detail pages of blurred hits carry the
 * full ld+json description.
 */
import { CONFIG } from "../config.ts";
import { fetchJson, fetchText, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { parseSalaryText, salaryFromDescription } from "../salary.ts";
import { scoreJob, worthDetail } from "../score.ts";
import type { Job, SearchCtx } from "../types.ts";
import { employmentOf, preferEmployer, splitLocations } from "./common.ts";

const API = "https://remotive.com/api/remote-jobs?limit=100";
const SEARCH = "https://remotive.com/api/v2/jobs/search/";
const PAGE = 50; // server cap for hitsPerPage

interface ApiJob {
  id: number; url: string; title: string; company_name?: string; company_logo?: string; category?: string; tags?: string[];
  job_type?: string; publication_date?: string; candidate_required_location?: string; salary?: string; description?: string;
}
interface Hit {
  id: string; title: string; company_name?: string; locations?: string[]; url?: string; remotive_com_url?: string; salary?: string; category?: string;
  occupation?: string; skills?: string[]; seniority?: string | false; job_type?: string; discovered_on?: string; display_logo?: boolean; remotive_logo_url?: string | false;
}
interface SearchPage { hits?: Hit[]; nbHits?: number; nbPages?: number; }

const strip = (s: string | undefined | null) => htmlToText(s ?? "").replace(/\s+/g, " ").trim(); // titles carry <em>…</em> query highlights
const idOf = (url: string | undefined, fallback: string | number) => `remotive:${url?.match(/-(\d+)\/?$/)?.[1] ?? fallback}`;
const utc = (s: string | undefined | null) => toIso(s ? `${s.trim().replace(" ", "T")}Z` : null); // "2026-09-25 17:33:00" without zone = UTC

async function searchPage(q: string, page: number): Promise<SearchPage> {
  const body = JSON.stringify({ requests: [{ indexName: "remotive_unlimited", params: `query=${encodeURIComponent(q)}&hitsPerPage=${PAGE}&page=${page}&skillsOperator=or` }], paywallProfile: "custom" });
  const d = await fetchJson<any>(SEARCH, { method: "POST", body, headers: { "Content-Type": "application/json", Accept: "application/json" } });
  const err = d?.error ?? d?.result?.error;
  if (err) throw new Error(`search proxy: ${JSON.stringify(err).slice(0, 120)}`);
  const res = d?.result?.results ?? d?.results ?? d?.result;
  if (!Array.isArray(res) || !Array.isArray(res[0]?.hits)) throw new Error(`unexpected reply: ${JSON.stringify(d).slice(0, 120)}`);
  return res[0];
}

function fromHit(h: Hit): Job | null {
  const listing = h.remotive_com_url || h.url;
  if (!listing || !/^https?:\/\//.test(listing)) return null;
  const salary = h.salary && !/^unspecified$/i.test(h.salary) ? h.salary : undefined;
  return {
    source: "remotive", id: idOf(listing, h.id), ...preferEmployer(listing, h.url, "remotive.com"),
    title: strip(h.title), company: strip(h.company_name), companyLogo: h.display_logo && h.remotive_logo_url ? h.remotive_logo_url : undefined,
    locations: (h.locations ?? []).map((x) => x.trim()).filter((x) => x && !/^remote$/i.test(x)),
    remote: "remote", employment: employmentOf(h.job_type), seniority: typeof h.seniority === "string" && h.seniority ? h.seniority : undefined,
    salary: parseSalaryText(salary) ?? undefined, postedAt: utc(h.discovered_on),
    tags: [h.category ?? "", h.occupation ?? "", ...(h.skills ?? [])].filter(Boolean),
  };
}

function fromApi(r: ApiJob): Job {
  const text = htmlToText(r.description ?? "");
  return {
    source: "remotive", id: idOf(r.url, r.id), url: r.url, title: r.title.trim(), company: r.company_name?.trim() ?? "", companyLogo: r.company_logo || undefined,
    locations: splitLocations(r.candidate_required_location), remote: "remote", employment: employmentOf(r.job_type),
    salary: parseSalaryText(r.salary) ?? salaryFromDescription(text) ?? undefined, postedAt: utc(r.publication_date),
    description: truncate(text), tags: [r.category ?? "", ...(r.tags ?? [])].filter(Boolean),
  };
}

/** Detail page: description (and missing employment/date) from the ld+json JobPosting. */
async function enrich(j: Job): Promise<void> {
  const html = await fetchText(j.sourceUrl ?? j.url, { tries: 2 });
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let d: any; try { d = JSON.parse(m[1]); } catch { continue; }
    for (const x of Array.isArray(d) ? d : [d]) {
      if (x?.["@type"] !== "JobPosting") continue;
      const text = htmlToText(String(x.description ?? ""));
      if (text) { j.description = truncate(text); j.salary ??= salaryFromDescription(text) ?? undefined; }
      if (!j.postedAt && x.datePosted) j.postedAt = utc(String(x.datePosted));
      if (!j.employment.length) j.employment = employmentOf(x.employmentType);
      return;
    }
  }
  throw new Error("no JobPosting ld+json");
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { queries, maxPages, maxDetails } = CONFIG.remotive;
  const out = new Map<string, Job>();
  let attempted = 0, failed = 0, lastErr: unknown;
  // 1. free sample (the only endpoint that ships descriptions) – once per run
  attempted++;
  try {
    const rows = (await fetchJson<{ jobs?: ApiJob[] }>(API)).jobs ?? [];
    for (const r of rows) { const j = fromApi(r); out.set(j.id, j); }
    ctx.log(`[remotive] sample: ${rows.length} jobs`);
  } catch (e) { failed++; lastErr = e; ctx.log(`[remotive] sample: ${(e as Error).message}`); }
  // 2. keyword searches over the full index, newest first – stop at the baseline or when a whole page is already known;
  //    "back to <date>" = oldest hit read: when it is still inside the baseline window, maxPages did not cover the whole window for that query
  for (const q of queries) {
    let fresh = 0, pages = 0, total: number | undefined, oldest: string | null = null;
    attempted++;
    try {
      for (let page = 0; page < maxPages; page++) {
        const r = await searchPage(q, page);
        const hits = r.hits ?? [];
        pages++; total ??= r.nbHits;
        let known = 0;
        for (const h of hits) {
          const j = fromHit(h);
          if (!j) continue;
          if (ctx.isSeen(j.id)) known++;
          const prev = out.get(j.id);
          if (!prev) { out.set(j.id, j); fresh++; }
          else if (!prev.sourceUrl && j.sourceUrl) { prev.url = j.url; prev.sourceUrl = j.sourceUrl; } // sample row + employer link from the hit
        }
        oldest = utc(hits.at(-1)?.discovered_on) ?? oldest;
        if (hits.length < PAGE || page + 1 >= (r.nbPages ?? 1) || (hits.length > 0 && known === hits.length) || (oldest !== null && new Date(oldest) < ctx.since)) break;
        await sleep(600);
      }
      ctx.log(`[remotive] "${q}": ${total ?? "?"} hits, ${pages} page(s), ${fresh} new here, back to ${oldest?.slice(0, 10) ?? "?"}`);
    } catch (e) {
      failed++; lastErr = e; const msg = (e as Error).message;
      ctx.log(`[remotive] "${q}": ${msg}`);
      if (/429/.test(msg)) { ctx.log("[remotive] search proxy rate-limited – remaining queries skipped this run"); break; }
    }
    await sleep(600);
  }
  if (failed === attempted) throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  // 3. descriptions for unseen listings whose title is worth it (bounded – each detail page is ~90 KB of HTML);
  //    a listing the matcher already hard-rejects on title + site fields (US only, director…) does not get a request
  let details = 0, rateLimited = false;
  for (const j of out.values()) {
    if (rateLimited || j.description || details >= maxDetails || ctx.isSeen(j.id) || !worthDetail(j.title)) continue;
    if ((j.postedAt !== null && new Date(j.postedAt) < ctx.since) || scoreJob(j).reject) continue;
    details++;
    try { await enrich(j); }
    catch (e) { const msg = (e as Error).message; ctx.log(`[remotive] detail ${j.id}: ${msg}`); if (/429/.test(msg)) rateLimited = true; }
    await sleep(500);
  }
  ctx.log(`[remotive] ${out.size} jobs (sample + ${queries.length} searches), ${details} details fetched${rateLimited ? " (stopped: 429)" : ""}`);
  return [...out.values()];
}
