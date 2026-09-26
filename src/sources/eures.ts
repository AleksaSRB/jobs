/**
 * EURES – EU job mobility portal, public search API of all EU/EEA public employment services (keyless; documented in rorar/EURES-API-Documentation):
 *   POST https://europa.eu/eures/api/jv-searchengine/public/jv-search/search   body { resultsPerPage (<=50), page, sortSearch, keywords: [{ keyword, specificSearchCode: "EVERYWHERE" }], requestLanguage: "en", … }
 *   detail: GET https://europa.eu/eures/api/jv-searchengine/public/jv/id/<id>?requestLang=en   (description, employer, location, contract type)
 * No remote flag – we search "<term> remote" / "home-based" style keywords; the matcher rejects on-site postings by location. Serbia is not an EU member, but
 * cross-border-friendly remote postings do appear (psychology, UX research, behavioural science, well-being).
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import { worthDetail } from "../score.ts";
import type { Job, SearchCtx } from "../types.ts";
import { Breaker, employmentOf } from "./common.ts";

type Any = Record<string, any>;
const s = (v: any): string => (v == null ? "" : typeof v === "string" ? v : typeof v === "number" ? String(v) : typeof v === "object" ? String(v.name ?? v.label ?? v.value ?? v.text ?? "") : String(v));
const BASE = "https://europa.eu/eures/api/jv-searchengine/public";

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { keywords, maxPages, maxDetails } = CONFIG.eures;
  const out = new Map<string, Job>();
  const br = new Breaker(3, "eures");
  let failed = 0;
  for (const kw of keywords) {
    try {
      for (let page = 1; page <= maxPages; page++) {
        const res = await fetchJson<Any>(`${BASE}/jv-search/search`, {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, tries: 2,
          body: JSON.stringify({ resultsPerPage: 50, page, sortSearch: "MOST_RECENT", keywords: [{ keyword: kw, specificSearchCode: "EVERYWHERE" }], publicationPeriod: null, occupationUris: [], locationCodes: [], requestLanguage: "en", sessionId: "" }),
        });
        const rows: Any[] = res.jvs ?? res.results ?? res.content ?? [];
        let n = 0, old = 0;
        for (const r of rows) {
          const id = s(r.id ?? r.jvId ?? r.reference);
          const title = s(r.title ?? r.jobTitle);
          if (!id || !title) continue;
          const key = `eures:${id}`;
          if (out.has(key)) continue;
          const postedAt = toIso(s(r.creationDate ?? r.publicationDate ?? r.lastModificationDate) || null);
          if (postedAt && new Date(postedAt) < ctx.since) { old++; continue; }
          const locs = (r.locationMap ? Object.values(r.locationMap).flat().map(s) : [s(r.location ?? r.locationLabel), s(r.countryCode ?? r.country)]).filter(Boolean);
          const text = htmlToText(s(r.description ?? r.summary));
          out.set(key, {
            source: "eures", id: key, url: `https://europa.eu/eures/portal/jv-se/jv-details/${encodeURIComponent(id)}?lang=en`, title: title.trim(),
            company: s(r.employer?.name ?? r.employerName ?? r.employer).trim(), locations: locs, remote: /remote|home[- ]based|teleworking|telework/i.test(`${title} ${text}`) ? "remote" : "unknown",
            employment: employmentOf(s(r.positionScheduleCodes?.[0] ?? r.positionSchedule ?? r.contractType)),
            salary: salaryFromDescription(text) ?? undefined, postedAt, description: truncate(text), tags: [s(r.occupationLabel ?? r.jobCategoriesCodes?.[0])].filter(Boolean),
          });
          n++;
        }
        ctx.log(`[eures] kw="${kw}" page=${page} results=${rows.length} new=${n}${old ? ` old=${old}` : ""}`);
        br.ok();
        await sleep(1_500);
        if (rows.length < 50 || old > rows.length / 2) break;
      }
    } catch (e) {
      ctx.log(`[eures] kw="${kw}": ${(e as Error).message}`);
      br.fail(e);
      if (++failed === keywords.length) throw e;
    }
  }
  let details = 0;
  for (const j of out.values()) {
    if (details >= maxDetails) break;
    if (ctx.isSeen(j.id) || !worthDetail(j.title) || (j.description ?? "").length > 300) continue;
    details++;
    try {
      const d = await fetchJson<Any>(`${BASE}/jv/id/${encodeURIComponent(j.id.split(":")[1])}?requestLang=en`, { tries: 2 });
      const text = htmlToText(s(d.description ?? d.jvProfiles?.[0]?.description ?? d.jvProfile?.description));
      if (text) { j.description = truncate(text); j.salary ??= salaryFromDescription(text) ?? undefined; }
      const emp = s(d.employer?.name ?? d.jvProfiles?.[0]?.employerName); if (emp && !j.company) j.company = emp;
    } catch (e) { ctx.log(`[eures] detail ${j.id}: ${(e as Error).message}`); }
    await sleep(800);
  }
  ctx.log(`[eures] ${out.size} jobs, ${details} details fetched`);
  return [...out.values()];
}
