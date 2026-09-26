/**
 * Jobspresso – WordPress "WP Job Manager" board, public RSS: GET https://jobspresso.co/?feed=job_feed&search_keywords=<q>
 * Items: <title> (job title), <link>, <description> (HTML), <pubDate>, <job_listing_type>, <job_listing_region>, and the company in
 * <dc:creator> / "Company: X" inside the description. Curated remote jobs (marketing, support, product, design, writing…).
 */
import { CONFIG } from "../config.ts";
import { fetchText, htmlToText, rssItems, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { Breaker, employmentOf } from "./common.ts";

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const out = new Map<string, Job>();
  let failed = 0;
  const br = new Breaker(3, "jobspresso");
  for (const q of CONFIG.jobspresso.queries) {
    try {
      const items = rssItems(await fetchText(`https://jobspresso.co/?feed=job_feed&search_keywords=${encodeURIComponent(q)}`));
      let n = 0;
      for (const it of items) {
        const link = it.get("link") || it.get("guid");
        const title = it.get("title");
        if (!link || !title) continue;
        const slug = new URL(link).pathname.replace(/\/+$/, "").split("/").pop() ?? link;
        const id = `jobspresso:${slug}`;
        if (out.has(id)) continue;
        const html = it.get("description");
        const text = htmlToText(html);
        const company = it.get("job_listing_company") || it.get("company") || text.match(/^Company:\s*(.+)$/m)?.[1] || it.get("dc:creator") || "";
        const region = it.get("job_listing_region") || it.get("region");
        out.set(id, {
          source: "jobspresso", id, url: link, title: title.replace(/\s*[-–]\s*Remote$/i, "").trim(), company: company.trim(),
          locations: region && !/anywhere|remote/i.test(region) ? [region] : region ? ["Anywhere"] : [], remote: "remote",
          employment: employmentOf(it.get("job_listing_type") || it.get("job_type")),
          salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(it.get("pubDate")), description: truncate(text), tags: [it.get("category")].filter(Boolean),
        });
        n++;
      }
      ctx.log(`[jobspresso] q="${q}": ${items.length} items, ${n} new in list`); br.ok();
    } catch (e) {
      ctx.log(`[jobspresso] q="${q}": ${(e as Error).message}`);
      br.fail(e); if (++failed === CONFIG.jobspresso.queries.length) throw e;
    }
    await sleep(800);
  }
  return [...out.values()];
}
