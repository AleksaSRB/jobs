# Psych & Health-Tech Jobs — remote job scraper (psychology · behavioral science · digital mental health · AI safety)

A small local app that reads **31 source types – 16 job boards / aggregators / APIs, 26 RSS boards, and ~460 company career pages through 10 ATS APIs** –, scores every listing with a
**weighted semantic matcher** (title + description concepts + industry + seniority + remote + eligibility from Serbia + license),
merges duplicates and shows the good ones as cards on **http://localhost:3008** with ★ Favorite · ✔ Applied · ✕ Reject.

Same product model as the other scrapers in this family (`job-scrapper2` etc.): TypeScript, Node ≥ 22.6 (type stripping),
**zero npm dependencies**, `data/db.json` as the database, two hidden Windows Scheduled Tasks. Full requirements: [docs/brief.md](docs/brief.md).
Source-by-source notes: [docs/sources.md](docs/sources.md). What is done / what is next: [plan.md](plan.md).

Target roles (18 job families, see `rules.json`): behavioral science, digital health, digital therapeutics, UX research in health,
health-tech product, AI safety / trust & safety / evaluation, conversation & prompt design, human-centered / responsible AI,
human risk / cyberpsychology, mental-health & well-being coaching, counseling (flagged when a license is required), corporate well-being,
evidence-based content / psychoeducation, AI persona design, narrative design, talent assessment, consumer psychology, organizational psychology.

---

## Install on a Windows desktop (step by step)

You need **Windows 10 or 11** and an internet connection. Everything else is handled by the installer.

1. **Get the folder.** Either
   - click the green **Code → Download ZIP** button on https://github.com/AleksaSRB/jobs, unzip it and move the folder somewhere permanent,
     for example `C:\Users\<name>\Desktop\jobs`, **or**
   - if Git is installed: `git clone https://github.com/AleksaSRB/jobs.git` (this also lets `update.cmd` work later).
2. **Double-click `setup.cmd`** inside the folder. A console window opens and:
   - checks for **Node.js 22.6+** and installs the LTS version through `winget` if it is missing
     (if that fails, install Node.js LTS manually from https://nodejs.org and run `setup.cmd` again);
   - registers two hidden scheduled tasks: **PsychJobsScraper** (every 15 min) and **PsychJobsServer** (starts at logon);
   - runs the **first scan** right away (last 7 days from every source; with ~460 career pages the first pass takes **20–40 minutes** – the console shows progress per source; later passes are incremental and each source runs on its own rhythm);
   - opens **http://localhost:3008** in the browser.
3. Bookmark **http://localhost:3008**. That is the whole app.

After a restart nothing needs to be done: the server starts at logon and the scraper keeps checking every 15 minutes.
If the page ever does not open, double-click **`open.cmd`** (starts the server and opens the browser).

Other buttons in the folder:

| File | What it does |
|------|--------------|
| `setup.cmd` | install (safe to run again – it re-registers the tasks and re-scans) |
| `open.cmd` | start the server if needed and open the UI |
| `npm run check -- --careers` (in a terminal) | test every source and career page from this machine |
| `update.cmd` | `git pull` the newest version and restart the server (your `data/` stays) |
| `uninstall.cmd` | remove the two scheduled tasks and stop the server (your `data/` stays) |

Optional: get free **Adzuna** API keys at https://developer.adzuna.com and put them into `config.json → adzuna.appId / appKey`
to add another aggregator (UK, DE, NL, PL, AT, IE searches); it is skipped with a note until configured. The same goes for **ReliefWeb**
(UN OCHA humanitarian jobs): request a free pre-approved `appname` via the form at https://apidoc.reliefweb.int/parameters#appname and put it
into `config.json → reliefweb.appname`. Right after the first scan run
`npm run check -- --careers` once: it prints which of the ~460 career-page slugs answer from your network (a wrong slug only logs `HTTP 404`).

### Running it by hand (any OS)

```
npm run scrape:force        # scan every source now
npm run serve               # UI on http://localhost:3008
npm run scrape -- --only himalayas,linkedin,greenhouse,rss
npm run check               # ping every source from this machine (add -- --careers to test every career page)
npm test                    # offline matcher regression tests (45 fixtures)
npm run score -- --all      # table of everything in the database by current rules
npm run score -- "conversation designer"   # full score breakdown for one job
npm run score -- --rescore  # re-score the database after editing rules.json
```

Environment variables: `PSY_JOBS_PORT` (port), `PSY_JOBS_DATA_DIR` (alternative database folder for experiments), `NTFY_TOPIC` (push notifications via ntfy.sh).
Logs: `data/scraper.log`, `data/new_jobs.log`, `data/filtered.log` (every hidden listing with the reason), `data/server.out`.

---

## The UI

- **Tabs:** New / Favorites / Applied / Rejected. Statuses live in `data/db.json` and survive rescans and restarts.
- **Filters:** free-text search, source, category (job family), sort (best match / newest / recently found / salary),
  Serbia-or-Worldwide only, fully remote, no license required, junior-friendly, full-time, contract/part-time, salary listed, strong matches only.
- **Card:** company + logo, source badge, title, location + eligibility chip (Serbia OK / Worldwide / Europe (check) / Location? / Not eligible),
  match level + score, primary chips (family, Remote, employment, salary), **warnings in red** (License required, US only, 5+ years, Hybrid?, Senior, US hours…),
  grey concept chips (CBT, LLM, Prompt Design, Psychological Safety…), 2–4 line summary, “Also on: …” for duplicates,
  full description and **“Why this score”** (every positive and negative signal).
- **Buttons:** ★ Favorite · ✔ Applied · ✕ Reject · Open ↗ (goes to the employer’s page when known, otherwise to the listing) · “hide company”.
- A red **new** ribbon marks cards found since your last visit. Click “last check” in the header for the per-source status table.

## How a listing is scored (rules.json)

The matcher never relies on the exact title. Every listing collects points from independent signals; **100+ Excellent, 75+ Strong, 50+ Possible**,
below `minScore` (50) it is hidden (logged in `data/filtered.log`).

| Signal | Points |
|--------|-------:|
| job family title match (18 families with dozens of title variants each) | +30 … +45 |
| description concepts of the family (behavior change, adherence, CBT, self-harm safety, prompt design, psychological safety…) | up to +35 |
| generic titles (Product Manager, UX Researcher, Content Writer, Recruiter) without health/psychology/AI context | title points × 0.45 |
| industry signals (mental health, digital health, AI safety, human-centered AI, coaching, psychology, org-psych, consumer, games, HR-tech) | +30 top, +45 max |
| adjacent titles (Research Scientist, Program Manager, Member Experience…) with matching responsibilities | +10 |
| fully remote / Serbia or Worldwide eligible / Europe (check) | +25 / +25 / +10 |
| 0–2 years · 3–4 · 5–6 · 7+ years required | +20 · −10 · −40 · −50 |
| senior/lead title · director/VP/head (hidden) | −45 · −60 |
| license required · preferred (counselor/therapist roles) | −40 (+ red chip) · −10 |
| purely technical role (5+ stack terms, no psychology concepts) | −80 |
| hybrid / on-site, US-only, other language mandatory, unpaid, commission-only, MLM | hidden |
| psychology background wanted, sensitive users, early career, hires globally, Serbia mentioned | +5 … +15 |

Everything is data: add a synonym, concept, industry, hard reject or weight in **`rules.json`**; queries, feeds, categories, rhythm and
career pages in **`config.json`**. After editing rules run `npm run score -- --rescore`; to re-evaluate previously hidden listings delete `data/seen.json`.

## Sources

| Source | How it is read | Rhythm |
|--------|----------------|-------:|
| Himalayas | JSON search API, `country=RS` (site filters by eligibility from Serbia), ~120 queries × 2 pages | 15 min |
| LinkedIn Jobs | public guest API: `location=Serbia` + remote, and `location=European Union` + remote + entry/associate; details for new relevant titles | 60 min |
| We Work Remotely | RSS: product, design, management & finance, customer support, sales & marketing, all-other | 30 min |
| Remote OK | JSON API + tags (healthcare, medical, ux, content, copywriting, non-tech, ai, product, hr, education, teaching, design, data annotation) | 60 min |
| Working Nomads | JSON search index per category (design, writing, management, healthcare, education, HR, consulting, marketing, legal) + public feed as fallback | 60 min |
| Jobicy | JSON API, industry slugs (hr, management, copywriting, design-multimedia, web-app-design, business, supporting, marketing, healthcare) + tags, all with `geo=serbia` | 60 min |
| Remotive | free JSON sample (rationed) + the site's search proxy (`remotive.queries`, newest first) + detail pages for descriptions | 6 h |
| Arbeitnow | free JSON API, newest first (Europe-heavy) | 60 min |
| The Muse | public JSON API, “Flexible / Remote”, entry + mid levels, 11 categories | 2 h |
| Jobspresso | WP Job Manager RSS: unfiltered newest page (50) + keyword searches (title matches; the search feed sorts by relevance, not date) | 60 min |
| aijobs.net → foorilla.com | htmx list fragments of `foorilla.com/hiring/jobs/?job_search=<title substring>` (header `HX-Request: true`; no RSS any more, API is paid) + details for unseen matching titles; company is masked for anonymous visitors | 60 min |
| Hacker News “Who is hiring” | monthly thread via the Algolia API, remote postings only | 6 h |
| JobRack | SSR HTML lists + details (Eastern Europe remote) | 60 min |
| Wellfound | SSR `__NEXT_DATA__` role pages (ux-researcher, product-manager/owner, program-manager, content-strategist, copywriter, people-operations, recruiter, game-designer; unknown role slugs 303 → skipped) | 6 h |
| Adzuna | official API with free keys (optional) | 2 h |
| Workable global search | keyless search API over every public Workable employer (`jobs.workable.com/api/v1/jobs?query=…&workplace=remote&day_range=7`), 25 domain queries (optional keyword-less `location=Serbia` pass via `workablesearch.locations`) | 2 h |
| hiring.cafe | hiringcafe.com Next.js SSR search JSON (`/_next/data/<buildId>/index.json?searchState=…`), remote filter + Serbia/Europe/worldwide location filter, 29 domain queries, descriptions per fresh hit (may be blocked from datacenter IPs; fine from a home PC) | 2 h |
| EURES | EU public employment services search API, 12 keyword sets + details | 3 h |
| ReliefWeb | official UN OCHA jobs API v2 (optional – needs a free pre-approved `appname`): MHPSS, staff well-being, social & behaviour change roles (many remote consultancies) | 3 h |
| 80,000 Hours | public Algolia index of the AI-safety / AI-governance / global-health job board (~900 roles) | 2 h |
| **26 RSS / Atom boards** | one generic adapter (`rss.feeds` in config): NoDesk, EU Remote Jobs, Real Work From Anywhere, JobsCollider ×5, RemoteFirstJobs, Remote.co ×3, Empllo, Authentic Jobs, GameJobs.co, Games-Career, APA PsycCareers, jobs.ac.uk ×2, THE unijobs, BPS Jobs, CharityJob, Guardian Jobs, Remotive RSS, SkipTheDrive | 60 min |
| **~460 company career pages** | public ATS APIs: **Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Recruitee, Personio, BambooHR, Workday, Teamtailor** – digital mental health, DTx, coaching & corporate well-being, AI labs & safety orgs, human-data / trust-and-safety vendors, conversational-AI & companion apps, people-science & research agencies, narrative game studios; list, verification status and how each slug was found: [docs/careers.md](docs/careers.md) | 2–3 h |

One broken source never stops the others; its error shows in the UI (“last check”) and in `data/scraper.log`.
Details, what each site gives, and what was tried and does not work (Indeed, Glassdoor, FlexJobs, Jobgether, Otta, Built In, Upwork…): [docs/sources.md](docs/sources.md). The research pass that produced the career-page list (and 168 catalogued boards for future batches): [docs/careers.md](docs/careers.md).

## Dedup, statuses, notifications

- The same job on several sites (same company + same/similar title, Jaccard ≥ 0.6) = one card + “Also on: …”; a duplicate that has the employer’s direct link or a salary passes them to the card. A rejected job stays rejected when another site finds it again.
- Favorite / Applied / Rejected live in `data/db.json` and survive rescans and restarts; “hide company” blocks a company for good.
- Push notifications: set `ntfyTopic` in `config.json` (or `NTFY_TOPIC`); only new jobs are sent, the first scan is skipped.
