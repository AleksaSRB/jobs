/** Job boards / aggregators (each has its own adapter in src/sources) + ATS kinds used for company career pages. */
export type BoardSource =
  | "himalayas" | "wwr" | "remoteok" | "workingnomads" | "jobrack" | "linkedin" | "wellfound" | "jobicy" | "remotive"
  | "arbeitnow" | "themuse" | "jobspresso" | "aijobs" | "hn" | "adzuna" | "eightyk"
  | "rss" | "workablesearch" | "hiringcafe" | "eures" | "reliefweb";
export type AtsKind = "greenhouse" | "lever" | "ashby" | "workable" | "smartrecruiters" | "recruitee" | "personio" | "bamboohr" | "workday" | "teamtailor";
export type Source = BoardSource | AtsKind;
export type Status = "new" | "favorite" | "applied" | "rejected";
export type SalaryPeriod = "year" | "month" | "week" | "day" | "hour";
export type RemoteType = "remote" | "hybrid" | "onsite" | "unknown";
export type EmploymentKind = "full-time" | "part-time" | "contract" | "freelance" | "temporary" | "internship";
export type MatchLevel = "excellent" | "good" | "possible" | "low";
/** Can a candidate based in Serbia apply (from location fields / description text)? */
export type Eligibility = "serbia" | "worldwide" | "europe" | "unclear" | "excluded";
/** Professional license / clinical registration requirement extracted from the text. */
export type LicenseRequirement = "none" | "preferred" | "required" | "unclear";
export type SeniorityLevel = "junior" | "mid" | "senior" | "unknown";

export interface Salary {
  min: number | null;
  max: number | null;
  currency: string | null;      // ISO code ("EUR", "USD"); null = unknown
  period: SalaryPeriod | null;  // null = unknown
  text?: string;                // raw text from the site
}

/** A listing as returned by a source adapter (normalized, not yet scored). */
export interface Job {
  source: Source;
  sourceLabel?: string;         // display name when one adapter serves many boards ("rss" -> "NoDesk", "EU Remote Jobs"…)
  id: string;                   // "<source>:<site id>"
  url: string;                  // best link for "Open" (employer page when known, otherwise the listing on the source)
  sourceUrl?: string;           // listing on the source site when it differs from url
  title: string;
  company: string;              // "" = unknown
  companyLogo?: string;
  locations: string[];          // allowed countries/regions as the site states them ("Worldwide", "Europe Only", "USA"); [] = not stated
  locationVerified?: boolean;   // the site already filtered by country (Himalayas country=RS, LinkedIn location=Serbia) -> applicable from Serbia
  remote: RemoteType;           // what the site says (flag/filter); "unknown" -> description text decides
  employment: EmploymentKind[]; // only from site fields (not from text)
  seniority?: string;           // site field ("Entry-level", "Senior", "Associate"…)
  yearsMin?: number | null;     // site field (Wellfound yearsExperienceMin)
  timezones?: string;           // "UTC-5…+3" (Himalayas)
  salary?: Salary;
  postedAt: string | null;      // ISO (UTC); null = site gives no date
  description?: string;         // plain text (truncated to DESCRIPTION_MAX)
  summary?: string;             // short summary from the site – otherwise built from the description
  tags: string[];
}

export interface Scoring {
  score: number;
  level: MatchLevel;
  reasons: string[];            // all signals with sign: "+45 Behavioral Science (title)", "-40 5+ years required" … (tuning + <details> on the card)
  matchReasons: string[];       // positive signals only (for the card's "Why it matches")
  negativeReasons: string[];    // negative signals only
  primaryCategory: string | null; // job family id from rules.json
  categories: string[];         // primary + secondary family ids
  badges: string[];             // primary chips (Remote, Full-time, family labels…)
  concepts: string[];           // secondary skill/concept badges (CBT, LLM, Prompt Design…), strongest 4–8
  warnings: string[];           // "License Required", "5+ Years", "Hybrid?", "US hours"…
  reject: string | null;        // hard rejection (US only, hybrid, director, purely technical, mandatory license when configured…)
  eligibility: Eligibility;
  license: LicenseRequirement;
  seniorityLevel: SeniorityLevel;
  yearsRequired: number | null;
  junior: boolean;
  fullTime: boolean;
  remoteFinal: RemoteType;      // after reading the description text
  industries: string[];         // industry signal ids that fired
}

export interface AlsoOn { id: string; source: Source; url: string }

/** A listing in the local database. */
export interface StoredJob extends Job {
  status: Status;
  firstSeen: string;            // ISO – when the scraper first saw it
  lastSeen: string;             // ISO – last time it was seen on the site
  salaryText: string;           // "" = not stated
  salaryEurMonth: number | null;
  score: number;
  level: MatchLevel;
  reasons: string[];
  matchReasons: string[];
  negativeReasons: string[];
  primaryCategory: string | null;
  categories: string[];
  badges: string[];
  concepts: string[];
  warnings: string[];
  eligibility: Eligibility;
  license: LicenseRequirement;
  seniorityLevel: SeniorityLevel;
  yearsRequired: number | null;
  junior: boolean;
  fullTime: boolean;
  remoteFinal: RemoteType;
  industries: string[];
  alsoOn?: AlsoOn[];            // same listing on other sites
  hiddenByRules?: boolean;      // status "rejected" was set by `score --rescore` (not by the user) -> may come back when rules pass it again
}

/** Per-source diagnostics (last run). */
export interface SourceState {
  lastFetched: string;          // ISO
  summary: string;
  ok: boolean;
  error?: string;
  parsed: number;
  accepted: number;
  rejected: number;
  durationSec: number;
}

export interface Db {
  baselineAt: string | null;    // listings older than this are ignored (first run: now − lookbackDays)
  lastRun: string | null;
  lastRunSummary: string;
  sources: Record<string, SourceState>;
  blockedCompanies: string[];
  jobs: Record<string, StoredJob>;
}

export interface SourceConfig { enabled: boolean; everyMin: number }

/** One company career page read through its ATS public API. */
export interface CareerSite {
  name: string;                 // display name (used when the ATS does not return one)
  ats: AtsKind;
  slug: string;                 // board token / site / org / account / subdomain; Workday: "tenant|wd5|SiteName"
  tags?: string[];              // e.g. ["mental-health"] – added to job tags so industry signals fire even for terse listings
  enabled?: boolean;            // default true
}

/** One RSS/Atom feed read by the generic `rss` source. */
export interface RssFeed {
  name: string;                 // board name shown on the card
  url: string;
  remote?: boolean;             // the board lists remote jobs only (default false -> text decides)
  region?: string;              // region the whole feed applies to ("Worldwide", "Europe") when items carry none
  titleSplit?: "company: title" | "title at company" | "none"; // how <title> encodes the company (default: auto)
  enabled?: boolean;
}

export interface Config {
  port: number;
  lookbackDays: number;
  intervalMin: number;
  minScore: number;
  ntfyTopic: string;
  sources: Record<Source, SourceConfig>;
  himalayas: { country: string; maxPages: number; queries: string[] };
  wwr: { feeds: string[] };
  remoteok: { tags: string[] };
  workingnomads: { categories: string[] };
  jobrack: { categories: string[]; maxPages: number; listPages: number; maxDetails: number };
  linkedin: { serbia: { location: string; maxPages: number; queries: string[] }; europe: { location: string; maxPages: number; queries: string[] }; maxDetails: number };
  wellfound: { maxPages: number; paths: string[] };
  jobicy: { industries: string[]; tags?: string[]; geos?: string[]; count: number }; // geos: ?get=locations slugs ("serbia" = open to Serbia); [] = unfiltered
  remotive: { queries: string[]; maxPages: number; maxDetails: number }; // maxPages × 50 hits per search query; maxDetails = detail pages per run
  arbeitnow: { maxPages: number };
  themuse: { categories: string[]; levels: string[]; maxPages: number };
  jobspresso: { queries: string[] };
  aijobs: { queries: string[]; maxPages: number; maxDetails: number }; // foorilla.com/hiring title-substring searches (ex aijobs.net RSS)
  hn: { keywords: string[]; maxComments: number };
  adzuna: { appId: string; appKey: string; countries: string[]; queries: string[]; resultsPerPage: number };
  eightyk: { url: string; algoliaAppId: string; algoliaApiKey: string; index: string };
  rss: { feeds: RssFeed[] };
  workablesearch: { queries: string[]; locations?: string[]; maxPages: number };
  hiringcafe: { queries: string[]; country: string; maxPages: number; maxDetails: number }; // country = ISO2 "user_country" filter (RS + anywhere in Europe/world); 40 hits per page is fixed by the site
  eures: { keywords: string[]; maxPages: number; maxDetails: number };
  reliefweb: { appname: string; query: string; limit: number }; // appname: pre-approved by ReliefWeb (free form, apidoc.reliefweb.int/parameters#appname); "" = skipped
  careers: CareerSite[];
  careersMaxJobsPerCompany: number;
  careersMaxDetails: number;    // per source kind that needs a detail request (SmartRecruiters, BambooHR, Workday)
  blockedCompanies: string[];
  fx: Record<string, number>;
}

/** Scoring rules (rules.json). */
export interface RuleGroup { label: string; score: number; patterns: string[] }
export interface JobFamily {
  id: string;
  label: string;
  priority: "very-high" | "high" | "conditional" | "adjacent";
  titleWeight: number;          // full points when a title pattern matches
  conceptWeight: number;        // full points when >= conceptFull distinct concept patterns match in the description
  titlePatterns: string[];
  conceptPatterns: string[];
  gated?: boolean;              // generic titles (Product Manager, UX Researcher…): full title points only with industry/concept support
  industries?: string[];        // industry ids that count as support for a gated family
  badge?: string;
}
export interface Rules {
  thresholds: { excellent: number; good: number; possible: number };
  families: JobFamily[];
  familyRules: { conceptFull: number; conceptPartialFactor: number; gatedFactor: number; gatedPenalty: number; secondaryMin: number; secondaryConceptMin: number; secondaryBonus: number; secondaryBonusMax: number; noFamilyIndustryOnly: number };
  adjacentTitles: { patterns: string[]; score: number };
  industries: Array<{ id: string; label: string; score: number; patterns: string[] }>;
  industryScoreMax: number;
  concepts: Array<{ group: string; label: string; patterns: string[] }>;
  conceptGroupOrder: string[];
  conceptScore: number;
  conceptScoreMax: number;
  humanAngle: string[];         // terms that turn a hard title negative into a soft one ("AI Safety Engineer – model behavior evaluation")
  technical: { patterns: string[]; minHits: number; maxConcepts: number; score: number };
  license: {
    credentials: string[]; requiredContext: string[]; preferredContext: string[]; notRequired: string[];
    hardReject: boolean; requiredScore: number; preferredScore: number; unclearScore: number;
  };
  titleRegulated: string[];     // title alone implies a regulated clinical role (therapist, clinician, nurse…)
  education: { relevant: string[]; relevantScore: number; unrelatedRequired: string[]; unrelatedScore: number };
  seniority: {
    juniorTitle: string[]; juniorTitleScore: number;
    juniorText: string[]; juniorTextScore: number;
    seniorTitle: string[]; seniorTitleScore: number;
    executiveTitle: string[]; executiveTitleScore: number; rejectExecutive: boolean;
    siteEntryScore: number; siteSeniorScore: number;
    years: { zeroToTwoScore: number; threeToFourScore: number; fiveToSixScore: number; sevenPlusScore: number; rejectFrom: number | null };
  };
  remote: { remoteText: string[]; hybridText: string[]; onsiteText: string[]; remoteScore: number; hybridScore: number; onsiteScore: number; unknownScore: number; rejectHybrid: boolean; rejectOnsite: boolean };
  eligibility: {
    serbia: string[]; serbiaScore: number;
    worldwide: string[]; worldwideScore: number;
    europe: string[]; europeScore: number;
    otherRegion: string[]; otherRegionScore: number; rejectOtherRegion: boolean;
    excludeText: string[]; excludeScore: number;
    unclearScore: number;
  };
  employment: {
    fullTimeText: string[]; fullTimeScore: number;
    partTimeText: string[]; partTimeScore: number;
    contractScore: number; freelanceScore: number; internshipScore: number; temporaryScore: number;
    unpaid: string[]; unpaidScore: number;
    commissionOnly: string[]; commissionOnlyScore: number;
  };
  language: { foreignLanguages: string; requiredPatterns: string[]; exceptions: string[]; score: number };
  timezone: { positive: string[]; positiveScore: number; negative: string[]; negativeScore: number };
  negatives: { title: RuleGroup[]; text: RuleGroup[] };
  positives: Array<{ id: string; label: string; score: number; patterns: string[]; badge?: string }>;
}

/** What scrape.ts hands to an adapter. */
export interface SearchCtx {
  since: Date;
  isSeen: (id: string) => boolean;
  log: (msg: string) => void;
}
