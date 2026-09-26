/**
 * The Muse – public JSON API, no key needed (rate-limited, ~500 requests/hour):
 *   GET https://www.themuse.com/api/public/jobs?page=N&category=<name>&level=<short>&location=Flexible%20%2F%20Remote
 * Fields: id, name, contents (HTML), publication_date, locations[{name}], categories[{name}], levels[{name, short_name}], company{name, short_name}, refs{landing_page}.
 * Pages are 20 jobs; `page` is 0-based. Mostly US companies – the matcher rejects US-only ones, but some are "Flexible / Remote" worldwide.
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { Breaker } from "./common.ts";

interface ApiJob { id: number; name: string; contents?: string; publication_date?: string; locations?: Array<{ name?: string }>; categories?: Array<{ name?: string }>; levels?: Array<{ name?: string; short_name?: string }>; company?: { name?: string; short_name?: string }; refs?: { landing_page?: string } }

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { categories, levels, maxPages } = CONFIG.themuse;
  const out = new Map<string, Job>();
  let failed = 0, calls = 0;
  const br = new Breaker(3, "themuse");
  for (const cat of categories) {
    try {
      for (let page = 0; page < maxPages; page++) {
        const qs = new URLSearchParams({ page: String(page), category: cat, location: "Flexible / Remote" });
        for (const l of levels) qs.append("level", l);
        const res = await fetchJson<{ page_count?: number; results?: ApiJob[] }>(`https://www.themuse.com/api/public/jobs?${qs}`);
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
        ctx.log(`[themuse] category="${cat}" page=${page} results=${rows.length} new=${n}${old ? ` old=${old}` : ""}`); br.ok();
        await sleep(1_200);
        if (rows.length < 20 || old >= rows.length / 2 || page + 1 >= (res.page_count ?? 1)) break;
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
