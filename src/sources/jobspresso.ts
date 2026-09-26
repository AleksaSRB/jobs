/**
 * Jobspresso – WordPress "WP Job Manager" board, public RSS: GET https://jobspresso.co/?feed=job_feed&search_keywords=<q>&posts_per_page=N
 * search_keywords really filters (an unknown word returns 0 items, "psychology" 20 items in 9 years) but it is a WP `s` search, so the feed is sorted
 * by RELEVANCE: title matches (newest first, back to 2016) come before body matches (newest first) – for "research" page 1 = 20 title matches from
 * 2017–2025 and a new post that only mentions the word in the text never reaches page 1; for "health" (matches "health insurance" in every US post)
 * the 6 title matches are followed by the newest posts of the board. orderby/order are ignored. Therefore every run first takes the UNFILTERED
 * newest page (search_keywords= empty, posts_per_page=50 ≈ 0.5 MB, newest first, reaches ~6–10 months back), which is every new post on this slow
 * board (5–10 posts a month in 2026, up to ~40 in a peak month), and then the keyword pages (title matches; posts_per_page is honoured, default 10).
 * Item fields: <title>, <link>, <pubDate>, <description> (short excerpt), <content:encoded> (full HTML), <media:content url="…"> (logo) and the
 * namespaced <job_listing:company>, <job_listing:location> ("United States, Canada" | "Anywhere in US" | "Worldwide" | "Eastern Time Zone"; empty
 * on 2017–2018 posts), <job_listing:job_type> (site category: "Design", "Writing", "AI &amp; Data, Engineer"…) and <job_listing:job_category>
 * (employment: "Full Time" | "Part Time" | "Contract" | "Freelance") – note the swapped meaning of job_type / job_category on this site.
 * <dc:creator> = "Company<br>⚲ Location" (fallback for the company). Mostly US/Canada companies, so most new posts fail the eligibility rules.
 */
import { CONFIG } from "../config.ts";
import { decodeEntities, fetchText, htmlToText, rssItems, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { Breaker, employmentOf, splitLocations } from "./common.ts";

const PER_BOARD = 50; // unfiltered newest page: every new post of the board, whatever words its title has
const PER_QUERY = 20; // newest title matches per keyword (WP default is 10)

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const out = new Map<string, Job>();
  let failed = 0;
  const br = new Breaker(3, "jobspresso");
  const queries = [...new Set(["", ...CONFIG.jobspresso.queries])]; // "" = whole board newest first (see header: keyword feeds are sorted by relevance)
  for (const q of queries) {
    const label = q ? `q="${q}"` : "newest";
    try {
      const items = rssItems(await fetchText(`https://jobspresso.co/?feed=job_feed&search_keywords=${encodeURIComponent(q)}&posts_per_page=${q ? PER_QUERY : PER_BOARD}`));
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
      ctx.log(`[jobspresso] ${label}: ${items.length} items, ${n} new in list`); br.ok();
    } catch (e) {
      ctx.log(`[jobspresso] ${label}: ${(e as Error).message}`);
      br.fail(e); if (++failed === queries.length) throw e;
    }
    await sleep(800);
  }
  return [...out.values()];
}
