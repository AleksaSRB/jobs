/**
 * Jobspresso – WordPress "WP Job Manager" board, public RSS: GET https://jobspresso.co/?feed=job_feed&search_keywords=<q>&posts_per_page=N
 * search_keywords really filters (an unknown word returns 0 items); the default page is 10 items, posts_per_page is honoured, newest first.
 * Item fields: <title>, <link>, <pubDate>, <description> (short excerpt), <content:encoded> (full HTML), <media:content url="…"> (logo) and the
 * namespaced <job_listing:company>, <job_listing:location> ("United States, Canada" | "Anywhere in US" | "Worldwide" | "Eastern Time Zone"),
 * <job_listing:job_type> (site category: "Design", "Writing", "AI &amp; Data, Engineer"…) and <job_listing:job_category> (employment: "Full Time" |
 * "Part Time" | "Contract" | "Freelance") – note the swapped meaning of job_type / job_category on this site. <dc:creator> = "Company<br>⚲ Location".
 * Slow curated remote board (~5–10 new posts a month), so most items in a run are older than the baseline. An empty query "" lists the whole board.
 */
import { CONFIG } from "../config.ts";
import { decodeEntities, fetchText, htmlToText, rssItems, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { Breaker, employmentOf, splitLocations } from "./common.ts";

const PER_QUERY = 20; // newest matches per keyword (WP default is 10)

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const out = new Map<string, Job>();
  let failed = 0;
  const br = new Breaker(3, "jobspresso");
  for (const q of CONFIG.jobspresso.queries) {
    try {
      const items = rssItems(await fetchText(`https://jobspresso.co/?feed=job_feed&search_keywords=${encodeURIComponent(q)}&posts_per_page=${PER_QUERY}`));
      let n = 0;
      for (const it of items) {
        const link = it.get("link") || it.get("guid");
        const title = it.get("title");
        if (!link || !title) continue;
        const slug = new URL(link).pathname.replace(/\/+$/, "").split("/").pop() || link;
        const id = `jobspresso:${slug}`;
        if (out.has(id)) continue;
        const text = htmlToText(it.get("content:encoded") || it.get("description"));
        const company = decodeEntities(it.get("job_listing:company")) || htmlToText(it.get("dc:creator").split(/<br/i)[0]);
        const region = decodeEntities(it.get("job_listing:location")).replace(/^(anywhere|remote) in (the )?/i, "").trim(); // "Anywhere in US" -> "US" (not worldwide)
        const logo = it.attr("media:content", "url");
        out.set(id, {
          source: "jobspresso", id, url: link, title: title.replace(/\s*[-–]\s*Remote$/i, "").trim(), company: company.trim(), companyLogo: logo || undefined,
          locations: /^(anywhere|worldwide|remote|global)$/i.test(region) ? ["Worldwide"] : splitLocations(region), remote: "remote",
          employment: employmentOf(it.get("job_listing:job_category")),
          salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(it.get("pubDate")), description: truncate(text),
          tags: decodeEntities(it.get("job_listing:job_type")).split(/\s*,\s*/).filter(Boolean),
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
