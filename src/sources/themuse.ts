/**
 * The Muse – public JSON API, no key needed (500 requests/hour per IP, X-Ratelimit-Remaining header; registered key = 3600/h):
 *   GET https://www.themuse.com/api/public/jobs?page=N&category=<name>&level=<name>&location=Flexible%20%2F%20Remote
 * Response: { page, page_count, items_per_page: 20, total, results[] }; `page` is 0-based and pages above 99 are HTTP 400 ("Value `page` is too high").
 * Job: id, name, contents (HTML), publication_date (ISO Z), locations[{name}], categories[{name}], levels[{name, short_name}], company{id, name, short_name}, refs{landing_page}.
 * Filters (see themuse.com/developers/api/v2): `category` must be one of the documented names ("Design and UX", "Product Management",
 *   "Human Resources and Recruitment", "Writing and Editing", …) – an unknown name silently returns total=0; `level` takes the FULL name
 *   ("Entry Level", "Mid Level", "Senior Level", "Internship", "management") – short names ("entry") are silently ignored, i.e. no level filter at all.
 * Results are NOT sorted by date (`descending` changes nothing, the order is stable between calls), so every page up to maxPages is read
 * and the baseline date filter is applied per job. Mostly US companies – the matcher rejects US-only ones; "Flexible / Remote" also covers worldwide roles.
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { Breaker } from "./common.ts";

interface ApiJob { id: number; name: string; contents?: string; publication_date?: string; locations?: Array<{ name?: string }>; categories?: Array<{ name?: string }>; levels?: Array<{ name?: string; short_name?: string }>; company?: { name?: string; short_name?: string }; refs?: { landing_page?: string } }
interface ApiPage { page?: number; page_count?: number; total?: number; results?: ApiJob[] }

/** Old config values / API short_names -> the full level names the filter actually understands. */
const LEVEL_NAMES: Record<string, string> = { entry: "Entry Level", mid: "Mid Level", senior: "Senior Level", internship: "Internship", management: "management" };
const MAX_PAGE = 99;

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { categories, levels, maxPages } = CONFIG.themuse;
  const levelNames = levels.map((l) => LEVEL_NAMES[l.trim().toLowerCase()] ?? l);
  const out = new Map<string, Job>();
  let failed = 0, calls = 0;
  const br = new Breaker(3, "themuse");
  for (const cat of categories) {
    try {
      for (let page = 0; page < maxPages && page <= MAX_PAGE; page++) {
        const qs = new URLSearchParams({ page: String(page), category: cat, location: "Flexible / Remote" });
        for (const l of levelNames) qs.append("level", l);
        const res = await fetchJson<ApiPage>(`https://www.themuse.com/api/public/jobs?${qs}`);
        calls++;
        const rows = res.results ?? [];
        let old = 0, n = 0;
        for (const r of rows) {
          if (!r.id || !r.name) continue;
          const id = `themuse:${r.id}`;
          const postedAt = toIso(r.publication_date);
          if (postedAt && new Date(postedAt) < ctx.since) { old++; continue; }
          if (out.has(id)) continue;
          const text = htmlToText(r.contents ?? "");
          const locs = (r.locations ?? []).map((l) => l.name ?? "").filter(Boolean);
          out.set(id, {
            source: "themuse", id, url: r.refs?.landing_page ?? `https://www.themuse.com/jobs/${r.company?.short_name ?? "x"}/${r.id}`, title: r.name.trim(),
            company: r.company?.name?.trim() ?? "",
            locations: locs.filter((l) => !/flexible \/ remote/i.test(l)), remote: locs.some((l) => /remote/i.test(l)) ? "remote" : "unknown",
            employment: [], seniority: r.levels?.[0]?.name,
            salary: salaryFromDescription(text) ?? undefined, postedAt, description: truncate(text), tags: (r.categories ?? []).map((c) => c.name ?? "").filter(Boolean),
          });
          n++;
        }
        ctx.log(`[themuse] category="${cat}" page=${page} pages=${res.page_count ?? "?"} total=${res.total ?? "?"} results=${rows.length} new=${n}${old ? ` old=${old}` : ""}`); br.ok();
        if (page === 0 && rows.length === 0) ctx.log(`[themuse] category="${cat}": 0 results – not a category name from themuse.com/developers/api/v2?`);
        await sleep(1_200);
        if (rows.length < 20 || page + 1 >= (res.page_count ?? 1)) break;
      }
    } catch (e) {
      ctx.log(`[themuse] ${cat}: ${(e as Error).message}`);
      br.fail(e); if (++failed === categories.length) throw e;
      if (/429/.test((e as Error).message)) break;
    }
  }
  ctx.log(`[themuse] ${calls} requests, ${out.size} jobs`);
  return [...out.values()];
}
