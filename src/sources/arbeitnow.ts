/**
 * Arbeitnow – free public JSON API, no key: GET https://www.arbeitnow.com/api/job-board-api?page=N
 * Fields: slug, company_name, title, description (HTML), remote (bool), url, tags[], job_types[], location ("Berlin" / "Remote"), created_at (unix seconds).
 * Mostly Europe / Germany, sorted newest first; a few pages are enough (~100 per page).
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { employmentOf, splitLocations } from "./common.ts";

interface ApiJob { slug: string; company_name?: string; title: string; description?: string; remote?: boolean; url: string; tags?: string[]; job_types?: string[]; location?: string; created_at?: number }

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const out = new Map<string, Job>();
  for (let page = 1; page <= CONFIG.arbeitnow.maxPages; page++) {
    const res = await fetchJson<{ data?: ApiJob[] }>(`https://www.arbeitnow.com/api/job-board-api?page=${page}`);
    const rows = res.data ?? [];
    let old = 0;
    for (const r of rows) {
      if (!r.slug || !r.title || !r.url) continue;
      const text = htmlToText(r.description ?? "");
      const postedAt = toIso(r.created_at ?? null);
      if (postedAt && new Date(postedAt) < ctx.since) old++;
      const id = `arbeitnow:${r.slug}`;
      if (out.has(id)) continue;
      out.set(id, {
        source: "arbeitnow", id, url: r.url, title: r.title.trim(), company: r.company_name?.trim() ?? "",
        locations: splitLocations(r.location), remote: r.remote ? "remote" : "unknown",
        employment: (r.job_types ?? []).flatMap((t) => employmentOf(t)),
        salary: salaryFromDescription(text) ?? undefined, postedAt, description: truncate(text), tags: r.tags ?? [],
      });
    }
    ctx.log(`[arbeitnow] page=${page} results=${rows.length}${old ? ` (${old} older than baseline)` : ""}`);
    if (rows.length === 0 || old >= rows.length / 2) break; // newest first: stop once most of the page is old
    await sleep(800);
  }
  return [...out.values()];
}
