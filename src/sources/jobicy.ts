/**
 * Jobicy – javni JSON API (provereno 19.09.2026): GET https://jobicy.com/api/v2/remote-jobs?count=50&industry=<marketing|business|management|hr…>
 * (industry "sales" i "customer-support" vraćaju 0 – prodaja je u "marketing" i "business"). Polja: id, url, jobTitle, companyName, companyLogo,
 * jobIndustry[], jobType[] ("Full-Time"), jobGeo ("USA", "Anywhere", "Europe", "Canada, Mexico, USA"), jobLevel ("Any"/"Senior"/"Director"),
 * jobExcerpt, jobDescription (HTML), pubDate, annualSalaryMin/Max, salaryCurrency. Dosta US-only i senior -> ocena filtrira.
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { Breaker, employmentOf, splitLocations } from "./common.ts";

interface ApiJob {
  id: number | string; url: string; jobTitle: string; companyName?: string; companyLogo?: string; jobIndustry?: string[]; jobType?: string[];
  jobGeo?: string; jobLevel?: string; jobExcerpt?: string; jobDescription?: string; pubDate?: string;
  annualSalaryMin?: number | string; annualSalaryMax?: number | string; salaryCurrency?: string;
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const out = new Map<string, Job>();
  let failed = 0;
  const br = new Breaker(3, "jobicy");
  for (const industry of CONFIG.jobicy.industries) {
    try {
      const res = await fetchJson<{ jobs?: ApiJob[] }>(`https://jobicy.com/api/v2/remote-jobs?count=${CONFIG.jobicy.count}&industry=${encodeURIComponent(industry)}`);
      let n = 0;
      for (const r of res.jobs ?? []) {
        if (!r.id || !r.jobTitle || !r.url) continue;
        const id = `jobicy:${r.id}`;
        if (out.has(id)) continue;
        const text = htmlToText(r.jobDescription ?? r.jobExcerpt ?? "");
        const min = Number(r.annualSalaryMin) || null, max = Number(r.annualSalaryMax) || null;
        out.set(id, {
          source: "jobicy",
          id,
          url: r.url,
          title: r.jobTitle.trim(),
          company: r.companyName?.trim() ?? "",
          companyLogo: r.companyLogo || undefined,
          locations: splitLocations(r.jobGeo),
          remote: "remote",
          employment: employmentOf(r.jobType?.[0]),
          seniority: r.jobLevel && !/^any$/i.test(r.jobLevel) ? r.jobLevel : undefined,
          salary: min || max ? { min, max, currency: r.salaryCurrency || "USD", period: "year" } : salaryFromDescription(text) ?? undefined,
          postedAt: toIso(r.pubDate),
          summary: htmlToText(r.jobExcerpt ?? "") || undefined,
          description: truncate(text),
          tags: r.jobIndustry ?? [],
        });
        n++;
      }
      ctx.log(`[jobicy] industry=${industry}: ${(res.jobs ?? []).length} jobs, ${n} new in list`); br.ok();
    } catch (e) {
      ctx.log(`[jobicy] ${industry}: ${(e as Error).message}`);
      br.fail(e); if (++failed === CONFIG.jobicy.industries.length) throw e;
    }
    await sleep(1_000);
  }
  return [...out.values()];
}
