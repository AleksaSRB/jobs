/**
 * 80,000 Hours job board (https://jobs.80000hours.org) – AI safety / AI governance / global health roles, many remote.
 * The site is a Next.js app fed by an Airtable-backed JSON endpoint whose URL changes between deployments, so the endpoint is configured
 * in config.json (`eightyk.url`) and this adapter accepts the two shapes seen so far:
 *   { records: [{ id, fields: { Title, "Hiring organisation", Location, "Date published", Link, "Role type", Description, "Problem area" } }] }
 *   or a plain array / { jobs: [...] } with camelCase keys (title, orgName / organisation, location, datePublished / publishedAt, url / link, description).
 * Disabled until a URL is set; when the board has no reachable JSON the source only logs a note (see docs/sources.md).
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { splitLocations } from "./common.ts";

const pick = (o: Record<string, any>, keys: string[]): any => { for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k]; return undefined; };
const str = (v: any): string => (Array.isArray(v) ? v.map(str).join(", ") : typeof v === "object" && v ? String(v.name ?? v.text ?? "") : v === undefined ? "" : String(v));

export async function search(ctx: SearchCtx): Promise<Job[]> {
  if (!CONFIG.eightyk.url) { ctx.log("[eightyk] no JSON endpoint configured (config.json eightyk.url) – skipped"); return []; }
  const raw = await fetchJson<any>(CONFIG.eightyk.url);
  const rows: Array<Record<string, any>> = Array.isArray(raw) ? raw : raw.records ?? raw.jobs ?? raw.data ?? raw.results ?? [];
  const out = new Map<string, Job>();
  for (const row of rows) {
    const f = row.fields ?? row;
    const title = str(pick(f, ["Title", "title", "name", "Role"]));
    const link = str(pick(f, ["Link", "link", "url", "URL", "applyUrl", "Apply URL"]));
    if (!title || !link) continue;
    const id = `eightyk:${row.id ?? f.id ?? link}`;
    if (out.has(id)) continue;
    const text = htmlToText(str(pick(f, ["Description", "description", "summary"])));
    const loc = str(pick(f, ["Location", "location", "locations", "City"]));
    out.set(id, {
      source: "eightyk", id, url: link, title: title.trim(), company: str(pick(f, ["Hiring organisation", "Organisation", "organisation", "orgName", "org", "company", "Company"])).trim(),
      locations: splitLocations(loc), remote: /remote|anywhere/i.test(loc) ? "remote" : "unknown", employment: [],
      salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(str(pick(f, ["Date published", "datePublished", "publishedAt", "published", "Date listed", "createdTime"])) || null),
      description: truncate(text), tags: [str(pick(f, ["Problem area", "problemAreas", "Role type", "roleType", "tags"]))].filter(Boolean),
    });
  }
  ctx.log(`[eightyk] ${rows.length} rows, ${out.size} jobs`);
  return [...out.values()];
}
