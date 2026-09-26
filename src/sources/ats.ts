/**
 * Company career pages through the public, key-less APIs of common applicant tracking systems (ATS).
 * One scraper source per ATS kind (source id = the kind); the companies come from config.json `careers`
 * [{ name, ats, slug, tags? }]. A failing company only logs; the source fails only when every company of that kind failed.
 *   greenhouse       GET https://boards-api.greenhouse.io/v1/boards/<token>/jobs?content=true
 *   lever            GET https://api.lever.co/v0/postings/<site>?mode=json
 *   ashby            GET https://api.ashbyhq.com/posting-api/job-board/<org>?includeCompensation=true
 *   workable         GET https://apply.workable.com/api/v1/widget/accounts/<account>?details=true
 *   smartrecruiters  GET https://api.smartrecruiters.com/v1/companies/<id>/postings?limit=100&offset=N   (+ one detail request per new relevant posting)
 *   recruitee        GET https://<sub>.recruitee.com/api/offers/
 *   personio         GET https://<sub>.jobs.personio.de/xml
 *   bamboohr         GET https://<sub>.bamboohr.com/careers/list                                        (+ detail /careers/<id>/detail)
 *   workday          POST https://<tenant>.wd<n>.myworkdayjobs.com/wday/cxs/<tenant>/<site>/jobs         (+ detail GET …/wday/cxs/<tenant>/<site><externalPath>); slug = "tenant|wd5|site"
 *   teamtailor       GET https://<sub>.teamtailor.com/jobs.json   (JSON Feed 1.1: items[].{id,url,title,content_html,date_published,_teamtailor?}; slug may also be a full custom career-site host)
 * All of these return every open position of the company – the matcher (rules.json) decides what is relevant.
 */
import { CONFIG } from "../config.ts";
import { decodeEntities, fetchJson, fetchText, htmlToText, sleep, toIso, truncate } from "../http.ts";
import { parseSalaryText, salaryFromDescription } from "../salary.ts";
import { worthDetail } from "../score.ts";
import type { AtsKind, CareerSite, Job, RemoteType, SalaryPeriod, SearchCtx } from "../types.ts";
import { Breaker, employmentOf, splitLocations } from "./common.ts";

type Partial = Omit<Job, "source" | "company" | "tags"> & { tags?: string[] };
type Fetcher = (site: CareerSite, ctx: SearchCtx, budget: { details: number }) => Promise<Partial[]>;

const isRemoteText = (s: string | undefined | null) => /\bremote\b|work from home|anywhere|distributed|virtual/i.test(s ?? "");
const remoteOf = (s: string | undefined | null): RemoteType => (isRemoteText(s) ? "remote" : /\bhybrid\b/i.test(s ?? "") ? "hybrid" : "unknown");
/** "Remote - US", "Remote (Europe)", "Remote, Serbia" -> ["US"] etc.; a bare "Remote" -> [] (region unknown). */
function locList(...raw: Array<string | undefined | null>): string[] {
  const out: string[] = [];
  for (const r of raw) for (const part of splitLocations((r ?? "").replace(/\((.*?)\)/g, ", $1").replace(/\bremote\b[\s\-–—:]*/gi, " "))) if (part && !out.includes(part)) out.push(part);
  return out;
}
const toText = (html: string | undefined | null) => htmlToText(decodeEntities(html ?? ""));

// ---------------------------------------------------------------- greenhouse
interface GhJob { id: number; title: string; updated_at?: string; first_published?: string; location?: { name?: string }; absolute_url: string; content?: string; departments?: Array<{ name?: string }>; offices?: Array<{ name?: string; location?: string }> }
const greenhouse: Fetcher = async (site) => {
  const res = await fetchJson<{ jobs?: GhJob[] }>(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(site.slug)}/jobs?content=true`);
  return (res.jobs ?? []).slice(0, CONFIG.careersMaxJobsPerCompany).map((j) => {
    const text = toText(j.content);
    const loc = j.location?.name ?? "";
    return {
      id: `greenhouse:${site.slug}/${j.id}`, url: j.absolute_url, title: j.title.trim(),
      locations: locList(loc, ...(j.offices ?? []).map((o) => o.location ?? o.name)), remote: remoteOf(loc),
      employment: [], salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(j.first_published ?? j.updated_at),
      description: truncate(text), tags: (j.departments ?? []).map((d) => d.name ?? "").filter(Boolean),
    };
  });
};

// ---------------------------------------------------------------- lever
interface LvJob { id: string; text: string; categories?: { team?: string; department?: string; location?: string; commitment?: string; allLocations?: string[] }; workplaceType?: string; descriptionPlain?: string; description?: string; lists?: Array<{ text?: string; content?: string }>; additionalPlain?: string; hostedUrl: string; applyUrl?: string; createdAt?: number; salaryRange?: { min?: number; max?: number; currency?: string; interval?: string } }
const LV_PERIOD: Record<string, SalaryPeriod> = { "per-year-salary": "year", "per-month-salary": "month", "per-hour-wage": "hour", "per-week-salary": "week", "per-day-salary": "day" };
const lever: Fetcher = async (site) => {
  let rows: LvJob[];
  try { rows = await fetchJson<LvJob[]>(`https://api.lever.co/v0/postings/${encodeURIComponent(site.slug)}?mode=json`, { tries: 2 }); }
  catch (e) { // EU tenants live on a separate host (api.lever.co answers 404 for them)
    if (!/HTTP 404/.test((e as Error).message)) throw e;
    rows = await fetchJson<LvJob[]>(`https://api.eu.lever.co/v0/postings/${encodeURIComponent(site.slug)}?mode=json`, { tries: 1 });
  }
  return rows.slice(0, CONFIG.careersMaxJobsPerCompany).map((j) => {
    const text = [j.descriptionPlain ?? toText(j.description), ...(j.lists ?? []).map((l) => `${l.text ?? ""}\n${toText(l.content)}`), j.additionalPlain ?? ""].join("\n").trim();
    const wt = (j.workplaceType ?? "").toLowerCase();
    const sr = j.salaryRange;
    return {
      id: `lever:${site.slug}/${j.id}`, url: j.hostedUrl, title: j.text.trim(),
      locations: locList(...(j.categories?.allLocations ?? [j.categories?.location])), remote: wt === "remote" ? "remote" : wt === "hybrid" ? "hybrid" : wt === "onsite" || wt === "on-site" ? "onsite" : remoteOf(j.categories?.location),
      employment: employmentOf(j.categories?.commitment),
      salary: sr && (sr.min || sr.max) ? { min: sr.min || null, max: sr.max || null, currency: sr.currency || null, period: LV_PERIOD[sr.interval ?? ""] ?? null } : salaryFromDescription(text) ?? undefined,
      postedAt: toIso(j.createdAt ?? null), description: truncate(text), tags: [j.categories?.department, j.categories?.team].filter((x): x is string => !!x),
    };
  });
};

// ---------------------------------------------------------------- ashby
interface AbJob { id: string; title: string; department?: string; team?: string; employmentType?: string; location?: string; secondaryLocations?: Array<{ location?: string }>; publishedAt?: string; isRemote?: boolean; isListed?: boolean; descriptionHtml?: string; descriptionPlain?: string; jobUrl: string; applyUrl?: string; address?: { postalAddress?: { addressCountry?: string; addressLocality?: string; addressRegion?: string } }; compensation?: { summaryComponents?: Array<{ compensationType?: string; interval?: string; currencyCode?: string; minValue?: number; maxValue?: number }> } }
const ashby: Fetcher = async (site) => {
  const res = await fetchJson<{ jobs?: AbJob[] }>(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(site.slug)}?includeCompensation=true`);
  return (res.jobs ?? []).filter((j) => j.isListed !== false).slice(0, CONFIG.careersMaxJobsPerCompany).map((j) => {
    const text = j.descriptionPlain ?? toText(j.descriptionHtml);
    const comp = (j.compensation?.summaryComponents ?? []).find((c) => /salary/i.test(c.compensationType ?? "") && (c.minValue || c.maxValue));
    const period: SalaryPeriod | null = comp ? (/year/i.test(comp.interval ?? "") ? "year" : /month/i.test(comp.interval ?? "") ? "month" : /hour/i.test(comp.interval ?? "") ? "hour" : null) : null;
    const country = j.address?.postalAddress?.addressCountry;
    return {
      id: `ashby:${site.slug}/${j.id}`, url: j.jobUrl, title: j.title.trim(),
      locations: locList(j.location, ...(j.secondaryLocations ?? []).map((s) => s.location), country), remote: j.isRemote ? "remote" : remoteOf(j.location),
      employment: employmentOf(j.employmentType),
      salary: comp ? { min: comp.minValue || null, max: comp.maxValue || null, currency: comp.currencyCode || null, period } : salaryFromDescription(text) ?? undefined,
      postedAt: toIso(j.publishedAt), description: truncate(text), tags: [j.department, j.team].filter((x): x is string => !!x),
    };
  });
};

// ---------------------------------------------------------------- workable
interface WkJob { title: string; shortcode: string; employment_type?: string; telecommuting?: boolean; remote?: boolean; workplace?: string; department?: string; url?: string; shortlink?: string; application_url?: string; published_on?: string; created_at?: string; country?: string; city?: string; state?: string; experience?: string; function?: string; industry?: string; description?: string; requirements?: string; benefits?: string; locations?: Array<{ country?: string; city?: string; region?: string }> }
const workable: Fetcher = async (site) => {
  const res = await fetchJson<{ jobs?: WkJob[] }>(`https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(site.slug)}?details=true`);
  return (res.jobs ?? []).slice(0, CONFIG.careersMaxJobsPerCompany).map((j) => {
    const text = [toText(j.description), toText(j.requirements), toText(j.benefits)].filter(Boolean).join("\n\n");
    const wp = (j.workplace ?? "").toLowerCase();
    const remote: RemoteType = wp === "remote" || j.telecommuting || j.remote ? "remote" : wp === "hybrid" ? "hybrid" : wp === "on_site" || wp === "onsite" ? "onsite" : "unknown";
    const locs = j.locations?.length ? j.locations.map((l) => [l.city, l.region, l.country].filter(Boolean).join(", ")) : [[j.city, j.state, j.country].filter(Boolean).join(", ")];
    return {
      id: `workable:${site.slug}/${j.shortcode}`, url: j.url || j.shortlink || `https://apply.workable.com/${site.slug}/j/${j.shortcode}/`, title: j.title.trim(),
      locations: locList(...locs), remote, employment: employmentOf(j.employment_type), seniority: j.experience && !/not applicable/i.test(j.experience) ? j.experience : undefined,
      salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(j.published_on ?? j.created_at), description: truncate(text), tags: [j.department, j.function, j.industry].filter((x): x is string => !!x),
    };
  });
};

// ---------------------------------------------------------------- smartrecruiters
interface SrPosting { id: string; name: string; releasedDate?: string; location?: { city?: string; region?: string; country?: string; remote?: boolean; fullLocation?: string }; department?: { label?: string }; function?: { label?: string }; typeOfEmployment?: { label?: string }; experienceLevel?: { label?: string }; company?: { identifier?: string; name?: string } }
const smartrecruiters: Fetcher = async (site, ctx, budget) => {
  const out: Partial[] = [];
  for (let offset = 0; offset < CONFIG.careersMaxJobsPerCompany; offset += 100) {
    const res = await fetchJson<{ totalFound?: number; content?: SrPosting[] }>(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(site.slug)}/postings?limit=100&offset=${offset}`);
    for (const p of res.content ?? []) {
      const loc = p.location?.fullLocation ?? [p.location?.city, p.location?.region, p.location?.country?.toUpperCase()].filter(Boolean).join(", ");
      out.push({
        id: `smartrecruiters:${site.slug}/${p.id}`, url: `https://jobs.smartrecruiters.com/${site.slug}/${p.id}`, title: p.name.trim(),
        locations: locList(loc), remote: p.location?.remote ? "remote" : remoteOf(loc), employment: employmentOf(p.typeOfEmployment?.label),
        seniority: p.experienceLevel?.label && !/not applicable/i.test(p.experienceLevel.label) ? p.experienceLevel.label : undefined,
        postedAt: toIso(p.releasedDate), tags: [p.department?.label, p.function?.label].filter((x): x is string => !!x),
      });
    }
    if ((res.content ?? []).length < 100 || offset + 100 >= (res.totalFound ?? 0)) break;
    await sleep(400);
  }
  for (const j of out) {
    if (budget.details <= 0) break;
    if (ctx.isSeen(j.id) || !worthDetail(j.title)) continue;
    budget.details--;
    try {
      const d = await fetchJson<{ jobAd?: { sections?: Record<string, { title?: string; text?: string }> }; postingUrl?: string; applyUrl?: string }>(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(site.slug)}/postings/${j.id.split("/").pop()}`);
      const text = Object.values(d.jobAd?.sections ?? {}).map((s) => toText(s.text)).filter(Boolean).join("\n\n");
      j.description = truncate(text); j.salary = salaryFromDescription(text) ?? undefined;
      if (d.postingUrl) j.url = d.postingUrl;
    } catch (e) { ctx.log(`[smartrecruiters] ${site.name} detail ${j.id}: ${(e as Error).message}`); }
    await sleep(300);
  }
  return out;
};

// ---------------------------------------------------------------- recruitee
interface RcOffer { id: number; title: string; careers_url?: string; remote?: boolean; hybrid?: boolean; on_site?: boolean; location?: string; country_code?: string; city?: string; employment_type_code?: string; description?: string; requirements?: string; created_at?: string; published_at?: string; department?: string; tags?: string[]; salary?: { min?: number; max?: number; currency?: string; period?: string } }
const recruitee: Fetcher = async (site) => {
  const res = await fetchJson<{ offers?: RcOffer[] }>(`https://${encodeURIComponent(site.slug)}.recruitee.com/api/offers/`);
  return (res.offers ?? []).slice(0, CONFIG.careersMaxJobsPerCompany).map((o) => {
    const text = [toText(o.description), toText(o.requirements)].filter(Boolean).join("\n\n");
    const s = o.salary;
    return {
      id: `recruitee:${site.slug}/${o.id}`, url: o.careers_url ?? `https://${site.slug}.recruitee.com/o/${o.id}`, title: o.title.trim(),
      locations: locList(o.location, o.country_code?.toUpperCase()), remote: o.remote ? "remote" : o.hybrid ? "hybrid" : o.on_site ? "onsite" : remoteOf(o.location),
      employment: employmentOf(o.employment_type_code), postedAt: toIso(o.published_at ?? o.created_at),
      salary: s && (s.min || s.max) ? { min: s.min || null, max: s.max || null, currency: s.currency || null, period: /year|annual/i.test(s.period ?? "") ? "year" : /month/i.test(s.period ?? "") ? "month" : /hour/i.test(s.period ?? "") ? "hour" : null } : salaryFromDescription(text) ?? undefined,
      description: truncate(text), tags: [o.department, ...(o.tags ?? [])].filter((x): x is string => !!x),
    };
  });
};

// ---------------------------------------------------------------- personio (XML feed)
const personio: Fetcher = async (site) => {
  let xml: string;
  try { xml = await fetchText(`https://${encodeURIComponent(site.slug)}.jobs.personio.de/xml`, { tries: 2 }); }
  catch (e) { if (!/HTTP 404|ENOTFOUND|getaddrinfo/.test((e as Error).message)) throw e; xml = await fetchText(`https://${encodeURIComponent(site.slug)}.jobs.personio.com/xml`, { tries: 1 }); }
  const tag = (block: string, name: string) => { const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`)); return m ? decodeEntities(m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")).trim() : ""; };
  const out: Partial[] = [];
  for (const block of xml.split(/<position>/).slice(1)) {
    const id = tag(block, "id"), name = tag(block, "name");
    if (!id || !name) continue;
    const parts = [...block.matchAll(/<jobDescription>([\s\S]*?)<\/jobDescription>/g)].map((m) => `${tag(m[1], "name")}\n${htmlToText(tag(m[1], "value"))}`);
    const text = parts.join("\n\n").trim();
    const office = tag(block, "office"), schedule = tag(block, "schedule"), type = tag(block, "employmentType"), seniority = tag(block, "seniority"), yoe = tag(block, "yearsOfExperience");
    const yearsMin = yoe ? Number((yoe.match(/^(\d+)/)?.[1] ?? (/^lt/.test(yoe) ? "0" : ""))) : NaN;
    out.push({
      id: `personio:${site.slug}/${id}`, url: `https://${site.slug}.jobs.personio.de/job/${id}`, title: name,
      locations: locList(office), remote: remoteOf(office),
      employment: /part/.test(schedule) && !/full/.test(schedule) ? ["part-time"] : /intern|trainee|working_student/.test(type) ? ["internship"] : /freelance/.test(type) ? ["freelance"] : /temporary/.test(type) ? ["temporary"] : /full/.test(schedule) || /permanent/.test(type) ? ["full-time"] : [],
      seniority: seniority || undefined, yearsMin: Number.isFinite(yearsMin) ? yearsMin : undefined,
      salary: salaryFromDescription(text) ?? undefined, postedAt: toIso(tag(block, "createdAt")), description: truncate(text), tags: [tag(block, "department"), tag(block, "occupationCategory")].filter(Boolean),
    });
    if (out.length >= CONFIG.careersMaxJobsPerCompany) break;
  }
  return out;
};

// ---------------------------------------------------------------- bamboohr
interface BhJob { id: number | string; jobOpeningName: string; departmentLabel?: string; employmentStatusLabel?: string; location?: { city?: string; state?: string; country?: string }; isRemote?: boolean; datePosted?: string }
const bamboohr: Fetcher = async (site, ctx, budget) => {
  const res = await fetchJson<{ result?: BhJob[] }>(`https://${encodeURIComponent(site.slug)}.bamboohr.com/careers/list`, { headers: { Accept: "application/json" } });
  const out = (res.result ?? []).slice(0, CONFIG.careersMaxJobsPerCompany).map((j): Partial => {
    const loc = [j.location?.city, j.location?.state, j.location?.country].filter(Boolean).join(", ");
    return {
      id: `bamboohr:${site.slug}/${j.id}`, url: `https://${site.slug}.bamboohr.com/careers/${j.id}`, title: j.jobOpeningName.trim(),
      locations: locList(loc), remote: j.isRemote ? "remote" : remoteOf(loc), employment: employmentOf(j.employmentStatusLabel),
      postedAt: toIso(j.datePosted), tags: [j.departmentLabel].filter((x): x is string => !!x),
    };
  });
  for (const j of out) {
    if (budget.details <= 0) break;
    if (ctx.isSeen(j.id) || !worthDetail(j.title)) continue;
    budget.details--;
    try {
      const d = await fetchJson<{ result?: { jobOpening?: { description?: string } } }>(`https://${encodeURIComponent(site.slug)}.bamboohr.com/careers/${j.id.split("/").pop()}/detail`, { headers: { Accept: "application/json" } });
      const text = toText(d.result?.jobOpening?.description);
      j.description = truncate(text); j.salary = salaryFromDescription(text) ?? undefined;
    } catch (e) { ctx.log(`[bamboohr] ${site.name} detail ${j.id}: ${(e as Error).message}`); }
    await sleep(300);
  }
  return out;
};

// ---------------------------------------------------------------- workday
interface WdPosting { title: string; externalPath: string; locationsText?: string; postedOn?: string; bulletFields?: string[] }
/** "Posted Today" | "Posted Yesterday" | "Posted 3 Days Ago" | "Posted 30+ Days Ago" -> ISO (approx.). */
function workdayDate(s: string | undefined): string | null {
  if (!s) return null;
  if (/today/i.test(s)) return new Date().toISOString();
  if (/yesterday/i.test(s)) return new Date(Date.now() - 86_400_000).toISOString();
  const m = s.match(/(\d+)\+?\s*days?/i);
  return m ? new Date(Date.now() - Number(m[1]) * 86_400_000).toISOString() : null;
}
const workday: Fetcher = async (site, ctx, budget) => {
  const [tenant, wd, siteName] = site.slug.split("|");
  if (!tenant || !wd || !siteName) throw new Error(`workday slug must be "tenant|wd5|SiteName" (got "${site.slug}")`);
  const base = `https://${tenant}.${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${siteName}`;
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  const out: Partial[] = [];
  for (let offset = 0; offset < CONFIG.careersMaxJobsPerCompany; offset += 20) {
    const res = await fetchJson<{ total?: number; jobPostings?: WdPosting[] }>(`${base}/jobs`, { method: "POST", headers, body: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText: "" }), tries: 2 });
    for (const p of res.jobPostings ?? []) {
      if (!p.externalPath || !p.title) continue;
      const loc = p.locationsText ?? "";
      out.push({
        id: `workday:${tenant}/${p.bulletFields?.[0] ?? p.externalPath.split("_").pop()}`, url: `https://${tenant}.${wd}.myworkdayjobs.com/${siteName}${p.externalPath}`, title: p.title.trim(),
        locations: /\d+ locations/i.test(loc) ? [] : locList(loc), remote: remoteOf(loc), employment: [], postedAt: workdayDate(p.postedOn), tags: [p.externalPath],
      });
    }
    if ((res.jobPostings ?? []).length < 20 || offset + 20 >= (res.total ?? 0)) break;
    await sleep(400);
  }
  for (const j of out) {
    const path = j.tags?.[0] ?? ""; j.tags = [];
    if (budget.details <= 0) break;
    if (ctx.isSeen(j.id) || !worthDetail(j.title)) continue;
    budget.details--;
    try {
      const d = await fetchJson<{ jobPostingInfo?: { jobDescription?: string; location?: string; additionalLocations?: string[]; startDate?: string; timeType?: string; remoteType?: string; externalUrl?: string; postedOn?: string } }>(`${base}${path}`, { headers: { Accept: "application/json" }, tries: 2 });
      const info = d.jobPostingInfo ?? {};
      const text = toText(info.jobDescription);
      j.description = truncate(text); j.salary = salaryFromDescription(text) ?? undefined;
      if (info.location || info.additionalLocations?.length) j.locations = locList(info.location, ...(info.additionalLocations ?? []));
      if (info.remoteType && /remote/i.test(info.remoteType)) j.remote = "remote";
      if (info.timeType) j.employment = employmentOf(info.timeType);
      if (info.startDate) j.postedAt = toIso(info.startDate) ?? j.postedAt;
      if (info.externalUrl) j.url = info.externalUrl;
    } catch (e) { ctx.log(`[workday] ${site.name} detail ${j.id}: ${(e as Error).message}`); }
    await sleep(400);
  }
  return out;
};

// ---------------------------------------------------------------- teamtailor (JSON Feed)
interface TtItem { id: string | number; url: string; title: string; content_html?: string; content_text?: string; date_published?: string; summary?: string; _teamtailor?: Record<string, any> }
const teamtailor: Fetcher = async (site) => {
  const host = /\./.test(site.slug) ? site.slug : `${site.slug}.teamtailor.com`;
  const res = await fetchJson<{ items?: TtItem[] }>(`https://${host}/jobs.json`);
  return (res.items ?? []).slice(0, CONFIG.careersMaxJobsPerCompany).map((it) => {
    const ex = it._teamtailor ?? {};
    const text = it.content_text ?? toText(it.content_html);
    const loc = [ex.location, ex.locations, ex.city, ex.country].map((v) => (Array.isArray(v) ? v.join(", ") : v)).filter(Boolean).join(", ") as string;
    const remoteStatus = String(ex.remote_status ?? ex.remoteStatus ?? "").toLowerCase();
    return {
      id: `teamtailor:${site.slug}/${it.id}`, url: it.url, title: it.title.trim(),
      locations: locList(loc), remote: remoteStatus === "fully" || remoteStatus === "fully_remote" ? "remote" : remoteStatus === "hybrid" ? "hybrid" : remoteStatus === "none" ? "onsite" : remoteOf(`${it.title} ${loc}`),
      employment: employmentOf(String(ex.employment_type ?? ex.employmentType ?? "")), postedAt: toIso(it.date_published),
      salary: salaryFromDescription(text) ?? undefined, description: truncate(text), tags: [ex.department, ex.role].map(String).filter((x) => x && x !== "undefined"),
    };
  });
};

const FETCHERS: Record<AtsKind, Fetcher> = { greenhouse, lever, ashby, workable, smartrecruiters, recruitee, personio, bamboohr, workday, teamtailor };

/** Build the scraper source for one ATS kind: reads every configured company of that kind. */
export function makeSearch(kind: AtsKind): (ctx: SearchCtx) => Promise<Job[]> {
  return async (ctx) => {
    const sites = CONFIG.careers.filter((c) => c.ats === kind && c.enabled !== false);
    if (sites.length === 0) { ctx.log(`[${kind}] no companies configured (config.json careers)`); return []; }
    const out = new Map<string, Job>();
    const budget = { details: CONFIG.careersMaxDetails };
    let failed = 0;
    const errors: string[] = [];
    const br = new Breaker(8, kind);
    for (const site of sites) {
      try {
        const jobs = await FETCHERS[kind](site, ctx, budget);
        let n = 0;
        for (const p of jobs) {
          if (out.has(p.id)) continue;
          out.set(p.id, { ...p, source: kind, company: site.name, tags: [...(site.tags ?? []), ...(p.tags ?? [])] });
          n++;
        }
        ctx.log(`[${kind}] ${site.name}: ${n} open positions`); br.ok();
      } catch (e) {
        failed++;
        const msg = (e as Error).message;
        // a wrong slug (404 / unknown host) is a config problem of that company, not a dead ATS: it must not trip the breaker
        if (!/HTTP 404|ENOTFOUND|getaddrinfo|curl HTTP 404/.test(msg)) br.fail(e);
        errors.push(`${site.name}: ${msg.slice(0, 60)}`);
        ctx.log(`[${kind}] ${site.name} (${site.slug}): ${msg}`);
      }
      await sleep(400);
    }
    if (failed === sites.length) throw new Error(`all ${sites.length} companies failed – ${errors.slice(0, 3).join("; ")}`);
    if (failed) ctx.log(`[${kind}] ${failed}/${sites.length} companies failed (check slugs in config.json): ${errors.slice(0, 5).join("; ")}`);
    return [...out.values()];
  };
}
