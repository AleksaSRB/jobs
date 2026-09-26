/**
 * Wellfound – public SEO role pages are SSR (verified 26.09.2026), no login:
 *   https://wellfound.com/role/r/<role>             remote listings for a role (__NEXT_DATA__.page = "/seoLanding/roleRemoteSearch", pageProps.role = slug)
 *   https://wellfound.com/role/l/<role>/<location>  listings by location, mixes onsite -> filtered by `remote` ("/seoLanding/roleLocationSearch")
 *   Role slugs are a fixed SEO list (ux-researcher, product-manager, product-owner, content-strategist, hr-manager, data-analyst… exist);
 *   an unknown slug answers 303 -> /remote (generic "Remote Tech & Startup Jobs", page = "/seoLanding/remoteSearch", ~56 engineering jobs/page).
 *   Node fetch follows that redirect silently, so a missing `pageProps.role` is what tells the two apart – such a path is logged and skipped
 *   (it must NOT be parsed: the generic page would pollute the db with random tech jobs).
 * Data: <script id="__NEXT_DATA__"> -> props.pageProps.apolloState.data -> "JobListingSearchResult:<id>" (title, slug, description (markdown), jobType,
 * liveStartAt (unix s), locationNames[] = HQ, remote, remoteConfig.kind REMOTE|ONSITE|ONSITE_OR_REMOTE|null, acceptedRemoteLocationNames[],
 * compensation "$90k – $130k • 0.1% – 0.5%", yearsExperienceMin/Max, primaryRoleTitle); company in "StartupResult:<id>" (name, logoUrl,
 * highlightedJobListings[].__ref). ROOT_QUERY carries pageCount / totalJobCount; ?page=N; sorted by relevance (not date), lots of senior and
 * years-old listings -> keep maxPages small, the scorer / baseline filter the rest. Historically behind DataDome -> may 403 (then the source only
 * reports the error). 2.5 s pause between pages.
 */
import { CONFIG } from "../config.ts";
import { fetchText, sleep, toIso, truncate } from "../http.ts";
import { parseSalaryText, salaryFromDescription } from "../salary.ts";
import type { Job, SearchCtx } from "../types.ts";
import { Breaker, employmentOf } from "./common.ts";

const BASE = "https://wellfound.com";

interface WfJob {
  id: string; title: string; slug: string; description?: string; jobType?: string; liveStartAt?: number;
  locationNames?: string[]; remote?: boolean; remoteConfig?: { kind?: string } | null;
  acceptedRemoteLocationNames?: string[]; compensation?: string; yearsExperienceMin?: number | null; yearsExperienceMax?: number | null;
}
interface WfStartup { name?: string; logoUrl?: string; highlightedJobListings?: Array<{ __ref?: string }> }

function parsePage(html: string): { jobs: Job[]; pageCount: number; total: number; role: string | null } {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("nema __NEXT_DATA__ (anti-bot ili promenjen sajt)");
  const next = JSON.parse(m[1]);
  const role: string | null = next?.props?.pageProps?.role ?? next?.query?.role ?? null; // null = redirected to /remote (unknown role slug)
  const state: Record<string, any> = next?.props?.pageProps?.apolloState?.data ?? next?.props?.pageProps?.apolloState ?? {};

  const startupOf = new Map<string, WfStartup>();
  for (const [key, val] of Object.entries(state)) {
    if (!key.startsWith("StartupResult:")) continue;
    for (const ref of (val as WfStartup).highlightedJobListings ?? []) if (ref.__ref) startupOf.set(ref.__ref, val as WfStartup);
  }

  const jobs: Job[] = [];
  for (const [key, val] of Object.entries(state)) {
    if (!key.startsWith("JobListingSearchResult:")) continue;
    const j = val as WfJob;
    const kind = j.remoteConfig?.kind;
    if (!(j.remote === true || kind === "REMOTE" || kind === "ONSITE_OR_REMOTE")) continue; // samo remote
    const startup = startupOf.get(key);
    const accepted = j.acceptedRemoteLocationNames ?? [];
    const hq = (j.locationNames ?? []).slice(0, 2).join(" / ");
    const text = (j.description ?? "").replace(/\n{3,}/g, "\n\n").trim();
    // polje compensation je merodavno; tekst opisa se gleda samo kad je ono prazno / "No equity"
    const salary = parseSalaryText(j.compensation) ?? (/\d/.test(j.compensation ?? "") ? null : salaryFromDescription(text));
    if (salary && salary.period === null && (salary.max ?? salary.min ?? 0) >= 10_000) salary.period = "year"; // compensation je godišnji iznos
    jobs.push({
      source: "wellfound",
      id: `wellfound:${j.id}`,
      url: `${BASE}/jobs/${j.id}-${j.slug}`,
      title: j.title.trim(),
      company: startup?.name?.trim() ?? "",
      companyLogo: startup?.logoUrl || undefined,
      // prazna lista = firma nije ograničila odakle zapošljava remote (ocena: nejasno, gleda opis); sedište ide u tagove
      locations: accepted,
      remote: "remote",
      employment: employmentOf(j.jobType),
      yearsMin: j.yearsExperienceMin ?? null,
      salary: salary ?? undefined,
      postedAt: toIso(j.liveStartAt ?? null),
      description: truncate(text),
      tags: [hq ? `sedište: ${hq}` : "", kind === "ONSITE_OR_REMOTE" ? "onsite ili remote" : ""].filter(Boolean),
    });
  }

  const root = JSON.stringify(state.ROOT_QUERY ?? {});
  const pageCount = Number(root.match(/"pageCount":(\d+)/)?.[1] ?? 1);
  const total = Number(root.match(/"totalJobCount":(\d+)/)?.[1] ?? jobs.length);
  return { jobs, pageCount, total, role };
}

export async function search(ctx: SearchCtx): Promise<Job[]> {
  const out = new Map<string, Job>();
  let failed = 0, dead = 0;
  const br = new Breaker(3, "wellfound");
  for (const path of CONFIG.wellfound.paths) {
    try {
      let pageCount = 1, n = 0, total = 0;
      for (let page = 1; page <= Math.min(pageCount, CONFIG.wellfound.maxPages); page++) {
        const html = await fetchText(`${BASE}${path}${page > 1 ? `?page=${page}` : ""}`, { tries: 2 });
        const parsed = parsePage(html);
        if (!parsed.role) throw new Error("HTTP 303 -> /remote (role slug does not exist)"); // fetch followed the redirect to the generic page
        pageCount = parsed.pageCount; total = parsed.total; n += parsed.jobs.length;
        for (const j of parsed.jobs) if (!out.has(j.id)) out.set(j.id, j);
        br.ok();
        await sleep(2_500);
      }
      ctx.log(`[wellfound] ${path}: remote=${n} of ${total} listings, pages ${Math.min(pageCount, CONFIG.wellfound.maxPages)}/${pageCount}`);
    } catch (e) {
      const msg = (e as Error).message;
      if (/HTTP 30[1-8]|HTTP 404/.test(msg)) { dead++; ctx.log(`[wellfound] ${path}: ${msg} – remove it from config.json wellfound.paths`); continue; } // not a site failure
      ctx.log(`[wellfound] ${path}: ${msg}`);
      br.fail(e);
      if (++failed === CONFIG.wellfound.paths.length) throw e;
    }
  }
  if (dead && dead === CONFIG.wellfound.paths.length) throw new Error(`none of the ${dead} configured role slugs exists (303 -> /remote) – fix config.json wellfound.paths`);
  return [...out.values()];
}
