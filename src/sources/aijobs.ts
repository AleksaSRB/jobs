/**
 * aijobs.net -> foorilla.com/hiring (the board was rebranded in 2026: aijobs.net/feed/ is a 301 to foorilla, foorilla has NO RSS/Atom,
 * the REST API /api/v1/ needs a paid PRO+ key and the CSV/JSON export needs a login). What works anonymously (verified 26.09.2026):
 *   list:   GET https://foorilla.com/hiring/jobs/?job_search=<q>&page=N with header "HX-Request: true" (django-htmx fragment; without the header -> 302 /hiring/)
 *           <li class="list-group-item"> <a … hx-get="/hiring/jobs/<slug>-<id>/">[<small>Featured</small>] Title</a> <small>2h|3d|1mo ago</small>
 *           <small class="text-warning-emphasis">[EN|MI|SE|EX]</small> <small class="text-body-secondary">[Full Time][Part Time]…</small>
 *           <small class="text-bg-success|secondary">USD 180K-220K</small> … <div class="text-end"><small>City, Country <span class="text-success">[R]</span></small>
 *           50 per page, newest first (featured ones pinned on top), next page = hx-get="/hiring/jobs/?page=N+1&job_search=…".
 *           job_search is a case-insensitive SUBSTRING of the title ("psycholog" hits psychology + psychologist, "mental health" also "Environmental Health").
 *   detail: GET https://foorilla.com/hiring/jobs/<slug>-<id>/ (same header) -> <h1>, [Senior-level / Expert] [~7yoe] [Full Time], salary "(estimate)",
 *           <strong>Tasks:</strong><ul>, Perks/Benefits, Skills/Tech stack required (tags), Educational requirements, Role(s), "Published: <strong>YYYY-MM-DD</strong>".
 *           Fetched only for unseen listings whose title passes worthDetail (maxDetails). The company is masked for anonymous visitors ("@ T...") -> company "" (unknown).
 * The board is now a general tech aggregator (~240k jobs / 60 d), so config.json aijobs.queries must be narrow title substrings.
 */
import { CONFIG } from "../config.ts";
import { decodeEntities, fetchText, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { parseSalaryText } from "../salary.ts";
import { worthDetail } from "../score.ts";
import type { EmploymentKind, Job, SearchCtx } from "../types.ts";
import { Breaker, employmentOf } from "./common.ts";

const BASE = "https://foorilla.com";
const HX = { headers: { "HX-Request": "true" } };
const SENIORITY: Record<string, string> = { EN: "Entry-level", MI: "Mid-level", SE: "Senior", EX: "Executive" };
const PAGE_SIZE = 50;

const clean = (html: string) => htmlToText(html).replace(/\s+/g, " ").trim();

/** "2h ago" | "3d ago" | "2w ago" | "1mo ago" -> approximate ISO (the detail page has the exact "Published:" date). */
function agoToIso(s: string, now = Date.now()): string | null {
  const m = s.match(/(\d+)\s*(mo|m|h|d|w|y)\b/i);
  if (!m) return null;
  const ms: Record<string, number> = { m: 60_000, h: 3_600_000, d: 86_400_000, w: 7 * 86_400_000, mo: 30 * 86_400_000, y: 365 * 86_400_000 };
  return new Date(now - Number(m[1]) * ms[m[2].toLowerCase()]).toISOString();
}

interface ListItem { path: string; id: string; title: string; ago: string; seniority?: string; employment: EmploymentKind[]; salaryText: string; locText: string; remote: boolean }

/** One <li class="list-group-item"> per job; the tab bar / search box <li>s have other classes. */
function parseList(html: string): ListItem[] {
  const out: ListItem[] = [];
  for (const li of html.split(/<li class="list-group-item[^"]*"[^>]*>/).slice(1)) { // the last <li> also carries hx-get="…page=N+1" hx-trigger="intersect once"
    const a = li.match(/hx-get="(\/hiring\/jobs\/[a-z0-9-]+-(\d+)\/)"[^>]*>([\s\S]*?)<\/a>/);
    if (!a) continue;
    const title = clean(a[3].replace(/<small[^>]*>[\s\S]*?<\/small>/g, ""));
    if (!title) continue;
    const ago = clean(li.match(/<div class="flex-shrink-0 terminal-meta">\s*<small>([\s\S]*?)<\/small>/)?.[1] ?? "");
    const seniority = SENIORITY[li.match(/<small class="text-warning-emphasis">\[(\w+)\]<\/small>/)?.[1] ?? ""];
    const empTags = [...li.matchAll(/<small class="text-body-secondary">([\s\S]*?)<\/small>/g)].flatMap((m) => [...m[1].matchAll(/\[([^\]]+)\]/g)].map((x) => x[1]));
    const employment = [...new Set(empTags.flatMap(employmentOf))];
    const salaryText = clean(li.match(/<small class="text-bg-(?:success|secondary)">([\s\S]*?)<\/small>/)?.[1] ?? "");
    const locHtml = li.match(/<div class="text-end">\s*<small>([\s\S]*?)<\/small>/)?.[1] ?? "";
    const remote = /\[R\]/.test(locHtml) || /\bremote\b/i.test(locHtml);
    const locText = clean(locHtml.replace(/<span[^>]*>\[R\]<\/span>/, "")).replace(/\bremote(?: job)?\b/gi, "").replace(/^[\s·,\-–]+|[\s·,\-–]+$/g, "").trim();
    out.push({ path: a[1], id: a[2], title, ago, seniority, employment, salaryText, locText, remote });
  }
  return out;
}

interface Detail { published: string | null; yearsMin: number | null; hybrid: boolean; text: string; tags: string[] }

function parseDetail(html: string): Detail {
  const section = (label: string) => html.match(new RegExp(`<strong>${label}</strong>\\s*<(ul|div)[^>]*>([\\s\\S]*?)</\\1>`))?.[2] ?? "";
  const lines = (h: string) => htmlToText(h).split("\n").map((l) => l.replace(/^[•*+\s]+/, "").trim()).filter((l) => l && l !== "N/A");
  const tagsOf = (h: string) => [...h.matchAll(/>\s*\[([^\]]+)\]\s*<\/a>/g)].map((m) => decodeEntities(m[1]).trim());
  const tasks = lines(section("Tasks:")), perks = lines(section("Perks/Benefits:")), skills = tagsOf(section("Skills/Tech stack required:"));
  const eduHtml = section("Educational requirements:"), edu = tagsOf(eduHtml).length ? tagsOf(eduHtml) : lines(eduHtml), roles = tagsOf(section("Role\\(s\\):"));
  const parts: string[] = [];
  if (tasks.length) parts.push(`Tasks:\n• ${tasks.join("\n• ")}`);
  if (skills.length) parts.push(`Skills: ${skills.join(", ")}`);
  if (edu.length) parts.push(`Education: ${edu.join(", ")}`);
  if (roles.length) parts.push(`Roles: ${roles.join(", ")}`);
  if (perks.length) parts.push(`Perks: ${perks.join(", ")}`);
  const yoe = html.match(/\[~(\d+)yoe\]/);
  return {
    published: toIso(html.match(/Published:\s*<strong>(\d{4}-\d{2}-\d{2})/)?.[1]), yearsMin: yoe ? Number(yoe[1]) : null,
    hybrid: /\bhybrid\b/i.test(perks.join(" ")), text: parts.join("\n\n"), tags: [...roles, ...skills].filter((t, i, arr) => arr.indexOf(t) === i).slice(0, 15),
  };
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const { queries, maxPages, maxDetails } = CONFIG.aijobs;
  const out = new Map<string, Job>();
  let failed = 0;
  const br = new Breaker(3, "aijobs");
  for (const q of queries) {
    let n = 0, pages = 0;
    try {
      for (let page = 1; page <= maxPages; page++) {
        const html = await fetchText(`${BASE}/hiring/jobs/?job_search=${encodeURIComponent(q)}&page=${page}`, HX);
        const items = parseList(html);
        pages++;
        for (const it of items) {
          const id = `aijobs:${it.id}`;
          if (out.has(id)) continue;
          const meta = [it.locText, it.seniority, it.employment.join(", "), it.salaryText].filter(Boolean).join(" · ");
          out.set(id, {
            source: "aijobs", sourceLabel: "foorilla.com", id, url: `${BASE}${it.path}`, title: it.title, company: "",
            locations: it.locText ? [it.locText] : [], remote: it.remote ? "remote" : "unknown", employment: it.employment, seniority: it.seniority,
            salary: parseSalaryText(it.salaryText) ?? undefined, postedAt: agoToIso(it.ago), description: meta, tags: [],
          });
          n++;
        }
        if (items.length < PAGE_SIZE || !/hx-get="\/hiring\/jobs\/\?page=\d+/.test(html)) break;
        await sleep(800);
      }
      ctx.log(`[aijobs] "${q}": ${n} new in list (${pages} page${pages === 1 ? "" : "s"})`); br.ok();
    } catch (e) {
      ctx.log(`[aijobs] "${q}": ${(e as Error).message}`);
      br.fail(e); if (++failed === queries.length) throw e;
    }
    await sleep(800);
  }
  // Details (exact published date, tasks/skills/education, yoe) only for unseen listings whose title can match a family.
  let details = 0;
  for (const j of out.values()) {
    if (details >= maxDetails) break;
    if (ctx.isSeen(j.id) || !worthDetail(j.title)) continue;
    details++;
    try {
      const d = parseDetail(await fetchText(j.url, HX));
      if (d.published) j.postedAt = d.published;
      if (d.yearsMin !== null) j.yearsMin = d.yearsMin;
      if (d.hybrid && j.remote === "unknown") j.remote = "hybrid";
      if (d.text) j.description = truncate(`${j.description}\n\n${d.text}`);
      j.tags = d.tags;
    } catch (e) { ctx.log(`[aijobs] detail ${j.id}: ${(e as Error).message}`); }
    await sleep(600);
  }
  ctx.log(`[aijobs] ${out.size} listings, ${details} details fetched`);
  return [...out.values()];
}
