/**
 * ReliefWeb Jobs – official API of the UN OCHA humanitarian portal (https://apidoc.reliefweb.int; v1 is decommissioned: HTTP 410 "use version v2"):
 *   GET https://api.reliefweb.int/v2/jobs?appname=<approved>&profile=full&limit=100&sort[]=date:desc&query[value]=<lucene>&query[operator]=OR
 * `appname` is mandatory and since 1 Nov 2025 must be PRE-APPROVED by ReliefWeb (free; short form linked from https://apidoc.reliefweb.int/parameters#appname,
 * "<organisation>-<purpose>-<random chars>", the approved string arrives by e-mail); any other value -> HTTP 403 {"error":{"type":"AccessDeniedHttpException",
 * "message":"You are not using an approved appname…"}}. It goes into config.json -> reliefweb.appname; without it the source only logs a note and returns []
 * (npm run check prints "not configured"). Fair use: 1000 calls/day, max 1000 rows per call – one call per run.
 * The whole domain (api.reliefweb.int, and reliefweb.int incl. its /jobs/rss.xml – so there is no keyless fallback) sits behind AWS WAF: bursts get HTTP 202 + an
 * "AwsWafIntegration" JavaScript challenge page (header x-amzn-waf-action: challenge) instead of JSON; reported as a clear error, it lifts by itself after a while.
 * Response {time, href, links, totalCount, count, data[]}; data[]: {id, score, href, fields}; fields (v2 is field-compatible with v1 – apidoc.reliefweb.int/fields-tables):
 *   title, body (Markdown), body-html, url (https://reliefweb.int/node/<id>), url_alias (https://reliefweb.int/job/<id>/<slug>), status, date.{created,changed,closing},
 *   source[].{name,shortname}, country[].{name,iso3} ("World" = global posting), city[].name (free text, sometimes "Remote" / "Home-based"),
 *   type[].name (Job | Consultancy | Volunteer Opportunity | Internship), experience[].name ("0-2 years" | "3-4 years" | "5-9 years" | "10+ years"),
 *   career_categories[].name, theme[].name, how_to_apply, how_to_apply-html.
 * Coverage: MHPSS (mental health & psychosocial support) advisers, psychologists, staff well-being, social & behaviour change (SBC) specialists,
 * research consultancies – many remote / home-based consultancies open to non-US/EU nationals. The matcher rejects unpaid volunteer posts.
 */
import { CONFIG } from "../config.ts";
import { fetchText, htmlToText, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";

type Any = Record<string, any>;
export interface ApiRow { id: string; fields?: Any }
const API = "https://api.reliefweb.int/v2/jobs";
const APPNAME_DOC = "https://apidoc.reliefweb.int/parameters#appname";
const names = (v: any): string[] => (Array.isArray(v) ? v.map((x) => String(x?.name ?? x ?? "")).filter(Boolean) : []);
/** Remote only from title / city – humanitarian descriptions are full of "remote areas", "remote field locations", so the text is left to the matcher. */
const REMOTE = /\b(remote(?!\s+(area|location|communit|field|clinic|site|region|village|district|rural|part|corner))|home[- ]?based|work(ing)? from home|telecommut\w*|telework\w*)\b/i;
const REMOTE_PLACE = /^(remote|home[- ]?based|work from home|any(where)?|worldwide|global)$/i;

/** One API row -> Job (exported so the mapping can be checked offline with a documented-shape sample); null = no id / title. */
export function toJob(row: ApiRow): Job | null {
  const f = row.fields ?? {};
  const title = String(f.title ?? "").trim();
  if (!row.id || !title) return null;
  const apply = f["how_to_apply-html"] ?? f.how_to_apply;
  const text = htmlToText(String(f["body-html"] ?? f.body ?? "") + (apply ? `\n\nHow to apply: ${apply}` : ""));
  const countries = names(f.country).map((c) => (c === "World" ? "Worldwide" : c)), cities = names(f.city), type = names(f.type), exp = names(f.experience)[0] ?? "";
  const yearsMin = Number(exp.match(/^(\d+)/)?.[1]);
  const id = `reliefweb:${row.id}`;
  return {
    source: "reliefweb", id, url: String(f.url_alias ?? f.url ?? `https://reliefweb.int/node/${row.id}`), title,
    company: names(f.source)[0] ?? "", locations: [...cities.filter((c) => !REMOTE_PLACE.test(c)), ...countries].filter((x, i, a) => a.indexOf(x) === i),
    remote: REMOTE.test(title) || cities.some((c) => REMOTE_PLACE.test(c)) ? "remote" : "unknown",
    employment: type.some((t) => /consultan/i.test(t)) ? ["contract"] : type.some((t) => /intern/i.test(t)) ? ["internship"] : type.some((t) => /volunteer/i.test(t)) ? ["temporary"] : [],
    yearsMin: Number.isFinite(yearsMin) ? yearsMin : undefined,
    salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(f.date?.created ?? f.date?.changed ?? null), description: truncate(text),
    tags: [...type, ...names(f.theme).slice(0, 3), ...names(f.career_categories).slice(0, 2)],
  };
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { appname, query, limit } = CONFIG.reliefweb;
  if (!appname) { ctx.log(`[reliefweb] no appname in config.json (reliefweb.appname) – skipped; request a free pre-approved one at ${APPNAME_DOC}`); return []; }
  const qs = new URLSearchParams({ appname, profile: "full", limit: String(Math.min(1000, Math.max(1, limit || 100))), "sort[]": "date:desc", "query[value]": query, "query[operator]": "OR" });
  let body: string;
  try { body = await fetchText(`${API}?${qs}`); }
  catch (e) { const m = (e as Error).message; throw new Error(/HTTP 403/.test(m) ? `appname "${appname}" is not approved by ReliefWeb (HTTP 403) – request one at ${APPNAME_DOC}` : m); }
  if (/AwsWafIntegration|awsWafCookieDomainList|awswaf\.com/.test(body)) throw new Error("AWS WAF JavaScript challenge instead of JSON (HTTP 202, x-amzn-waf-action: challenge) – this IP is throttled for a while, retry later");
  let res: { data?: ApiRow[]; totalCount?: number; error?: { message?: string } };
  try { res = JSON.parse(body); } catch { throw new Error(`not JSON: ${body.slice(0, 120).replace(/\s+/g, " ")}`); }
  if (res.error) throw new Error(`API error: ${res.error.message ?? JSON.stringify(res.error).slice(0, 120)}`);
  const out = new Map<string, Job>();
  let skipped = 0;
  for (const row of res.data ?? []) { const j = toJob(row); if (j) out.set(j.id, j); else skipped++; } // old rows go back too – scrape.ts counts them as beforeBaseline
  ctx.log(`[reliefweb] total=${res.totalCount ?? "?"} fetched=${(res.data ?? []).length} kept=${out.size}${skipped ? ` noTitle=${skipped}` : ""}`);
  return [...out.values()];
}
