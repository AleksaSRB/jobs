import { appendFileSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { DATA_DIR, DB_FILE, FILTERED_LOG, RUN_LOG, SEEN_FILE } from "./config.ts";
import { fmtSalary, salaryEurMonth } from "./salary.ts";
import { firstSentences } from "./text.ts";
import type { Db, Job, Scoring, StoredJob } from "./types.ts";

mkdirSync(DATA_DIR, { recursive: true });

export function ts(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const LOG_MAX = 5 * 1024 * 1024;
/** Append a line to a log; when the file passes LOG_MAX it is rotated to <file>.1 (single backup). */
function appendRotating(file: string, line: string): void {
  try {
    try { if (statSync(file).size > LOG_MAX) renameSync(file, `${file}.1`); } catch { /* no file yet */ }
    appendFileSync(file, line + "\n");
  } catch { /* ignore */ }
}

export function log(msg: string): void {
  const line = `[${ts()}] ${msg}`;
  console.log(line);
  appendRotating(RUN_LOG, line);
}

/** Listings the matcher hid – with the reason and the full score breakdown (first place to look when tuning rules.json). */
export function logFiltered(job: Job, reason: string, scoring?: Scoring): void {
  const detail = scoring ? ` | ${scoring.reasons.join("; ")}` : "";
  appendRotating(FILTERED_LOG, `[${ts()}] ${job.source} | ${job.title} | ${job.company || "?"} | ${reason}${detail} | ${job.url}`);
}

function writeJsonAtomic(file: string, value: unknown): void {
  mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 1));
  renameSync(tmp, file);
}

// ---------------------------------------------------------------- db.json
export function loadDb(): Db {
  try {
    const db = JSON.parse(readFileSync(DB_FILE, "utf8")) as Db;
    if (db && typeof db === "object" && db.jobs) {
      db.sources ??= {};
      db.blockedCompanies ??= [];
      db.baselineAt ??= null;
      return db;
    }
  } catch { /* new database */ }
  return { baselineAt: null, lastRun: null, lastRunSummary: "", sources: {}, blockedCompanies: [], jobs: {} };
}

export function saveDb(db: Db): void {
  writeJsonAtomic(DB_FILE, db);
}

// ---------------------------------------------------------------- seen.json: id -> posted date when first seen
export type SeenMap = Map<string, string | null>;

export function loadSeen(): SeenMap {
  try {
    return new Map(Object.entries(JSON.parse(readFileSync(SEEN_FILE, "utf8")) as Record<string, string | null>));
  } catch { return new Map(); }
}

export function saveSeen(seen: SeenMap): void {
  writeJsonAtomic(SEEN_FILE, Object.fromEntries(seen));
}

/** Scoring -> card fields (used on first insert and on --rescore). */
export function applyScoring(j: StoredJob | Job, s: Scoring): void {
  Object.assign(j, {
    score: s.score, level: s.level, reasons: s.reasons, matchReasons: s.matchReasons, negativeReasons: s.negativeReasons,
    primaryCategory: s.primaryCategory, categories: s.categories, badges: s.badges, concepts: s.concepts, warnings: s.warnings,
    eligibility: s.eligibility, license: s.license, seniorityLevel: s.seniorityLevel, yearsRequired: s.yearsRequired,
    junior: s.junior, fullTime: s.fullTime, remoteFinal: s.remoteFinal, industries: s.industries,
  });
}

export function toStored(j: Job, s: Scoring): StoredJob {
  const now = new Date().toISOString();
  const stored = {
    ...j,
    summary: j.summary || firstSentences(j.description),
    status: "new", firstSeen: now, lastSeen: now,
    salaryText: fmtSalary(j.salary), salaryEurMonth: salaryEurMonth(j.salary),
  } as StoredJob;
  applyScoring(stored, s);
  return stored;
}
