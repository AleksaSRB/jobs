# SOURCES — everything tried, and whether it runs from this machine

Live verification on **26–27.09.2026** from a Windows 11 PC on a home connection in Serbia (Node 22.16, curl.exe 8.12, no browser, no paid keys).
Every source was run on its own with `PSY_JOBS_DATA_DIR=<scratch> npm run scrape -- --only <source>`; "found / accepted" are the numbers of that
run (7-day baseline, so most of "found" is older than a week or hidden by the matcher for a documented reason – see `data/filtered.log`).
Details per source (what was wrong, what changed, what was tried for the dead ones): [docs/verification.md](docs/verification.md).

**Totals:** 31 source types → **29 running** (2 of them low-yield by nature), **2 need a free key** (Adzuna, ReliefWeb), 0 dead adapters ·
RSS adapter: **14 of 26 feeds running**, 12 dead (feeds removed / blocked by the sites) · career pages: **403 of 463 enabled**, 60 disabled (wrong or private
slugs), ~17 000 open positions parsed per pass.

## Job boards / aggregators / APIs (21 source types)

| Source | Status | Last run (found / accepted / s) | Outcome |
|--------|--------|--------------------------------:|---------|
| Himalayas | ✅ RUNNING | 509 / 75 / 107 | Rate limit (429) at 500 ms spacing lost one query per pass → 750 ms + one 20 s cool-down retry; duplicate query removed. Main source. |
| LinkedIn Jobs | ✅ RUNNING | 236 / 37 / 168 | Node's TLS fingerprint got HTTP 429 on the first request while curl.exe got 200 → plain GETs answered 429/403 now retry once through curl.exe (host stays on curl for the run). |
| We Work Remotely | ✅ RUNNING | 189 / 9 / 6 | `<country>` is WWR's GeoLock list, not a second location: US/CA-locked jobs were passing as "Anywhere in the World" → fixed. |
| Remote OK | ✅ RUNNING | 742 / 4 / 22 | Tags `health`, `research`, `psychology`, `writing` do not exist (0 rows) → replaced by real ones; double-encoded UTF-8 repaired. Low volume board (~15 jobs/week site-wide). |
| Working Nomads | ✅ RUNNING | 704 / 8 / 10 | Documented feed ignores every filter and holds ~50 items → now the site's own search index per category (`jobsapi/_search`), feed kept as fallback. |
| Jobicy | ✅ RUNNING | 267 / 19 / 24 | `product`/`technical-writing` industries no longer exist (HTTP 400); `count` is 1–200 not 50; tags are substring searches; `geo=serbia` added. |
| Remotive | ✅ RUNNING | 716 / 23 / 33 | Free API is an 18-job sample and ignores `search=` → the site's own search proxy (`api/v2/jobs/search/`) + detail pages for descriptions. |
| Arbeitnow | ✅ RUNNING | 1100 / 16 / 17 | ~20 % of descriptions arrive entity-escaped and were stripped to junk; pagination now follows `links.next`; unreliable `remote` flag backed by location/tags. Germany-heavy, mostly on-site → rejected by location. |
| The Muse | ✅ RUNNING | 58 / 6 / 71 | `level=entry` short names were silently ignored, 3 category names wrong (0 results), only 3 of ≤ 20 unsorted pages read → all fixed. Mostly US companies. |
| Jobspresso | ✅ RUNNING (slow board) | 156 / 0 / 9 | Adapter read non-namespaced tags → real `job_listing:*` fields; unfiltered newest page added (search feed is relevance-sorted). Board posts 5–10 jobs a month, newest 29.08 → nothing inside 7 days. |
| aijobs.net → foorilla.com | ✅ RUNNING (renamed) | 608 / 1 / 72 | aijobs.net is a 301 to foorilla.com; no RSS any more, API paid → htmx list fragments by title substring + detail pages. Company names are masked for anonymous visitors. |
| Hacker News "Who is hiring" | ✅ RUNNING (monthly) | 144 / 5 / 4 (1 Sept baseline) | Thread of the month found; header line parsed into company / role / locations / remote / employment; careers link preferred. On 27.09 all 62 remote postings were older than the 7-day baseline (thread posted 1 Sept). |
| Adzuna | 🔑 NEEDS KEY | 0 / 0 / 0 | Skips cleanly until `config.json → adzuna.appId/appKey` (free at developer.adzuna.com). Invalid `ie` market removed, predicted salaries ignored. |
| 80,000 Hours | ✅ RUNNING | 926 / 7 / 1 | Algolia credentials still valid (974 hits); hit field names were wrong (no dates → everything looked new, no locations) → fixed. |
| Workable global search | ✅ RUNNING | 285 / 3 / 107 | `location=Remote` returns 0 → real parameters `workplace=remote&day_range=7`; real field names. Remote pool is dominated by US state-licensed clinical roles → hidden for the right reasons. |
| hiring.cafe | ✅ RUNNING (moved) | 74 / 5 / 92 | Site moved to hiringcafe.com, old POST API answers 405 → Next.js SSR data route with an explicit Serbia/Europe/worldwide location filter + description API. |
| EURES | ✅ RUNNING (low yield) | 886 / 0 / 104 | Search body fixed (one keyword object per word, otherwise OR); detail profile parsed. EU public employment services are on-site and local-language → 417 rejected by location/language, 0 kept – expected. |
| ReliefWeb | 🔑 NEEDS KEY | 0 / 0 / 0 | API v1 is decommissioned (410); v2 only serves an `appname` pre-approved by ReliefWeb (free form, apidoc.reliefweb.int/parameters#appname), any other string → 403. Adapter is on v2 and skips until `reliefweb.appname` is set. No keyless fallback (site + RSS are behind an AWS WAF JS challenge). |
| JobRack | ✅ RUNNING | 76 / 5 / 13 | Detail text swallowed the Apply button and company sidebar; typographic entities; category `design` → `designer`. |
| Wellfound | ✅ RUNNING | 461 / 5 / 48 | Unknown role slugs 303-redirect to a random engineering page (Node follows silently) → detected and skipped; 10 real role paths kept. |
| 26 RSS / Atom boards | ⚠️ 14 / 26 FEEDS | 874 / 89 / 25 | See the feed table below. |

## RSS / Atom feeds (generic adapter, `config.json → rss.feeds`)

| Feed | Status | Reason |
|------|--------|--------|
| NoDesk, EU Remote Jobs, Real Work From Anywhere, JobsCollider (writing / project management / human resources / design), Empllo, Authentic Jobs, GameJobs.co (Atom), Games-Career, THE unijobs (psychology), Guardian Jobs (wellbeing) | ✅ RUNNING | 6–142 items each, sane title / company / link / date. |
| Remotive RSS | ✅ FIXED | `/remote-jobs/rss-feed` now returns HTML → `/remote-jobs/feed` (17 items). |
| Remote.co ×3 (healthcare, HR, writing) | ❌ NOT RUNNING | HTTP 403 / timeout – Cloudflare blocks Node and curl alike. |
| BPS Jobs | ❌ NOT RUNNING | `jobs.bps.org.uk` no longer resolves (DNS). |
| JobsCollider (all others) | ❌ NOT RUNNING | HTTP 404 – the category feed was removed (`remote-other-jobs.rss` also 404). |
| RemoteFirstJobs | ❌ NOT RUNNING | `/rss`, `/feed`, `/rss.xml`, `/jobs.rss` all return HTML / 404. |
| SkipTheDrive | ❌ NOT RUNNING | `/feed/` and the job-feed variants return the HTML home page. |
| jobs.ac.uk ×2 | ❌ NOT RUNNING | `/search/rss` returns HTML (500 on the variant) – RSS search was removed. |
| CharityJob (mental health) | ❌ NOT RUNNING | `/jobs/rss` returns the HTML search page. |
| APA PsycCareers | ❌ NOT RUNNING | Bot wall: every RSS URL returns a NOINDEX HTML challenge page. |
| EU Remote Jobs (worldwide region) | ❌ NOT RUNNING | Region feed answers `application/rss+xml` but the body is the HTML home page (main EU Remote Jobs feed works). |

## Company career pages (10 ATS kinds, 463 companies configured)

Every configured slug was probed once (`npm run check -- --careers`: 397 answered, 51 failed) and then each ATS kind was scraped in full.

| ATS | Enabled / disabled | Open positions parsed | Accepted | Duration | Notes |
|-----|-------------------:|----------------------:|---------:|---------:|-------|
| Greenhouse | 133 / 24 | 6743 | 8 | 243 s | 20 slugs 404 (Ada, Aisera, Alma, Attest, Calibrate, Cerebral, Eleanor Health, Fantastic Pixel Castle, Forethought, Google DeepMind, Grow Therapy, Hinge, Koa Health, LetsGetChecked, Moveworks, NOCD, Noom, SoundHound, User Interviews, Volley) – name-derived slug variants probed, none exists → disabled. |
| Ashby | 106 / 9 | 4186 | 5 | 118 s | 8 slugs 404 (Latitude, Playgig, Regression Games, Suzy, Synthflow, Textio, Whatnot, Woebot Health) → disabled. |
| Lever | 47 / 11 | 1000 | 3 | 85 s | 10 slugs 404 on both api.lever.co and api.eu.lever.co (Cogito, Gobrightside, Gupshup, Haptik, Luzia, Lyra Collective, Mahana, Medallia, Mountaintop, Respondent) → disabled. |
| Workable | 45 / 3 | 1400 | 8 | 40 s | ifeel 404 → disabled. |
| Workday | 27 / 2 | 2442 | 7 | 201 s | Paging stopped at 40 per tenant (`total` only on page 1) → fixed (833 → 2442 postings). |
| SmartRecruiters | 21 / 0 | 1170 | 0 | 43 s | All tenants answer; details per relevant posting. |
| BambooHR | 15 / 2 | 38 | 1 | 32 s | InMoment 401 (private board), Logically not on BambooHR → disabled. |
| Recruitee | 4 / 1 | 16 | 0 | 3 s | – |
| Personio | 3 / 6 | 3 | 0 | 9 s | quantilope, selfapy redirect to personio.com (tenants gone) → disabled. |
| Teamtailor | 2 / 2 | 29 | 0 | 15 s | lingoda, palta 404 → disabled. |

15 further companies were already disabled by the research pass (low-confidence slugs). Wrong slugs never break a pass (a 404 no longer counts towards the per-kind circuit breaker).

## Tried and not scrapeable (no adapter)

| Site | Why |
|------|-----|
| Indeed, Glassdoor, FlexJobs, ZipRecruiter, SimplyHired | anti-bot / login walls, no public API |
| Otta / Welcome to the Jungle, Built In, Jooble | Cloudflare / DataDome challenges (WTTJ Algolia needs a referer allow-list) |
| Jobgether, Remote Rocketship, RemoteYeah | client-rendered SPAs without a stable JSON endpoint |
| Upwork, Toptal, Contra | Cloudflare; official APIs need an account and are not employee job boards |
| Remote.co, APA PsycCareers, BPS Jobs, jobs.ac.uk RSS, CharityJob RSS, SkipTheDrive, RemoteFirstJobs | feeds removed or blocked (see the feed table) |
| Joberty, HelloWorld | Serbian IT-only boards |
| Reed, Careerjet, Landing.jobs, The Hub, Torre, Braintrust, Built In API, Reddit hiring threads, Getro/Consider VC boards | catalogued in [docs/careers.md](docs/careers.md), need a key / referer trick or are low relevance – not wired |
