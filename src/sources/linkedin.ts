/**
 * LinkedIn Jobs – javni „guest“ API bez logovanja (provereno 19.09.2026, IP iz Srbije; adapter iz mom-jobs/, proširen):
 *   lista:  GET https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=<q>&location=<loc>&f_WT=2&f_TPR=r<sekunde>&start=<0,10,20…>
 *           HTML fragment, 10 <li> po strani: data-entity-urn="urn:li:jobPosting:<id>", base-search-card__title, __subtitle (firma),
 *           job-search-card__location, <time datetime>, base-card__full-link href, img data-delayed-url (logo)
 *           f_WT=2 = remote, f_E=2,3 = entry/associate, f_TPR=r432000 = poslednjih 5 dana
 *   detalj: GET https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/<id>  -> description__text, description__job-criteria-text (Seniority, Employment type…)
 * Dva skupa upita:
 *   serbia  – location=Serbia + remote: oglasi vidljivi kandidatima u Srbiji -> locationVerified
 *   europe  – location=European Union + remote + entry/associate: oglas sa lokacijom „European Union“ ide dalje kao „Europe“ (proveri opis);
 *             oglas sa konkretnim gradom/zemljom (Stockholm, Sweden) je po pravilu remote SAMO u toj zemlji -> lokacija te zemlje (ocena ga odbija)
 * Rizik: rate limit (HTTP 429) posle većeg broja zahteva -> mali broj upita, pauze, detalj samo za neviđene sa pogođenom kategorijom; 429 prekida izvor.
 */
import { CONFIG } from "../config.ts";
import { decodeEntities, fetchText, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { parseSalaryText, salaryFromDescription } from "../salary.ts";
import { worthDetail } from "../score.ts";
import type { Job, SearchCtx } from "../types.ts";
import { employmentOf } from "./common.ts";

const API = "https://www.linkedin.com/jobs-guest/jobs/api";
const clean = (s: string | undefined) => decodeEntities(htmlToText(s ?? "")).replace(/\s+/g, " ").trim();

function parseList(html: string, verified: boolean): Job[] {
  const out: Job[] = [];
  for (const li of html.split(/<li>/).slice(1)) {
    const id = li.match(/urn:li:jobPosting:(\d+)/)?.[1];
    const title = clean(li.match(/base-search-card__title"[^>]*>([\s\S]*?)<\/h3>/)?.[1]);
    if (!id || !title) continue;
    const href = li.match(/class="base-card__full-link[^"]*"\s+href="([^"?]+)/)?.[1] ?? `https://www.linkedin.com/jobs/view/${id}`;
    const loc = clean(li.match(/job-search-card__location"[^>]*>([\s\S]*?)<\/span>/)?.[1]);
    const euWide = /european union|europe|emea/i.test(loc);
    out.push({
      source: "linkedin", id: `linkedin:${id}`, url: decodeEntities(href), title,
      company: clean(li.match(/base-search-card__subtitle"[^>]*>([\s\S]*?)<\/h4>/)?.[1]),
      companyLogo: li.match(/data-delayed-url="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&"),
      locations: verified ? [loc || "Serbia"] : euWide ? ["Europe"] : [loc],
      locationVerified: verified || undefined,
      remote: "remote", employment: [],
      salary: parseSalaryText(clean(li.match(/job-search-card__salary-info"[^>]*>([\s\S]*?)<\/span>/)?.[1])) ?? undefined,
      postedAt: toIso(li.match(/<time[^>]*datetime="([^"]+)"/)?.[1]),
      tags: [],
    });
  }
  return out;
}

async function enrich(job: Job): Promise<void> {
  const id = job.id.split(":")[1];
  const html = await fetchText(`${API}/jobPosting/${id}`, { tries: 2 });
  const desc = html.match(/description__text[^"]*"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? html.match(/class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "";
  const text = htmlToText(desc);
  if (text) job.description = truncate(text);
  const criteria = [...html.matchAll(/description__job-criteria-subheader"[^>]*>([\s\S]*?)<\/h3>\s*<span[^>]*description__job-criteria-text[^>]*>([\s\S]*?)<\/span>/g)]
    .map((m) => [clean(m[1]), clean(m[2])] as const);
  for (const [k, v] of criteria) {
    if (/employment type/i.test(k)) job.employment = employmentOf(v);
    else if (/seniority/i.test(k) && v && !/not applicable/i.test(v)) job.seniority = v;
    else if (/job function/i.test(k) && v) job.tags.push(...v.split(/,\s*|\s+and\s+/).slice(0, 3));
  }
  job.salary ??= salaryFromDescription(text) ?? undefined;
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { serbia, europe, maxDetails } = CONFIG.linkedin;
  const found = new Map<string, Job>();
  const tpr = Math.max(86_400, Math.round((Date.now() - ctx.since.getTime()) / 1000) + 3600);
  let rateLimited = false;
  const sets = [
    { label: "serbia", location: serbia.location, maxPages: serbia.maxPages, queries: serbia.queries, verified: true, extra: "" },
    { label: "europe", location: europe.location, maxPages: europe.maxPages, queries: europe.queries, verified: false, extra: "&f_E=2%2C3" },
  ];
  for (const set of sets) {
    for (const q of set.queries) {
      for (let page = 0; page < set.maxPages && !rateLimited; page++) {
        const url = `${API}/seeMoreJobPostings/search?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(set.location)}&f_WT=2${set.extra}&f_TPR=r${tpr}&start=${page * 10}`;
        let jobs: Job[] = [];
        try { jobs = parseList(await fetchText(url, { tries: 2 }), set.verified); }
        catch (e) {
          const msg = (e as Error).message;
          if (/429/.test(msg)) { rateLimited = true; ctx.log(`[linkedin] rate limit (429) – prekidam ovaj prolaz`); break; }
          if (!/HTTP 400/.test(msg)) ctx.log(`[linkedin] ${set.label} q="${q}" page=${page}: ${msg}`);
          break; // 400 = nema (više) rezultata
        }
        for (const j of jobs) if (!found.has(j.id)) found.set(j.id, j);
        ctx.log(`[linkedin] ${set.label} q="${q}" start=${page * 10} results=${jobs.length}`);
        await sleep(1_200);
        if (jobs.length < 10) break;
      }
      if (rateLimited) break;
    }
    if (rateLimited) break;
  }
  let details = 0;
  for (const j of found.values()) {
    if (rateLimited || ctx.isSeen(j.id) || details >= maxDetails || !worthDetail(j.title)) continue;
    if (j.postedAt !== null && new Date(j.postedAt) < ctx.since) continue;
    details++;
    try { await enrich(j); }
    catch (e) { const msg = (e as Error).message; ctx.log(`[linkedin] detalj ${j.id}: ${msg}`); if (/429/.test(msg)) rateLimited = true; }
    await sleep(1_500);
  }
  ctx.log(`[linkedin] ukupno ${found.size} oglasa, ${details} detalja skinuto${rateLimited ? " (prekinuto: 429)" : ""}`);
  if (found.size === 0 && rateLimited) throw new Error("HTTP 429 (rate limit)");
  return [...found.values()];
}
