/**
 * 80,000 Hours job board (https://jobs.80000hours.org) – AI safety / AI governance / trust & safety / global-health roles, many remote-worldwide.
 * The board is a Nuxt app on a public Algolia index (search-only key embedded in the site; identical in several open-source scrapers, 2026):
 *   POST https://<appId>-dsn.algolia.net/1/indexes/<index>/query   headers x-algolia-application-id / x-algolia-api-key   body {"query":"","hitsPerPage":1000,"page":0}
 * Hit fields: title, company_name (or org / organisation), description / description_short, url_external, company_career_page_url, locations[], tags[], objectID,
 * date_published / published_at; job page https://jobs.80000hours.org/job/<objectID>. If the key rotates, put the new one in config.json `eightyk.algoliaApiKey`
 * (or a full JSON endpoint in `eightyk.url`; the legacy shapes { records: [{ fields }] } / arrays are still accepted).
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { preferEmployer, splitLocations } from "./common.ts";

const pick = (o: Record<string, any>, keys: string[]): any => { for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k]; return undefined; };
const str = (v: any): string => (Array.isArray(v) ? v.map(str).filter(Boolean).join(", ") : typeof v === "object" && v ? String(v.name ?? v.text ?? v.title ?? "") : v === undefined ? "" : String(v));

async function fetchRows(ctx: SearchCtx): Promise<Array<Record<string, any>>> {
  const { url, algoliaAppId, algoliaApiKey, index } = CONFIG.eightyk;
  if (url) {
    const raw = await fetchJson<any>(url);
    return Array.isArray(raw) ? raw : raw.hits ?? raw.records ?? raw.jobs ?? raw.data ?? raw.results ?? [];
  }
  if (!algoliaAppId || !algoliaApiKey) { ctx.log("[eightyk] neither eightyk.url nor Algolia credentials configured – skipped"); return []; }
  const res = await fetchJson<{ hits?: Array<Record<string, any>>; nbHits?: number }>(`https://${algoliaAppId}-dsn.algolia.net/1/indexes/${encodeURIComponent(index)}/query`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-algolia-application-id": algoliaAppId, "x-algolia-api-key": algoliaApiKey }, body: JSON.stringify({ query: "", hitsPerPage: 1000, page: 0 }), tries: 2,
  });
  ctx.log(`[eightyk] algolia nbHits=${res.nbHits ?? "?"}`);
  return res.hits ?? [];
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const rows = await fetchRows(ctx);
  const out = new Map<string, Job>();
  for (const row of rows) {
    const f = row.fields ?? row;
    const title = str(pick(f, ["title", "Title", "name", "Role"]));
    const oid = str(row.objectID ?? row.id ?? f.id ?? f.objectID);
    const listing = oid ? `https://jobs.80000hours.org/job/${oid}` : "";
    const external = str(pick(f, ["url_external", "Link", "link", "url", "URL", "applyUrl", "Apply URL", "company_career_page_url"]));
    if (!title || !(listing || external)) continue;
    const id = `eightyk:${oid || external}`;
    if (out.has(id)) continue;
    const text = htmlToText(str(pick(f, ["description", "Description", "description_short", "summary"])));
    const loc = str(pick(f, ["locations", "Location", "location", "City"]));
    const link = listing ? preferEmployer(listing, /^https?:/.test(external) ? external : undefined, "80000hours.org") : { url: external };
    out.set(id, {
      source: "eightyk", id, ...link, title: title.trim(),
      company: str(pick(f, ["company_name", "Hiring organisation", "Organisation", "organisation", "orgName", "org", "company", "Company"])).trim(),
      companyLogo: str(pick(f, ["company_logo", "logo"])) || undefined,
      locations: splitLocations(loc), remote: /remote|anywhere/i.test(loc) ? "remote" : "unknown", employment: [],
      salary: salaryFromDescription(text) ?? undefined,
      postedAt: toIso(str(pick(f, ["date_published", "published_at", "Date published", "datePublished", "publishedAt", "published", "Date listed", "createdTime", "created_at"])) || null),
      description: truncate(text), tags: [str(pick(f, ["tags", "Problem area", "problemAreas", "Role type", "roleType"]))].filter(Boolean),
    });
  }
  ctx.log(`[eightyk] ${rows.length} rows, ${out.size} jobs`);
  return [...out.values()];
}
