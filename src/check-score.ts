/**
 * Scoring diagnostics (does not touch any website):
 *   npm run score -- --all                 table of every job in the database: score | level | status | eligibility | source | title (current rules.json)
 *   npm run score -- <part of id or title> full score breakdown for that job
 *   npm run score -- --rescore             re-score every job in the database with the current rules.json and save (statuses stay);
 *                                          jobs that now fall below the threshold get status "rejected" (favorites / applied stay)
 * Jobs the matcher REJECTED earlier are not in the database (only in data/filtered.log) – delete data/seen.json to re-evaluate them.
 */
import { CONFIG } from "./config.ts";
import { hideReason, scoreJob } from "./score.ts";
import { applyScoring, loadDb, saveDb } from "./store.ts";

const args = process.argv.slice(2);
const db = loadDb();
const jobs = Object.values(db.jobs);

if (args.includes("--rescore")) {
  let hidden = 0, changed = 0, restored = 0;
  for (const j of jobs) {
    const s = scoreJob(j);
    if (s.score !== j.score) changed++;
    applyScoring(j, s);
    if (j.status === "new" && hideReason(s)) { j.status = "rejected"; j.hiddenByRules = true; hidden++; }
    else if (j.status === "rejected" && j.hiddenByRules && !hideReason(s)) { j.status = "new"; delete j.hiddenByRules; restored++; }
  }
  saveDb(db);
  console.log(`Re-scored ${jobs.length} jobs, ${changed} changed scores, ${hidden} hidden below threshold ${CONFIG.minScore}, ${restored} restored.`);
} else if (args.includes("--all") || args.length === 0) {
  for (const j of jobs.sort((a, b) => b.score - a.score)) console.log(`${String(j.score).padStart(4)} ${j.level.padEnd(9)} ${j.status.padEnd(8)} ${j.eligibility.padEnd(9)} ${(j.license ?? "").padEnd(9)} ${j.source.padEnd(14)} ${j.title} — ${j.company} (${j.id})`);
  console.log(`\n${jobs.length} jobs in the database.`);
} else {
  const q = args.join(" ").toLowerCase();
  const hits = jobs.filter((j) => j.id.toLowerCase().includes(q) || j.title.toLowerCase().includes(q));
  if (!hits.length) { console.log("No such job in the database."); process.exit(1); }
  for (const j of hits) {
    const s = scoreJob(j);
    console.log(`\n${j.title} — ${j.company} [${j.source}] ${j.url}\n  status: ${j.status} | stored: ${j.score} | now: ${s.score} (${s.level})${s.reject ? ` | REJECTED: ${s.reject}` : ""}`);
    for (const r of s.reasons) console.log(`  ${r}`);
    console.log(`  primary: ${s.primaryCategory} | categories: ${s.categories.join(", ")} | badges: ${s.badges.join(", ")} | concepts: ${s.concepts.join(", ")} | warnings: ${s.warnings.join(", ")} | license: ${s.license} | eligibility: ${s.eligibility}`);
  }
}
