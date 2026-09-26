/**
 * Local server (http://localhost:3008): UI + API over data/db.json.
 *   GET  /                        UI (public/index.html)
 *   GET  /api/jobs                every job (including rejected – the UI has a "Rejected" tab) + counters + source diagnostics
 *   POST /api/jobs/:id/status     { status: "new" | "favorite" | "applied" | "rejected" }
 *   POST /api/companies/block     { company } – rejects all new jobs of that company and hides future ones
 *   POST /api/scrape              runs the scraper (--force, all sources) and waits for it to finish
 */
import { spawn } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { join } from "node:path";
import { CONFIG, LOCK_FILE, PUBLIC_DIR, ROOT, RULES } from "./config.ts";
import { companyBlocked } from "./dedup.ts";
import { CATEGORY_LABEL, INDUSTRY_LABEL } from "./score.ts";
import { loadDb, log, saveDb } from "./store.ts";
import type { Status } from "./types.ts";

const STATUSES: Status[] = ["new", "favorite", "applied", "rejected"];

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 1e6) { reject(new Error("body too large")); req.destroy(); } });
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

let scrapeInFlight: Promise<{ code: number | null }> | null = null;

/** Runs src/scrape.ts --force as a separate process and waits for it (max 25 min – 20+ sources, LinkedIn and Wellfound are slow). */
function runScraper(): Promise<{ code: number | null }> {
  if (scrapeInFlight) return scrapeInFlight;
  scrapeInFlight = new Promise((resolve) => {
    const child = spawn(process.execPath, ["--experimental-strip-types", "--disable-warning=ExperimentalWarning", join(ROOT, "src", "scrape.ts"), "--force"],
      { cwd: ROOT, stdio: "ignore", windowsHide: true });
    const timer = setTimeout(() => child.kill(), 25 * 60_000);
    child.on("close", (code) => { clearTimeout(timer); scrapeInFlight = null; resolve({ code }); });
    child.on("error", () => { clearTimeout(timer); scrapeInFlight = null; resolve({ code: -1 }); });
  });
  return scrapeInFlight;
}

async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;
  try {
    if (req.method === "GET" && (path === "/" || path === "/index.html")) {
      const file = join(PUBLIC_DIR, "index.html");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Length": statSync(file).size });
      createReadStream(file).pipe(res);
      return;
    }
    if (req.method === "GET" && path === "/favicon.ico") { res.writeHead(204); res.end(); return; }

    if (req.method === "GET" && path === "/api/jobs") {
      const db = loadDb();
      const all = Object.values(db.jobs);
      const count = (s: Status) => all.filter((j) => j.status === s).length;
      sendJson(res, 200, {
        baselineAt: db.baselineAt,
        minScore: CONFIG.minScore,
        thresholds: RULES.thresholds,
        categoryLabels: CATEGORY_LABEL,
        industryLabels: INDUSTRY_LABEL,
        intervalMin: CONFIG.intervalMin,
        lastRun: db.lastRun,
        lastRunSummary: db.lastRunSummary,
        sources: db.sources,
        sourceConfig: CONFIG.sources,
        careers: CONFIG.careers.map((c) => ({ name: c.name, ats: c.ats, enabled: c.enabled !== false })),
        scraping: scrapeInFlight !== null || existsSync(LOCK_FILE),
        counts: { new: count("new"), favorite: count("favorite"), applied: count("applied"), rejected: count("rejected") },
        jobs: all,
      });
      return;
    }

    const m = req.method === "POST" ? path.match(/^\/api\/jobs\/(.+)\/status$/) : null;
    if (m) {
      const id = decodeURIComponent(m[1]);
      const status = (await readBody(req))?.status as Status;
      if (!STATUSES.includes(status)) { sendJson(res, 400, { error: `status must be ${STATUSES.join(" | ")}` }); return; }
      const db = loadDb();
      const j = db.jobs[id];
      if (!j) { sendJson(res, 404, { error: "job not found" }); return; }
      j.status = status;
      delete j.hiddenByRules;
      saveDb(db);
      log(`status ${id} -> ${status}`);
      sendJson(res, 200, { ok: true, id, status });
      return;
    }

    if (req.method === "POST" && path === "/api/companies/block") {
      const company = String((await readBody(req))?.company ?? "").trim();
      if (!company) { sendJson(res, 400, { error: "company is required" }); return; }
      const db = loadDb();
      if (!companyBlocked(company, [db.blockedCompanies])) db.blockedCompanies.push(company);
      // favorites and applied stay; only new ones are removed
      const rejected = Object.values(db.jobs).filter((j) => j.status === "new" && companyBlocked(j.company, [[company]]));
      for (const j of rejected) j.status = "rejected";
      saveDb(db);
      log(`company hidden: ${company} (${rejected.length} jobs rejected)`);
      sendJson(res, 200, { ok: true, company, rejected: rejected.map((j) => j.id) });
      return;
    }

    if (req.method === "POST" && path === "/api/scrape") {
      const { code } = await runScraper();
      const db = loadDb();
      sendJson(res, 200, { ok: code === 0, code, lastRun: db.lastRun, summary: db.lastRunSummary });
      return;
    }

    sendJson(res, 404, { error: "not found" });
  } catch (e) {
    log(`server error ${req.method} ${path}: ${(e as Error).message}`);
    sendJson(res, 500, { error: (e as Error).message });
  }
}

createServer(handler).listen(CONFIG.port, "127.0.0.1", () => {
  log(`UI: http://localhost:${CONFIG.port}`);
});
// localhost sometimes resolves to IPv6 – listen there too
createServer(handler).on("error", (e) => log(`IPv6 loopback not available: ${(e as Error).message}`)).listen(CONFIG.port, "::1");
