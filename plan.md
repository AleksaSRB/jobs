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
- [x] 7 new board adapters: Arbeitnow, The Muse, Jobspresso, aijobs.net, Hacker News “Who is hiring”, Adzuna (key), 80,000 Hours (endpoint)
- [x] 9 ATS adapters for company career pages: Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Recruitee, Personio, BambooHR, Workday
- [x] Circuit breaker per source (a dead site costs seconds, not hours); one broken source never stops the pass
- [x] UI in English: tabs, search, source/category filters, Serbia/Worldwide, fully remote, no-license, junior, full-time, contract, salary, strong-only;
      warning chips (License required, US only, 5+ years, Hybrid?, Senior…), concept chips, “Why this score”, per-source diagnostics
- [x] Dedup across sources, employer link preferred, statuses persisted, “hide company”, ntfy notifications
- [x] `npm test` (45 offline fixtures covering every family + rejects), `npm run check` (per-source connectivity probe), TypeScript typecheck clean
- [x] Windows installer/updater/uninstaller, README with a step-by-step install guide
- [x] Research pass over ~800 companies / boards → `config.json → careers` + `docs/careers.md` (see below)

## Batch 2 — first run on the real machine (needs network; 1–2 h of tuning)

1. `setup.cmd` → wait for the first pass → open `data/scraper.log` and the “last check” table.
2. `npm run check -- --careers` → disable or fix any career-page slug that returns 404 (`"enabled": false` in `config.json`).
3. Read `data/filtered.log` for the first day: anything relevant that was hidden? Add the title variant / concept to `rules.json`, then `npm run score -- --rescore`.
4. Anything irrelevant that got through? Add a negative pattern or lower a weight; the card’s “Why this score” shows exactly which rule fired.
5. Decide `license.hardReject` (keep visible with a red chip, or hide) and whether `remote.rejectHybrid` should stay `true`.
6. Optional keys: Adzuna (`adzuna.appId/appKey`), 80,000 Hours JSON URL (`eightyk.url`), ntfy topic for phone notifications.

## Batch 3 — more sources (ideas, in priority order)

- More career pages: every new company found in `filtered.log` / on the boards that hires in this niche → add its ATS slug (2 lines in `config.json`).
- Himalayas/LinkedIn query lists: prune queries that never yield (see per-query log lines) and add ones that do.
- Boards that need a browser today (Jobgether, Otta, Built In) — only if a headless browser is acceptable (breaks the zero-dependency rule).
- Niche boards from the research whose feed shape was uncertain (behavioral-science and UX-research boards, TSPA jobs) — verify with `curl` from the target PC and add an RSS adapter (pattern: `src/sources/jobspresso.ts`).
- Teamtailor career sites (many EU health-tech / coaching companies) — `/jobs.rss` where available.
- Semantic similarity (local embeddings) as an extra signal — only if regex recall proves insufficient after Batch 2; the brief prefers the local weighted matcher.
