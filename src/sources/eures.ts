/**
 * EURES – EU job-mobility portal: public search API over all EU/EEA public employment services (keyless; community doc: github.com/rorar/EURES-API-Documentation).
 *   POST https://europa.eu/eures/api/jv-searchengine/public/jv-search/search
 *     body { resultsPerPage (≤50), page, sortSearch: "MOST_RECENT" | "BEST_MATCH", publicationPeriod: null | "LAST_DAY" | "LAST_WEEK" | "LAST_MONTH",
 *            keywords: [{ keyword, specificSearchCode: "EVERYWHERE" | "TITLE" | "DESCRIPTION" | "EMPLOYER" }], locationCodes: [], requestLanguage: "en", sessionId: "" }
 *     Keyword OBJECTS are AND-ed, but words inside ONE keyword string are OR-ed ("psychologist remote" = 105 000 hits) – so every config keyword is split into one object per word.
 *     response { numberRecords, jvs: [{ id (base64), title, description (HTML, full text), creationDate / lastModificationDate (epoch ms), locationMap { "BE": ["BE224"] } (ISO country → NUTS3),
 *                employer { name, website } | null, positionScheduleCodes ["fulltime" | "parttime" | "flextime"], positionOfferingCode ("directhire" | "temporary" | "contract" | …), availableLanguages ["nl"] }], facets }
 *     MOST_RECENT sorts by lastModificationDate (PES re-exports bump old postings), so postedAt = creationDate and pre-baseline items are left to scrape.ts to count.
 *   detail: GET https://europa.eu/eures/api/jv-searchengine/public/jv/id/<id>?requestLang=en
 *     { preferredLanguage, jvProfiles: { "<lang>": { title, description, employer { name } | null, locations [{ countryCode, region, cityName }], workingLanguageCodes,
 *       positionLanguages [{ languageCode, requiredSkillLevel, desiredSkillLevel }], offeredRemunerationPackage { salaries [{ minimumSalary, maximumSalary, currencyCode, payingIntervalCode }] } } } }
 * No remote flag and no posting-language filter: postings are mostly on-site and in the local language. The card carries the country name (from locationMap), so the matcher
 * rejects on-site EU postings by location and the title/description text decides remote/hybrid. Serbia is not in the EU – only cross-border remote work is realistic.
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { salaryFromDescription } from "../salary.ts";
import { worthDetail } from "../score.ts";
import type { Job, Salary, SearchCtx } from "../types.ts";
import { Breaker, employmentOf } from "./common.ts";

type Any = Record<string, any>;
const s = (v: any): string => (v == null ? "" : typeof v === "string" ? v : String(v));
const BASE = "https://europa.eu/eures/api/jv-searchengine/public";
const PAGE = 50;
const REGION = new Intl.DisplayNames(["en"], { type: "region" });
const LANGUAGE = new Intl.DisplayNames(["en"], { type: "language" });
/** "BE" -> "Belgium" (Eurostat codes: EL = Greece, UK = United Kingdom); unknown codes stay as they are. */
const countryName = (code: string): string => { const c = code.toUpperCase().replace(/^EL$/, "GR").replace(/^UK$/, "GB"); try { return REGION.of(c) ?? code; } catch { return code; } };
const languageName = (code: string): string => { try { return LANGUAGE.of(code.toLowerCase()) ?? code; } catch { return code; } };
const periodOf = (code: string): Salary["period"] => (/hour/i.test(code) ? "hour" : /da(y|ily)/i.test(code) ? "day" : /week/i.test(code) ? "week" : /month/i.test(code) ? "month" : /year|annu/i.test(code) ? "year" : null);
const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))];

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { keywords, maxPages, maxDetails } = CONFIG.eures;
  const out = new Map<string, Job>();
  const br = new Breaker(3, "eures");
  let failed = 0;
  for (const kw of keywords) {
    const terms = kw.split(/\s+/).filter(Boolean).map((keyword) => ({ keyword, specificSearchCode: "EVERYWHERE" })); // one object per word = AND
    if (!terms.length) continue;
    try {
      for (let page = 1; page <= maxPages; page++) {
        const res = await fetchJson<Any>(`${BASE}/jv-search/search`, {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, tries: 2,
          body: JSON.stringify({
            resultsPerPage: PAGE, page, sortSearch: "MOST_RECENT", keywords: terms, publicationPeriod: "LAST_MONTH", occupationUris: [], skillUris: [], requiredExperienceCodes: [],
            positionScheduleCodes: [], sectorCodes: [], educationAndQualificationLevelCodes: [], positionOfferingCodes: [], locationCodes: [], euresFlagCodes: [], otherBenefitsCodes: [],
            requiredLanguages: [], minNumberPost: null, sessionId: "", requestLanguage: "en",
          }),
        });
        const rows: Any[] = Array.isArray(res.jvs) ? res.jvs : [];
        let n = 0, old = 0;
        for (const r of rows) {
          const id = s(r.id), title = s(r.title).trim();
          if (!id || !title) continue;
          const key = `eures:${id}`;
          if (out.has(key)) continue;
          const postedAt = toIso(r.creationDate ?? r.lastModificationDate ?? null);
          if (postedAt && new Date(postedAt) < ctx.since) old++;
          const text = htmlToText(s(r.description));
          out.set(key, {
            source: "eures", id: key, url: `https://europa.eu/eures/portal/jv-se/jv-details/${encodeURIComponent(id)}?lang=en`, title,
            company: s(r.employer?.name).trim(), locations: uniq(Object.keys(r.locationMap ?? {}).map(countryName)), remote: "unknown", // no remote flag – title/description text decides
            employment: uniq([...employmentOf(s(r.positionScheduleCodes?.[0])), ...employmentOf(s(r.positionOfferingCode))]) as Job["employment"],
            salary: salaryFromDescription(text) ?? undefined, postedAt, description: truncate(text), tags: [],
          });
          n++;
        }
        ctx.log(`[eures] kw="${kw}" page=${page} results=${rows.length}/${res.numberRecords ?? "?"} new=${n}${old ? ` old=${old}` : ""}`);
        br.ok();
        await sleep(1_500);
        if (rows.length < PAGE) break;
      }
    } catch (e) {
      ctx.log(`[eures] kw="${kw}": ${(e as Error).message}`);
      br.fail(e);
      if (++failed === keywords.length) throw e;
    }
  }
  // Detail: employer (missing in many search hits), precise country list, salary fields and language requirements – only for unseen, in-window, title-relevant hits.
  let details = 0;
  for (const j of out.values()) {
    if (details >= maxDetails) break;
    if (ctx.isSeen(j.id) || (j.postedAt && new Date(j.postedAt) < ctx.since) || !worthDetail(j.title)) continue;
    details++;
    try {
      const d = await fetchJson<Any>(`${BASE}/jv/id/${encodeURIComponent(j.id.slice("eures:".length))}?requestLang=en`, { tries: 2 });
      const p: Any = d.jvProfiles?.[d.preferredLanguage] ?? Object.values(d.jvProfiles ?? {})[0] ?? {};
      const text = htmlToText(s(p.description));
      const langs = ((p.positionLanguages ?? []) as Any[]).map((l) => { const lvl = s(l.requiredSkillLevel ?? l.desiredSkillLevel).toUpperCase(); return `• ${languageName(s(l.languageCode))}${lvl ? ` – ${lvl} (${l.requiredSkillLevel ? "required" : "desired"})` : ""}`; });
      const working = uniq(((p.workingLanguageCodes ?? []) as string[]).map(languageName));
      const extra = [langs.length ? `Language requirements:\n${langs.join("\n")}` : "", working.length ? `Working language: ${working.join(", ")}` : ""].filter(Boolean).join("\n");
      const full = [text.length >= (j.description ?? "").length ? text : j.description ?? "", extra].filter(Boolean).join("\n\n");
      if (full) j.description = truncate(full);
      if (!j.company) j.company = s(p.employer?.name).trim();
      const locs = uniq(((p.locations ?? []) as Any[]).map((l) => s(l.countryCode)).filter(Boolean).map(countryName));
      if (locs.length) j.locations = locs;
      const sal = ((p.offeredRemunerationPackage?.salaries ?? []) as Any[]).find((x) => typeof x.minimumSalary === "number" || typeof x.maximumSalary === "number");
      if (sal) j.salary = { min: typeof sal.minimumSalary === "number" ? sal.minimumSalary : null, max: typeof sal.maximumSalary === "number" ? sal.maximumSalary : null, currency: s(sal.currencyCode).toUpperCase() || null, period: periodOf(s(sal.payingIntervalCode)) };
      else j.salary ??= salaryFromDescription(text) ?? undefined;
    } catch (e) { ctx.log(`[eures] detail ${j.id}: ${(e as Error).message}`); }
    await sleep(800);
  }
  ctx.log(`[eures] ${out.size} jobs, ${details} details fetched`);
  return [...out.values()];
}
