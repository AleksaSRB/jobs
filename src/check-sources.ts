/**
 * Connectivity check for every source – run this on the machine that will scrape (the sites block some networks / countries):
 *   npm run check                 one cheap request per board + one per ATS kind (first configured company)
 *   npm run check -- --careers    also try EVERY configured career page (prints which slugs are wrong)
 * Prints OK / HTTP status / error per source. Nothing is written to the database.
 */
import { CONFIG } from "./config.ts";
import { fetchText } from "./http.ts";
import type { AtsKind } from "./types.ts";

const all = process.argv.includes("--careers");

const atsUrl = (ats: AtsKind, slug: string): { url: string; opts?: Parameters<typeof fetchText>[1] } => {
  const [tenant, wd, site] = slug.split("|");
  switch (ats) {
    case "greenhouse": return { url: `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs` };
    case "lever": return { url: `https://api.lever.co/v0/postings/${slug}?mode=json&limit=1` };
    case "ashby": return { url: `https://api.ashbyhq.com/posting-api/job-board/${slug}` };
    case "workable": return { url: `https://apply.workable.com/api/v1/widget/accounts/${slug}` };
    case "smartrecruiters": return { url: `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=1` };
    case "recruitee": return { url: `https://${slug}.recruitee.com/api/offers/` };
    case "personio": return { url: `https://${slug}.jobs.personio.de/xml` };
    case "bamboohr": return { url: `https://${slug}.bamboohr.com/careers/list`, opts: { headers: { Accept: "application/json" } } };
    case "workday": return { url: `https://${tenant}.${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/jobs`, opts: { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ appliedFacets: {}, limit: 1, offset: 0, searchText: "" }) } };
    case "teamtailor": return { url: `https://${/\./.test(slug) ? slug : `${slug}.teamtailor.com`}/jobs.json` };
  }
};

const BOARDS: Array<[string, string, Parameters<typeof fetchText>[1]?]> = [
  ["himalayas", `https://himalayas.app/jobs/api/search?q=${encodeURIComponent(CONFIG.himalayas.queries[0] ?? "psychology")}&country=${CONFIG.himalayas.country}&sort=recent&page=1`],
  ["wwr", `https://weworkremotely.com/categories/${CONFIG.wwr.feeds[0]}.rss`],
  ["remoteok", "https://remoteok.com/api"],
  ["workingnomads", `https://www.workingnomads.com/jobsapi/_search?q=${encodeURIComponent(`category_name:"${CONFIG.workingnomads.categories[0] ?? "Healthcare"}" AND expired:false`)}&size=1&sort=pub_date:desc`],
  ["jobicy", `https://jobicy.com/api/v2/remote-jobs?count=1&industry=${CONFIG.jobicy.industries[0]}`],
  ["remotive", "https://remotive.com/api/remote-jobs?limit=1"],
  ["arbeitnow", "https://www.arbeitnow.com/api/job-board-api?page=1"],
  ["themuse", `https://www.themuse.com/api/public/jobs?page=0&category=${encodeURIComponent(CONFIG.themuse.categories[0])}&location=Flexible%20%2F%20Remote`],
  ["jobspresso", `https://jobspresso.co/?feed=job_feed&search_keywords=${encodeURIComponent(CONFIG.jobspresso.queries[0])}`],
  ["aijobs", `https://foorilla.com/hiring/jobs/?job_search=${encodeURIComponent(CONFIG.aijobs.queries[0] ?? "psycholog")}&page=1`, { headers: { "HX-Request": "true" } }], // htmx fragment; without the header -> 302 /hiring/
  ["hn", "https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=%22who%20is%20hiring%22&hitsPerPage=1"],
  ["adzuna", CONFIG.adzuna.appId ? `https://api.adzuna.com/v1/api/jobs/${CONFIG.adzuna.countries[0]}/search/1?app_id=${CONFIG.adzuna.appId}&app_key=${CONFIG.adzuna.appKey}&what=psychology&results_per_page=1` : ""],
  ["eightyk", CONFIG.eightyk.url || (CONFIG.eightyk.algoliaAppId ? `https://${CONFIG.eightyk.algoliaAppId}-dsn.algolia.net/1/indexes/${CONFIG.eightyk.index}?query=&hitsPerPage=1&x-algolia-application-id=${CONFIG.eightyk.algoliaAppId}&x-algolia-api-key=${CONFIG.eightyk.algoliaApiKey}` : "")], // Algolia GET search form (…/query is POST-only)
  ["rss", CONFIG.rss.feeds[0]?.url ?? ""],
  ["workablesearch", `https://jobs.workable.com/api/v1/jobs?query=${encodeURIComponent(CONFIG.workablesearch.queries[0] ?? "psychology")}&workplace=remote&day_range=30&limit=1`],
  ["reliefweb", `https://api.reliefweb.int/v1/jobs?appname=psych-healthtech-jobs&limit=1&query[value]=${encodeURIComponent("mental health")}`],
  ["jobrack", "https://jobrack.eu/jobs?page=1"],
  ["linkedin", `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(CONFIG.linkedin.serbia.queries[0] ?? "psychology")}&location=Serbia&f_WT=2&start=0`],
  ["wellfound", `https://wellfound.com${CONFIG.wellfound.paths[0]}`],
];

async function probe(name: string, url: string, opts?: Parameters<typeof fetchText>[1]): Promise<void> {
  if (!url) { console.log(`skip  ${name.padEnd(22)} not configured`); return; }
  const t0 = Date.now();
  try {
    const body = await fetchText(url, { tries: 1, ...(opts ?? {}) });
    const kind = /^\s*[{[]/.test(body) ? "json" : /<rss|<feed|<workzag/i.test(body) ? "xml" : "html";
    console.log(`OK    ${name.padEnd(22)} ${kind} ${body.length} bytes ${Date.now() - t0} ms`);
  } catch (e) { console.log(`FAIL  ${name.padEnd(22)} ${(e as Error).message} (${Date.now() - t0} ms)`); }
}

for (const [name, url, opts] of BOARDS) if (CONFIG.sources[name as keyof typeof CONFIG.sources]?.enabled !== false) await probe(name, url, opts);
const kinds: AtsKind[] = ["greenhouse", "lever", "ashby", "workable", "smartrecruiters", "recruitee", "personio", "bamboohr", "workday", "teamtailor"];
for (const k of kinds) {
  const sites = CONFIG.careers.filter((c) => c.ats === k && c.enabled !== false);
  if (!sites.length) { console.log(`skip  ${k.padEnd(22)} no companies configured`); continue; }
  for (const s of all ? sites : sites.slice(0, 1)) { const { url, opts } = atsUrl(k, s.slug); await probe(`${k}:${s.name}`.slice(0, 22), url, opts); }
}
console.log("note: hiring.cafe and EURES need POST bodies – run the scraper with --only hiringcafe,eures to test them.");
console.log(`\n${CONFIG.careers.length} career pages configured (use --careers to test all).`);
