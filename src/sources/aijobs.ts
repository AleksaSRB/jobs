/**
 * aijobs.net – AI / ML / data job board with public RSS feeds (https://aijobs.net/feed/ and filtered variants).
 * Items: <title> "Job Title at Company", <link>, <description> (HTML), <pubDate>, <category>, sometimes <dc:creator>.
 * Many roles are engineering (the matcher rejects those); the interesting ones are AI safety / policy / evaluation / annotation / conversation design.
 */
import { CONFIG } from "../config.ts";
import { fetchText, htmlToText, rssItems, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { Breaker } from "./common.ts";

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const out = new Map<string, Job>();
  let failed = 0;
  const br = new Breaker(3, "aijobs");
  for (const feed of CONFIG.aijobs.feeds) {
    try {
      const items = rssItems(await fetchText(feed));
      let n = 0;
      for (const it of items) {
        const link = it.get("link") || it.get("guid");
        const full = it.get("title");
        if (!link || !full) continue;
        const m = full.match(/^(.*?)\s+(?:at|@|-|–)\s+([^-–]+)$/);
        const id = `aijobs:${new URL(link).pathname.replace(/\/+$/, "").split("/").pop() ?? link}`;
        if (out.has(id)) continue;
        const html = it.get("description");
        const text = htmlToText(html);
        const locLine = text.match(/^(?:Location|Based in)[:\s]+(.+)$/mi)?.[1];
        out.set(id, {
          source: "aijobs", id, url: link, title: (m ? m[1] : full).trim(), company: (m ? m[2] : it.get("dc:creator") || "").trim(),
          locations: locLine ? locLine.split(/[,;|]/).map((s) => s.trim()).filter((s) => s && !/remote/i.test(s)) : [],
          remote: /\bremote\b/i.test(full + " " + (locLine ?? "")) ? "remote" : "unknown", employment: [],
          salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(it.get("pubDate")), description: truncate(text), tags: [it.get("category")].filter(Boolean),
        });
        n++;
      }
      ctx.log(`[aijobs] ${feed}: ${items.length} items, ${n} new in list`); br.ok();
    } catch (e) {
      ctx.log(`[aijobs] ${feed}: ${(e as Error).message}`);
      br.fail(e); if (++failed === CONFIG.aijobs.feeds.length) throw e;
    }
    await sleep(800);
  }
  return [...out.values()];
}
