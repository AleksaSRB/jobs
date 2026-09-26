import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Config, Rules, Source } from "./types.ts";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/** PSY_JOBS_DATA_DIR: alternative database folder for experiments without touching the real data/. */
export const DATA_DIR = process.env.PSY_JOBS_DATA_DIR || join(ROOT, "data");
export const DB_FILE = join(DATA_DIR, "db.json");
export const SEEN_FILE = join(DATA_DIR, "seen.json");
export const LOCK_FILE = join(DATA_DIR, "scrape.lock");
export const RUN_LOG = join(DATA_DIR, "scraper.log");
export const NEW_LOG = join(DATA_DIR, "new_jobs.log");
export const FILTERED_LOG = join(DATA_DIR, "filtered.log");
export const PUBLIC_DIR = join(ROOT, "public");
export const CONFIG_FILE = join(ROOT, "config.json");
export const RULES_FILE = join(ROOT, "rules.json");

export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

/** Every source the scraper knows, in scan order (cheap JSON/RSS sources first, rate-limited HTML sources last). */
export const ALL_SOURCES: Source[] = [
  "himalayas", "wwr", "remoteok", "workingnomads", "jobicy", "remotive", "arbeitnow", "themuse", "jobspresso", "aijobs", "eightyk", "adzuna", "hn",
  "greenhouse", "lever", "ashby", "workable", "smartrecruiters", "recruitee", "personio", "bamboohr", "workday",
  "jobrack", "linkedin", "wellfound",
];

const DEFAULT_SOURCES = Object.fromEntries(ALL_SOURCES.map((s) => [s, { enabled: true, everyMin: 60 }])) as Config["sources"];

const DEFAULTS: Config = {
  port: 3008,
  lookbackDays: 7,
  intervalMin: 15,
  minScore: 50,
  ntfyTopic: "",
  sources: DEFAULT_SOURCES,
  himalayas: { country: "RS", maxPages: 2, queries: ["behavioral scientist", "ux researcher", "mental health"] },
  wwr: { feeds: ["remote-product-jobs", "remote-design-jobs", "all-other-remote-jobs"] },
  remoteok: { tags: ["health", "research", "ux"] },
  workingnomads: { categories: ["Design", "Writing", "Management", "Healthcare", "Education", "Human Resources", "Consulting"] },
  jobrack: { categories: ["content-writer", "project-manager"], maxPages: 1, listPages: 2, maxDetails: 20 },
  linkedin: { serbia: { location: "Serbia", maxPages: 1, queries: ["ux researcher"] }, europe: { location: "European Union", maxPages: 1, queries: [] }, maxDetails: 40 },
  wellfound: { maxPages: 2, paths: ["/role/r/ux-researcher"] },
  jobicy: { industries: ["hr", "product"], count: 50 },
  arbeitnow: { maxPages: 3 },
  themuse: { categories: ["Data and Analytics", "Product Management", "UX & Design", "Healthcare", "Writing and Editing", "HR & Recruiting", "Science and Engineering"], levels: ["entry", "mid"], maxPages: 3 },
  jobspresso: { queries: ["research", "health", "content", "product"] },
  aijobs: { feeds: ["https://aijobs.net/feed/"] },
  hn: { keywords: ["remote"], maxComments: 600 },
  adzuna: { appId: "", appKey: "", countries: ["gb", "de", "nl", "pl", "at"], queries: ["behavioural scientist", "ux researcher remote"], resultsPerPage: 50 },
  eightyk: { url: "" },
  careers: [],
  careersMaxJobsPerCompany: 400,
  careersMaxDetails: 60,
  blockedCompanies: [],
  fx: { EUR: 1, USD: 0.88, GBP: 1.16, RSD: 0.0085 },
};

function loadConfig(): Config {
  let user: Partial<Config> = {};
  try { user = JSON.parse(readFileSync(CONFIG_FILE, "utf8")); } catch { /* use defaults */ }
  const merge = <K extends keyof Config>(k: K): Config[K] => ({ ...(DEFAULTS[k] as object), ...((user[k] ?? {}) as object) }) as Config[K];
  return {
    ...DEFAULTS, ...user,
    port: Number(process.env.PSY_JOBS_PORT) || user.port || DEFAULTS.port,
    sources: merge("sources"), himalayas: merge("himalayas"), wwr: merge("wwr"), remoteok: merge("remoteok"), workingnomads: merge("workingnomads"),
    jobrack: merge("jobrack"), linkedin: merge("linkedin"), wellfound: merge("wellfound"), jobicy: merge("jobicy"), arbeitnow: merge("arbeitnow"),
    themuse: merge("themuse"), jobspresso: merge("jobspresso"), aijobs: merge("aijobs"), hn: merge("hn"), adzuna: merge("adzuna"), eightyk: merge("eightyk"),
    careers: (user.careers ?? DEFAULTS.careers).filter((c) => c && c.name && c.ats && c.slug),
    fx: merge("fx"),
  };
}

function loadRules(): Rules {
  try { return JSON.parse(readFileSync(RULES_FILE, "utf8")) as Rules; } catch (e) { throw new Error(`rules.json: ${(e as Error).message}`); }
}

export const CONFIG: Config = loadConfig();
export const RULES: Rules = loadRules();
export const NTFY_TOPIC: string = process.env.NTFY_TOPIC || CONFIG.ntfyTopic || "";
