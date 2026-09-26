/**
 * Remotive (provereno 19.09.2026): javni API je sveden na uzorak (~16 oglasa, parametri search/category se ignorišu),
 * ostatak je iza plaćenog naloga; RSS po kategoriji (feed/marketing) ima 1 stavku. Čitamo samo API – jeftino, slab prinos.
 * Njihova napomena: oglasi kasne 24 h, maksimalno ~4 poziva dnevno -> everyMin 360 u config.json.
 */
import { fetchJson, htmlToText, toIso, truncate } from "../http.ts";
import { parseSalaryText, salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { employmentOf, splitLocations } from "./common.ts";

interface ApiJob {
  id: number; url: string; title: string; company_name?: string; company_logo?: string; category?: string; tags?: string[];
  job_type?: string; publication_date?: string; candidate_required_location?: string; salary?: string; description?: string;
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const out = new Map<string, Job>();
  const api = await fetchJson<{ jobs?: ApiJob[] }>("https://remotive.com/api/remote-jobs?limit=100");
  for (const r of api.jobs ?? []) {
    const text = htmlToText(r.description ?? "");
    out.set(`remotive:${r.id}`, {
      source: "remotive",
      id: `remotive:${r.id}`,
      url: r.url,
      title: r.title.trim(),
      company: r.company_name?.trim() ?? "",
      companyLogo: r.company_logo || undefined,
      locations: splitLocations(r.candidate_required_location),
      remote: "remote",
      employment: employmentOf(r.job_type),
      salary: parseSalaryText(r.salary) ?? salaryFromDescription(text) ?? undefined,
      postedAt: toIso(r.publication_date ? `${r.publication_date}Z` : null), // API daje UTC bez oznake zone
      description: truncate(text),
      tags: [r.category ?? "", ...(r.tags ?? [])].filter(Boolean),
    });
  }
  ctx.log(`[remotive] ${out.size} oglasa u API uzorku`);
  return [...out.values()];
}
