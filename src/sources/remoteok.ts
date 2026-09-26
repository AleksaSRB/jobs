/**
 * Remote OK – official JSON API (verified 26.09.2026). Element 0 is a legal notice (they ask for a follow link back to the listing).
 *   /api                     the 99 newest listings site-wide (Remote OK posts only ~15 jobs/week, so this alone covers the 7-day baseline)
 *   /api?tags=<tag>          up to 100 newest listings with that tag, all ages (most are months old -> beforeBaseline)
 *   Tags are matched against Remote OK's own vocabulary: unknown ones ("research", "psychology", "mental health", "behavioral", "user research")
 *   silently return only the legal notice; some are aliases ("health" ≡ "healthcare", "writing" ≡ "content").
 * Fields: id, slug, date (ISO) / epoch, company, company_logo, position, tags[], description (HTML), location ("City, Region, Country" | "Remote" | ""),
 *         salary_min/salary_max (USD per year, 0 = not stated), url (listing on Remote OK), apply_url (always a Remote OK redirect).
 * Text fields arrive double-encoded (UTF-8 bytes served as Latin-1: "grabaciÃ³n", "Youâ\u0080\u0099ll") – fixMojibake() reverses that.
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

/** UTF-8 read as Latin-1 ("Ã³" = ó, "â\u0080\u0093" = –) -> proper text; a trailing U+FFFD only means the API cut a title mid-character. */
function fixMojibake(s: string): string {
  if (!/[Â-ô][\u0080-¿]/.test(s) || /[^\u0000-ÿ]/.test(s)) return s;
  const fixed = Buffer.from(s, "latin1").toString("utf8").replace(/�+$/, "");
  return fixed.includes("�") ? s : fixed;
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
        const text = htmlToText(fixMojibake(r.description ?? ""));
        const listing = r.url.replace("remoteOK.com", "remoteok.com");
        out.set(id, {
          source: "remoteok",
          id,
          ...preferEmployer(listing, r.apply_url?.replace("remoteOK.com", "remoteok.com"), "remoteok.com"),
          title: fixMojibake(r.position).trim(),
          company: fixMojibake(r.company ?? "").trim(),
          companyLogo: r.company_logo || undefined,
          locations: [...new Set(splitLocations(fixMojibake(r.location ?? "")))], // "New York, New York, New York, United States"
          remote: "remote",
          employment: [],
          salary: hasSalary ? { min: r.salary_min || null, max: r.salary_max || null, currency: "USD", period: "year" } : salaryFromDescription(text) ?? undefined,
          postedAt: toIso(r.date ?? r.epoch ?? null),
          description: truncate(text),
          tags: r.tags ?? [],
        });
        n++;
      }
      const jobs = rows.length - 1;
      ctx.log(`[remoteok] ${url.replace("https://remoteok.com", "")}: ${jobs} jobs, ${n} new in list${jobs === 0 && url.includes("tags=") ? " – tag unknown to Remote OK?" : ""}`); br.ok();
    } catch (e) {
      ctx.log(`[remoteok] ${url}: ${(e as Error).message}`);
      br.fail(e); if (++failed === urls.length) throw e;
    }
    await sleep(1_000);
  }
  return [...out.values()];
}
