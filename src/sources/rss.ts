/**
 * Generic RSS / Atom source – one adapter for every board that only offers a feed (config.json `rss.feeds`):
 * NoDesk, EU Remote Jobs (WP Job Manager), Real Work From Anywhere, JobsCollider, RemoteFirstJobs, GameJobs.co (Atom), Games-Career,
 * APA PsycCareers (YM Careers), jobs.ac.uk / THE unijobs / BPS (Madgex), CharityJob, Guardian Jobs, Remote.co, Empllo, Authentic Jobs…
 * Each feed carries its own `name` (shown on the card as the source), optional `remote` (board lists remote jobs only) and `region`.
 * Company is taken from WP Job Manager / Madgex fields when present, else from the title ("Company: Title" or "Title at Company").
 */
import { CONFIG } from "../config.ts";
import { decodeEntities, fetchText, htmlToText, rssItems, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, RssFeed, SearchCtx } from "../types.ts";
import { Breaker, employmentOf, splitLocations } from "./common.ts";

/** Atom <entry> -> the same accessor interface as rssItems() gives for <item>. */
function atomEntries(xml: string) {
  return xml.split(/<entry[\s>]/).slice(1).map((raw) => ({
    get(tag: string): string {
      const m = raw.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
      if (!m) return tag === "link" ? (raw.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? "") : "";
      const cdata = m[1].match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
      return (cdata ? cdata[1] : decodeEntities(m[1])).trim();
    },
    attr(tag: string, name: string): string { const m = raw.match(new RegExp(`<${tag}\\s[^>]*?${name}="([^"]*)"`)); return m ? decodeEntities(m[1]) : ""; },
  }));
}

function splitTitle(full: string, mode: RssFeed["titleSplit"]): { title: string; company: string } {
  const t = full.replace(/\s+/g, " ").trim();
  if (mode !== "none") {
    const colon = t.match(/^([^:]{2,60}):\s+(.+)$/);
    if ((mode === "company: title" || !mode) && colon && !/^(senior|junior|lead|head|remote|urgent|hiring|wanted)\b/i.test(colon[1])) return { company: colon[1].trim(), title: colon[2].trim() };
    const at = t.match(/^(.+?)\s+(?:at|@)\s+([^()]{2,60})(?:\s*\(.*\))?$/i);
    if ((mode === "title at company" || !mode) && at) return { title: at[1].trim(), company: at[2].trim() };
    const dash = t.match(/^(.+?)\s+[-–—]\s+([A-Z][^-–—]{1,50})$/);
    if (!mode && dash && !/remote|full[- ]time|part[- ]time|contract/i.test(dash[2])) return { title: dash[1].trim(), company: dash[2].trim() };
  }
  return { title: t, company: "" };
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const feeds = CONFIG.rss.feeds.filter((f) => f && f.url && f.enabled !== false);
  if (!feeds.length) { ctx.log("[rss] no feeds configured (config.json rss.feeds)"); return []; }
  const out = new Map<string, Job>();
  const br = new Breaker(4, "rss");
  let failed = 0;
  for (const feed of feeds) {
    try {
      const xml = await fetchText(feed.url);
      const items = /<feed[\s>]/.test(xml) && !/<rss[\s>]/.test(xml) ? atomEntries(xml) : rssItems(xml);
      let n = 0;
      for (const it of items) {
        const link = it.get("link") || it.get("guid") || it.get("id");
        const full = it.get("title");
        if (!link || !full || !/^https?:/.test(link)) continue;
        const html = it.get("content:encoded") || it.get("description") || it.get("summary") || it.get("content");
        const text = htmlToText(html);
        const fieldCompany = it.get("job_listing:company") || it.get("job:company") || it.get("company") || it.get("job_listing_company") || it.get("dc:creator") || it.get("author") || "";
        const split = splitTitle(full, feed.titleSplit);
        const company = (fieldCompany && !/^(admin|editor|jobs?|feed|noreply)/i.test(fieldCompany) ? fieldCompany : split.company).replace(/\s+/g, " ").trim().slice(0, 80);
        const title = (fieldCompany ? (split.company && split.company.toLowerCase() === fieldCompany.toLowerCase() ? split.title : full) : split.title).replace(/\s*[-–|(]\s*(fully )?remote\s*[)]?\s*$/i, "").trim();
        const locField = it.get("job_listing:location") || it.get("job:location") || it.get("location") || it.get("job_listing_region") || it.get("region") || "";
        const locations = locField ? splitLocations(locField).filter((l) => !/^(remote|anywhere)$/i.test(l)) : feed.region ? [feed.region] : [];
        if (/anywhere|worldwide/i.test(locField) && !locations.some((l) => /worldwide|anywhere/i.test(l))) locations.push("Worldwide");
        const slug = (() => { try { const u = new URL(link); return (u.pathname.replace(/\/+$/, "").split("/").pop() || u.pathname) + (u.search.includes("id=") ? u.search : ""); } catch { return link; } })();
        const id = `rss:${feed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${slug}`;
        if (out.has(id)) continue;
        out.set(id, {
          source: "rss", sourceLabel: feed.name, id, url: link, title, company,
          locations, remote: feed.remote || /\bremote\b/i.test(`${full} ${locField}`) ? "remote" : "unknown",
          employment: employmentOf(it.get("job_listing:job_type") || it.get("job:type") || it.get("job_listing_type") || it.get("type") || ""),
          salary: salaryFromDescription(text) ?? undefined,
          postedAt: toIso(it.get("pubDate") || it.get("published") || it.get("updated") || it.get("dc:date")),
          description: truncate(text), tags: [it.get("category")].filter(Boolean),
        });
        n++;
      }
      ctx.log(`[rss] ${feed.name}: ${items.length} items, ${n} new in list`);
      br.ok();
    } catch (e) {
      ctx.log(`[rss] ${feed.name} (${feed.url}): ${(e as Error).message}`);
      br.fail(e);
      if (++failed === feeds.length) throw e;
    }
    await sleep(700);
  }
  return [...out.values()];
}
