/**
 * ReliefWeb Jobs – official open API of the UN OCHA humanitarian portal (no key; `appname` is mandatory; fair use ~1000 calls/day):
 *   GET https://api.reliefweb.int/v1/jobs?appname=<app>&profile=full&limit=100&sort[]=date:desc&query[value]=<lucene query>
 * Fields: id, fields.title, fields.body (markdown/HTML), fields.date.created, fields.source[].name, fields.country[].name, fields.city[].name,
 *   fields.type[].name (Job / Consultancy / Volunteer), fields.experience[].name ("0-2 years", "3-4 years", "5-9 years"), fields.url, fields.how_to_apply.
 * Coverage: MHPSS (mental health & psychosocial support) advisers, psychologists, staff well-being, social & behaviour change (SBC) specialists,
 * research consultancies – many remote / consultant roles open to non-US/EU nationals. The matcher rejects unpaid volunteer posts.
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";

type Any = Record<string, any>;
const names = (v: any): string[] => (Array.isArray(v) ? v.map((x) => String(x?.name ?? x ?? "")).filter(Boolean) : []);

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { query, limit } = CONFIG.reliefweb;
  const qs = new URLSearchParams({ appname: "psych-healthtech-jobs", profile: "full", limit: String(Math.min(1000, limit)), "sort[]": "date:desc", "query[value]": query, "query[operator]": "OR" });
  const res = await fetchJson<{ data?: Array<{ id: string; fields?: Any }> ; totalCount?: number }>(`https://api.reliefweb.int/v1/jobs?${qs}`);
  const out = new Map<string, Job>();
  let old = 0;
  for (const row of res.data ?? []) {
    const f = row.fields ?? {};
    const title = String(f.title ?? "").trim();
    if (!row.id || !title) continue;
    const postedAt = toIso(f.date?.created ?? f.date?.changed ?? null);
    if (postedAt && new Date(postedAt) < ctx.since) { old++; continue; }
    const text = htmlToText(String(f.body ?? "") + (f.how_to_apply ? `\n\nHow to apply: ${f.how_to_apply}` : ""));
    const countries = names(f.country), cities = names(f.city), type = names(f.type), exp = names(f.experience)[0] ?? "";
    const yearsMin = Number(exp.match(/^(\d+)/)?.[1]);
    const id = `reliefweb:${row.id}`;
    out.set(id, {
      source: "reliefweb", id, url: String(f.url ?? `https://reliefweb.int/job/${row.id}`), title,
      company: names(f.source)[0] ?? "", locations: [...cities, ...countries].filter((x, i, a) => a.indexOf(x) === i),
      remote: /remote|home[- ]based|work from home|telecommut/i.test(`${title}\n${text.slice(0, 3000)}`) || countries.some((c) => /remote|home-based/i.test(c)) ? "remote" : "unknown",
      employment: type.some((t) => /consultan/i.test(t)) ? ["contract"] : type.some((t) => /volunteer/i.test(t)) ? ["temporary"] : [],
      yearsMin: Number.isFinite(yearsMin) ? yearsMin : undefined,
      salary: salaryFromDescription(text) ?? undefined, postedAt, description: truncate(text), tags: [...type, ...names(f.theme).slice(0, 3), ...names(f.career_categories).slice(0, 2)],
    });
  }
  ctx.log(`[reliefweb] total=${res.totalCount ?? "?"} fetched=${(res.data ?? []).length} kept=${out.size}${old ? ` old=${old}` : ""}`);
  return [...out.values()];
}
