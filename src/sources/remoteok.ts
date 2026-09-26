/**
 * Remote OK – zvaničan JSON API (provereno 19.09.2026). Element 0 je pravna napomena (traže link nazad na oglas).
 *   /api                     99 najnovijih oglasa
 *   /api?tags=<tag>          radi samo `tags` (množina); rade "marketing", "sales", "customer support", "seo", "social media"…
 * Polja: id, slug, date/epoch, company, company_logo, position, tags[], description (HTML), location (često prazno),
 *        salary_min/salary_max (USD godišnje, 0 = nije navedeno), url (stranica na Remote OK), apply_url (najčešće opet Remote OK redirect).
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { Breaker, preferEmployer, splitLocations } from "./common.ts";

interface ApiJob {
  id?: string | number; slug?: string; date?: string; epoch?: number; company?: string; company_logo?: string; position?: string;
  tags?: string[]; description?: string; location?: string; salary_min?: number; salary_max?: number; url?: string; apply_url?: string;
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const out = new Map<string, Job>();
  const urls = ["https://remoteok.com/api", ...CONFIG.remoteok.tags.map((t) => `https://remoteok.com/api?tags=${encodeURIComponent(t)}`)];
  let failed = 0;
  const br = new Breaker(3, "remoteok");
  for (const url of urls) {
    try {
      const rows = await fetchJson<ApiJob[]>(url);
      let n = 0;
      for (const r of rows) {
        if (!r.id || !r.position || !r.url) continue;
        const id = `remoteok:${r.id}`;
        if (out.has(id)) continue;
        const hasSalary = (r.salary_max || r.salary_min || 0) >= 1_000;
        const text = htmlToText(r.description ?? "");
        const listing = r.url.replace("remoteOK.com", "remoteok.com");
        out.set(id, {
          source: "remoteok",
          id,
          ...preferEmployer(listing, r.apply_url?.replace("remoteOK.com", "remoteok.com"), "remoteok.com"),
          title: r.position.trim(),
          company: r.company?.trim() ?? "",
          companyLogo: r.company_logo || undefined,
          locations: splitLocations(r.location),
          remote: "remote",
          employment: [],
          salary: hasSalary ? { min: r.salary_min || null, max: r.salary_max || null, currency: "USD", period: "year" } : salaryFromDescription(text) ?? undefined,
          postedAt: toIso(r.date ?? r.epoch ?? null),
          description: truncate(text),
          tags: r.tags ?? [],
        });
        n++;
      }
      ctx.log(`[remoteok] ${url.replace("https://remoteok.com", "")}: ${rows.length - 1} jobs, ${n} new in list`); br.ok();
    } catch (e) {
      ctx.log(`[remoteok] ${url}: ${(e as Error).message}`);
      br.fail(e); if (++failed === urls.length) throw e;
    }
    await sleep(1_000);
  }
  return [...out.values()];
}
