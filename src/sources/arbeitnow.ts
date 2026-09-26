/**
 * Arbeitnow – free public JSON API, no key: GET https://www.arbeitnow.com/api/job-board-api?page=N (pages 1–2 return 250 rows, later pages 100; follow links.next;
 * meta.per_page / current_page). data[]: slug, company_name, title, description (HTML; roughly 2 in 5 arrive entity-escaped "&lt;p&gt;…"), remote (bool, set on ~4 % only –
 * the location text "Remote" / "Remote (Germany)" / "Home Office" / "Poste à distance" / "Berlin (Hybrid)" and tags such as "Remote" / "Homeoffice" / "Hybrid" are the
 * better signal), url (listing on arbeitnow.com/.co.uk/.fr, no employer link), tags[] (departments + workplace words), job_types[] (mixed: employment "Full time" /
 * "Working student" / "Fixed-term" / "CDI" and seniority "Entry" / "Mid" / "Experienced" / "Executive" / "director"), location ("Berlin" / "Berlin; Munich" /
 * "DE - Stuttgart" / "100% Remote in Deutschland" / ""), created_at (unix seconds). Ordered by created_at (a few rows out of order), ~420 listings a day
 * (Germany/UK/France-heavy): stop once most of a page is older than the baseline or already seen.
 */
import { CONFIG } from "../config.ts";
import { decodeEntities, fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { EmploymentKind, Job, RemoteType, SearchCtx } from "../types.ts";
import { employmentOf, splitLocations } from "./common.ts";

interface ApiJob { slug: string; company_name?: string; title: string; description?: string; remote?: boolean; url: string; tags?: string[]; job_types?: string[]; location?: string; created_at?: number }
interface ApiPage { data?: ApiJob[]; links?: { next?: string | null } }

const REMOTE_WORD = /\b(remote|home ?office|t[ée]l[ée]travail)\b|[àa] distance\b/i, HYBRID_WORD = /\bhybrid\b/i, ONSITE_WORD = /\bon-?site\b|\bvor ort\b|\bpr[ée]sentiel\b/i;
/** Seniority labels Arbeitnow mixes into job_types ("FR Executive/Cadre" is a French contract status, not a level). */
const SENIORITY_LABEL = /entry|einstieg|\bmid\b|experienced|erfahren|associate|manager|director|executive|leitung/i;
/** job_types labels employmentOf() does not know: Werkstudent = max 20 h/week, fixed-term = temporary contract, French/German internship words. */
const EMPLOYMENT_EXTRA: [RegExp, EmploymentKind][] = [
  [/working student|werkstudent|minijob|^side$|hilfst[äa]tigkeit/i, "part-time"],
  [/fixed.?term|befristet|\bcdd\b|contract - \d/i, "temporary"],
  [/^stage$|alternance|apprentice|ausbildung/i, "internship"],
];

function employmentsOf(types: string[]): EmploymentKind[] {
  return [...new Set(types.flatMap((t) => [...employmentOf(t), ...EMPLOYMENT_EXTRA.filter(([re]) => re.test(t)).map(([, k]) => k)]))];
}

function remoteOf(flag: boolean | undefined, loc: string, tags: string): RemoteType {
  if (flag || REMOTE_WORD.test(loc) || REMOTE_WORD.test(tags)) return "remote";
  if (HYBRID_WORD.test(loc) || HYBRID_WORD.test(tags)) return "hybrid";
  return ONSITE_WORD.test(loc) ? "onsite" : "unknown";
}

/** "Remote (Germany)" -> ["Germany"], "Berlin (Hybrid)" -> ["Berlin"], "DE - Stuttgart" / "Munich (DEU)" -> ["Stuttgart"] / ["Munich"], "100% Remote in Deutschland" -> ["Deutschland"], "Remote job" -> [] (remote/hybrid go to the `remote` field). */
function cleanLocations(s: string | undefined): string[] {
  return splitLocations((s ?? "").replace(/\s+und\s+/gi, " and ").replace(/\d{1,3}\s?%/g, "")) // German lists: "Schweiz und Italien"; "100% Remote"
    .map((x) => x.replace(/\((?:DE|DEU|GER|UK|FR|AT|CH|[A-Z]{3}\d?)\)/g, "").replace(/^(?:DE|UK|FR|AT|CH)\s*-\s*(?=\S)/, "") // "(GER)", "(MUC1)", "DE - Stuttgart"
      .replace(/poste [àa] distance|[àa] distance|t[ée]l[ée]travail/gi, "")
      .replace(/\b(remote|hybrid|home ?office|head ?office|office|on-?site|zentrale|job|work|from|in)\b/gi, "").replace(/[()\-–+]+/g, " ").replace(/\s+/g, " ").trim())
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
      const loc = r.location ?? "", tags = r.tags ?? [], types = r.job_types ?? [];
      out.set(id, {
        source: "arbeitnow", id, url: r.url, title: r.title.trim(), company: r.company_name?.trim() ?? "",
        locations: cleanLocations(loc), remote: remoteOf(r.remote, loc, tags.join(" | ")), employment: employmentsOf(types),
        seniority: types.find((t) => SENIORITY_LABEL.test(t) && !/cadre/i.test(t)),
        salary: salaryFromDescription(text) ?? undefined, postedAt, description: truncate(text), tags,
      });
    }
    ctx.log(`[arbeitnow] page=${page} results=${rows.length}${old ? ` (${old} older than baseline)` : ""}${seen ? ` (${seen} already seen)` : ""}`);
    url = res.links?.next ?? null;
    if (rows.length === 0 || old >= rows.length / 2 || seen >= rows.length / 2) break; // ordered by created_at: stop once most of the page is old or known
    await sleep(800);
  }
  return [...out.values()];
}
