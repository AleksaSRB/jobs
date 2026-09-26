/**
 * Scraper: one pass over all sources.
 *   node --experimental-strip-types src/scrape.ts           (one pass; the Scheduled Task – each source is read when its `everyMin` is due)
 *   node --experimental-strip-types src/scrape.ts --force   (every source now; the "Scan now" button and the first run after install)
 *   node --experimental-strip-types src/scrape.ts --only himalayas,linkedin,greenhouse
 *   node --experimental-strip-types src/scrape.ts --loop    (loop every CONFIG.intervalMin)
 *
 * Baseline: the first pass takes listings published in the last `lookbackDays` (config.json) and stores that date in db.json (baselineAt);
 * afterwards only what is newer is shown. Listings without a date pass (their first-seen time counts).
 *
 * New listing = not seen before + company not blocked + the matcher (rules.json) did not hard-reject it + score >= minScore
 *               + not a duplicate (same company + similar title) of a listing already in the database (the duplicate becomes an "Also on" link).
 * One broken source never breaks the pass: the error is written to db.sources.<source> and the loop moves on.
 */
import { appendFileSync, existsSync, rmSync, statSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { ALL_SOURCES, CONFIG, LOCK_FILE, NEW_LOG, NTFY_TOPIC } from "./config.ts";
import { companyBlocked, DedupIndex } from "./dedup.ts";
import { sleep } from "./http.ts";
import { fmtSalary, salaryEurMonth } from "./salary.ts";
import { hideReason, scoreJob } from "./score.ts";
import * as adzuna from "./sources/adzuna.ts";
import * as aijobs from "./sources/aijobs.ts";
import * as arbeitnow from "./sources/arbeitnow.ts";
import { makeSearch } from "./sources/ats.ts";
import * as eightyk from "./sources/eightyk.ts";
import * as himalayas from "./sources/himalayas.ts";
import * as hn from "./sources/hn.ts";
import * as jobicy from "./sources/jobicy.ts";
import * as jobrack from "./sources/jobrack.ts";
import * as jobspresso from "./sources/jobspresso.ts";
import * as linkedin from "./sources/linkedin.ts";
import * as remoteok from "./sources/remoteok.ts";
import * as remotive from "./sources/remotive.ts";
import * as themuse from "./sources/themuse.ts";
import * as wellfound from "./sources/wellfound.ts";
import * as workingnomads from "./sources/workingnomads.ts";
import * as wwr from "./sources/wwr.ts";
import { loadDb, loadSeen, log, logFiltered, saveDb, saveSeen, toStored, ts } from "./store.ts";
import type { Job, SearchCtx, Source, SourceState, StoredJob } from "./types.ts";

const { values: args } = parseArgs({
  options: { force: { type: "boolean", default: false }, loop: { type: "boolean", default: false }, only: { type: "string" } },
});

const SEARCHERS: Record<Source, (ctx: SearchCtx) => Promise<Job[]>> = {
  himalayas: himalayas.search, wwr: wwr.search, remoteok: remoteok.search, workingnomads: workingnomads.search, jobicy: jobicy.search, remotive: remotive.search,
  arbeitnow: arbeitnow.search, themuse: themuse.search, jobspresso: jobspresso.search, aijobs: aijobs.search, eightyk: eightyk.search, adzuna: adzuna.search, hn: hn.search,
  greenhouse: makeSearch("greenhouse"), lever: makeSearch("lever"), ashby: makeSearch("ashby"), workable: makeSearch("workable"), smartrecruiters: makeSearch("smartrecruiters"),
  recruitee: makeSearch("recruitee"), personio: makeSearch("personio"), bamboohr: makeSearch("bamboohr"), workday: makeSearch("workday"),
  jobrack: jobrack.search, linkedin: linkedin.search, wellfound: wellfound.search,
};
const SOURCES = ALL_SOURCES.map((name) => ({ name, search: SEARCHERS[name] }));

const ONLY = args.only ? new Set(args.only.split(",").map((s) => s.trim()).filter(Boolean)) : null;
if (ONLY) for (const s of ONLY) if (!(s in SEARCHERS)) { console.error(`unknown source "${s}". Known: ${ALL_SOURCES.join(", ")}`); process.exit(2); }

/** The task fires every intervalMin; 2 min of tolerance so a source with the same period is not skipped every other time. */
function isDue(lastFetched: string | undefined, everyMin: number): boolean {
  if (!lastFetched) return true;
  return Date.now() - new Date(lastFetched).getTime() >= (everyMin - 2) * 60_000;
}

/** A card without a salary adopts one from `from` (same listing read again, or a duplicate from another site). */
function adoptSalary(card: StoredJob, from: Job): boolean {
  const text = fmtSalary(from.salary);
  if (card.salaryText || !text) return false;
  card.salary = from.salary; card.salaryText = text; card.salaryEurMonth = salaryEurMonth(from.salary);
  return true;
}

/** The employer's own page beats an aggregator: if a duplicate has a "better" url, the card takes it. */
function adoptEmployerUrl(card: StoredJob, from: Job): boolean {
  if (!from.sourceUrl || card.sourceUrl || card.url === from.url) return false; // from.sourceUrl exists only when from.url is the employer's link
  card.sourceUrl = card.url; card.url = from.url;
  return true;
}

export function fmt(j: StoredJob): string {
  return `[${j.source}] ${j.score} ${j.title} — ${j.company || "?"}${j.salaryText ? ` | ${j.salaryText}` : ""} | ${j.locations.slice(0, 3).join(", ") || "remote"}`;
}

async function notify(fresh: StoredJob[]): Promise<void> {
  if (!NTFY_TOPIC) return;
  const shown = fresh.slice(0, 10);
  let body = shown.map((j) => `${fmt(j)}\n${j.url}`).join("\n\n");
  if (fresh.length > shown.length) body += `\n\n... and ${fresh.length - shown.length} more`;
  try {
    const res = await fetch(`https://ntfy.sh/${encodeURIComponent(NTFY_TOPIC)}`, {
      method: "POST", headers: { "Title": `New jobs: ${fresh.length}`, "Tags": "briefcase", "Priority": "default" }, body, signal: AbortSignal.timeout(15_000),
    });
    log(`ntfy (${NTFY_TOPIC}): HTTP ${res.status}`);
  } catch (e) { log(`ntfy error: ${(e as Error).message}`); }
}

function lockActive(): boolean {
  try { return existsSync(LOCK_FILE) && Date.now() - statSync(LOCK_FILE).mtimeMs < 25 * 60_000; } catch { return false; }
}

export async function runOnce(force: boolean): Promise<void> {
  if (lockActive()) { log("Skipping: another scrape is running (data/scrape.lock)"); return; }
  writeFileSync(LOCK_FILE, String(process.pid));
  try {
    const seen = loadSeen();
    const start = loadDb();
    const firstRun = start.lastRun === null;
    if (!start.baselineAt) {
      start.baselineAt = new Date(Date.now() - CONFIG.lookbackDays * 86_400_000).toISOString();
      saveDb(start);
      log(`First pass: baseline = last ${CONFIG.lookbackDays} days (since ${start.baselineAt})`);
    }
    const since = new Date(start.baselineAt);
    const known = start.jobs;
    const index = new DedupIndex(Object.values(known));
    const fresh: StoredJob[] = [];
    const summary: string[] = [];

    for (const src of SOURCES) {
      const sc = CONFIG.sources[src.name];
      if (ONLY ? !ONLY.has(src.name) : !sc?.enabled) continue;
      if (!ONLY && !force && !isDue(start.sources[src.name]?.lastFetched, sc.everyMin)) continue;

      const batch: StoredJob[] = [];
      const touched = new Map<string, StoredJob>(); // cards whose lastSeen / alsoOn / salary / url changed
      const t0 = Date.now();
      const state: SourceState = { lastFetched: "", summary: "", ok: true, parsed: 0, accepted: 0, rejected: 0, durationSec: 0 };
      try {
        const items = await src.search({ since, isSeen: (id) => seen.has(id) || id in known, log });
        let old = 0, filtered = 0, dupes = 0, blocked = 0, lowScore = 0;
        const now = new Date().toISOString();
        for (const j of items) {
          const inDb = known[j.id];
          if (inDb) {
            inDb.lastSeen = now; touched.set(inDb.id, inDb);
            if (inDb.status !== "rejected") {
              if (inDb.source !== j.source && inDb.url !== j.url && !(inDb.alsoOn ?? []).some((a) => a.source === j.source)) inDb.alsoOn = [...(inDb.alsoOn ?? []), { id: j.id, source: j.source, url: j.url }];
              if (adoptSalary(inDb, j)) log(`salary filled in: ${inDb.id} -> ${inDb.salaryText}`);
            }
            continue;
          }
          if (seen.has(j.id)) continue;
          seen.set(j.id, j.postedAt);
          if (j.postedAt !== null && new Date(j.postedAt) < since) { old++; continue; }
          if (companyBlocked(j.company, [CONFIG.blockedCompanies, start.blockedCompanies])) { blocked++; logFiltered(j, "company hidden"); continue; }
          const scoring = scoreJob(j);
          const why = hideReason(scoring);
          if (why) { if (scoring.reject) filtered++; else lowScore++; logFiltered(j, why, scoring); continue; }
          const match = index.find(j);
          if (match) {
            dupes++;
            if (match.status !== "rejected") {
              if (match.source !== j.source && !(match.alsoOn ?? []).some((a) => a.id === j.id)) match.alsoOn = [...(match.alsoOn ?? []), { id: j.id, source: j.source, url: j.url }];
              if (adoptSalary(match, j)) log(`salary taken from duplicate: ${match.id} -> ${match.salaryText}`);
              if (adoptEmployerUrl(match, j)) log(`employer link taken from duplicate: ${match.id} -> ${match.url}`);
              touched.set(match.id, match);
            }
            log(`duplicate: ${j.id} ≈ ${match.id} (${match.status})`);
            continue;
          }
          const stored = toStored(j, scoring);
          batch.push(stored);
          known[stored.id] = stored;
          index.add(stored);
        }
        state.parsed = items.length; state.accepted = batch.length; state.rejected = filtered + blocked + lowScore;
        state.summary = `${src.name}: found=${items.length} accepted=${batch.length}${dupes ? ` duplicates=${dupes}` : ""}${lowScore ? ` lowScore=${lowScore}` : ""}${filtered ? ` rejected=${filtered}` : ""}${old ? ` beforeBaseline=${old}` : ""}${blocked ? ` hiddenCompany=${blocked}` : ""}`;
      } catch (e) {
        state.ok = false; state.error = (e as Error).message;
        state.summary = `${src.name}: ERROR (${state.error.slice(0, 80)})`;
        log(`ERROR ${src.name}: ${state.error}`);
      }
      state.durationSec = Math.round((Date.now() - t0) / 1000);
      state.lastFetched = new Date().toISOString();
      state.summary += ` duration=${state.durationSec}s`;
      summary.push(state.summary);
      log(state.summary);

      // write after every source: reload the db (the server may have changed statuses) and add only the changes
      const db = loadDb();
      db.baselineAt ??= start.baselineAt;
      for (const s of batch) if (!db.jobs[s.id]) db.jobs[s.id] = s;
      for (const m of touched.values()) {
        const j = db.jobs[m.id];
        if (!j) continue;
        j.lastSeen = m.lastSeen;
        if (m.alsoOn) j.alsoOn = m.alsoOn;
        if (!j.salaryText && m.salaryText) { j.salary = m.salary; j.salaryText = m.salaryText; j.salaryEurMonth = m.salaryEurMonth; }
        if (m.url !== j.url && m.sourceUrl) { j.sourceUrl = m.sourceUrl; j.url = m.url; }
      }
      db.sources[src.name] = state;
      db.lastRun = new Date().toISOString();
      db.lastRunSummary = SOURCES.map((s) => db.sources[s.name]?.summary).filter(Boolean).join(" | ");
      saveDb(db);
      saveSeen(seen);
      fresh.push(...batch);
    }

    if (summary.length === 0) { log("No source is due yet."); return; }
    if (fresh.length > 0) {
      fresh.sort((a, b) => b.score - a.score);
      log(`NEW JOBS: ${fresh.length}`);
      const lines = fresh.map((j) => `${fmt(j)} | ${j.url}`);
      for (const l of lines) console.log("  " + l);
      try { appendFileSync(NEW_LOG, `\n[${ts()}] NEW JOBS: ${fresh.length}\n${lines.join("\n")}\n`); } catch { /* ignore */ }
      if (firstRun) log("First pass (initial fill) – ntfy skipped.");
      else await notify(fresh);
    } else log("No new jobs.");
  } finally {
    rmSync(LOCK_FILE, { force: true });
  }
}

async function main(): Promise<void> {
  log(`Start | threshold ${CONFIG.minScore} | ${args.loop ? `loop every ${CONFIG.intervalMin} min` : ONLY ? `only ${[...ONLY].join(", ")}` : args.force ? "all sources (--force)" : "one pass"} | ${CONFIG.careers.length} career pages configured`);
  for (;;) {
    try { await runOnce(args.force === true); } catch (e) { log(`ERROR run: ${(e as Error).message}`); }
    if (!args.loop) break;
    await sleep(CONFIG.intervalMin * 60_000);
  }
}

main();
