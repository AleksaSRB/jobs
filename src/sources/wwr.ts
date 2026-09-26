/**
 * We Work Remotely – zvaničan RSS po kategoriji (provereno 26.09.2026, svih 6 feedova 200, 7–75 stavki po feedu):
 *   https://weworkremotely.com/categories/<remote-sales-and-marketing-jobs|remote-customer-support-jobs|remote-management-and-finance-jobs|remote-product-jobs|remote-design-jobs|all-other-remote-jobs>.rss
 *   <title> je "Firma: Pozicija"; <type> (Full-Time/Contract), <category>, <skills> (CSV, retko), <description> HTML opis (entity-encoded, ne CDATA),
 *   <pubDate> RFC 822, <guid> = <link>, media:content logo. Plate nema kao polje – vadi se iz teksta (~20% oglasa).
 *   Lokacija: <region> je stari tag (Anywhere in the World ~98%, USA Only, Europe Only; ponekad grad koji je poslodavac ukucao – "Manama").
 *   <country> je WWR "GeoLock" lista – kad nije prazna, oglas je zaključan SAMO za te zemlje (na stranici "This job is GeoLocked", apply dugme zaključano),
 *   a <region> i dalje kaže "Anywhere in the World" -> tada <country> zamenjuje region. Format: "🇨🇦 Canada, 🇫🇮 Finland, and 🇺🇸 United States of America"
 *   (zastavica + ime, zarez i "and"; deli se po zastavici, ne po " and " – "Bosnia and Herzegovina"). <state> = savezna država sedišta firme, ne restrikcija -> ignoriše se.
 *   (remote-marketing-jobs i remote-business-management-jobs su 301 -> ne postoje više.)
 */
import { CONFIG } from "../config.ts";
import { fetchText, htmlToText, rssItems, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { Breaker, employmentOf, splitLocations } from "./common.ts";

const FLAG = /[\u{1F1E6}-\u{1F1FF}]{2}/u; // regional-indicator pair = one flag emoji

/** GeoLock list "🇨🇦 Canada, 🇫🇮 Finland, and 🇺🇸 United States of America" -> ["Canada", "Finland", "United States of America"]. */
export function geoLockCountries(s: string): string[] {
  if (!FLAG.test(s)) return splitLocations(s); // format without flags (fallback)
  return s.split(/(?=[\u{1F1E6}-\u{1F1FF}]{2})/u)
    .map((x) => x.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "").replace(/^[\s,]+/, "").replace(/[\s,]*(\s+and)?[\s,]*$/, "").trim())
    .filter(Boolean);
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const out = new Map<string, Job>();
  let failed = 0;
  const br = new Breaker(3, "wwr");
  for (const feed of CONFIG.wwr.feeds) {
    try {
      const items = rssItems(await fetchText(`https://weworkremotely.com/categories/${feed}.rss`));
      let n = 0;
      for (const it of items) {
        const link = it.get("link") || it.get("guid");
        const full = it.get("title");
        if (!link || !full) continue;
        const sep = full.indexOf(": ");
        const text = htmlToText(it.get("description"));
        const region = it.get("region"), geo = geoLockCountries(it.get("country"));
        const job: Job = {
          source: "wwr",
          id: `wwr:${new URL(link).pathname.replace(/\/+$/, "").split("/").pop()}`,
          url: link,
          title: (sep > 0 ? full.slice(sep + 2) : full).replace(/\s+/g, " ").trim(),
          company: sep > 0 ? full.slice(0, sep).replace(/\s+/g, " ").trim() : "",
          companyLogo: it.attr("media:content", "url") || undefined,
          locations: geo.length ? [...new Set(geo)] : region ? [region] : [], // GeoLock list beats the (then misleading) "Anywhere in the World" region
          remote: "remote",
          employment: employmentOf(it.get("type")),
          salary: salaryFromDescription(text) ?? undefined,
          postedAt: toIso(it.get("pubDate")),
          description: truncate(text),
          tags: [it.get("category"), ...it.get("skills").split(",")].map((s) => s.trim()).filter(Boolean),
        };
        if (!out.has(job.id)) { out.set(job.id, job); n++; }
      }
      ctx.log(`[wwr] ${feed}: ${items.length} items, ${n} new in list`); br.ok();
    } catch (e) {
      ctx.log(`[wwr] ${feed}: ${(e as Error).message}`);
      br.fail(e); if (++failed === CONFIG.wwr.feeds.length) throw e;
    }
    await sleep(500);
  }
  return [...out.values()];
}
