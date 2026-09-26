/**
 * Adzuna – free developer API (register at https://developer.adzuna.com for app_id / app_key, put them in config.json `adzuna`):
 *   GET https://api.adzuna.com/v1/api/jobs/<country>/search/<page>?app_id=…&app_key=…&what=<query>&results_per_page=50&sort_by=date&content-type=application/json
 * countries: gb, us, at, au, be, br, ca, ch, de, es, fr, in, it, mx, nl, nz, pl, sg, za. Fields: id, title, description (snippet ~500 chars),
 * redirect_url, created, company{display_name}, location{display_name, area[]}, category{label}, salary_min/max, contract_type, contract_time.
 * Disabled until keys are set (the source then only logs a note).
 */
import { CONFIG } from "../config.ts";
import { fetchJson, sleep, toIso, truncate } from "../http.ts";
import type { EmploymentKind, Job, SearchCtx } from "../types.ts";
import { Breaker } from "./common.ts";

interface ApiJob { id: string; title: string; description?: string; redirect_url: string; created?: string; company?: { display_name?: string }; location?: { display_name?: string; area?: string[] }; category?: { label?: string }; salary_min?: number; salary_max?: number; contract_type?: string; contract_time?: string }
const CURRENCY: Record<string, string> = { gb: "GBP", us: "USD", at: "EUR", au: "AUD", be: "EUR", br: "BRL", ca: "CAD", ch: "CHF", de: "EUR", es: "EUR", fr: "EUR", in: "INR", it: "EUR", mx: "MXN", nl: "EUR", nz: "NZD", pl: "PLN", sg: "SGD", za: "ZAR" };

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { appId, appKey, countries, queries, resultsPerPage } = CONFIG.adzuna;
  if (!appId || !appKey) { ctx.log("[adzuna] no app_id / app_key in config.json – skipped (free keys: https://developer.adzuna.com)"); return []; }
  const out = new Map<string, Job>();
  let failed = 0, total = 0;
  const br = new Breaker(3, "adzuna");
  for (const country of countries) {
    for (const q of queries) {
      total++;
      try {
        const qs = new URLSearchParams({ app_id: appId, app_key: appKey, what: q, results_per_page: String(resultsPerPage), sort_by: "date", "content-type": "application/json", max_days_old: String(Math.max(1, Math.ceil((Date.now() - ctx.since.getTime()) / 86_400_000))) });
        const res = await fetchJson<{ results?: ApiJob[] }>(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?${qs}`);
        let n = 0;
        for (const r of res.results ?? []) {
          const id = `adzuna:${r.id}`;
          if (out.has(id)) continue;
          const emp: EmploymentKind[] = r.contract_time === "part_time" ? ["part-time"] : r.contract_type === "contract" ? ["contract"] : r.contract_time === "full_time" ? ["full-time"] : [];
          const loc = r.location?.display_name ?? "";
          out.set(id, {
            source: "adzuna", id, url: r.redirect_url, title: r.title.replace(/<[^>]+>/g, "").trim(), company: r.company?.display_name?.trim() ?? "",
            locations: loc ? [loc] : [], remote: /\bremote\b/i.test(`${r.title} ${loc}`) ? "remote" : "unknown", employment: emp,
            salary: r.salary_min || r.salary_max ? { min: r.salary_min || null, max: r.salary_max || null, currency: CURRENCY[country] ?? null, period: "year" } : undefined,
            postedAt: toIso(r.created), description: truncate((r.description ?? "").replace(/<[^>]+>/g, "")), tags: [r.category?.label ?? ""].filter(Boolean),
          });
          n++;
        }
        ctx.log(`[adzuna] ${country} q="${q}": ${(res.results ?? []).length} results, ${n} new`); br.ok();
      } catch (e) {
        ctx.log(`[adzuna] ${country} q="${q}": ${(e as Error).message}`);
        br.fail(e); if (++failed === total && failed >= countries.length * queries.length) throw e;
      }
      await sleep(700);
    }
  }
  return [...out.values()];
}
