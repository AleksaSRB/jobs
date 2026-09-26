/**
 * 80,000 Hours job board (https://jobs.80000hours.org) – AI safety / AI governance / biosecurity / global-health roles, ~1000 live, many remote-worldwide.
 * Nuxt app on a public Algolia index; app id + search-only key sit in the page's runtime config (`algoliaApplicationId` / `algoliaApiKey` / `algoliaJobsIndex`; verified 09/2026):
 *   POST https://<appId>-dsn.algolia.net/1/indexes/<index>/query   headers x-algolia-application-id / x-algolia-api-key   body {"query":"","hitsPerPage":1000,"page":N}
 * Hit fields (live): objectID = post_pk, title, description_short (HTML bullets – `description` is always ""), company_name, company_description, company_logo_url,
 * url_external (employer link + utm), posted_at / closes_at (unix seconds), card_locations[] ("Remote, Global", "London, UK"), tags_country[] ("USA", "Europe (ex UK)"),
 * tags_location_type[] (["Remote"] or []), tags_role_type[] (Full-time / Part-time / Internship / Fellowship / Volunteering / Funding / Course / Other), tags_exp_required[],
 * experience_min (years), salary (text, "Unpaid" for volunteering), tags_area[], tags_skill[]. Listing permalink: https://jobs.80000hours.org/?jobPk=<post_pk>.
 * Funding (grants) and Course entries share the index but are not jobs – skipped. If the key rotates, copy the new values from the HTML of jobs.80000hours.org into
 * config.json `eightyk` (or set a full JSON endpoint in `eightyk.url`; { records: [{ fields }] } / plain arrays are still accepted there).
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, toIso, truncate } from "../http.ts";
import { parseSalaryText, salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { employmentOf, preferEmployer, splitLocations } from "./common.ts";

const PAGE_MAX = 5;                      // 1000 hits per page – the whole board fits in one; more pages only if it grows past that
const NOT_A_JOB = /^(funding|course)$/i; // grants and courses are listed next to the jobs

const pick = (o: Record<string, any>, keys: string[]): any => { for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k]; return undefined; };
const str = (v: any): string => (Array.isArray(v) ? v.map(str).filter(Boolean).join(", ") : typeof v === "object" && v ? String(v.name ?? v.text ?? v.title ?? "") : v === undefined ? "" : String(v));
const list = (v: any): string[] => (Array.isArray(v) ? v.map(str).filter(Boolean) : str(v) ? [str(v)] : []);
const noRemote = (xs: string[]): string[] => xs.map((s) => s.replace(/^remote,\s*/i, "").trim()).filter((s) => s && !/^remote$/i.test(s)); // the remote flag lives in `remote`, not in locations

async function fetchRows(ctx: SearchCtx): Promise<Array<Record<string, any>>> {
  const { url, algoliaAppId, algoliaApiKey, index } = CONFIG.eightyk;
  if (url) {
    const raw = await fetchJson<any>(url);
    return Array.isArray(raw) ? raw : raw.hits ?? raw.records ?? raw.jobs ?? raw.data ?? raw.results ?? [];
  }
  if (!algoliaAppId || !algoliaApiKey) { ctx.log("[eightyk] neither eightyk.url nor Algolia credentials configured – skipped"); return []; }
  const rows: Array<Record<string, any>> = [];
  for (let page = 0; page < PAGE_MAX; page++) {
    let res: { hits?: Array<Record<string, any>>; nbHits?: number; nbPages?: number };
    try {
      res = await fetchJson(`https://${algoliaAppId}-dsn.algolia.net/1/indexes/${encodeURIComponent(index)}/query`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-algolia-application-id": algoliaAppId, "x-algolia-api-key": algoliaApiKey }, body: JSON.stringify({ query: "", hitsPerPage: 1000, page }), tries: 2,
      });
    } catch (e) { if (page === 0) throw e; ctx.log(`[eightyk] page ${page} failed (${(e as Error).message}) – keeping ${rows.length} rows`); break; } // first page must work, later ones are a bonus
    rows.push(...(res.hits ?? []));
    if (page === 0) ctx.log(`[eightyk] algolia nbHits=${res.nbHits ?? "?"} nbPages=${res.nbPages ?? "?"}`);
    if (!res.hits?.length || page + 1 >= (res.nbPages ?? 1)) break;
  }
  return rows;
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const rows = await fetchRows(ctx);
  const out = new Map<string, Job>();
  const now = Date.now() / 1000;
  let notJobs = 0, closed = 0;
  for (const row of rows) {
    const f = row.fields ?? row;
    const title = str(pick(f, ["title", "Title", "name"]));
    const oid = str(row.objectID ?? f.post_pk ?? f.id ?? f.objectID);
    const external = str(pick(f, ["url_external", "url", "Link", "link", "applyUrl", "company_career_page_url"]));
    if (!title || !(oid || external)) continue;
    const roleTypes = list(pick(f, ["tags_role_type", "Role type", "roleType"]));
    if (roleTypes.some((t) => NOT_A_JOB.test(t))) { notJobs++; continue; }
    if (typeof f.closes_at === "number" && f.closes_at < now) { closed++; continue; }
    const id = `eightyk:${oid || external}`;
    if (out.has(id)) continue;
    const listing = oid ? `https://jobs.80000hours.org/?jobPk=${encodeURIComponent(oid)}` : "";
    const link = listing ? preferEmployer(listing, /^https?:/.test(external) ? external : undefined, "80000hours.org") : { url: external };
    const company = str(pick(f, ["company_name", "company", "Hiring organisation", "organisation", "org"])).trim();
    const salaryText = str(pick(f, ["salary", "Salary"])).trim();
    const about = htmlToText(str(pick(f, ["company_description"])));
    const text = [htmlToText(str(pick(f, ["description", "Description", "description_short", "summary"]))), salaryText && `Compensation: ${salaryText}`, about && `About ${company || "the organisation"}: ${about}`].filter(Boolean).join("\n\n");
    const rawLoc = pick(f, ["card_locations", "locations", "Location", "location"]);
    const cards = noRemote(Array.isArray(rawLoc) ? rawLoc.map(str) : splitLocations(str(rawLoc))); // "Remote, Global" -> "Global", "London, UK" stays whole
    const countries = noRemote(list(pick(f, ["tags_country", "country"]))).filter((c) => !/\(confirmed visas\)$/i.test(c) && !cards.some((x) => x.includes(c))); // country / region facets ("USA", "Europe (ex UK)") not already in the card text
    const exp = list(pick(f, ["tags_exp_required"]));
    out.set(id, {
      source: "eightyk", id, ...link, title: title.trim(), company,
      companyLogo: str(pick(f, ["company_logo_url", "company_logo", "logo"])) || undefined,
      locations: [...new Set([...cards, ...countries])], remote: list(f.tags_location_type).some((t) => /remote/i.test(t)) || /\bremote\b|anywhere/i.test(str(rawLoc)) ? "remote" : "unknown",
      employment: [...new Set(roleTypes.flatMap((t) => employmentOf(t)))],
      seniority: exp.join(", ") || undefined, yearsMin: typeof f.experience_min === "number" ? f.experience_min : undefined,
      salary: parseSalaryText(salaryText) ?? salaryFromDescription(text) ?? undefined,
      postedAt: toIso(pick(f, ["posted_at", "created_at", "date_published", "published_at", "Date published"]) ?? null),
      description: truncate(text), tags: [...list(pick(f, ["tags_area", "Problem area"])), ...list(pick(f, ["tags_skill"])), ...roleTypes],
    });
  }
  ctx.log(`[eightyk] ${rows.length} rows, ${out.size} jobs (skipped ${notJobs} funding/course entries, ${closed} past closing date)`);
  return [...out.values()];
}
