/**
 * Working Nomads – dva javna JSON endpointa (provereno 26.09.2026):
 *  1. GET https://www.workingnomads.com/jobsapi/_search?q=<lucene>&size=N&sort=pub_date:desc – Elasticsearch indeks samog sajta (svi aktivni oglasi, GET sa
 *     Lucene query stringom); po jedan zahtev po konfigurisanoj kategoriji: category_name:"Healthcare" AND pub_date:[<since> TO now] AND expired:false.
 *     _source: id, slug, title, company, category_name, description (HTML), tags[], locations[] ("USA", "Europe", "EMEA", "Anywhere"…), location_base/location_extra,
 *     position_type (ft|pt|fr), experience_level (ENTRY_LEVEL|MID_LEVEL|SENIOR_LEVEL), apply_option (with_your_ats|with_email), apply_url (ATS stranica poslodavca),
 *     salary_range ("$48k-$63k per year"), annual_salary_usd, pub_date, expired. Stranica oglasa: /jobs/<slug>. Kategorije nedeljno: Management ~260, Marketing ~100,
 *     Consulting ~100, Human Resources ~50, Design ~30, Healthcare ~20, Legal ~20, Education ~17, Writing ~10.
 *  2. GET https://www.workingnomads.com/api/exposed_jobs/ – dokumentovani feed (~50 najnovijih iz SVIH kategorija, parametri za filter/stranice se ignorišu):
 *     ostaje kao rezerva i spaja se sa indeksom. Polja: url (/job/go/<id>/ redirect), title, description (HTML), company_name, category_name, tags (CSV), location, pub_date.
 *  Isti numerički id u oba -> id "workingnomads:<id>"; dokument iz indeksa ima prednost nad kopijom iz feeda (bogatija polja). Feed-only oglasi dobijaju platu
 *  naknadno iz istog indeksa (q=id:(… OR …), polje salary_range).
 */
import { CONFIG } from "../config.ts";
import { fetchJson, htmlToText, toIso, truncate } from "../http.ts";
import { parseSalaryText, salaryFromDescription } from "../salary.ts";
import { worthDetail } from "../score.ts";
import type { EmploymentKind, Job, SearchCtx } from "../types.ts";
import { Breaker, preferEmployer, splitLocations } from "./common.ts";

const SEARCH = "https://www.workingnomads.com/jobsapi/_search";
const FEED = "https://www.workingnomads.com/api/exposed_jobs/";
const PER_CATEGORY = 300; // newest N per category and run (weekly volume today ≤ ~280; the scraper runs hourly, so nothing is skipped)
const EMPLOYMENT: Record<string, EmploymentKind> = { ft: "full-time", pt: "part-time", fr: "freelance", ct: "contract", co: "contract", in: "internship" };
const SENIORITY: Record<string, string> = { ENTRY_LEVEL: "Entry-level", MID_LEVEL: "Mid-level", SENIOR_LEVEL: "Senior" };

interface FeedJob { url: string; title: string; description?: string; company_name?: string; category_name?: string; tags?: string; location?: string; pub_date?: string }
interface Doc {
  id: number | string; slug?: string; title?: string; company?: string; category_name?: string; description?: string; tags?: string[];
  locations?: string[]; location_base?: string; location_extra?: string; position_type?: string; experience_level?: string;
  apply_url?: string; salary_range?: string; pub_date?: string; expired?: boolean;
}
interface SearchRes { hits?: { total?: { value?: number }; hits?: Array<{ _source?: Doc }> } }

const numericId = (j: Job) => j.id.match(/^workingnomads:(\d+)$/)?.[1];

function fromFeed(r: FeedJob): Job {
  const text = htmlToText(r.description ?? "");
  return {
    source: "workingnomads", id: `workingnomads:${r.url.match(/(\d+)\/?$/)?.[1] ?? r.url}`, url: r.url, title: r.title.trim(), company: r.company_name?.trim() ?? "",
    locations: splitLocations(r.location), remote: "remote", employment: [], salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(r.pub_date),
    description: truncate(text), tags: [r.category_name ?? "", ...(r.tags ?? "").split(",")].map((s) => s.trim()).filter(Boolean),
  };
}

function fromDoc(d: Doc): Job | null {
  if (!d.id || !d.title) return null;
  const listing = d.slug ? `https://www.workingnomads.com/jobs/${d.slug}` : `https://www.workingnomads.com/job/go/${d.id}/`;
  const text = htmlToText(d.description ?? "");
  const locations = d.locations?.length ? d.locations.flatMap((l) => splitLocations(l)) : splitLocations([d.location_base, d.location_extra].filter(Boolean).join(", "));
  const employment = EMPLOYMENT[d.position_type ?? ""];
  return {
    source: "workingnomads", id: `workingnomads:${d.id}`, ...preferEmployer(listing, d.apply_url, "workingnomads.com"),
    title: d.title.trim(), company: d.company?.trim() ?? "", locations, remote: "remote", employment: employment ? [employment] : [],
    seniority: SENIORITY[d.experience_level ?? ""], salary: parseSalaryText(d.salary_range) ?? salaryFromDescription(text) ?? undefined,
    postedAt: toIso(d.pub_date), description: truncate(text), tags: [d.category_name ?? "", ...(d.tags ?? [])].map((s) => s.trim()).filter(Boolean),
  };
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const cats = CONFIG.workingnomads.categories;
  const byId = new Map<string, Job>();
  const indexed = new Set<string>();

  // 1. documented feed (~50 newest across all categories) – cheap fallback, must not kill the source
  try {
    const rows = await fetchJson<FeedJob[]>(FEED);
    const wanted = new Set(cats.map((c) => c.toLowerCase()));
    for (const r of rows) {
      if (!r.url || !r.title || (wanted.size > 0 && !wanted.has((r.category_name ?? "").toLowerCase()))) continue;
      const j = fromFeed(r); byId.set(j.id, j);
    }
    ctx.log(`[workingnomads] feed: ${rows.length} jobs, ${byId.size} in target categories`);
  } catch (e) { ctx.log(`[workingnomads] feed failed: ${(e as Error).message}`); }

  // 2. search index, one query per category (empty category list = everything since the baseline)
  const since = ctx.since.toISOString().slice(0, 10);
  const breaker = new Breaker(3, "[workingnomads] search index");
  try {
    for (const cat of cats.length ? cats : [""]) {
      try {
        const q = `${cat ? `category_name:"${cat}" AND ` : ""}pub_date:[${since} TO now] AND expired:false`;
        const res = await fetchJson<SearchRes>(`${SEARCH}?q=${encodeURIComponent(q)}&size=${PER_CATEGORY}&sort=pub_date:desc`);
        let n = 0;
        for (const h of res.hits?.hits ?? []) { const j = h._source && fromDoc(h._source); if (j) { byId.set(j.id, j); indexed.add(j.id); n++; } }
        const total = res.hits?.total?.value ?? n;
        ctx.log(`[workingnomads] ${cat || "all categories"}: ${n} jobs${total > n ? ` (newest ${n} of ${total} since ${since})` : ""}`);
        breaker.ok();
      } catch (e) { ctx.log(`[workingnomads] ${cat || "all categories"} failed: ${(e as Error).message}`); breaker.fail(e); }
    }
  } catch (e) {
    if (byId.size === 0) throw e; // feed and index both dead -> source ERROR
    ctx.log(`[workingnomads] ${(e as Error).message} – continuing with the feed only`);
  }

  // 3. salary for new feed-only listings (index documents already carry salary_range)
  const want = [...byId.values()].filter((j) => !indexed.has(j.id) && worthDetail(j.title) && !ctx.isSeen(j.id) && numericId(j));
  if (want.length) {
    try {
      const ids = want.map((j) => numericId(j)!);
      const res = await fetchJson<{ hits?: { hits?: Array<{ _source?: { id?: number | string; salary_range?: string } }> } }>(
        `${SEARCH}?q=${encodeURIComponent(`id:(${ids.join(" OR ")})`)}&size=${ids.length}&_source_includes=id,salary_range`);
      const rangeById = new Map((res.hits?.hits ?? []).map((h) => [String(h._source?.id), h._source?.salary_range ?? ""]));
      for (const j of want) j.salary = parseSalaryText(rangeById.get(numericId(j)!)) ?? j.salary;
    } catch { /* listing keeps the salary from its description (or none) */ }
  }
  return [...byId.values()];
}
