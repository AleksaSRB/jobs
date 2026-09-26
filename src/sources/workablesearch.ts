/**
 * Workable global job search – keyless JSON over every public Workable employer (thousands of SMBs; strong for UK/EU health, coaching,
 * L&D and research agencies): GET https://jobs.workable.com/api/v1/jobs?query=<q>&location=Remote[&pageToken=…]   (max 20 per call)
 * Response: { jobs: [{ id, title, company: { title, image, url }, location: { city, country, countryCode, region, telecommuting… }, workplace,
 *   employmentType, description?, url / shortlink / applicationUrl, created / publishedOn }], nextPageToken }  – field names vary a little
 * between versions, so every field is read defensively. Cloudflare error 1015 on bursts -> 3 s spacing. Complements the per-account widget API.
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, RemoteType, SearchCtx } from "../types.ts";
import { Breaker, employmentOf } from "./common.ts";

type Any = Record<string, any>;
const s = (v: any): string => (v == null ? "" : typeof v === "string" ? v : typeof v === "object" ? String(v.title ?? v.name ?? v.text ?? "") : String(v));

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { queries, maxPages } = CONFIG.workablesearch;
  const out = new Map<string, Job>();
  const br = new Breaker(3, "workablesearch");
  let failed = 0;
  for (const q of queries) {
    try {
      let token = "";
      for (let page = 0; page < maxPages; page++) {
        const qs = new URLSearchParams({ query: q, location: "Remote", limit: "20" });
        if (token) qs.set("pageToken", token);
        const res = await fetchJson<Any>(`https://jobs.workable.com/api/v1/jobs?${qs}`, { headers: { Accept: "application/json" }, tries: 2 });
        const rows: Any[] = res.jobs ?? res.results ?? res.data ?? [];
        let n = 0;
        for (const r of rows) {
          const id = s(r.id ?? r.shortcode ?? r.slug);
          const title = s(r.title);
          const url = s(r.url ?? r.shortlink ?? r.applicationUrl ?? r.jobUrl) || (id ? `https://jobs.workable.com/view/${id}` : "");
          if (!id || !title || !url) continue;
          const key = `workablesearch:${id}`;
          if (out.has(key)) continue;
          const loc: Any = r.location ?? {};
          const locs = [loc.city, loc.region ?? loc.state, loc.country ?? loc.countryName ?? loc.countryCode].map(s).filter(Boolean);
          const wp = s(r.workplace ?? r.workplaceType).toLowerCase();
          const remote: RemoteType = wp === "remote" || loc.telecommuting || r.telecommuting || r.remote ? "remote" : wp === "hybrid" ? "hybrid" : wp === "on_site" || wp === "onsite" ? "onsite" : "unknown";
          const text = htmlToText(s(r.description ?? r.descriptionHtml ?? r.excerpt ?? r.summary));
          out.set(key, {
            source: "workablesearch", id: key, url, title: title.trim(), company: s(r.company ?? r.companyName ?? r.account).trim(),
            companyLogo: s(r.company?.image ?? r.companyLogo ?? r.logo) || undefined,
            locations: locs, remote, employment: employmentOf(s(r.employmentType ?? r.employment_type ?? r.type)),
            salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(s(r.publishedOn ?? r.published ?? r.created ?? r.createdAt) || null),
            description: truncate(text), tags: [s(r.department), s(r.function), s(r.industry)].filter(Boolean),
          });
          n++;
        }
        ctx.log(`[workablesearch] q="${q}" page=${page} results=${rows.length} new=${n}`);
        br.ok();
        token = s(res.nextPageToken ?? res.paging?.next ?? "");
        await sleep(3_000);
        if (!token || rows.length < 20) break;
      }
    } catch (e) {
      ctx.log(`[workablesearch] q="${q}": ${(e as Error).message}`);
      br.fail(e);
      if (++failed === queries.length) throw e;
      if (/1015|429/.test((e as Error).message)) { ctx.log("[workablesearch] rate limited – stopping this pass"); break; }
    }
  }
  return [...out.values()];
}
