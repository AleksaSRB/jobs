/**
 * Hacker News "Ask HN: Who is hiring?" (monthly thread) via the public Algolia API (no key):
 *   thread:   GET https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=%22who%20is%20hiring%22&hitsPerPage=3
 *   comments: GET https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_<id>&hitsPerPage=1000&page=N
 * Each top-level comment is one company's posting, free text: "Company | Role(s) | REMOTE | Full-time | https://…".
 * We keep only comments mentioning remote work; the first line becomes company + title, the rest the description.
 * Startups (AI, health-tech) post here that never reach the boards. The matcher's keyword rules decide relevance.
 */
import { CONFIG } from "../config.ts";
import { decodeEntities, fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";

interface Hit { objectID: string; created_at?: string; created_at_i?: number; comment_text?: string; parent_id?: number; story_id?: number; title?: string; author?: string }

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const stories = await fetchJson<{ hits?: Hit[] }>("https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=%22who%20is%20hiring%22&hitsPerPage=4");
  const thread = (stories.hits ?? []).find((h) => /who is hiring/i.test(h.title ?? ""));
  if (!thread) throw new Error("current 'Who is hiring' thread not found");
  ctx.log(`[hn] thread: ${thread.title} (${thread.objectID})`);
  const keywords = CONFIG.hn.keywords.map((k) => new RegExp(k, "i"));
  const out = new Map<string, Job>();
  let seen = 0;
  for (let page = 0; seen < CONFIG.hn.maxComments; page++) {
    const res = await fetchJson<{ hits?: Hit[]; nbPages?: number }>(`https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_${thread.objectID}&hitsPerPage=200&page=${page}`);
    const hits = res.hits ?? [];
    for (const h of hits) {
      seen++;
      if (Number(h.parent_id) !== Number(thread.objectID)) continue; // only top-level postings
      const text = htmlToText(decodeEntities(h.comment_text ?? "").replace(/<p>/g, "\n"));
      if (!text || !keywords.every((k) => k.test(text))) continue;
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const head = lines[0] ?? "";
      const parts = head.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
      const company = parts[0]?.replace(/\s*\(.*?\)\s*$/, "").slice(0, 80) ?? "";
      const roles = parts.slice(1).filter((p) => !/^(remote|onsite|on-site|hybrid|full[- ]?time|part[- ]?time|contract|intern|https?:|\$|€|£|[A-Z]{2,3}$|[a-z]+, [a-z]+$)/i.test(p) && !/^\d/.test(p));
      const title = (roles[0] ?? head).slice(0, 120);
      if (!title) continue;
      const url = text.match(/https?:\/\/[^\s)>\]]+/)?.[0] ?? `https://news.ycombinator.com/item?id=${h.objectID}`;
      const id = `hn:${h.objectID}`;
      out.set(id, {
        source: "hn", id, url, sourceUrl: url.includes("ycombinator.com") ? undefined : `https://news.ycombinator.com/item?id=${h.objectID}`,
        title, company,
        locations: [], remote: /\b(remote|anywhere)\b/i.test(head) ? "remote" : "unknown",
        employment: /part[- ]?time/i.test(head) ? ["part-time"] : /contract/i.test(head) ? ["contract"] : /full[- ]?time/i.test(head) ? ["full-time"] : [],
        salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(h.created_at ?? h.created_at_i ?? null), description: truncate(text), tags: ["hn"],
      });
    }
    if (hits.length < 200 || page + 1 >= (res.nbPages ?? 1)) break;
    await sleep(600);
  }
  ctx.log(`[hn] ${seen} comments read, ${out.size} remote postings kept`);
  return [...out.values()];
}
