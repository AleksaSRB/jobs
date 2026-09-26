/**
 * Wellfound – javne SEO stranice po ulozi su SSR (provereno 19.09.2026; adapter iz jobs/ scrapera), bez logina:
 *   https://wellfound.com/role/r/<uloga>            remote oglasi za ulogu (rade: marketing, digital-marketing, social-media-manager, sales, account-executive…;
 *                                                   marketing-coordinator, sdr, customer-success, business-development, operations -> 303, ne postoje)
 *   https://wellfound.com/role/l/<uloga>/<lokacija> oglasi po lokaciji (meša onsite -> filtriramo po `remote`)
 * Podaci: <script id="__NEXT_DATA__"> -> props.pageProps.apolloState.data -> "JobListingSearchResult:<id>" (title, slug, description, jobType,
 * liveStartAt, remote, remoteConfig.kind, acceptedRemoteLocationNames[], compensation, yearsExperienceMin/Max), firma u "StartupResult:<id>".
 * 20 oglasa po strani, ?page=N, sortirano po relevantnosti (ne po datumu) i dosta senior -> maxPages mali, ocena filtrira.
 * Zamke: sajt je istorijski iza DataDome-a -> može 403; tada ovaj izvor samo prijavi grešku. Pauza 2,5 s između strana.
 */
import { CONFIG } from "../config.ts";
import { fetchText, sleep, toIso, truncate } from "../http.ts";
import { parseSalaryText, salaryFromDescription } from "../salary.ts";
import type { Job } from "../types.ts";
import { Breaker, employmentOf } from "./common.ts";

const BASE = "https://wellfound.com";

interface WfJob {
  id: string; title: string; slug: string; description?: string; jobType?: string; liveStartAt?: number;
  locationNames?: string[]; remote?: boolean; remoteConfig?: { kind?: string } | null;
  acceptedRemoteLocationNames?: string[]; compensation?: string; yearsExperienceMin?: number | null; yearsExperienceMax?: number | null;
}
interface WfStartup { name?: string; logoUrl?: string; highlightedJobListings?: Array<{ __ref?: string }> }

function parsePage(html: string): { jobs: Job[]; pageCount: number } {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("nema __NEXT_DATA__ (anti-bot ili promenjen sajt)");
  const next = JSON.parse(m[1]);
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

  const pageCount = Number(JSON.stringify(state.ROOT_QUERY ?? {}).match(/"pageCount":(\d+)/)?.[1] ?? 1);
  return { jobs, pageCount };
}

export async function search(): Promise<Job[]> {
  const out = new Map<string, Job>();
  let failed = 0;
  const br = new Breaker(3, "wellfound");
  for (const path of CONFIG.wellfound.paths) {
    try {
      let pageCount = 1;
      for (let page = 1; page <= Math.min(pageCount, CONFIG.wellfound.maxPages); page++) {
        const html = await fetchText(`${BASE}${path}${page > 1 ? `?page=${page}` : ""}`, { tries: 2 });
        const parsed = parsePage(html);
        pageCount = parsed.pageCount;
        for (const j of parsed.jobs) if (!out.has(j.id)) out.set(j.id, j);
        br.ok();
        await sleep(2_500);
      }
    } catch (e) {
      if (/HTTP 30[1-8]|HTTP 404/.test((e as Error).message)) { failed++; continue; } // role slug does not exist – not a site failure
      br.fail(e);
      if (++failed === CONFIG.wellfound.paths.length) throw e;
    }
  }
  return [...out.values()];
}
