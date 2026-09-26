/**
 * JobRack – SSR HTML, remote poslovi za Istočnu Evropu (provereno 19.09.2026; adapter preuzet iz mom-jobs/):
 *   lista:  https://jobrack.eu/jobs?page=N  i  https://jobrack.eu/jobs/category/<sales-marketing|seo|content-writer|support|executive-assistant|project-manager>?page=N
 *           <a href="https://jobrack.eu/jobs/<slug>" class="list-group-item"> … job-title, company-name, job-posted-time ("3 days ago"),
 *           jobs-category, job-details (snippet), job-tags (Full Time / "2000.00 - 3000.00 USD / Monthly"), img.employer-logo; ~10 po strani, od najnovijeg
 *   detalj: <div class="job-description …"> ; plata u .text-with-icon.salary; skida se samo za neviđene oglase čiji naslov pogađa kategoriju.
 * Lokacija: JobRack zapošljava iz Istočne Evrope -> "Eastern Europe" (Srbija ulazi).
 */
import { CONFIG } from "../config.ts";
import { decodeEntities, fetchText, htmlToText, relativeToIso, sleep, truncate } from "../http.ts";
import { parseSalaryText, salaryFromDescription } from "../salary.ts";
import { worthDetail } from "../score.ts";
import type { EmploymentKind, Job, SearchCtx } from "../types.ts";
import { Breaker } from "./common.ts";

const BASE = "https://jobrack.eu";

const pick = (block: string, re: RegExp) => { const m = block.match(re); return m ? decodeEntities(htmlToText(m[1])).replace(/\s+/g, " ").trim() : ""; };

function employmentOf(tags: string[]): EmploymentKind[] {
  const t = tags.join(" ").toLowerCase();
  const out: EmploymentKind[] = [];
  if (/part[- ]?time/.test(t)) out.push("part-time");
  else if (/full[- ]?time/.test(t)) out.push("full-time");
  if (/freelance/.test(t)) out.push("freelance");
  if (/contract/.test(t)) out.push("contract");
  if (/intern/.test(t)) out.push("internship");
  return out;
}

function parseList(html: string): Job[] {
  const out: Job[] = [];
  for (const m of html.matchAll(/<a href="(https:\/\/jobrack\.eu\/jobs\/([^"/]+))"\s+class="list-group-item">([\s\S]*?)<\/a>/g)) {
    const [, url, slug, block] = m;
    const title = pick(block, /class="job-title"[^>]*>([\s\S]*?)<\/h2>/);
    if (!title) continue;
    const tags = [...block.matchAll(/<span class="btn btn-xs[^"]*">([\s\S]*?)<\/span>/g)].map((t) => decodeEntities(htmlToText(t[1])).replace(/\s+/g, " ").trim()).filter(Boolean);
    const salaryTag = tags.find((t) => /\d/.test(t));
    const logo = block.match(/class="employer-logo"\s+src="([^"]+)"/)?.[1];
    out.push({
      source: "jobrack", id: `jobrack:${slug}`, url, title,
      company: pick(block, /class="company-name"[^>]*>([\s\S]*?)<\/h4>/),
      companyLogo: logo ? (logo.startsWith("http") ? logo : `${BASE}${logo}`) : undefined,
      locations: ["Eastern Europe"], remote: "remote",
      employment: employmentOf(tags),
      salary: parseSalaryText(salaryTag) ?? undefined,
      postedAt: relativeToIso(pick(block, /class="job-posted-time[^"]*"[^>]*>([\s\S]*?)<\/span>/)),
      description: pick(block, /class="job-details[^"]*"[^>]*>([\s\S]*?)<\/p>/),
      tags: [pick(block, /class="jobs-category"[^>]*>([\s\S]*?)<\/span>/), ...tags.filter((t) => !/\d/.test(t))].filter(Boolean),
    });
  }
  return out;
}

async function enrich(job: Job): Promise<void> {
  const html = await fetchText(job.url);
  const desc = html.match(/<div class="job-description[^"]*">([\s\S]*?)<\/div>\s*(?:<div class="(?:apply|job-apply|row|col)|<\/section|<footer|<div class="container)/)?.[1]
    ?? html.match(/<div class="job-description[^"]*">([\s\S]*?)(?=<h\d[^>]*>\s*Apply|<a[^>]*apply|<footer)/i)?.[1];
  const text = htmlToText(desc ?? "");
  if (text.length > (job.description?.length ?? 0)) job.description = truncate(text);
  const sal = html.match(/class="text-with-icon salary"[^>]*>([\s\S]*?)<\/(?:p|div|span)>/)?.[1];
  if (sal) job.salary = parseSalaryText(htmlToText(sal).replace(/\s+/g, " ")) ?? job.salary;
  job.salary ??= salaryFromDescription(text) ?? undefined;
  const type = htmlToText(html.match(/class="text-with-icon job-type"[^>]*>([\s\S]*?)<\/(?:p|div|span)>/)?.[1] ?? "").trim();
  if (type && job.employment.length === 0) job.employment = employmentOf([type]);
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { categories, maxPages, listPages, maxDetails } = CONFIG.jobrack;
  const found = new Map<string, Job>();
  const plan: Array<{ url: string; pages: number; label: string }> = [
    { url: `${BASE}/jobs`, pages: listPages, label: "all" },
    ...categories.map((c) => ({ url: `${BASE}/jobs/category/${c}`, pages: maxPages, label: c })),
  ];
  let failed = 0;
  const br = new Breaker(3, "jobrack");
  for (const p of plan) {
    try {
      for (let page = 1; page <= p.pages; page++) {
        const jobs = parseList(await fetchText(`${p.url}?page=${page}`));
        for (const j of jobs) if (!found.has(j.id)) found.set(j.id, j);
        ctx.log(`[jobrack] ${p.label} page=${page} results=${jobs.length}`); br.ok();
        await sleep(500);
        if (jobs.length === 0) break;
        if (jobs.every((j) => j.postedAt !== null && new Date(j.postedAt) < ctx.since)) break; // lista je od najnovijeg
      }
    } catch (e) {
      ctx.log(`[jobrack] ${p.label}: ${(e as Error).message}`);
      br.fail(e); if (++failed === plan.length) throw e;
    }
  }
  let details = 0;
  for (const j of found.values()) {
    if (ctx.isSeen(j.id) || details >= maxDetails || !worthDetail(j.title)) continue;
    if (j.postedAt !== null && new Date(j.postedAt) < ctx.since) continue;
    details++;
    try { await enrich(j); } catch (e) { ctx.log(`[jobrack] detail ${j.id}: ${(e as Error).message}`); }
    await sleep(500);
  }
  ctx.log(`[jobrack] total ${found.size} jobs, ${details} details fetched`);
  return [...found.values()];
}
