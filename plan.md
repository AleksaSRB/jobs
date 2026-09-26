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

## Batch 2 — first run on the real machine (needs network; 1–2 h of tuning)

1. `setup.cmd` → wait for the first pass → open `data/scraper.log` and the “last check” table.
2. `npm run check -- --careers` → disable or fix any career-page slug that returns 404 (`"enabled": false` in `config.json`); also watch `data/scraper.log` for hiring.cafe / Workable-search rate limits (429 / 1015) and lengthen their `everyMin` if needed.
3. Read `data/filtered.log` for the first day: anything relevant that was hidden? Add the title variant / concept to `rules.json`, then `npm run score -- --rescore`.
4. Anything irrelevant that got through? Add a negative pattern or lower a weight; the card’s “Why this score” shows exactly which rule fired.
5. Decide `license.hardReject` (keep visible with a red chip, or hide) and whether `remote.rejectHybrid` should stay `true`.
6. Optional keys: Adzuna (`adzuna.appId/appKey`), 80,000 Hours JSON URL (`eightyk.url`), ntfy topic for phone notifications.

## Batch 3 — more sources (ideas, in priority order)

- More career pages: every new company found in `filtered.log` / on the boards that hires in this niche → add its ATS slug (2 lines in `config.json`).
- Himalayas/LinkedIn query lists: prune queries that never yield (see per-query log lines) and add ones that do.
- Boards that need a browser today (Jobgether, Otta, Built In) — only if a headless browser is acceptable (breaks the zero-dependency rule).
- Boards catalogued in `docs/careers.md` but not wired: Welcome to the Jungle (Algolia + referer), Reed / Jooble / Careerjet (free keys), Landing.jobs, The Hub, Torre, Braintrust, Built In API, Reddit hiring threads, Getro/Consider VC portfolio boards.
- 198 researched companies without a key-less ATS (custom sites, iCIMS, Rippling) – see the list in `docs/careers.md`; add when an adapter for that ATS exists.
- Use the ATS tenant directories (kalil0321/ats-scrapers on GitHub) to keep discovering employers: grep the CSVs for new brand names and paste 2 lines into `config.json`.
- Semantic similarity (local embeddings) as an extra signal — only if regex recall proves insufficient after Batch 2; the brief prefers the local weighted matcher.
