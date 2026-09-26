/**
 * Arbeitnow – free public JSON API, no key: GET https://www.arbeitnow.com/api/job-board-api?page=N (pages 1–2 return 250 rows, later pages 100; follow links.next).
 * data[]: slug, company_name, title, description (HTML; about 1 in 5 arrives entity-escaped "&lt;p&gt;…"), remote (bool, rarely set – the location text
 * "Remote" / "Remote (Germany)" / "Berlin (Hybrid)" is the better signal), url (listing on arbeitnow.com/.co.uk/.fr, no employer link), tags[] (departments),
 * job_types[] ("Full time", "Working student", "Intern", "Permanent"…), location ("Berlin" / "Berlin; Munich" / "Remote job" / ""), created_at (unix seconds).
 * Roughly newest first, ~400 listings a day (Germany/UK/France-heavy): stop once most of a page is older than the baseline or already seen.
 */
import { CONFIG } from "../config.ts";
import { decodeEntities, fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { employmentOf, splitLocations } from "./common.ts";

interface ApiJob { slug: string; company_name?: string; title: string; description?: string; remote?: boolean; url: string; tags?: string[]; job_types?: string[]; location?: string; created_at?: number }
interface ApiPage { data?: ApiJob[]; links?: { next?: string | null } }

const REMOTE_WORD = /\b(remote|home ?office)\b/i, HYBRID_WORD = /\bhybrid\b/i;

/** "Remote (Germany)" -> ["Germany"], "Berlin (Hybrid)" -> ["Berlin"], "Munich Office" -> ["Munich"], "Remote job" -> [] (remote/hybrid go to the `remote` field). */
function cleanLocations(s: string | undefined): string[] {
  return splitLocations((s ?? "").replace(/\s+und\s+/gi, " and ")) // German lists: "Schweiz und Italien"
    .map((x) => x.replace(/\b(remote|hybrid|home ?office|head ?office|office|on-?site|job|work|from)\b/gi, "").replace(/[()\-–+]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const out = new Map<string, Job>();
  let url: string | null = "https://www.arbeitnow.com/api/job-board-api?page=1";
  for (let page = 1; url && page <= CONFIG.arbeitnow.maxPages; page++) {
    let res: ApiPage;
    try { res = await fetchJson<ApiPage>(url); }
    catch (e) { if (out.size === 0) throw e; ctx.log(`[arbeitnow] page=${page} ERROR ${(e as Error).message} – keeping ${out.size} listings`); break; } // a bad later page must not lose the earlier ones
    const rows = res.data ?? [];
    let old = 0, seen = 0;
    for (const r of rows) {
      if (!r.slug || !r.title || !r.url) continue;
      const id = `arbeitnow:${r.slug}`;
      const postedAt = toIso(r.created_at ?? null);
      if (postedAt && new Date(postedAt) < ctx.since) old++;
      if (ctx.isSeen(id)) seen++;
      if (out.has(id)) continue;
      const raw = r.description ?? "";
      const text = htmlToText(/^\s*&lt;/.test(raw) ? decodeEntities(raw) : raw); // escaped feeds: unescape first, otherwise the tags survive as text
      const loc = r.location ?? "";
      out.set(id, {
        source: "arbeitnow", id, url: r.url, title: r.title.trim(), company: r.company_name?.trim() ?? "",
        locations: cleanLocations(loc), remote: r.remote || REMOTE_WORD.test(loc) ? "remote" : HYBRID_WORD.test(loc) ? "hybrid" : "unknown",
        employment: [...new Set((r.job_types ?? []).flatMap((t) => employmentOf(t)))],
        salary: salaryFromDescription(text) ?? undefined, postedAt, description: truncate(text), tags: r.tags ?? [],
      });
    }
    ctx.log(`[arbeitnow] page=${page} results=${rows.length}${old ? ` (${old} older than baseline)` : ""}${seen ? ` (${seen} already seen)` : ""}`);
    url = res.links?.next ?? null;
    if (rows.length === 0 || old >= rows.length / 2 || seen >= rows.length / 2) break; // roughly newest first: stop once most of the page is old or known
    await sleep(800);
  }
  return [...out.values()];
}
