/**
 * Working Nomads – javni JSON (provereno 19.09.2026): GET https://www.workingnomads.com/api/exposed_jobs/  (~50 najnovijih, sve kategorije)
 * Agregator; `url` je redirect (/job/go/<id>/) ka originalnom oglasu. Polja: title, description (HTML), company_name, category_name
 * (Marketing / Sales / Customer Success / Administration / Management / Development …), tags, location ("Global", "USA", "Philippines, Nicaragua…"), pub_date.
 * Plata: exposed_jobs je nema, ali je ima interni search sajta (/jobsapi/_search, polje salary_range, isti id) -> jedan grupni zahtev za NOVE oglase.
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, toIso, truncate } from "../http.ts";
import { parseSalaryText, salaryFromDescription } from "../salary.ts";
import { worthDetail } from "../score.ts";
import type { Job, SearchCtx } from "../types.ts";
import { splitLocations } from "./common.ts";

interface ApiJob { url: string; title: string; description?: string; company_name?: string; category_name?: string; tags?: string; location?: string; pub_date?: string }

const numericId = (j: Job) => j.id.match(/^workingnomads:(\d+)$/)?.[1];

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const rows = await fetchJson<ApiJob[]>("https://www.workingnomads.com/api/exposed_jobs/");
  const wanted = new Set(CONFIG.workingnomads.categories.map((c) => c.toLowerCase()));
  const jobs: Job[] = rows.filter((r) => r.url && r.title && (wanted.size === 0 || wanted.has((r.category_name ?? "").toLowerCase()))).map((r) => {
    const text = htmlToText(r.description ?? "");
    return {
      source: "workingnomads" as const,
      id: `workingnomads:${r.url.match(/(\d+)\/?$/)?.[1] ?? r.url}`,
      url: r.url,
      title: r.title.trim(),
      company: r.company_name?.trim() ?? "",
      locations: splitLocations(r.location),
      remote: "remote" as const,
      employment: [],
      salary: salaryFromDescription(text) ?? undefined,
      postedAt: toIso(r.pub_date),
      description: truncate(text),
      tags: [r.category_name ?? "", ...(r.tags ?? "").split(",")].map((s) => s.trim()).filter(Boolean),
    };
  });
  ctx.log(`[workingnomads] ${rows.length} oglasa u feed-u, ${jobs.length} u ciljanim kategorijama`);

  const want = jobs.filter((j) => worthDetail(j.title) && !ctx.isSeen(j.id) && numericId(j));
  if (want.length) {
    try {
      const ids = want.map((j) => numericId(j)!);
      const res = await fetchJson<{ hits?: { hits?: Array<{ _source?: { id?: number | string; salary_range?: string } }> } }>(
        `https://www.workingnomads.com/jobsapi/_search?q=${encodeURIComponent(`id:(${ids.join(" OR ")})`)}&size=${ids.length}&_source_includes=id,salary_range`);
      const rangeById = new Map((res.hits?.hits ?? []).map((h) => [String(h._source?.id), h._source?.salary_range ?? ""]));
      for (const j of want) j.salary = parseSalaryText(rangeById.get(numericId(j)!)) ?? j.salary;
    } catch { /* nedokumentovan endpoint: oglas ostaje sa platom iz opisa (ili bez nje) */ }
  }
  return jobs;
}
