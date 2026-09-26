/**
 * hiring.cafe (now hiringcafe.com – hiring.cafe 308-redirects there) – aggregator that indexes company ATS postings worldwide with LLM-structured filters.
 * The old `POST /api/search-jobs` answers 405 since the move (26.09.2026); the search runs in Next.js getServerSideProps ("/ssr/search-jobs"), so we read
 * the JSON the SPA itself reads:  GET https://hiringcafe.com/_next/data/<buildId>/index.json?searchState=<urlencoded JSON>&page=N
 *   searchState { searchQuery, workplaceTypes:["Remote"], sortBy:"date", locations:[<"user_country" RS + anywhere_in_continent/anywhere_in_world>] }
 *   -> pageProps { ssrHits[], ssrPage, ssrPageSize (40, a `size` field is ignored), ssrIsLastPage, ssrTotalCount, ssrError }.
 *   `dateFetchedPastNDays` is ignored on this route; without `locations` the server injects the visitor's IP country, so we pass it explicitly (config `country`).
 * buildId comes from `__NEXT_DATA__` of the HTML search page (GET https://hiringcafe.com/?searchState=…, same pageProps); a stale buildId -> 404 -> refresh once.
 * Hit: { objectID, apply_url, board_token, is_expired, job_information:{ title }, v5_processed_job_data:{ company_name, workplace_type, formatted_workplace_location
 *   ("Paris or Europe"), workplace_countries (ISO2), is_workplace_worldwide_ok, estimated_publish_date, commitment[], seniority_level, min_industry_and_role_yoe,
 *   <yearly|monthly|weekly|daily|hourly>_<min|max>_compensation, listed_compensation_currency/_frequency, requirements_summary, role_activities[], job_category, role_type },
 *   enriched_company_data:{ name, tagline } } – no logo, no description in the list. Description: GET /api/job-description?id=<objectID> -> { job:{ job_information:{ description (HTML) } } },
 *   fetched only for unseen hits inside the baseline window (ctx.since), capped by maxDetails; requirements_summary + role_activities stand in otherwise.
 * Cloudflare in front: GET with the browser UA passes from Node fetch (POST / datacenter IPs get "Just a moment" challenges) -> 2.5 s between list pages,
 * 400 ms between details, stop the pass on 429/403/1015, breaker on repeated failures. Best single place for unusual titles ("clinical prompt engineer", "AI persona writer").
 */
import { CONFIG } from "../config.ts";
import { fetchJson, fetchText, htmlToText, nextData, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, RemoteType, SalaryPeriod, SearchCtx } from "../types.ts";
import { Breaker, employmentOf, splitLocations } from "./common.ts";

type Any = Record<string, any>;
const BASE = "https://hiringcafe.com";
const s = (v: any): string => (v == null ? "" : typeof v === "string" ? v : typeof v === "number" ? String(v) : typeof v === "object" ? String(v.name ?? v.title ?? v.text ?? "") : String(v));
const regionName = (code: string): string => { try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code; } catch { return code; } };
/** The SPA's "user_country" filter: jobs open in <country>, anywhere on its continent or anywhere in the world (the server injects the IP country when absent). */
const userCountry = (code: string) => ({ formatted_address: regionName(code), types: ["country"], geometry: { location: { lat: 0, lon: 0 } }, id: "user_country", address_components: [{ long_name: regionName(code), short_name: code, types: ["country"] }], options: { flexible_regions: ["anywhere_in_continent", "anywhere_in_world"] } });
const PERIODS: Array<[string, string, SalaryPeriod]> = [["Hourly", "hourly", "hour"], ["Daily", "daily", "day"], ["Weekly", "weekly", "week"], ["Monthly", "monthly", "month"], ["Yearly", "yearly", "year"]];
const BLOCKED = /429|403|1015|Cloudflare/;

let buildId = "";

/** One results page: the JSON data route while the buildId is valid, otherwise (first call, or 404 after a new deploy) the HTML page, whose __NEXT_DATA__ gives both. */
async function fetchPage(state: object, page: number): Promise<Any> {
  const qs = `searchState=${encodeURIComponent(JSON.stringify(state))}${page ? `&page=${page}` : ""}`;
  if (buildId) {
    try { const d = await fetchJson<Any>(`${BASE}/_next/data/${buildId}/index.json?${qs}`, { tries: 2, headers: { Accept: "application/json" } }); return d.pageProps ?? d; }
    catch (e) { if (!/HTTP 404|nije JSON/.test((e as Error).message)) throw e; buildId = ""; }
  }
  const html = await fetchText(`${BASE}/?${qs}`, { tries: 2 });
  buildId = html.match(/"buildId":"([^"]+)"/)?.[1] ?? "";
  const props = nextData<Any>(html);
  if (!props) throw new Error("no __NEXT_DATA__ in the search page");
  return props;
}

function toJob(r: Any, country: string): Job | null {
  const info: Any = r.job_information ?? {};
  const pj: Any = r.v5_processed_job_data ?? {};
  const ec: Any = r.enriched_company_data ?? {};
  const id = s(r.objectID ?? r.id), title = s(info.title ?? pj.core_job_title).trim(), url = s(r.apply_url);
  if (!id || !title || !/^https?:\/\//i.test(url) || r.is_expired === true) return null;
  const wp = s(pj.workplace_type).toLowerCase();
  const remote: RemoteType = wp.includes("remote") ? "remote" : wp.includes("hybrid") ? "hybrid" : wp.includes("site") ? "onsite" : "unknown";
  const countries: string[] = Array.isArray(pj.workplace_countries) ? pj.workplace_countries.map(s) : [];
  const locations = [...splitLocations(s(pj.formatted_workplace_location).replace(/\s+or\s+/g, ", ")), ...countries.map(regionName), ...(pj.is_workplace_worldwide_ok === true ? ["Worldwide"] : [])]
    .filter((x, i, arr) => x && arr.indexOf(x) === i).slice(0, 12);
  const [, key, period] = PERIODS.find(([f]) => f === s(pj.listed_compensation_frequency)) ?? PERIODS[4];
  const min = Number(pj[`${key}_min_compensation`]) || null, max = Number(pj[`${key}_max_compensation`]) || null;
  const summary = [s(pj.requirements_summary), Array.isArray(pj.role_activities) ? pj.role_activities.map(s).filter(Boolean).join("; ") : ""].filter(Boolean).join("\n");
  return {
    source: "hiringcafe", id: `hiringcafe:${id}`, url, title,
    company: s(pj.company_name ?? ec.name ?? r.attributed_org?.name ?? r.board_token).trim(),
    locations, locationVerified: countries.includes(country) || undefined, remote,
    employment: employmentOf(s(Array.isArray(pj.commitment) ? pj.commitment[0] : pj.commitment)),
    seniority: s(pj.seniority_level) || undefined, yearsMin: typeof pj.min_industry_and_role_yoe === "number" ? pj.min_industry_and_role_yoe : undefined,
    salary: min || max ? { min, max, currency: s(pj.listed_compensation_currency) || null, period } : undefined,
    postedAt: toIso(s(pj.estimated_publish_date) || null), summary: summary || undefined,
    tags: [s(pj.job_category), s(pj.role_type), s(ec.tagline)].filter(Boolean),
  };
}

/** Description HTML for one hit (the list carries none); also the only place a text salary can come from. */
async function describe(j: Job): Promise<boolean> {
  const d = await fetchJson<Any>(`${BASE}/api/job-description?id=${encodeURIComponent(j.id.slice("hiringcafe:".length))}`, { tries: 1, headers: { Accept: "application/json" } });
  const text = htmlToText(s(d.job?.job_information?.description));
  if (!text) return false;
  j.description = truncate(text);
  j.salary ??= salaryFromDescription(text) ?? undefined;
  return true;
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { queries, country, maxPages, maxDetails } = CONFIG.hiringcafe;
  const out = new Map<string, Job>();
  const br = new Breaker(3, "hiringcafe");
  let failed = 0, blocked = false;
  for (const q of queries) {
    const state = { searchQuery: q, workplaceTypes: ["Remote"], sortBy: "date", locations: [userCountry(country)] };
    try {
      for (let page = 0; page < maxPages; page++) {
        const pp = await fetchPage(state, page);
        if (pp.ssrError) throw new Error(`ssrError: ${s(pp.ssrError).slice(0, 80)}`);
        const rows: Any[] = Array.isArray(pp.ssrHits) ? pp.ssrHits : [];
        let n = 0;
        for (const r of rows) { const j = toJob(r, country); if (j && !out.has(j.id)) { out.set(j.id, j); n++; } }
        ctx.log(`[hiringcafe] q="${q}" page=${page} results=${rows.length}/${pp.ssrTotalCount ?? "?"} new=${n}`);
        br.ok();
        await sleep(2_500);
        if (pp.ssrIsLastPage !== false || !rows.length) break;
      }
    } catch (e) {
      const msg = (e as Error).message;
      ctx.log(`[hiringcafe] q="${q}": ${msg}`);
      if (BLOCKED.test(msg)) { ctx.log("[hiringcafe] blocked / rate limited – stopping this pass"); if (!out.size) throw e; blocked = true; break; }
      br.fail(e);
      if (++failed === queries.length) throw e;
    }
  }
  let details = 0;
  for (const j of out.values()) {
    if (blocked || details >= maxDetails) break;
    if (ctx.isSeen(j.id) || (j.postedAt && new Date(j.postedAt) < ctx.since)) continue;
    try { if (await describe(j)) details++; }
    catch (e) { const msg = (e as Error).message; ctx.log(`[hiringcafe] description ${j.id}: ${msg}`); if (BLOCKED.test(msg)) blocked = true; }
    await sleep(400);
  }
  ctx.log(`[hiringcafe] ${out.size} listings, ${details} descriptions fetched`);
  return [...out.values()];
}
