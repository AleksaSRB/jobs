# Sources — what is wired, how each is read, and what was tried

Legend: ✅ adapter ported from `job-scrapper2` and verified there on 19.09.2026 (IP in Serbia, no browser) · 🆕 new adapter written from the
site's public API contract (26.09.2026) — run `npm run check` on the scraping machine to confirm each one answers from your network ·
🔑 needs a free key/URL in `config.json` · ❌ not scrapeable without a browser/login.

> The development container that built this project had **no outbound network to job sites** (egress proxy), so the 🆕 adapters
> could not be exercised live there. They follow the documented public endpoints and fail softly (one bad source or company never breaks the pass).
> First thing to do on the target PC: `npm run check` (and `npm run check -- --careers` to validate every career-page slug).

## Job boards & aggregators

| # | Source | Status | How it is read | Notes |
|---|--------|:------:|----------------|-------|
| 1 | **Himalayas** | ✅ | `GET himalayas.app/jobs/api/search?q=<query>&country=RS&sort=recent&page=N` (20/page) | `country=RS` = applicable from Serbia (includes worldwide) → `locationVerified`. `applicationLink` = employer link. ~120 domain queries × 2 pages. Main source. |
| 2 | **LinkedIn Jobs** | ✅ | guest API `jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=…&location=Serbia&f_WT=2&f_TPR=r<sec>&start=N` + `jobPosting/<id>` details | Two sets: `location=Serbia` (verified) and `location=European Union` + entry/associate (`f_E=2,3`). Rate limit 429 stops the source for that pass; details only for unseen titles that pass `worthDetail`. |
| 3 | **We Work Remotely** | ✅ | RSS `categories/<feed>.rss` | product, design, management & finance, customer support, sales & marketing, all-other. `<region>` = Anywhere in the World / Europe Only / USA Only. |
| 4 | **Remote OK** | ✅ | JSON `remoteok.com/api` + `?tags=<tag>` | Element 0 is a legal notice. Tags: healthcare, medical, ux, content, copywriting, non tech, ai, product, hr, education, teaching, design, data annotation. Unknown tags (research, psychology, mental health…) return 0 rows; health ≡ healthcare, writing ≡ content. Site-wide volume ~15 jobs/week, so plain `/api` already covers the 7-day baseline. Text fields are UTF-8-as-Latin-1 double-encoded → adapter repairs them. |
| 5 | **Working Nomads** | ✅ | JSON `workingnomads.com/jobsapi/_search?q=category_name:"<cat>" AND pub_date:[<since> TO now] AND expired:false&size=300&sort=pub_date:desc` (site's own Elasticsearch index, GET + Lucene query string) + `api/exposed_jobs/` feed as fallback | One request per category: Design, Writing, Management, Healthcare, Education, Human Resources, Consulting, Marketing, Legal (~600 listings/week together). Index docs carry `locations[]`, `apply_url` (employer ATS page → card link), `position_type`, `experience_level`, `salary_range`. The documented `exposed_jobs` feed is only ~50 newest across ALL categories (filter/paging params ignored; typically 0 rows for Healthcare/Design/HR) – kept merged in as a fallback. |
| 6 | **Jobicy** | ✅ | JSON `jobicy.com/api/v2/remote-jobs?count=50&industry=<slug>&geo=serbia` (and `&tag=<x>&geo=serbia`) | Industry must be a slug from `?get=industries` (hr, management = "Product & Operations", copywriting = "Content & Editorial", design-multimedia, web-app-design, business, supporting, marketing, healthcare…; `product` / `technical-writing` no longer exist → HTTP 400, adapter validates slugs first). `count` is capped at 50 and half the unfiltered feed is US-only, so `geo=serbia` (a `?get=locations` slug: jobGeo Anywhere / Europe / EMEA and combinations) keeps the cap for eligible rows. Salary now in `salaryMin/Max/Currency/Period`. |
| 7 | **Remotive** | ✅ | JSON `remotive.com/api/remote-jobs?limit=100` | Free API is a sample (~16 jobs, 24 h delay) → every 6 h. |
| 8 | **JobRack** | ✅ | SSR HTML `jobrack.eu/jobs?page=N`, `/jobs/category/<content-writer|project-manager|design|support>` + detail | Remote roles for Eastern Europe → Serbia eligible. Mostly assistant/ops; matcher filters. |
| 9 | **Wellfound** | ✅ | SSR `__NEXT_DATA__` on `/role/r/<role>` (20/page, sorted by relevance) | Role slugs that do not exist return 303 and are skipped (ux-researcher, product-manager, prompt-engineer are known to exist; the rest are tried). Historically behind DataDome → may 403. |
| 10 | **Arbeitnow** | 🆕 | JSON `arbeitnow.com/api/job-board-api?page=N` (free, no key) | Europe/Germany-heavy, newest first, `remote` flag, `job_types`, tags. |
| 11 | **The Muse** | ✅ | JSON `themuse.com/api/public/jobs?page=N&category=…&level=Entry%20Level&level=Mid%20Level&location=Flexible%20%2F%20Remote` | Public API, 500 req/h without key; `page` 0-based (max 99), 20/page, results not sorted by date → all pages read, date filter per job. Categories used (names from themuse.com/developers/api/v2): Design and UX, Product Management, Healthcare, Social Services, Writing and Editing, Human Resources and Recruitment, Data and Analytics, Project Management, Education, Science and Engineering, Media/PR/Communications – an unknown category name silently returns 0 results; `level` needs the full name ("entry" is silently ignored). Mostly US companies → eligibility rules decide. |
| 12 | **Jobspresso** | ✅ | WP Job Manager RSS `jobspresso.co/?feed=job_feed&search_keywords=<q>&posts_per_page=20` | Curated remote board, slow (~5–10 new posts a month), mostly US/Canada companies → eligibility rules decide. `search_keywords` really filters (unknown word → 0 items), `posts_per_page` is honoured (default 10). Fields are namespaced: `job_listing:company`, `job_listing:location` ("United States, Canada", "Anywhere in US" → normalised to "US"), `job_listing:job_category` = employment (Full Time/Part Time/Contract/Freelance), `job_listing:job_type` = site category (Design, Writing, AI & Data…) → tags; full text in `content:encoded`, logo in `media:content`. An empty query `""` lists the whole board. |
| 13 | **aijobs.net → foorilla.com** | 🆕 | HTML fragment `foorilla.com/hiring/jobs/?job_search=<q>&page=N` with header `HX-Request: true` (+ `/hiring/jobs/<slug>-<id>/` details) | aijobs.net was rebranded to foorilla (26.09.2026: `aijobs.net/feed/` → 301, no RSS on foorilla, `/api/v1/` needs a paid PRO+ key, CSV/JSON export needs a login). `job_search` is a case-insensitive title substring, 50 per page, newest first; the board is now a general tech aggregator (~240k jobs/60 d) so `aijobs.queries` are narrow substrings. Company name is masked for anonymous visitors (`@ T...`) → company unknown. |
| 14 | **Hacker News “Who is hiring”** | 🆕 | Algolia `hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring` → `tags=comment,story_<id>` | Monthly thread; only top-level comments containing “remote”; first line → company / role. Startups that never post to boards. |
| 15 | **Adzuna** | 🆕🔑 | `api.adzuna.com/v1/api/jobs/<gb|de|nl|pl|at>/search/1?what=<q>&sort_by=date&max_days_old=…` | Free developer key (developer.adzuna.com). Skipped with a note until `adzuna.appId/appKey` are set. Only the API's 19 markets (gb us at au be br ca ch de es fr in it mx nl nz pl sg za) – no `ie`; Adzuna's predicted (Jobsworth) salaries are ignored. |
| 16 | **80,000 Hours job board** | 🆕 | see row 21 (Algolia); `config.json → eightyk.url` is only an optional override | Leave `eightyk.url` empty – the adapter reads the public Algolia index directly. The override still accepts `{ hits: [] }`, Airtable `records[].fields` and plain arrays. |

## New keyless APIs found by the research pass (26.09.2026)

| # | Source | Status | How it is read | Notes |
|---|--------|:------:|----------------|-------|
| 17 | **Workable global search** | 🆕 | `GET jobs.workable.com/api/v1/jobs?query=<q>&workplace=remote&day_range=7&limit=20[&pageToken=<nextPageToken>]` | Searches every public Workable employer at once (thousands of SMBs; UK/EU health, coaching, L&D, research agencies). Same call as the jobs.workable.com/search SPA: filters are `workplace=on_site\|hybrid\|remote`, `day_range=1\|7\|30\|0` (not `location=Remote`, which returns 0); `limit` max 20. Fields: `id`, `title`, `url`, `company.title`, `locations[]` (`TELECOMMUTE` + "City, Region, Country"), `workplace`, `employmentType`, `description`/`requirementsSection`/`benefitsSection` (HTML), `created`. Cloudflare 1015 on bursts → 3 s spacing. 25 domain queries. |
| 18 | **hiring.cafe** | 🆕 | `POST hiring.cafe/api/search-jobs` `{size, page, searchState:{searchQuery, workplaceTypes:["Remote"]}}` | Unofficial API (used by RSSHub and several 2025-26 scrapers); indexes company ATS postings worldwide with structured remote filters – best place for unusual titles. May 429/403 datacenter IPs; 2.5 s spacing, breaker. |
| 19 | **EURES** | 🆕 | `POST europa.eu/eures/api/jv-searchengine/public/jv-search/search` + detail `GET …/jv/id/<id>` | All EU/EEA public employment services; keyless; no remote flag → keywords include "remote". Mostly on-site → matcher rejects by location. |
| 20 | **ReliefWeb Jobs** | 🆕 | `GET api.reliefweb.int/v1/jobs?appname=…&profile=full&query[value]=<lucene>` | Official UN OCHA API; MHPSS advisers, psychologists, staff well-being, social & behaviour change specialists, research consultancies; many remote consultancies. |
| 21 | **80,000 Hours** | ✅ | `POST <appId>-dsn.algolia.net/1/indexes/jobs_prod/query` `{"query":"","hitsPerPage":1000,"page":0}` with the site's search-only key (in `config.json → eightyk`; verified 26.09.2026, ~970 hits) | Whole board in one call. Hit fields: `post_pk`/`objectID`, `title`, `description_short` (HTML bullets; `description` is empty), `company_name`, `company_description`, `url_external` (employer link), `posted_at`/`closes_at` (unix s), `card_locations[]`, `tags_country[]`, `tags_location_type[]` (`Remote`), `tags_role_type[]`, `tags_exp_required[]`, `experience_min`, `salary` (text), `tags_area[]`, `tags_skill[]`. Permalink `jobs.80000hours.org/?jobPk=<post_pk>`. Funding/Course rows and past-`closes_at` rows are skipped. Key rotates → copy `algoliaApiKey` from the page HTML into `eightyk`. |
| 22 | **26 RSS / Atom boards** | 🆕 | generic adapter `src/sources/rss.ts`, feeds in `config.json → rss.feeds` | NoDesk, EU Remote Jobs (+ worldwide region feed), Real Work From Anywhere (no-country-restriction roles only – ideal for Serbia), JobsCollider (writing / PM / HR / design / other), RemoteFirstJobs, Remote.co (healthcare / HR / writing), Empllo, Authentic Jobs, GameJobs.co (Atom), Games-Career, APA PsycCareers, jobs.ac.uk ×2, THE unijobs, BPS Jobs, CharityJob, Guardian Jobs, Remotive RSS, SkipTheDrive. Each feed fails independently; the card shows the board name. |
| 23 | **Teamtailor career sites** | 🆕 | `GET <sub>.teamtailor.com/jobs.json` (JSON Feed) – 10th ATS kind | Nordic/UK/EU employers (Askable, Paradox Interactive, Zing Coach…). Lever EU tenants (`api.eu.lever.co`) and Personio `.com` hosts are handled as fallbacks. |
| — | Jobicy `tag=` + `geo=` / Remotive `search=` | 🆕 | extra query parameters on the existing adapters | Jobicy tags psychology, mental-health, ux-research, coaching… (free text; unknown tag = 200 with 0 rows) and `geo=serbia` on every query; Remotive keyword searches on top of the free sample. |

Catalogued but **not wired** (needs a key, a referer trick, or is low relevance): Welcome to the Jungle (Algolia with referer allow-list), Reed (UK key), Jooble (key + Cloudflare), Careerjet (affiliate id), Landing.jobs, The Hub, Torre, Braintrust, Built In API, Reddit hiring threads, Getro/Consider VC boards, Inside Higher Ed / Chronicle / HERC / HigherEdJobs (US on-site academia). Full table with endpoints: [careers.md](careers.md#job-boards-catalogued-during-the-research-168).

## Company career pages (ATS public APIs)

The biggest recall win for this niche: the companies that hire psychologists, behavioral scientists, coaches, T&S analysts and conversation
designers are known, and their career pages expose key-less JSON:

| ATS | Endpoint | Notes |
|-----|----------|-------|
| Greenhouse | `boards-api.greenhouse.io/v1/boards/<token>/jobs?content=true` | full HTML content, `location.name`, `first_published`/`updated_at` |
| Lever | `api.lever.co/v0/postings/<site>?mode=json` | `workplaceType` remote/hybrid/onsite, `categories.commitment`, `salaryRange` |
| Ashby | `api.ashbyhq.com/posting-api/job-board/<org>?includeCompensation=true` | `isRemote`, `employmentType`, `compensation.summaryComponents` |
| Workable | `apply.workable.com/api/v1/widget/accounts/<account>?details=true` | `workplace`/`telecommuting`, `experience`, description + requirements + benefits |
| SmartRecruiters | `api.smartrecruiters.com/v1/companies/<id>/postings?limit=100` + `/postings/<id>` | detail request per new relevant posting (`careersMaxDetails`) |
| Recruitee | `<sub>.recruitee.com/api/offers/` | `remote`/`hybrid`/`on_site`, `employment_type_code`, `salary` |
| Personio | `<sub>.jobs.personio.de/xml` | XML feed; `schedule`, `employmentType`, `seniority`, `yearsOfExperience` |
| BambooHR | `<sub>.bamboohr.com/careers/list` + `/careers/<id>/detail` | `isRemote`, `employmentStatusLabel`; detail per new relevant posting |
| Workday | `POST <tenant>.wd<n>.myworkdayjobs.com/wday/cxs/<tenant>/<site>/jobs` + detail GET | slug = `tenant|wd5|Site`; `locationsText`, `postedOn` (“Posted 3 Days Ago”), `timeType`, `remoteType` |
| Teamtailor | `<sub>.teamtailor.com/jobs.json` (JSON Feed 1.1) | `_teamtailor.remote_status`, `employment_type`; slug may be a full custom career-site host |

Companies are listed in `config.json → careers` as `{ "name", "ats", "slug", "tags": ["mental-health"] }` (tags are added to every job of that
company so industry signals fire even for terse listings). ~460 companies: 348 slugs found verbatim in public ATS tenant directories, 31 corrected from
those directories, 28 discovered there by domain keyword, 56 from research memory only (low-confidence ones disabled). Wrong slugs only log `HTTP 404`
for that company. Full list with status and notes: [careers.md](careers.md).

## Tried and not usable without a browser / login

| Site | Why not |
|------|---------|
| Indeed, Glassdoor, FlexJobs, ZipRecruiter, SimplyHired | anti-bot / login walls; no public API. |
| Jobgether | Astro SPA, no public JSON. |
| Otta / Welcome to the Jungle, Built In | anti-bot (Cloudflare/DataDome), login for details. |
| Upwork, Toptal, Contra | Cloudflare challenge; official APIs need an account/key and are not job boards for employees. |
| EU Remote Jobs | feed returns HTML. |
| Remote Rocketship, RemoteYeah | client-rendered, no stable JSON. |
| Jooble API | key-based and the API endpoint itself sat behind a Cloudflare challenge from Serbia (24.09.2026, job-scrapper). |
| Joberty, HelloWorld | Serbian IT-only boards (HelloWorld shares the Infostud database). |

## Per-source log line

Every pass logs one line per source (also visible in the UI under “last check”):

```
[2026-09-26 12:22:46] himalayas: found=812 accepted=23 duplicates=4 lowScore=610 rejected=175 beforeBaseline=0 duration=97s
```

`found` = listings parsed, `accepted` = new cards, `lowScore` = below `minScore`, `rejected` = hard rejects (US-only, hybrid, director,
technical, license when configured…), all with reasons in `data/filtered.log`.
