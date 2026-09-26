/**
 * Weighted, multi-signal matcher (docs/brief.md §2, §11, §19). Not a title allowlist: a listing scores from
 *   job-family title match + description concepts + industry signals + adjacent titles + seniority + remote + eligibility
 *   + employment type + license + education + skill concepts + positives/negatives (all in rules.json).
 * Output: score, level, primary/secondary family, reasons (for the card's "Why this score"), badges, concept chips, warnings,
 * license requirement, eligibility from Serbia, seniority, hard rejection (US only, hybrid/onsite, director, purely technical…).
 * Everything runs on lower-cased, diacritics-folded text. Title patterns see the title only; concepts see the description.
 */
import { CONFIG, RULES } from "./config.ts";
import { compile, fold, latinize, sentenceAround } from "./text.ts";
import type { Eligibility, Job, LicenseRequirement, MatchLevel, RemoteType, Scoring, SeniorityLevel } from "./types.ts";

const FR = RULES.familyRules, S = RULES.seniority, R = RULES.remote, EL = RULES.eligibility, E = RULES.employment, L = RULES.language, TZ = RULES.timezone, LIC = RULES.license;

const FAMILIES = RULES.families.map((f) => ({ ...f, titleRe: compile(f.titlePatterns, `families.${f.id}.title`), conceptRe: compile(f.conceptPatterns, `families.${f.id}.concepts`) }));
const ADJACENT = compile(RULES.adjacentTitles.patterns, "adjacentTitles");
const INDUSTRIES = RULES.industries.map((i) => ({ ...i, re: compile(i.patterns, `industries.${i.id}`) }));
const CONCEPTS = RULES.concepts.map((c) => ({ ...c, re: compile(c.patterns, `concepts.${c.label}`) }));
const HUMAN = compile(RULES.humanAngle, "humanAngle");
const TECH = compile(RULES.technical.patterns, "technical");
const LIC_CRED = LIC.credentials.map((p) => new RegExp(p, "gi"));
const LIC_REQ = compile(LIC.requiredContext, "license.requiredContext");
const LIC_PREF = compile(LIC.preferredContext, "license.preferredContext");
const LIC_NOT = compile(LIC.notRequired, "license.notRequired");
const LIC_TITLE = compile(RULES.titleRegulated, "titleRegulated");
const EDU_REL = compile(RULES.education.relevant, "education.relevant");
const EDU_UNREL = compile(RULES.education.unrelatedRequired, "education.unrelatedRequired");
const JUNIOR_TITLE = compile(S.juniorTitle, "seniority.juniorTitle");
const JUNIOR_TEXT = compile(S.juniorText, "seniority.juniorText");
const SENIOR_TITLE = compile(S.seniorTitle, "seniority.seniorTitle");
const EXEC_TITLE = compile(S.executiveTitle, "seniority.executiveTitle");
const REMOTE_TXT = compile(R.remoteText, "remote.remoteText");
const HYBRID_TXT = compile(R.hybridText, "remote.hybridText");
const ONSITE_TXT = compile(R.onsiteText, "remote.onsiteText");
const EL_SERBIA = compile(EL.serbia, "eligibility.serbia");
const EL_WORLD = compile(EL.worldwide, "eligibility.worldwide");
/** "anywhere" / "global" / "international" alone: worldwide only when the same location string names no region ("Anywhere in US" = US). */
const EL_WORLD_STRONG = EL_WORLD.filter((r) => !(EL.worldwideWeak ?? []).includes(r.source));
const EL_EUROPE = compile(EL.europe, "eligibility.europe");
const EL_OTHER = compile(EL.otherRegion, "eligibility.otherRegion");
const EL_EXCLUDE = EL.excludeText.map((p) => new RegExp(p, "gi"));
const FULL_TXT = compile(E.fullTimeText, "employment.fullTimeText");
const PART_TXT = compile(E.partTimeText, "employment.partTimeText");
const UNPAID = compile(E.unpaid, "employment.unpaid");
const COMMISSION = compile(E.commissionOnly, "employment.commissionOnly");
const LANG_REQ = L.requiredPatterns.map((p) => new RegExp(p.replace(/LANG/g, L.foreignLanguages), "gi"));
/** Ad written in another language: stop-word density in the title + first 600 chars (text is diacritics-folded, so the list is too). */
const FOREIGN_TEXT = L.foreignTextStopwords ? new RegExp(`\\b(${L.foreignTextStopwords})\\b`, "g") : null;
const ENGLISH_TEXT = /\b(the|and|with|for|you|our|will|are|is|to|of|we|in)\b/g;
const LANG_EXC = compile(L.exceptions.map((p) => p.replace(/LANG/g, L.foreignLanguages)), "language.exceptions");
/** A language in the title ("Content Writer (German)") is mandatory. */
const LANG_TITLE = new RegExp(`\\b(${L.foreignLanguages})\\b`, "i");
const TZ_POS = compile(TZ.positive, "timezone.positive");
const TZ_NEG = compile(TZ.negative, "timezone.negative");
const NEG_TITLE = RULES.negatives.title.map((g) => ({ ...g, re: compile(g.patterns, `negatives.title.${g.label}`) }));
const NEG_TEXT = RULES.negatives.text.map((g) => ({ ...g, re: compile(g.patterns, `negatives.text.${g.label}`) }));
const POS = RULES.positives.map((g) => ({ ...g, re: compile(g.patterns, `positives.${g.id}`) }));
/** Hard title negatives that a human/psychology angle in the title turns into a soft −20 ("Behavioral Data Scientist", "Human Factors Engineer"). */
const SOFTENABLE = /software|finance|sales|support|teaching/i;

/** Which concept groups to show first per primary family (presentation only). */
const PREFERRED_GROUPS: Record<string, string[]> = {
  "behavioral-science": ["Psychology", "Research"], "digital-health": ["Health", "Product"], "digital-therapeutics": ["Psychology", "Health"],
  "ux-research": ["Research", "Product"], "healthtech-product": ["Product", "Health"], "ai-safety": ["AI", "Psychology"], "conversation-design": ["AI", "Content"],
  "human-centered-ai": ["AI", "Research"], "human-risk": ["Psychology", "AI"], "coaching": ["Health", "Psychology"], "counselor": ["Psychology", "Health"],
  "corporate-wellbeing": ["Organizational", "Health"], "content": ["Content", "Health"], "ai-persona": ["Content", "AI"], "narrative-design": ["Content"],
  "talent-assessment": ["Talent", "Psychology"], "consumer-psychology": ["Consumer", "Research"], "organizational-psychology": ["Organizational", "Psychology"],
};

const firstMatch = (res: RegExp[], text: string): RegExpMatchArray | null => { for (const r of res) { const m = text.match(r); if (m) return m; } return null; };
const PERK_SENTENCE = RULES.industryExcludeSentence ? new RegExp(RULES.industryExcludeSentence, "i") : null;
/** An industry term inside a benefits/perks sentence ("mental health days", "coaching budget", "wellness stipend") says nothing about the employer's business. */
function hitOutsidePerks(re: RegExp, body: string): boolean {
  if (!PERK_SENTENCE) return re.test(body);
  for (const m of body.matchAll(new RegExp(re.source, "gi"))) if (!PERK_SENTENCE.test(sentenceAround(body, m.index ?? 0))) return true;
  return false;
}
const countMatches = (res: RegExp[], text: string): { n: number; samples: string[] } => {
  const samples: string[] = [];
  for (const r of res) { const m = text.match(r); if (m && m[0].trim()) samples.push(m[0].trim().replace(/\s+/g, " ")); }
  return { n: samples.length, samples };
};
const quote = (s: string) => `«${s.trim().replace(/\s+/g, " ").slice(0, 60)}»`;
const sign = (n: number) => (n >= 0 ? `+${n}` : String(n));
const uniq = <T,>(a: T[]) => [...new Set(a)];

export function levelOf(score: number): MatchLevel {
  const t = RULES.thresholds;
  return score >= t.excellent ? "excellent" : score >= t.good ? "good" : score >= t.possible ? "possible" : "low";
}

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(RULES.families.map((f) => [f.id, f.label]));
export const INDUSTRY_LABEL: Record<string, string> = Object.fromEntries(RULES.industries.map((i) => [i.id, i.label]));

/** Title hits a job family or an adjacent title and no hard negative – adapters use this to decide which (unseen) listings deserve a detail request. */
export function worthDetail(title: string): boolean {
  const t = fold(latinize(title));
  if (EXEC_TITLE.some((r) => r.test(t))) return false;
  for (const g of NEG_TITLE) {
    const m = firstMatch(g.re, t);
    if (g.score > -100 || !m) continue;
    if (!(SOFTENABLE.test(g.label) && HUMAN.some((r) => r.test(t.replace(m[0], " "))))) return false;
  }
  return FAMILIES.some((f) => f.titleRe.some((r) => r.test(t))) || ADJACENT.some((r) => r.test(t));
}

// ---------------------------------------------------------------- years of experience

const WORD_NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, ten: 10 };
const NUM = String.raw`(\d{1,2}|one|two|three|four|five|six|seven|eight|ten)`;
const YEARS_RE = [
  // "3+ years of experience", "2-4 years' experience in research", "minimum of 5 years experience"
  new RegExp(String.raw`\b${NUM}\s*(?:\+|plus)?\s*(?:-|–|to)?\s*(?:${NUM})?\s*\+?\s*(?:years?|yrs?)(?:'|’)?\s*(?:of\s+)?(?:\w+[- ]){0,4}?(?:experience|exp\b|background|track record|practice)`, "gi"),
  // "experience: 3+ years", "experienced (2+ years)"
  new RegExp(String.raw`\b(?:experience|experienced)\b[^.\n:]{0,30}?[:(]?\s*${NUM}\s*(?:\+|plus)?\s*(?:-|–|to)?\s*(?:${NUM})?\s*\+?\s*(?:years?|yrs?)`, "gi"),
];
const YEARS_SKIP_BEFORE = /\b(we|our|company|team|clients?|founded|business|industry|market|agency|brand|history|over the (last|past)|for the (last|past)|in the (last|past)|with (over|more than))\b[^.\n]{0,25}$/;
const YEARS_SKIP_AFTER = /^[^.\n]{0,20}\b(in business|in the (market|industry)|of history|of operation|of success|of growth|old)\b/;
const toNum = (s: string | undefined): number | null => (s === undefined ? null : /^\d+$/.test(s) ? Number(s) : WORD_NUM[s] ?? null);

/** Minimum years of experience demanded by the text (the strictest one), or null when not mentioned. */
export function yearsRequired(text: string): number | null {
  let best: number | null = null;
  for (const re of YEARS_RE) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const lo = toNum(m[1]);
      if (lo === null || lo > 15) continue;
      const idx = m.index ?? 0;
      if (YEARS_SKIP_BEFORE.test(text.slice(Math.max(0, idx - 40), idx))) continue;
      if (YEARS_SKIP_AFTER.test(text.slice(idx + m[0].length, idx + m[0].length + 40))) continue;
      if (best === null || lo > best) best = lo;
    }
  }
  return best;
}

// ---------------------------------------------------------------- location

type LocClass = "serbia" | "worldwide" | "europe" | "other" | "generic";

function classifyLocation(loc: string): LocClass {
  const l = fold(loc);
  if (EL_SERBIA.some((r) => r.test(l))) return "serbia";
  if (EL_WORLD_STRONG.some((r) => r.test(l))) return "worldwide";
  if (EL_EUROPE.some((r) => r.test(l))) return "europe";   // "Anywhere in Europe"
  if (EL_OTHER.some((r) => r.test(l))) return "other";     // "Anywhere in US", "Global – UK based"
  if (EL_WORLD.some((r) => r.test(l))) return "worldwide"; // a bare "Anywhere" / "Global"
  return "generic"; // "Remote", "" and similar
}

// ---------------------------------------------------------------- license

/** Strongest credential requirement in the text (required > preferred > unclear > none). */
export function licenseRequirement(title: string, body: string): { level: LicenseRequirement; hit: string } {
  if (LIC_NOT.some((r) => r.test(body))) return { level: "none", hit: firstMatch(LIC_NOT, body)?.[0] ?? "" };
  const st: { level: LicenseRequirement; hit: string } = { level: "none", hit: "" };
  const RANK: Record<LicenseRequirement, number> = { none: 0, unclear: 1, preferred: 2, required: 3 };
  const bump = (l: LicenseRequirement, h: string) => { if (RANK[l] > RANK[st.level]) { st.level = l; st.hit = h; } };
  const t = firstMatch(LIC_TITLE, title);
  if (t) bump("required", `${t[0]} (title)`);
  for (const re of LIC_CRED) {
    re.lastIndex = 0;
    for (const m of body.matchAll(re)) {
      const sentence = sentenceAround(body, m.index ?? 0);
      if (LIC_NOT.some((r) => r.test(sentence))) continue;
      if (LIC_PREF.some((r) => r.test(sentence))) bump("preferred", m[0]);
      else if (LIC_REQ.some((r) => r.test(sentence))) bump("required", m[0]);
      else bump("unclear", m[0]);
      if (st.level === "required") return st;
    }
  }
  return st;
}

// ---------------------------------------------------------------- scoring

export function scoreJob(job: Job): Scoring {
  const title = fold(latinize(job.title));
  const body = fold(latinize(`${job.description ?? ""}\n${job.summary ?? ""}\n${job.tags.join(" ")}`));
  const text = `${title}\n${body}`;
  const locText = fold(job.locations.join(" | "));
  const reasons: string[] = [], matchReasons: string[] = [], negativeReasons: string[] = [];
  const badges: string[] = [], warnings: string[] = [];
  let score = 0;
  let reject: string | null = null;
  const add = (n: number, why: string) => {
    score += n; reasons.push(`${sign(n)} ${why}`);
    if (n > 0) matchReasons.push(`+${n} ${why}`); else if (n < 0) negativeReasons.push(`${n} ${why}`);
  };
  const hardReject = (why: string) => { if (!reject) reject = why; reasons.push(`✕ ${why}`); negativeReasons.push(`✕ ${why}`); };

  // ---- industry / company signals (title + description + tags)
  const industries = INDUSTRIES.filter((i) => i.re.some((r) => r.test(title) || hitOutsidePerks(r, body))).sort((a, b) => b.score - a.score);
  const industryIds = industries.map((i) => i.id);
  if (industries.length) {
    const pts = Math.min(RULES.industryScoreMax, industries[0].score + (industries[1] ? Math.round(industries[1].score / 2) : 0));
    add(pts, `industry: ${industries.slice(0, 3).map((i) => i.label).join(", ")}`);
  }

  // ---- job families: title match (full weight) + description concepts (up to conceptWeight)
  const fams = FAMILIES.map((f) => {
    const t = firstMatch(f.titleRe, title);
    const c = countMatches(f.conceptRe, body);
    let titlePts = t ? f.titleWeight : 0;
    let conceptPts = c.n >= FR.conceptFull ? f.conceptWeight : c.n > 0 ? Math.round(f.conceptWeight * FR.conceptPartialFactor * c.n) : 0;
    let note = "", gatedMiss = false;
    if (t && f.gated && !(f.industries ?? []).some((id) => industryIds.includes(id))) {
      // generic title (Product Manager, UX Researcher, Content Writer, Recruiter…) without a health / psychology / AI industry signal
      titlePts = Math.round(titlePts * FR.gatedFactor); conceptPts = Math.round(conceptPts * FR.gatedFactor); gatedMiss = true;
      note = " – generic context (no health / psychology / AI industry signal)";
    }
    return { f, t, c, titlePts, conceptPts, note, gatedMiss, total: titlePts + conceptPts };
  }).filter((x) => x.total > 0 && (x.t || x.c.n >= 2)).sort((a, b) => b.total - a.total || Number(!!b.t) - Number(!!a.t)); // one lone concept never makes a family
  const primary = fams[0];
  const secondaries = fams.slice(1).filter((x) => x.total >= FR.secondaryMin && (x.t || x.c.n >= FR.secondaryConceptMin)).slice(0, 3);
  const adj = firstMatch(ADJACENT, title);
  if (primary) {
    if (primary.titlePts) add(primary.titlePts, `${primary.f.label} – title ${quote(primary.t![0])}${primary.note}`);
    if (primary.conceptPts) add(primary.conceptPts, `${primary.f.label} – ${primary.c.n} concept${primary.c.n > 1 ? "s" : ""} in description (${primary.c.samples.slice(0, 4).join(", ")}${primary.c.n > 4 ? "…" : ""})`);
    if (primary.gatedMiss) add(FR.gatedPenalty, "generic role: no mental-health / health-tech / AI / psychology context");
    if (secondaries.length) add(Math.min(FR.secondaryBonusMax, FR.secondaryBonus * secondaries.length), `also matches: ${secondaries.slice(0, 3).map((x) => x.f.label).join(", ")}`);
    if (!primary.t) {
      if (adj && primary.c.n >= FR.conceptFull) add(RULES.adjacentTitles.score, `adjacent title ${quote(adj[0])} with matching responsibilities`);
      else if (primary.c.n >= FR.conceptFull) add(-10, "job family found only in the description, not the title");
      else add(FR.conceptOnlyPenalty ?? -10, `job family only weakly present in the description (${primary.c.n} concept${primary.c.n > 1 ? "s" : ""}, title ${adj ? "only adjacent" : "unrelated"})`); // 1–2 perk-paragraph hits must not ride the site bonuses over the threshold
    }
  } else if (adj && industries.length) {
    add(RULES.adjacentTitles.score, `adjacent title ${quote(adj[0])} in a relevant industry`);
    add(FR.noFamilyIndustryOnly, "unclear relevance: no job-family signal in title or description");
  } else if (industries.length) {
    add(-70, "no target job family in title or description (only an industry signal)");
    hardReject("no target job family in title or description");
  } else {
    add(-70, "unrelated: no target job family and no relevant industry");
    hardReject("unrelated industry and responsibilities");
  }
  const maxConceptHits = Math.max(0, ...fams.map((x) => x.c.n));

  // ---- hard/soft title negatives (engineer, physician, accountant, sales, MLM…) – a human/psychology angle softens some
  for (const g of NEG_TITLE) {
    const m = firstMatch(g.re, title);
    if (!m) continue;
    const rest = title.replace(m[0], " "); // "Behavioral Data Scientist" -> "behavioral" keeps a human angle; "Machine Learning Engineer" -> nothing
    if (g.score <= -100 && SOFTENABLE.test(g.label) && HUMAN.some((r) => r.test(rest))) { add(-20, `${g.label} ${quote(m[0])} – but a human/psychology angle in the title`); continue; }
    add(g.score, `${g.label} ${quote(m[0])}`);
    if (g.score <= -100) hardReject(`${g.label}: ${quote(m[0])}`);
  }

  // ---- purely technical role (stack density with no psychology concepts)
  const tech = countMatches(TECH, body);
  if (tech.n >= RULES.technical.minHits && maxConceptHits <= RULES.technical.maxConcepts) {
    add(RULES.technical.score, `purely technical role (${tech.n} stack terms: ${tech.samples.slice(0, 4).join(", ")}; no psychology concepts)`);
    if (tech.n >= RULES.technical.minHits + 2) hardReject(`purely technical software role (${tech.n} stack terms, no psychology / behavioural content)`);
  }
  else if (tech.n >= RULES.technical.minHits * 2) { add(-30, `heavily technical stack (${tech.samples.slice(0, 4).join(", ")}…)`); warnings.push("Technical"); }

  // ---- seniority
  let junior = false;
  let seniorityLevel: SeniorityLevel = "unknown";
  const ex = firstMatch(EXEC_TITLE, title);
  const sen = ex ? null : firstMatch(SENIOR_TITLE, title);
  if (ex) { add(S.executiveTitleScore, `director / head / executive title ${quote(ex[0])}`); warnings.push("Director+"); seniorityLevel = "senior"; if (S.rejectExecutive) hardReject(`director / executive level: ${quote(ex[0])}`); }
  else if (sen) { add(S.seniorTitleScore, `senior / lead title ${quote(sen[0])}`); warnings.push("Senior"); seniorityLevel = "senior"; }
  else {
    const jr = firstMatch(JUNIOR_TITLE, title);
    if (jr) { add(S.juniorTitleScore, `junior / associate title ${quote(jr[0])}`); junior = true; seniorityLevel = "junior"; }
  }
  const siteSen = fold(job.seniority ?? "");
  if (siteSen) {
    if (/entry|junior|associate|intern|graduate/.test(siteSen)) { add(S.siteEntryScore, `site: ${job.seniority}`); junior = true; if (seniorityLevel === "unknown") seniorityLevel = "junior"; }
    else if (/senior|lead|director|executive|vp|head|principal|manager/.test(siteSen) && !/mid/.test(siteSen)) { add(S.siteSeniorScore, `site: ${job.seniority}`); warnings.push("Senior (site)"); if (seniorityLevel === "unknown") seniorityLevel = "senior"; }
  }
  let years = yearsRequired(body);
  if (job.yearsMin != null && (years === null || job.yearsMin > years)) years = job.yearsMin;
  if (years !== null) {
    if (years <= 2) { add(S.years.zeroToTwoScore, `asks for ${years}${years === 0 ? "" : "+"} years of experience`); junior = true; badges.push(`${years}+ yrs`); if (seniorityLevel === "unknown") seniorityLevel = "junior"; }
    else if (years <= 4) { add(S.years.threeToFourScore, `asks for ${years}+ years of experience`); badges.push(`${years}+ yrs`); if (seniorityLevel === "unknown") seniorityLevel = "mid"; }
    else if (years <= 6) { add(S.years.fiveToSixScore, `asks for ${years}+ years of experience`); warnings.push(`${years}+ years`); if (seniorityLevel !== "senior") seniorityLevel = "senior"; }
    else { add(S.years.sevenPlusScore, `asks for ${years}+ years of experience`); warnings.push(`${years}+ years`); seniorityLevel = "senior"; }
    if (S.years.rejectFrom != null && years >= S.years.rejectFrom) hardReject(`${years}+ years of experience mandatory`);
  } else {
    const jt = firstMatch(JUNIOR_TEXT, body);
    if (jt) { add(S.juniorTextScore, `junior signal in description ${quote(jt[0])}`); junior = true; if (seniorityLevel === "unknown") seniorityLevel = "junior"; }
  }
  if (junior && seniorityLevel !== "senior") badges.push("Junior-friendly");

  // ---- remote / hybrid / onsite (site field first, then location strings and description)
  let remoteFinal: RemoteType = job.remote;
  const officeText = `${title}\n${body}`; // "… - Belgrade - On-site" in the title counts too (LinkedIn's remote filter is not reliable)
  const officeHit = (res: RegExp[]) => {
    for (const r of res) {
      for (const m of officeText.matchAll(new RegExp(r.source, "gi"))) {
        const sentence = sentenceAround(officeText, m.index ?? 0);
        if (/\b(no|not|never|without|fully remote|100% remote|remote[- ]first|optional|not required|no need|instead of|rather than|is not|isn't|occasional|once a (quarter|year)|twice a year|if you (prefer|want|wish)|can also|option(al)? to)\b/.test(sentence)) continue;
        return m;
      }
    }
    return null;
  };
  const probe = `${title}\n${locText}\n${body}`;
  if (job.remote === "hybrid") { add(R.hybridScore, "hybrid (site field)"); warnings.push("Hybrid"); if (R.rejectHybrid) hardReject("hybrid"); }
  else if (job.remote === "onsite") { add(R.onsiteScore, "on-site (site field)"); warnings.push("On-site"); if (R.rejectOnsite) hardReject("on-site"); }
  else {
    const h = officeHit(HYBRID_TXT) ?? officeHit(ONSITE_TXT);
    const locRemote = firstMatch(REMOTE_TXT, `${title}\n${locText}`);
    if (job.remote === "remote" || locRemote) {
      add(R.remoteScore, job.remote === "remote" ? "remote (site field / filter)" : `remote ${quote(locRemote![0])}`); badges.push("Remote"); remoteFinal = "remote";
      if (h) { add(-30, `but the description mentions office presence ${quote(h[0])}`); warnings.push("Hybrid?"); }
    } else if (h) {
      const hybrid = HYBRID_TXT.some((r) => r.test(h[0]));
      add(hybrid ? R.hybridScore : R.onsiteScore, `${hybrid ? "hybrid" : "on-site"} in description ${quote(h[0])}`); warnings.push(hybrid ? "Hybrid" : "On-site"); remoteFinal = hybrid ? "hybrid" : "onsite";
      if (hybrid ? R.rejectHybrid : R.rejectOnsite) hardReject(`${hybrid ? "hybrid" : "on-site"}: ${quote(h[0])}`);
    } else {
      const r = firstMatch(REMOTE_TXT, probe);
      if (r) { add(R.remoteScore, `remote ${quote(r[0])}`); badges.push("Remote"); remoteFinal = "remote"; }
      else add(R.unknownScore, "unclear whether the role is remote");
    }
  }

  // ---- can a candidate in Serbia apply?
  let eligibility: Eligibility = "unclear";
  const classes = job.locations.map(classifyLocation);
  let exclHit: RegExpMatchArray | null = null;
  outer: for (const re of EL_EXCLUDE) {
    re.lastIndex = 0;
    for (const m of body.matchAll(re)) {
      const sentence = sentenceAround(body, m.index ?? 0);
      if (/\b(serbia|balkan|worldwide|anywhere|globally|europe|emea|or (other|any) countr|international|outside (the|of)|not (limited|restricted))\b/.test(sentence)) continue;
      exclHit = m; break outer;
    }
  }
  const excludeWarn = (hit: string) => warnings.push(/\b(us|usa|u\.s|united states|america)\b/i.test(hit) ? "US only" : /\b(uk|united kingdom|london|england)\b/i.test(hit) ? "UK only" : /\bcanada|canadian\b/i.test(hit) ? "Canada only" : /\b(eu|european union|schengen)\b/i.test(hit) ? "EU only" : "Location restricted");
  if (exclHit) { eligibility = "excluded"; add(EL.excludeScore, `description excludes Serbia ${quote(exclHit[0])}`); excludeWarn(exclHit[0]); hardReject(`not available from Serbia: ${quote(exclHit[0])}`); }
  else if (job.locationVerified) { eligibility = "serbia"; add(EL.serbiaScore, "site already filters: applicable from Serbia"); }
  else if (classes.includes("serbia")) { eligibility = "serbia"; add(EL.serbiaScore, `location ${quote(job.locations[classes.indexOf("serbia")])}`); }
  else if (classes.includes("worldwide")) { eligibility = "worldwide"; add(EL.worldwideScore, `location ${quote(job.locations[classes.indexOf("worldwide")])}`); }
  else if (classes.includes("europe")) { eligibility = "europe"; add(EL.europeScore, `location ${quote(job.locations[classes.indexOf("europe")])} – check whether Serbia is included`); }
  else if (classes.includes("other")) {
    eligibility = "excluded"; add(EL.otherRegionScore, `location ${quote(locText)}`); excludeWarn(locText);
    if (EL.rejectOtherRegion) hardReject(`location does not include Serbia: ${quote(locText)}`);
  } else {
    const s = firstMatch(EL_SERBIA, body), w = firstMatch(EL_WORLD, body), e = firstMatch(EL_EUROPE, body);
    if (s) { eligibility = "serbia"; add(EL.serbiaScore, `description: ${quote(s[0])}`); }
    else if (w) { eligibility = "worldwide"; add(EL.worldwideScore, `description: ${quote(w[0])}`); }
    else if (e) { eligibility = "europe"; add(EL.europeScore, `description: ${quote(e[0])} – check whether Serbia is included`); }
    else add(EL.unclearScore, "location / eligibility not stated");
  }

  // ---- employment type (site fields first, then text)
  let fullTime = false;
  const emp = job.employment;
  const ptTitle = firstMatch(PART_TXT, title);
  if (emp.includes("part-time") || ptTitle) { add(E.partTimeScore, ptTitle ? `part-time in title ${quote(ptTitle[0])}` : "part-time (site field)"); badges.push("Part-time"); }
  else if (emp.includes("internship")) { add(E.internshipScore, "internship (site field)"); badges.push("Internship"); }
  else if (emp.includes("full-time")) { add(E.fullTimeScore, "full-time (site field)"); badges.push("Full-time"); fullTime = true; }
  else if (emp.includes("contract")) { add(E.contractScore, "contract (site field)"); badges.push("Contract"); fullTime = !firstMatch(PART_TXT, text); }
  else if (emp.includes("freelance")) { add(E.freelanceScore, "freelance (site field)"); badges.push("Freelance"); }
  else if (emp.includes("temporary")) { add(E.temporaryScore, "temporary (site field)"); badges.push("Temporary"); }
  else {
    const pt = firstMatch(PART_TXT, text);
    const ft = firstMatch(FULL_TXT, text);
    if (/\bintern(ship)?\b|\btrainee\b/.test(title)) { add(E.internshipScore, "internship (title)"); badges.push("Internship"); }
    else if (pt && !ft) { add(E.partTimeScore, `part-time ${quote(pt[0])}`); badges.push("Part-time"); }
    else if (ft) { add(E.fullTimeScore, `full-time ${quote(ft[0])}`); badges.push("Full-time"); fullTime = true; }
    else if (/\bcontract(or)?\b/.test(text)) { add(E.contractScore, "contract (description)"); badges.push("Contract"); }
    else add(0, "employment type not stated");
  }
  const unpaid = firstMatch(UNPAID, text);
  if (unpaid) { add(E.unpaidScore, `unpaid ${quote(unpaid[0])}`); hardReject(`unpaid: ${quote(unpaid[0])}`); }
  const comm = firstMatch(COMMISSION, text);
  if (comm) { add(E.commissionOnlyScore, `commission only ${quote(comm[0])}`); hardReject(`commission only: ${quote(comm[0])}`); }

  // ---- professional license / clinical registration
  const lic = licenseRequirement(title, body);
  let license: LicenseRequirement = lic.level;
  if (license === "none" && primary?.f.id === "counselor") license = "unclear";
  if (license === "required") { add(LIC.requiredScore, `license / clinical registration required ${quote(lic.hit)}`); warnings.push("License required"); if (LIC.hardReject) hardReject(`mandatory professional license: ${quote(lic.hit)}`); }
  else if (license === "preferred") { add(LIC.preferredScore, `license preferred ${quote(lic.hit)}`); warnings.push("License preferred"); }
  else if (license === "unclear" && LIC.unclearScore) add(LIC.unclearScore, lic.hit ? `credential mentioned, requirement unclear ${quote(lic.hit)}` : "regulated role? license requirement unclear");

  // ---- education
  const rel = firstMatch(EDU_REL, body);
  if (rel) add(RULES.education.relevantScore, `relevant degree welcome ${quote(rel[0])}`);
  else {
    const un = firstMatch(EDU_UNREL, body);
    if (un) { add(RULES.education.unrelatedScore, `unrelated degree required ${quote(un[0])}`); warnings.push("Technical degree"); }
  }

  // ---- other language mandatory (English is normal)
  let langHit: string | null = title.match(LANG_TITLE)?.[0] ?? null;
  if (langHit) langHit = `${langHit} (title)`;
  outer2: for (const re of langHit ? [] : LANG_REQ) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const sentence = sentenceAround(text, m.index ?? 0);
      if (LANG_EXC.some((r) => r.test(sentence))) continue;
      langHit = m[0]; break outer2;
    }
  }
  if (!langHit && FOREIGN_TEXT) {
    const head = `${title}\n${body.slice(0, 600)}`;
    const n = (head.match(FOREIGN_TEXT) ?? []).length, en = (head.match(ENGLISH_TEXT) ?? []).length;
    if (n >= (L.foreignTextMinHits ?? 6) && n > en) langHit = `text not in English (${n} foreign stop-words)`;
  }
  if (langHit) { add(L.score, `another language mandatory ${quote(langHit)}`); warnings.push("Language"); hardReject(`requires another language: ${quote(langHit)}`); }

  // ---- time zone
  const tzp = firstMatch(TZ_POS, text);
  if (tzp) { add(TZ.positiveScore, `European / flexible hours ${quote(tzp[0])}`); badges.push("EU hours"); }
  const tzn = firstMatch(TZ_NEG, text);
  if (tzn) { add(TZ.negativeScore, `US working hours ${quote(tzn[0])}`); warnings.push("US hours"); }
  if (job.timezones) badges.push(job.timezones);

  // ---- other negatives in the text
  for (const g of NEG_TEXT) {
    const m = firstMatch(g.re, body);
    if (!m) continue;
    add(g.score, `${g.label} ${quote(m[0])}`);
    if (g.score <= -100) hardReject(`${g.label}: ${quote(m[0])}`);
  }

  // ---- positives
  for (const g of POS) {
    if (g.id === "serbia-named" && (job.locationVerified || eligibility === "serbia")) continue;
    if (g.id === "english-only" && langHit) continue;
    const m = firstMatch(g.re, text);
    if (!m) continue;
    if (g.score) add(g.score, `${g.label} ${quote(m[0])}`);
    if (g.badge) badges.push(g.badge);
    if (g.id === "serbia-named" && eligibility === "unclear") eligibility = "serbia";
  }

  // ---- skill / concept chips (strongest 4–8, groups relevant to the primary family first)
  const found = CONCEPTS.filter((c) => c.re.some((r) => r.test(text)));
  if (found.length) add(Math.min(RULES.conceptScoreMax, RULES.conceptScore * found.length), `concepts: ${found.slice(0, 6).map((c) => c.label).join(", ")}${found.length > 6 ? "…" : ""}`);
  const order = uniq([...(primary ? PREFERRED_GROUPS[primary.f.id] ?? [] : []), ...RULES.conceptGroupOrder]);
  const concepts = uniq(found.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group)).map((c) => c.label)).slice(0, 8);

  if (primary) badges.unshift(primary.f.badge ?? primary.f.label);
  for (const x of secondaries.slice(0, 2)) badges.push(x.f.badge ?? x.f.label);
  // generic bonuses (remote, eligible, junior, full-time, degree) stack to 100+ on their own: without a title-level family match a card is never "excellent",
  // without any family (adjacent title / industry only) never "good"
  const cap = !primary ? FR.adjacentOnlyMaxScore : !primary.t ? FR.noTitleMaxScore : undefined;
  if (cap != null && score > cap) add(cap - score, `capped at ${cap}: ${!primary ? "no job family in the title or description" : "job family not in the title"}`);
  reasons.push(`= ${score}`);
  return {
    score, level: levelOf(score), reasons, matchReasons, negativeReasons,
    primaryCategory: primary?.f.id ?? null, categories: [primary?.f.id, ...secondaries.map((x) => x.f.id)].filter((x): x is string => !!x),
    badges: uniq(badges), concepts, warnings: uniq(warnings), reject, eligibility, license, seniorityLevel, yearsRequired: years, junior, fullTime, remoteFinal, industries: industryIds,
  };
}

/** Why a listing is hidden (hard rejection or score below the threshold), or null when it is shown. */
export function hideReason(s: Scoring): string | null {
  if (s.reject) return s.reject;
  if (s.score < CONFIG.minScore) return `score ${s.score} < ${CONFIG.minScore}`;
  return null;
}
