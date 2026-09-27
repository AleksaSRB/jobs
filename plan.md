# Plan & status

Goal (docs/brief.md): the same scraper product as `job-scrapper2`, on **localhost:3008**, for fully remote psychology / health-tech / AI-safety
roles applicable from Serbia, with a semantic (not title-only) matcher and **as many job sources as possible**.

## Batch 1 — done (26.09.2026)

- [x] Project scaffold on the `job-scrapper2` architecture (TypeScript, Node ≥ 22.6, zero dependencies, `data/db.json`, scheduled tasks, port 3008, `PSY_JOBS_*` env vars)
- [x] Central taxonomy in `rules.json`: 18 job families (A–R from the brief) with title variants **and** description concepts, 11 industry signal groups,
      92 concept badges, adjacent titles, license extraction rules, education, seniority/years, remote/hybrid, eligibility from Serbia, employment,
      other-language, time zone, hard negatives (engineering, medical, finance/legal, sales, MLM…), positives (psychology background, sensitive users, hires globally…)
- [x] `score.ts` weighted matcher: primary/secondary family, gated generic titles (PM / UXR / writer / recruiter need industry context), purely-technical detection,
      license requirement (`none | preferred | required | unclear`), eligibility, seniority level, warnings, match/negative reasons — all inspectable on the card
- [x] 9 proven adapters ported unchanged (Himalayas, LinkedIn, WWR, Remote OK, Working Nomads, JobRack, Wellfound, Jobicy, Remotive) with domain queries/feeds
- [x] 12 new board/API adapters: Arbeitnow, The Muse, Jobspresso, aijobs.net, Hacker News “Who is hiring”, Adzuna (key), 80,000 Hours (Algolia index), Workable global search, hiring.cafe, EURES, ReliefWeb, generic RSS/Atom (26 feeds)
- [x] 10 ATS adapters for company career pages: Greenhouse, Lever (+EU host), Ashby, Workable, SmartRecruiters, Recruitee, Personio (.de/.com), BambooHR, Workday, Teamtailor
- [x] Circuit breaker per source (a dead site costs seconds, not hours); one broken source never stops the pass
- [x] UI in English: tabs, search, source/category filters, Serbia/Worldwide, fully remote, no-license, junior, full-time, contract, salary, strong-only;
      warning chips (License required, US only, 5+ years, Hybrid?, Senior…), concept chips, “Why this score”, per-source diagnostics
- [x] Dedup across sources, employer link preferred, statuses persisted, “hide company”, ntfy notifications
- [x] `npm test` (45 offline fixtures covering every family + rejects), `npm run check` (per-source connectivity probe), TypeScript typecheck clean
- [x] Windows installer/updater/uninstaller, README with a step-by-step install guide
- [x] Research pass (10 parallel agents) over ~660 companies and 168 boards, cross-checked against public ATS tenant directories → **463 career pages** in `config.json → careers` (348 directory-verified, 31 corrected, 28 discovered, 56 memory-only) + `docs/careers.md`

## Batch 2 — first live runs on a real PC — done (26–27.09.2026)

- [x] Every source type exercised live from a Windows PC in Serbia; 20 adapters corrected against real responses (field names, parameters, moved sites: aijobs.net → foorilla, hiring.cafe → hiringcafe.com, ReliefWeb v2, Workable search params, Remotive search proxy, Working Nomads index, Jobicy slugs, WWR GeoLock, Workday paging…) – [SOURCES.md](SOURCES.md), [docs/verification.md](docs/verification.md)
- [x] `npm run check -- --careers` over 463 career pages → 60 disabled (45 dead/private slugs after probing variants + 15 low-confidence), 403 live, ~17 000 open positions per pass
- [x] 12 dead RSS feeds disabled with evidence, Remotive feed URL fixed → 14 live feeds
- [x] `http.ts`: 429/403 on a plain GET (TLS-fingerprint bot detection, LinkedIn) retried through curl.exe; `ats.ts`: wrong slugs no longer trip the circuit breaker
- [x] Matcher tuned from real listings (12 new fixtures, 57/57): GeoLock/“Anywhere in US” eligibility, AMER + missing countries, paid volunteer time, executive-title false positives, engineering manager / curriculum developer, generic perk words, non-English ads, US-employer boilerplate
- [x] `setup.cmd` run on the owner's PC (27.09.2026 01:29, first pass 24.5 min, 256 cards); default sort = newest first
- [x] Hard gates decided after the first real pass: licence required, PhD/doctorate required, "Executive" in the title → hidden (`remote.rejectHybrid` stays `true`)
- [ ] Still open: optional keys Adzuna (`adzuna.appId/appKey`) and ReliefWeb (`reliefweb.appname`, free approval form); ntfy topic; install on the second laptop (README quick start).

## Batch 3 — more sources (ideas, in priority order)

- More career pages: every new company found in `filtered.log` / on the boards that hires in this niche → add its ATS slug (2 lines in `config.json`).
- Himalayas/LinkedIn query lists: prune queries that never yield (see per-query log lines) and add ones that do.
- Boards that need a browser today (Jobgether, Otta, Built In) — only if a headless browser is acceptable (breaks the zero-dependency rule).
- Boards catalogued in `docs/careers.md` but not wired: Welcome to the Jungle (Algolia + referer), Reed / Jooble / Careerjet (free keys), Landing.jobs, The Hub, Torre, Braintrust, Built In API, Reddit hiring threads, Getro/Consider VC portfolio boards.
- 198 researched companies without a key-less ATS (custom sites, iCIMS, Rippling) – see the list in `docs/careers.md`; add when an adapter for that ATS exists.
- Use the ATS tenant directories (kalil0321/ats-scrapers on GitHub) to keep discovering employers: grep the CSVs for new brand names and paste 2 lines into `config.json`.
- Semantic similarity (local embeddings) as an extra signal — only if regex recall proves insufficient after Batch 2; the brief prefers the local weighted matcher.
