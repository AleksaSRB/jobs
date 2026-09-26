/**
 * hiring.cafe – aggregator that indexes company ATS postings worldwide with structured remote filters; unofficial JSON API used by RSSHub and
 * several open-source scrapers (2025–26):  POST https://hiring.cafe/api/search-jobs   body { size, page, searchState: { searchQuery, workplaceTypes: ["Remote"] } }
 * Hits: { id, apply_url, job_information: { title, description }, v5_processed_job_data: { company_name, workplace_type, formatted_workplace_location,
 *   requirements_summary, estimated_publish_date, ... }, v5_processed_company_data: { name, image_url } } – shapes vary, read defensively.
 * Cloudflare may block datacenter IPs / return 429 on bursts -> browser UA (http.ts), 2.5 s spacing, breaker on repeated failures.
 * Best single place for unusual titles ("clinical prompt engineer", "AI persona writer", "behavioral product researcher").
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, RemoteType, SearchCtx } from "../types.ts";
import { Breaker, employmentOf, splitLocations } from "./common.ts";

type Any = Record<string, any>;
const s = (v: any): string => (v == null ? "" : typeof v === "string" ? v : typeof v === "number" ? String(v) : typeof v === "object" ? String(v.name ?? v.title ?? v.text ?? "") : String(v));

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { queries, pageSize, maxPages } = CONFIG.hiringcafe;
  const out = new Map<string, Job>();
  const br = new Breaker(3, "hiringcafe");
  let failed = 0;
  for (const q of queries) {
    try {
      for (let page = 0; page < maxPages; page++) {
        const res = await fetchJson<Any>("https://hiring.cafe/api/search-jobs", {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", Origin: "https://hiring.cafe", Referer: "https://hiring.cafe/" },
          body: JSON.stringify({ size: pageSize, page, searchState: { searchQuery: q, workplaceTypes: ["Remote"], sortBy: "date" } }), tries: 2,
        });
        const rows: Any[] = res.results ?? res.hits ?? res.jobs ?? res.data ?? (Array.isArray(res) ? res : []);
        let n = 0;
        for (const r of rows) {
          const info: Any = r.job_information ?? r.jobInformation ?? r;
          const pj: Any = r.v5_processed_job_data ?? r.processed_job_data ?? r.processedJobData ?? {};
          const pc: Any = r.v5_processed_company_data ?? r.processed_company_data ?? {};
          const id = s(r.id ?? r.objectID ?? r._id ?? r.apply_url);
          const title = s(info.title ?? pj.core_job_title ?? r.title);
          const url = s(r.apply_url ?? r.applyUrl ?? info.apply_url ?? r.url);
          if (!id || !title || !url) continue;
          const key = `hiringcafe:${id}`;
          if (out.has(key)) continue;
          const wp = s(pj.workplace_type ?? r.workplace_type).toLowerCase();
          const remote: RemoteType = wp.includes("remote") ? "remote" : wp.includes("hybrid") ? "hybrid" : wp.includes("onsite") || wp.includes("on-site") ? "onsite" : "unknown";
          const loc = s(pj.formatted_workplace_location ?? pj.workplace_location ?? r.location);
          const countries = Array.isArray(pj.workplace_countries) ? pj.workplace_countries.map(s) : [];
          const text = htmlToText(s(info.description ?? r.description)) || s(pj.requirements_summary);
          out.set(key, {
            source: "hiringcafe", id: key, url, title: title.trim(),
            company: s(pj.company_name ?? pc.name ?? r.company_name ?? r.company).trim(), companyLogo: s(pc.image_url ?? pc.logo) || undefined,
            locations: [...splitLocations(loc), ...countries].filter((x, i, arr) => x && arr.indexOf(x) === i && !/^remote$/i.test(x)),
            remote, employment: employmentOf(s(pj.commitment?.[0] ?? pj.employment_type ?? r.employment_type)),
            seniority: s(pj.seniority_level ?? pj.experience_level) || undefined,
            yearsMin: typeof pj.min_years_of_experience === "number" ? pj.min_years_of_experience : undefined,
            salary: pj.yearly_min_compensation || pj.yearly_max_compensation ? { min: pj.yearly_min_compensation || null, max: pj.yearly_max_compensation || null, currency: s(pj.listed_compensation_currency) || "USD", period: "year" } : salaryFromDescription(text) ?? undefined,
            postedAt: toIso(s(pj.estimated_publish_date ?? r.published_at ?? r.date_posted) || null), description: truncate(text), tags: [s(pj.job_category), s(pj.role_type)].filter(Boolean),
          });
          n++;
        }
        ctx.log(`[hiringcafe] q="${q}" page=${page} results=${rows.length} new=${n}`);
        br.ok();
        await sleep(2_500);
        if (rows.length < pageSize) break;
      }
    } catch (e) {
      ctx.log(`[hiringcafe] q="${q}": ${(e as Error).message}`);
      br.fail(e);
      if (++failed === queries.length) throw e;
      if (/429|403|1015/.test((e as Error).message)) { ctx.log("[hiringcafe] blocked / rate limited – stopping this pass"); break; }
    }
  }
  return [...out.values()];
}
