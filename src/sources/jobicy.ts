/**
 * Jobicy – public JSON API (checked 26.09.2026): GET https://jobicy.com/api/v2/remote-jobs?count=50[&industry=<slug>][&tag=<text>][&geo=<slug>]
 * count is capped at 50 (newest first). industry must be a slug from ?get=industries – hr, management ("Product & Operations"), copywriting
 * ("Content & Editorial"), design-multimedia, web-app-design, business, supporting, marketing, healthcare, education, data-science, project-management…;
 * an unknown slug answers HTTP 400 ("product" and "technical-writing" no longer exist). tag= is free text (unknown tag -> 200 with 0 jobs + message).
 * geo must be a slug from ?get=locations; geo=serbia returns listings open to Serbia (jobGeo "Anywhere", "Europe", "EMEA" and combinations with them),
 * so the 50-row cap is not spent on US-only rows (about half of the unfiltered feed). Fields: id, url, jobTitle, companyName, companyLogo, jobIndustry[],
 * jobType[] ("Full-Time"/"Contract"/"Part-Time"/"Internship"), jobGeo ("USA", "Anywhere", "Canada,  UK,  USA"), jobLevel ("Any"/"Midweight"/"Senior"/
 * "Director"/"Entry-Level, Junior"), jobExcerpt, jobDescription (HTML), pubDate (ISO), salaryMin/salaryMax (numbers), salaryCurrency, salaryPeriod
 * ("yearly"/"monthly"/"hourly"; the old annualSalaryMin/Max fields are gone).
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SalaryPeriod, SearchCtx } from "../types.ts";
import { Breaker, employmentOf, splitLocations } from "./common.ts";

const API = "https://jobicy.com/api/v2/remote-jobs";
const PERIODS: Record<string, SalaryPeriod> = { yearly: "year", annually: "year", annual: "year", monthly: "month", weekly: "week", daily: "day", hourly: "hour" };

interface ApiJob {
  id: number | string; url: string; jobTitle: string; companyName?: string; companyLogo?: string; jobIndustry?: string[]; jobType?: string[];
  jobGeo?: string; jobLevel?: string; jobExcerpt?: string; jobDescription?: string; pubDate?: string;
  salaryMin?: number | string; salaryMax?: number | string; salaryCurrency?: string; salaryPeriod?: string;
  annualSalaryMin?: number | string; annualSalaryMax?: number | string; // field names before 2026, kept as a fallback
}
interface ApiList { jobs?: ApiJob[]; jobCount?: number; message?: string }

/** ?get=industries / ?get=locations -> valid slugs; null when the lookup fails (then every configured slug is tried and a wrong one answers HTTP 400). */
async function validSlugs(get: "industries" | "locations"): Promise<Set<string> | null> {
  try {
    const r = await fetchJson<Record<string, Array<{ industrySlug?: string; geoSlug?: string }>>>(`${API}?get=${get}`, { tries: 1 });
    const s = new Set((r[get] ?? []).map((x) => x.industrySlug ?? x.geoSlug ?? "").filter(Boolean));
    return s.size ? s : null;
  } catch { return null; }
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const out = new Map<string, Job>();
  let failed = 0;
  const br = new Breaker(3, "jobicy");
  const cfg = CONFIG.jobicy;
  // a misspelt slug is skipped (valid list in the log) instead of costing three retried HTTP 400s on every run
  const keep = (kind: string, list: string[], valid: Set<string> | null) => list.filter((x) => {
    if (!valid || valid.has(x)) return true;
    ctx.log(`[jobicy] ${kind}=${x}: unknown slug, skipped (valid: ${[...valid].join(", ")})`); return false;
  });
  const industries = cfg.industries.length ? keep("industry", cfg.industries, await validSlugs("industries")) : [];
  const geos = cfg.geos?.length ? keep("geo", cfg.geos, await validSlugs("locations")) : [];
  const base = [...industries.map((i) => ({ label: `industry=${i}`, qs: `industry=${encodeURIComponent(i)}` })), ...(cfg.tags ?? []).map((t) => ({ label: `tag=${t}`, qs: `tag=${encodeURIComponent(t)}` }))];
  const plan = (geos.length ? geos : [""]).flatMap((g) => base.map((q) => (g ? { label: `${q.label} geo=${g}`, qs: `${q.qs}&geo=${encodeURIComponent(g)}` } : q)));
  for (const { label, qs } of plan) {
    try {
      const res = await fetchJson<ApiList>(`${API}?count=${cfg.count}&${qs}`);
      const jobs = res.jobs ?? [];
      let n = 0;
      for (const r of jobs) {
        if (!r.id || !r.jobTitle || !r.url) continue;
        const id = `jobicy:${r.id}`;
        if (out.has(id)) continue;
        const text = htmlToText(r.jobDescription ?? r.jobExcerpt ?? "");
        const min = Number(r.salaryMin ?? r.annualSalaryMin) || null, max = Number(r.salaryMax ?? r.annualSalaryMax) || null;
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
          salary: min || max ? { min, max, currency: r.salaryCurrency || "USD", period: PERIODS[(r.salaryPeriod ?? "").toLowerCase()] ?? null } : salaryFromDescription(text) ?? undefined,
          postedAt: toIso(r.pubDate),
          summary: htmlToText(r.jobExcerpt ?? "") || undefined,
          description: truncate(text),
          tags: r.jobIndustry ?? [],
        });
        n++;
      }
      ctx.log(`[jobicy] ${label}: ${jobs.length} jobs, ${n} new in list${!jobs.length && res.message ? ` (${res.message})` : ""}`); br.ok();
    } catch (e) {
      const msg = (e as Error).message;
      ctx.log(`[jobicy] ${label}: ${msg}${/HTTP 400/.test(msg) ? " (unknown industry/geo slug – see ?get=industries / ?get=locations)" : ""}`);
      if (!/HTTP 400/.test(msg)) br.fail(e); // HTTP 400 = a wrong slug in config.json, not a dead API: it must not trip the breaker
      if (++failed === plan.length) throw e;
    }
    await sleep(1_000);
  }
  return [...out.values()];
}
