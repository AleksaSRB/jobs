/**
 * Himalayas – zvaničan JSON search API (provereno 19.09.2026, IP iz Srbije):
 *   GET https://himalayas.app/jobs/api/search?q=<upit>&country=RS&sort=recent&page=N   (20 po strani)
 * `country=RS` vraća oglase na koje se može konkurisati iz Srbije (uključuje worldwide) -> locationVerified.
 * Polja: title, companyName, companyLogo, employmentType (Full Time/Part Time/Contractor/Freelance/Internship), seniority[] (Entry-level/Mid-level/Senior),
 *        minSalary/maxSalary/currency/salaryPeriod, locationRestrictions[], timezoneRestrictions[], categories[], description (HTML), pubDate (unix),
 *        guid (oglas na Himalayas-u), applicationLink (često direktno kod poslodavca -> „Otvori“ vodi tamo).
 * Zamke: `q` na /jobs/api (bez /search) se ignoriše; slug oglasa se ponavlja među firmama -> id sadrži i firmu.
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SalaryPeriod, SearchCtx } from "../types.ts";
import { Breaker, employmentOf, preferEmployer } from "./common.ts";

const PAGE_SIZE = 20;
const PERIODS: Record<string, SalaryPeriod> = { annual: "year", yearly: "year", monthly: "month", weekly: "week", daily: "day", hourly: "hour" };

interface ApiJob {
  title: string; excerpt?: string; companyName: string; companyLogo?: string; employmentType?: string;
  minSalary: number | null; maxSalary: number | null; salaryPeriod?: string; currency: string | null;
  seniority?: string[]; locationRestrictions?: string[]; timezoneRestrictions?: number[]; categories?: string[];
  description?: string; pubDate: number; applicationLink?: string; guid: string;
}
interface ApiPage { jobs?: ApiJob[]; offset?: number; limit?: number; totalCount?: number }

function jobId(guid: string): string {
  const m = guid.match(/\/companies\/([^/]+)\/jobs\/([^/?#]+)/);
  return m ? `himalayas:${m[1]}/${m[2]}` : `himalayas:${guid}`;
}

/** [-5, -4, ..., 3] -> "UTC-5…+3"; bez ograničenja (sve zone) -> undefined. */
function tzRange(tz: number[] | undefined): string | undefined {
  if (!tz || tz.length === 0 || tz.length >= 30) return undefined;
  const sign = (n: number) => (n >= 0 ? `+${n}` : String(n));
  const lo = Math.min(...tz), hi = Math.max(...tz);
  return lo === hi ? `UTC${sign(lo)}` : `UTC${sign(lo)}…${sign(hi)}`;
}

function toJob(j: ApiJob): Job {
  const locs = j.locationRestrictions ?? [];
  const hasSalary = (j.minSalary ?? 0) > 0 || (j.maxSalary ?? 0) > 0;
  const text = htmlToText(j.description || j.excerpt || "");
  return {
    source: "himalayas",
    id: jobId(j.guid),
    ...preferEmployer(j.guid, j.applicationLink, "himalayas.app"),
    title: j.title.trim(),
    company: j.companyName?.trim() ?? "",
    companyLogo: j.companyLogo || undefined,
    locations: locs.length ? locs : ["Worldwide"],
    locationVerified: true,
    remote: "remote",
    employment: employmentOf(j.employmentType),
    seniority: j.seniority?.[0],
    timezones: tzRange(j.timezoneRestrictions),
    salary: hasSalary
      ? { min: j.minSalary || null, max: j.maxSalary || null, currency: j.currency, period: PERIODS[(j.salaryPeriod ?? "").toLowerCase()] ?? null }
      : salaryFromDescription(text) ?? undefined,
    postedAt: toIso(j.pubDate),
    description: truncate(text),
    tags: (j.categories ?? []).map((c) => c.replace(/-/g, " ")),
  };
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { country, maxPages, queries } = CONFIG.himalayas;
  const out = new Map<string, Job>();
  let failed = 0;
  const br = new Breaker(3, "himalayas");
  for (const q of queries) {
    try {
      for (let page = 1; page <= maxPages; page++) {
        const url = `https://himalayas.app/jobs/api/search?q=${encodeURIComponent(q)}${country ? `&country=${country}` : ""}&sort=recent&page=${page}`;
        const res = await fetchJson<ApiPage>(url);
        const jobs = (res.jobs ?? []).map(toJob);
        let n = 0;
        for (const j of jobs) if (!out.has(j.id)) { out.set(j.id, j); n++; }
        ctx.log(`[himalayas] q="${q}" page=${page} results=${jobs.length} new=${n} total=${res.totalCount ?? "?"}`); br.ok();
        await sleep(500);
        const lastPage = jobs.length === 0 || (typeof res.totalCount === "number"
          ? (res.offset ?? (page - 1) * PAGE_SIZE) + (res.limit ?? PAGE_SIZE) >= res.totalCount
          : jobs.length < PAGE_SIZE);
        // sortirano po datumu: dalje strane nisu potrebne kad stignemo do starih ili već viđenih oglasa
        const reachedOld = jobs.some((j) => j.postedAt !== null && new Date(j.postedAt) < ctx.since);
        if (lastPage || reachedOld || jobs.every((j) => ctx.isSeen(j.id))) break;
      }
    } catch (e) {
      ctx.log(`[himalayas] q="${q}": ${(e as Error).message}`);
      br.fail(e); if (++failed === queries.length) throw e;
    }
  }
  return [...out.values()];
}
