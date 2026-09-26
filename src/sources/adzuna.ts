/**
 * Adzuna – free developer API (register at https://developer.adzuna.com for app_id / app_key, put them in config.json `adzuna`):
 *   GET https://api.adzuna.com/v1/api/jobs/<country>/search/<page>?app_id=…&app_key=…&what=<query>&results_per_page=50&sort_by=date&max_days_old=<n>&content-type=application/json
 * Spec (OpenAPI, developer.adzuna.com/api_docs/services/236708.json): country ∈ gb us at au be br ca ch de es fr in it mx nl nz pl sg za – nothing else
 * (no ie), so an unknown country is logged and skipped instead of burning 3 tries per query and tripping the breaker. sort_by ∈ default|hybrid|date|salary|relevance.
 * Response {count, mean, results[]}; results[]: id, title, description (truncated to 500 chars), redirect_url, created (ISO 8601), company{display_name, canonical_name},
 * location{display_name, area[]}, category{tag, label}, salary_min/max (local currency, per year), salary_is_predicted ("1" = Adzuna's Jobsworth estimate, not
 * advertised -> ignored), contract_time (full_time|part_time), contract_type (permanent|contract). Errors are JSON {exception, display}: wrong keys -> HTTP 401 AUTH_FAIL,
 * bad parameters -> 400, unknown country -> 404. Without keys the source only logs a note and returns [] (npm run check prints "not configured").
 */
import { CONFIG } from "../config.ts";
import { fetchJson, sleep, toIso, truncate } from "../http.ts";
import type { EmploymentKind, Job, SearchCtx } from "../types.ts";
import { Breaker } from "./common.ts";

export interface ApiJob { id: string; title?: string; description?: string; redirect_url: string; created?: string; company?: { display_name?: string }; location?: { display_name?: string; area?: string[] }; category?: { label?: string }; salary_min?: number; salary_max?: number; salary_is_predicted?: string; contract_type?: string; contract_time?: string }
/** The API's country enum -> local currency (Adzuna gives salaries in the market's currency). */
const CURRENCY: Record<string, string> = { gb: "GBP", us: "USD", at: "EUR", au: "AUD", be: "EUR", br: "BRL", ca: "CAD", ch: "CHF", de: "EUR", es: "EUR", fr: "EUR", in: "INR", it: "EUR", mx: "MXN", nl: "EUR", nz: "NZD", pl: "PLN", sg: "SGD", za: "ZAR" };

/** One search result -> Job (exported so the mapping can be checked offline with a documented-shape sample). */
export function toJob(r: ApiJob, country: string): Job {
  const title = (r.title ?? "").replace(/<[^>]+>/g, "").trim();
  const loc = r.location?.display_name?.trim() ?? "";
  const emp: EmploymentKind[] = r.contract_time === "part_time" ? ["part-time"] : r.contract_type === "contract" ? ["contract"] : r.contract_time === "full_time" ? ["full-time"] : [];
  const advertised = r.salary_is_predicted !== "1" && Boolean(r.salary_min || r.salary_max); // "1" = Jobsworth estimate, not what the advertiser wrote
  return {
    source: "adzuna", id: `adzuna:${r.id}`, url: r.redirect_url, title, company: r.company?.display_name?.trim() ?? "",
    locations: loc ? [loc] : [], remote: /\bremote\b/i.test(`${title} ${loc}`) ? "remote" : "unknown", employment: emp,
    salary: advertised ? { min: r.salary_min || null, max: r.salary_max || null, currency: CURRENCY[country] ?? null, period: "year" } : undefined,
    postedAt: toIso(r.created), description: truncate((r.description ?? "").replace(/<[^>]+>/g, "")), tags: [r.category?.label ?? ""].filter(Boolean),
  };
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { appId, appKey, countries, queries, resultsPerPage } = CONFIG.adzuna;
  if (!appId || !appKey) { ctx.log("[adzuna] no app_id / app_key in config.json – skipped (free keys: https://developer.adzuna.com)"); return []; }
  const markets = countries.filter((c) => c in CURRENCY);
  for (const c of countries) if (!(c in CURRENCY)) ctx.log(`[adzuna] "${c}" is not an Adzuna market – skipped (supported: ${Object.keys(CURRENCY).join(" ")})`);
  const out = new Map<string, Job>();
  let failed = 0, total = 0;
  const br = new Breaker(3, "adzuna");
  for (const country of markets) {
    for (const q of queries) {
      total++;
      try {
        const qs = new URLSearchParams({ app_id: appId, app_key: appKey, what: q, results_per_page: String(resultsPerPage), sort_by: "date", "content-type": "application/json", max_days_old: String(Math.max(1, Math.ceil((Date.now() - ctx.since.getTime()) / 86_400_000))) });
        const res = await fetchJson<{ results?: ApiJob[] }>(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?${qs}`);
        let n = 0;
        for (const r of res.results ?? []) {
          if (!r?.id || !r.redirect_url) continue;
          const j = toJob(r, country);
          if (out.has(j.id)) continue;
          out.set(j.id, j); n++;
        }
        ctx.log(`[adzuna] ${country} q="${q}": ${(res.results ?? []).length} results, ${n} new`); br.ok();
      } catch (e) {
        ctx.log(`[adzuna] ${country} q="${q}": ${(e as Error).message}`);
        br.fail(e); if (++failed === total && failed >= markets.length * queries.length) throw e; // every query failed -> the source reports ERROR, not found=0
      }
      await sleep(700);
    }
  }
  return [...out.values()];
}
