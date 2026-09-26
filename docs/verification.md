# Verification — first live runs (26–27.09.2026)

Machine: Windows 11, Node 22.16, curl.exe 8.12, home connection in Serbia, no browser. Method per source: `PSY_JOBS_DATA_DIR=<scratch> npm run scrape -- --only <source>`,
then the per-source line in `scraper.log`, 3–10 cards in `db.json` compared with the live page, and 5–10 hidden listings in `filtered.log` checked for the right reason.
Status: **WORKS** unchanged · **FIXED** code/config changed and now works · **NEEDS KEY** skips cleanly until a free key is configured · **DEAD** no keyless way.
Numbers are from the last clean run of that source (7-day baseline → `beforeBaseline` is the part of `found` older than a week).

## Source types

| Source | Status | found / accepted / lowScore / rejected / older | s | What was wrong → what changed |
|--------|--------|-------------------------------------------------|--:|-------------------------------|
| himalayas | FIXED | 509 / 75 / 20 / 64 / 345 | 107 | 500 ms spacing hit HTTP 429 on one query per pass and fetchText's 2 s/4 s retries stayed inside the limiter window (the query was silently lost) → 750 ms spacing + one 20 s cool-down retry; duplicate "health coach" query removed (134 queries); header comment corrected (`applicationLink` = listing, not employer link). |
| linkedin | FIXED | 236 / 37 / 3 / 193 / 0 | 168 | Node fetch → HTTP 429 on the first request, curl.exe with identical headers → 200 (TLS fingerprint). `http.ts`: a plain GET (no cookies/body/custom headers) answered 429/403 is retried once through curl.exe; on success the host stays on curl for the run; a curl 429 still stops the source. List (10 `<li>`/page) and detail parsing (description, seniority, employment, job function) verified. `f_WT=2` is not reliable ("… - Belgrade - On-site" came back as remote) → the matcher now reads office/hybrid words in the title too. |
| wwr | FIXED | 189 / 9 / 2 / 35 / 142 | 6 | `<region>` is "Anywhere in the World" on 98 % of items while `<country>` carries WWR's GeoLock list ("🇨🇦 Canada, 🇫🇮 Finland, and 🇺🇸 United States") – the adapter emitted both, so 8 US/CA-locked jobs scored +25 worldwide → locations = GeoLock countries (flags stripped) else region; whitespace in titles collapsed. |
| remoteok | FIXED | 742 / 4 / 0 / 10 / 728 | 22 | Tags `health`, `research`, `psychology`, `writing` are not in Remote OK's vocabulary (only the legal-notice element came back) → `healthcare`, `medical`, `data annotation`…; text fields are UTF-8 read as Latin-1 → repaired. Volume is ~15 new jobs/week site-wide. |
| workingnomads | FIXED | 704 / 8 / 8 / 592 / 93 | 10 | `api/exposed_jobs/` is a fixed ~50-item feed that ignores `category`, `limit`, `page` → primary source is now `jobsapi/_search?q=category_name:"<cat>" AND pub_date:[since TO now] AND expired:false` (the site's Elasticsearch, ~600 listings/week, `apply_url` = employer link); feed kept as fallback. |
| jobicy | FIXED | 267 / 19 / 8 / 43 / 195 | 24 | `industry=product` / `technical-writing` → HTTP 400 (slugs gone) → slugs validated via `?get=industries`; `count` accepts 1–200 (50 truncated marketing/tag queries); `tag=` is a substring search (`mental-health` matched 1 row, `mental health` 51); `geo=serbia` (`?get=locations`) drops single-country US rows; `salaryMin/Max/Period` replaced the old `annualSalary*` fields. |
| remotive | FIXED | 716 / 23 / 3 / 453 / 237 | 33 | Free API = 18-job sample, `search=` ignored → the site's instantsearch proxy `POST api/v2/jobs/search/` (index `remotive_unlimited`, 50/page, newest first, stops at the baseline) + ld+json detail pages for descriptions of unseen, non-rejected titles (`maxDetails`); id = numeric URL suffix so sample and hits dedup; a 429 stops the remaining queries. |
| arbeitnow | FIXED | 1100 / 16 / 129 / 952 / 0 | 17 | ~1 in 5 descriptions arrive entity-escaped and `htmlToText` stripped tags before decoding → decoded first; pagination via `links.next` (250 rows on pages 1–2, then 100); per-page try/catch; `remote` flag unreliable → location/tags consulted. Germany/UK on-site heavy: 113 hybrid + 194 location rejects are correct. |
| themuse | FIXED | 58 / 6 / 4 / 48 / 0 | 71 | `level=entry&level=mid` silently ignored (needs "Entry Level"/"Mid Level"); categories "Product", "HR" → 0 results (real names "Product Management", "Human Resources and Recruitment"); results unsorted so 3 of up to 20 pages missed most of the week → all pages read with a per-job date filter. |
| jobspresso | FIXED | 156 / 0 / 0 / 0 / 156 | 9 | Adapter read `job_listing_company` etc.; the feed uses namespaced `job_listing:company` / `:location` / `:job_category`, full text in `content:encoded` → fixed; `posts_per_page=20`; unfiltered newest page added because the keyword feed is relevance-sorted (2017 title matches first). Board posts 5–10 jobs/month; with a 2026-01-01 baseline 44 posts scored, all correctly hidden (US/Canada-only or engineering). |
| aijobs | FIXED | 608 / 1 / 2 / 72 / 533 | 72 | `aijobs.net/feed/` → 301 to foorilla.com (rebrand); foorilla has no RSS, `/api/v1/` is paid, export needs login → htmx fragments `GET /hiring/jobs/?job_search=<title substring>&page=N` (header `HX-Request: true`) + detail pages (`Published:` date, tasks, skills, `~Nyoe`, `[R]` remote tag) for unseen titles. Company is masked for anonymous visitors (`@ T...`) → unknown. Mostly US on-site academia/clinical → hidden by location (49 of 74). |
| hn | FIXED | 144 / 5 / 6 / 133 / 0 (1 Sept baseline) | 4 | First-line parsing rewritten: company / roles / locations / remote / employment classified per `|` part, job-seeker templates skipped, careers/ATS link preferred over the first link, `created_at` of the comment as date, paging stops at the baseline. On 27.09 all 62 remote postings were older than 7 days (thread of 1 Sept) – expected mid-month behaviour. |
| adzuna | NEEDS KEY | 0 / 0 / 0 / 0 / 0 | 0 | Skips with a clear note. Latent bugs fixed for when keys arrive: `ie` is not an Adzuna market (would have killed the run), predicted (Jobsworth) salaries are ignored, error bodies (401 AUTH_FAIL) reported. |
| eightyk | FIXED | 926 / 7 / 0 / 74 / 845 | 1 | Algolia appId/key/index still valid (974 hits) but the adapter's field names were guesses: no date field matched (everything looked new: 119 mostly months-old cards), no locations → real fields `post_pk`, `posted_at`/`closes_at` (unix), `card_locations`, `tags_country`, `tags_location_type`, `url_external`, `salary`, `description_short`; Funding/Course rows and closed roles skipped; probe in `check-sources.ts` used GET on the POST-only `/query` → fixed. |
| workablesearch | FIXED | 285 / 3 / 3 / 263 / 14 | 107 | `location=Remote` is not a filter the API understands (always `totalSize: 0`) → real parameters from the site's bundle: `workplace=remote&day_range=<1|7|30|0>&limit=20&pageToken`; real field names (`company.title`, `locations[]`, `workplace`, `employmentType`, `created`). 25 queries, 3 s spacing, no 1015. 238 of 285 remote hits are US state-licensed clinical roles → hidden by location (checked: correct). |
| hiringcafe | FIXED | 74 / 5 / 1 / 1 / 67 | 92 | `hiring.cafe` → 308 to hiringcafe.com; `POST /api/search-jobs` → 405. Now `GET /_next/data/<buildId>/index.json?searchState=…` (`buildId` from `__NEXT_DATA__`, refreshed on 404) with `workplaceTypes:["Remote"]`, `sortBy:"date"` and an explicit `user_country` RS + anywhere-in-Europe/world filter (otherwise the server injects the visitor's IP country); hits carry structured location/commitment/seniority/compensation; `GET /api/job-description?id=` for descriptions of fresh hits. 2.5 s / 400 ms spacing, 429/403 stops the pass. |
| eures | WORKS (low yield) | 886 / 0 / 0 / 417 / 469 | 104 | Keyword objects are AND-ed but words inside one string are OR-ed ("psychologist remote" = 105 000 hits) → one object per word; `publicationPeriod: LAST_MONTH`; `locationMap` → country names; detail profile gives employer, locations, salary, language requirements. Output is on-site / local-language public-employment postings → 191 location + 104 unrelated rejects, all correct; 0 kept is the honest result. |
| reliefweb | NEEDS KEY | 0 / 0 / 0 / 0 / 0 | 0 | v1 → HTTP 410 "decommissioned, use v2"; v2 → 403 `AccessDeniedHttpException` for every non-approved `appname` (policy since 1 Nov 2025; free form on apidoc.reliefweb.int/parameters#appname). Adapter moved to v2 with `config.json → reliefweb.appname`; without it the source skips with a note. Tried: several appnames, both UAs, `reliefweb.int/jobs/rss.xml` and the HTML river → HTTP 202 + AWS WAF JavaScript challenge. |
| jobrack | FIXED | 76 / 5 / 0 / 6 / 65 | 13 | Detail regex overran `div.job-description` and appended "Apply Now / company blurb / Share"; `&lsquo;`-style entities left in text; category `design` 302s to page 1 (`designer` exists) → fixed. 3 general pages cover a week. |
| wellfound | FIXED | 461 / 5 / 0 / 38 / 418 | 48 | Unknown role slugs (user-researcher, prompt-engineer, behavioral-scientist, conversation-designer…) 303-redirect to the generic remote page that Node follows silently, flooding the source with random engineering jobs → detected by the missing `pageProps.role` and skipped; 10 existing role paths kept; `yearsExperienceMin`, remote flag, locations verified. |
| rss | FIXED (14/26) | 874 / 89 / 104 / 430 / 217 | 25 | Per-feed table below. Remotive feed URL corrected; 12 dead feeds disabled. |
| greenhouse | FIXED (config) | 6743 / 8 / 14 / 561 / 6160 | 243 | 133 boards answer; 20 slugs 404 → variants probed, disabled (list in SOURCES.md). HTML-escaped `content` decoded, `location.name` + offices → locations. |
| lever | FIXED (config) | 1000 / 3 / 0 / 50 / 947 | 85 | 47 boards answer (EU host fallback works); 10 slugs 404 on both hosts → disabled. |
| ashby | FIXED (config) | 4186 / 5 / 2 / 339 / 3839 | 118 | 106 boards answer; 8 slugs 404 → disabled. `isRemote`, `location`, `compensation` verified. |
| workable (ATS) | FIXED (config) | 1400 / 8 / 29 / 188 / 1170 | 40 | 45 accounts answer; ifeel 404 → disabled. |
| smartrecruiters | WORKS | 1170 / 0 / 0 / 254 / 916 | 43 | 21 tenants answer; details per relevant new posting. |
| recruitee | WORKS | 16 / 0 / 0 / 2 / 14 | 3 | 4 tenants answer. |
| personio | FIXED (config) | 3 / 0 / 0 / 0 / 3 | 9 | 3 tenants answer; quantilope, selfapy redirect to personio.com (accounts gone) → disabled. |
| bamboohr | FIXED (config) | 38 / 1 / 1 / 36 / 0 | 32 | 15 tenants answer; InMoment 401 (private), Logically returns the BambooHR marketing page (not a tenant) → disabled. |
| workday | FIXED | 2442 / 7 / 147 / 469 / 1815 | 201 | Only the first page carries `total`; later pages omit it, so paging stopped at 40 per tenant → remembered from page 1 (833 → 2442 postings, Cigna and Thriveworks hit the 400 cap). |
| teamtailor | FIXED (config) | 29 / 0 / 0 / 0 / 29 | 15 | Askable, Paradox answer; lingoda, palta 404 → disabled. |

`ats.ts`: a 404 / unknown host no longer counts towards the per-kind circuit breaker (8 wrong slugs in a row used to abort the whole ATS kind).

## RSS / Atom feeds

| Feed | Status | Items | Evidence |
|------|--------|------:|----------|
| NoDesk | WORKS | 10 | |
| EU Remote Jobs | WORKS | 50 | |
| EU Remote Jobs (Worldwide) | DEAD | 0 | region feed: `application/rss+xml` header, HTML home page body; `?feed=job_feed&job_region=worldwide` and `/job-region/worldwide/feed/` same |
| Real Work From Anywhere | WORKS | 142 | |
| JobsCollider (writing / project management / human resources / design) | WORKS | 100 each | |
| JobsCollider (all others) | DEAD | – | HTTP 404; `remote-other-jobs.rss` 404 (customer-service feed exists but is off-topic) |
| RemoteFirstJobs | DEAD | – | `/rss` HTML; `/feed`, `/rss.xml`, `/jobs.rss` 404 |
| Remote.co (healthcare / HR / writing) | DEAD | – | HTTP 403 (Node) / timeout (curl) – Cloudflare |
| Empllo | WORKS | 100 | |
| Authentic Jobs | WORKS | 10 | |
| GameJobs.co (Atom) | WORKS | 100 | |
| Games-Career | WORKS | 6 | |
| APA PsycCareers | DEAD | – | NOINDEX HTML bot-challenge page on every RSS URL |
| jobs.ac.uk (behavioural science / digital mental health) | DEAD | – | `/search/rss` returns HTML; `/search/rss/` 500; `/feeds/rss` 404 |
| THE unijobs (psychology) | WORKS | 20 | |
| BPS Jobs | DEAD | – | `jobs.bps.org.uk` does not resolve |
| CharityJob (mental health) | DEAD | – | `/jobs/rss` returns the HTML search page; `/rss/jobs` 404 |
| Guardian Jobs (wellbeing) | WORKS | 20 | |
| Remotive RSS | FIXED | 17 | `/remote-jobs/rss-feed` → HTML; `/remote-jobs/feed` is the live feed |
| SkipTheDrive | DEAD | – | `/feed/` HTML home page; `?feed=job_feed` 404 |

## Career pages

463 configured → probe: 397 answered, 51 failed (36 × 404, 2 × 429, 410, 401, rate limits). After probing name-derived slug variants for every 404 (none exists) and
re-checking the 429s: **403 enabled, 60 disabled** (45 in this pass + 15 low-confidence slugs from the research pass). The ten ATS sources parse
**~17 000 open positions per pass** (greenhouse 6743, ashby 4186, workday 2442, workable 1400, smartrecruiters 1170, lever 1000, bamboohr 38, teamtailor 29, recruitee 16, personio 3).

## Matcher changes from the same runs

`rules.json` (+ small `score.ts` hooks), 12 new fixtures in `src/test-score.ts` (57/57): paid volunteer time ≠ unpaid, "Volunteering" role type = unpaid;
AMER/Americas and ~30 missing countries + US "City ST 12345" in `otherRegion`; "Anywhere in US" = US and "Anywhere in Europe" = Europe (`eligibility.worldwideWeak`);
"Assistant to the CEO" / "HR Business Partner" are not executives; "Engineering Manager" is a software role, "Curriculum Developer" is not; field-service
technicians, merchant services, product sourcing rejected; soft −15 for US-employer boilerplate (401(k), E-Verify, veteran status); generic perk words
(clients, culture, benefits, workshops, players, wellness, stress, brands, needs…) need their psychology/health context before they build a job family;
ads in another language detected by stop-word density; "remote areas" is not remote work; "- On-site" in a title counts even when the site's remote filter says otherwise.

## Full pass (`npm run scrape:force`, 27.09.2026 00:40–01:04, fresh scratch DB)

**24 min 23 s** for all 31 sources, 0 errors, ~25 000 listings parsed → **288 cards** (148 excellent / 76 good / 64 possible); 7-day baseline.
Per-source durations (s): workday 200 · linkedin 166 · himalayas 108 · eures 106 · workablesearch 104 · greenhouse 102 · hiringcafe 91 · themuse 70 · aijobs 69 · ashby 62 ·
lever 53 · wellfound 47 · smartrecruiters 42 · remotive 39 · workable 33 · arbeitnow 25 · rss 24 · jobicy 24 · remoteok 22 · bamboohr 21 · workingnomads 14 · jobrack 12 ·
jobspresso 9 · wwr 6 · teamtailor 5 · recruitee 2 · personio 2 · eightyk 1 · hn 1 · adzuna 0 · reliefweb 0.
Accepted per source: rss 88 · himalayas 63 · linkedin 36 · remotive 21 · arbeitnow 15 · jobicy 11 · wwr 8 · workday 7 · greenhouse 5 · hiringcafe 5 · wellfound 5 ·
workingnomads 4 · jobrack 4 · eightyk 4 · themuse 2 · remoteok 2 · lever 2 · ashby 2 · workable 1 · aijobs 1 · workablesearch 1 · bamboohr 1 · the rest 0
(EURES / SmartRecruiters / Recruitee / Personio / Teamtailor / Jobspresso / HN parsed fine but had nothing new and eligible inside the week).
The scheduled task runs every 15 min with per-source rhythms (`everyMin`), so a normal incremental pass is a few minutes; only the first pass after install
(or `--force`) takes the full ~25 min. Nothing exceeded the 30-minute budget, so no `everyMin` was lengthened.
