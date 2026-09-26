/**
 * Workable global job search – keyless JSON over every public Workable employer (thousands of SMBs; strong for UK/EU health, coaching,
 * L&D and research agencies). The same call the SPA at jobs.workable.com/search makes (job-board bundle, `getPaginatedJobs`):
 *   GET https://jobs.workable.com/api/v1/jobs?query=<q>&workplace=remote&day_range=7&limit=20[&pageToken=<nextPageToken>]
 *   GET https://jobs.workable.com/api/v1/jobs?location=Serbia&workplace=remote&day_range=7&limit=20   (config `locations`, opt-in: every remote job located
 *   there, ~33/week for Serbia – off by default because keyword-less rows trip the matcher's industry signals on benefits boilerplate: 13/33 accepted, ~2 relevant)
 * Filters: workplace=on_site|hybrid|remote (repeatable), day_range=1|7|30|0 (0 = any time), employment_type=full_time|part_time|contract|temporary|other,
 * experience=internship|entry_level|…, location=<city or country> (geocoded; "Remote"/"Europe" are not places -> 0 / everything); `remote=true` is only an SPA
 * URL flag, not an API param; limit > 20 -> HTTP 400 {"limit":"Must be less than or equal to 20"}. `query` is fuzzy AND over title + description with
 * stemming ("psychologist" also finds psychology/psychological) – a quoted phrase ("prompt engineer": 4 hits instead of 659) is much tighter; no sort
 * param (relevance order, not date), so a query with hundreds of hits is truncated to maxPages × 20.
 * Response: { totalSize, nextPageToken?, autoAppliedFilters, jobs: [{ id (uuid), title, state, description (HTML), requirementsSection, benefitsSection,
 *   employmentType ("Full-time"|"Part-time"|"Contract"|"Other"|""), url (absolute https://jobs.workable.com/view/<shortcode>/…), language,
 *   locations: ["TELECOMMUTE", "City, Region, Country"], location: { city, subregion, countryName }, created, updated (ISO),
 *   company: { id, title, image, url, website, description }, department?, workplace ("remote"|"hybrid"|"on_site"), isFeatured }] }
 * Cloudflare error 1015 (HTTP 429) on bursts -> 3 s spacing. Complements the per-account widget API in ats.ts.
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, RemoteType, SearchCtx } from "../types.ts";
import { Breaker, employmentOf } from "./common.ts";

type Any = Record<string, any>;
const s = (v: any): string => (v == null ? "" : typeof v === "string" ? v : typeof v === "object" ? String(v.title ?? v.name ?? v.text ?? "") : String(v));
const PAGE = 20; // API maximum

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { queries, locations = [], maxPages } = CONFIG.workablesearch;
  const days = CONFIG.lookbackDays;
  const dayRange = days <= 1 ? "1" : days <= 7 ? "7" : days <= 30 ? "30" : "0"; // the API only knows these buckets; scrape.ts drops anything older than the baseline anyway
  // one pass per keyword (remote, any country) + one per location (remote jobs located there, whatever the title – like the LinkedIn Serbia pass)
  const passes = [...queries.map((q) => ({ label: `q="${q}"`, params: { query: q } })), ...locations.map((l) => ({ label: `location="${l}"`, params: { location: l } }))];
  const out = new Map<string, Job>();
  const br = new Breaker(3, "workablesearch");
  let failed = 0;
  for (const p of passes) {
    try {
      let token = "";
      for (let page = 0; page < maxPages; page++) {
        const qs = new URLSearchParams({ ...p.params, workplace: "remote", day_range: dayRange, limit: String(PAGE) });
        if (token) qs.set("pageToken", token);
        const res = await fetchJson<Any>(`https://jobs.workable.com/api/v1/jobs?${qs}`, { headers: { Accept: "application/json" }, tries: 2 });
        const rows: Any[] = Array.isArray(res.jobs) ? res.jobs : [];
        let n = 0;
        for (const r of rows) {
          const id = s(r.id);
          const title = s(r.title).trim();
          const url = s(r.url);
          if (!id || !title || !/^https?:\/\//.test(url)) continue;
          const key = `workablesearch:${id}`;
          if (out.has(key)) continue;
          const loc: Any = r.location ?? {};
          const listed = (Array.isArray(r.locations) ? r.locations : []).map(s).filter((x: string) => x && x !== "TELECOMMUTE");
          const locs = listed.length ? listed : [[loc.city, loc.subregion, loc.countryName].map(s).filter(Boolean).join(", ")].filter(Boolean);
          const wp = s(r.workplace).toLowerCase();
          const remote: RemoteType = wp === "remote" || listed.length < (r.locations?.length ?? 0) ? "remote" : wp === "hybrid" ? "hybrid" : wp === "on_site" ? "onsite" : "unknown";
          const text = [s(r.description), s(r.requirementsSection), s(r.benefitsSection)].map(htmlToText).filter(Boolean).join("\n\n");
          out.set(key, {
            source: "workablesearch", id: key, url, title, company: s(r.company).trim(), companyLogo: s(r.company?.image) || undefined,
            locations: locs, remote, employment: employmentOf(s(r.employmentType)),
            salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(s(r.created ?? r.updated) || null),
            description: truncate(text), tags: [s(r.department)].filter(Boolean),
          });
          n++;
        }
        ctx.log(`[workablesearch] ${p.label} page=${page} results=${rows.length}/${res.totalSize ?? "?"} new=${n}`);
        br.ok();
        token = s(res.nextPageToken);
        await sleep(3_000);
        if (!token || rows.length < PAGE) break;
      }
    } catch (e) {
      ctx.log(`[workablesearch] ${p.label}: ${(e as Error).message}`);
      br.fail(e);
      if (++failed === passes.length) throw e;
      if (/1015|429/.test((e as Error).message)) { ctx.log("[workablesearch] rate limited – stopping this pass"); break; }
    }
  }
  return [...out.values()];
}
