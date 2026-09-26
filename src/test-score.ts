/**
 * Offline regression tests for the matcher (no network):  npm test
 * Each fixture is a listing as an adapter would return it plus what we expect from rules.json (docs/brief.md §35 acceptance criteria).
 */
import { CONFIG } from "./config.ts";
import { hideReason, scoreJob } from "./score.ts";
import type { Job } from "./types.ts";

type Expect = { min?: number; max?: number; primary?: string; categories?: string[]; shown?: boolean; reject?: boolean; license?: string; eligibility?: string; warn?: string[]; badge?: string[]; remote?: string };
const j = (title: string, description: string, extra: Partial<Job> = {}): Job => ({ source: "himalayas", id: `t:${title}`, url: "", title, company: "Acme", locations: [], remote: "unknown", employment: [], postedAt: null, tags: [], description, ...extra });
const WW = "Fully remote, work from anywhere in the world. ";
const CASES: Array<[string, Job, Expect]> = [
  // ---- A behavioral science
  ["behavioral scientist", j("Behavioral Scientist", WW + "Design behavior change interventions for our digital health app, run experiments on adherence and habit formation, apply behavioral economics and nudges. Psychology or behavioral science degree. 1-3 years of experience."), { min: 100, primary: "behavioral-science", shown: true }],
  ["research scientist member experience (title unknown, concepts strong)", j("Research Scientist, Member Experience", WW + "Mental health app. Behavior change, adherence, intervention experiments, CBT modules, member outcomes and clinical outcomes.", { remote: "remote" }), { min: 75, shown: true }],
  // ---- B digital health, C DTx
  ["digital health specialist", j("Digital Health Program Specialist", WW + "Support telehealth programs, patient engagement and clinical outcomes for a digital mental health platform. Entry level welcome."), { min: 75, primary: "digital-health", shown: true }],
  ["dtx designer", j("Digital Therapeutics Designer", WW + "Design evidence-based intervention modules (CBT, ACT) and treatment pathways for a prescription digital therapeutic. Psychoeducation content, clinical protocols."), { min: 75, primary: "digital-therapeutics", shown: true }],
  // ---- D UX research: generic SaaS lower than mental-health
  ["uxr generic saas", j("UX Researcher", WW + "Run usability tests and user interviews for a B2B invoicing SaaS. Synthesize research findings. 2 years of experience."), { shown: true, max: 99 }],
  ["uxr mental health", j("UX Researcher", WW + "Interview vulnerable users of our mental health app, run diary studies with sensitive populations, human-centered design, psychological safety in research. 2 years of experience. Background in psychology."), { min: 100, primary: "ux-research", shown: true }],
  // ---- E product
  ["pm mental health", j("Product Manager", WW + "Own the roadmap of a digital mental health platform: clinical workflows, therapist experience, member outcomes, HIPAA. Work with clinicians."), { min: 100, primary: "healthtech-product", shown: true }],
  ["pm fintech senior", j("Product Manager", WW + "B2B payments platform. Own the roadmap for payment APIs and fraud tooling. 5+ years of product management experience."), { shown: false }],
  // ---- F AI safety / T&S
  ["ai safety evaluator", j("AI Safety Evaluator", WW + "Evaluate model responses for harmful outputs, self-harm safety and crisis escalation; rate conversations against safety policies; red teaming; human feedback for LLMs. Psychology background preferred."), { min: 100, primary: "ai-safety", shown: true }],
  ["conversation quality specialist", j("Conversation Quality Specialist", WW + "Evaluate AI companion conversations for empathy, self-harm safety, crisis escalation and policy compliance."), { min: 100, primary: "ai-safety", shown: true }],
  ["ai safety engineer infra", j("AI Safety Engineer", WW + "Build adversarial ML pipelines in Python and PyTorch, CUDA kernels, Kubernetes, distributed systems, C++ inference optimization, CI/CD."), { shown: false }],
  ["trust and safety analyst", j("Trust & Safety Analyst", WW + "Review reported content, enforce community guidelines, handle sensitive topics including self-harm, work with policy teams. Entry level."), { min: 75, primary: "ai-safety", shown: true }],
  // ---- G conversation / prompt design
  ["prompt engineer psychology", j("Prompt Engineer", WW + "Write and iterate system prompts for a therapeutic chatbot; design conversation flows and guardrails for sensitive topics; tone of voice and empathy; work with clinical psychologists."), { min: 75, primary: "conversation-design", shown: true }],
  ["conversation designer", j("Conversation Designer", WW + "Design dialogue flows, persona and tone of voice for an AI mental health coach; sensitive topics; prompt design."), { min: 100, primary: "conversation-design", shown: true }],
  // ---- H human-centered AI, I human risk
  ["human-centered ai researcher", j("Human-Centered AI Researcher", WW + "Study human-AI interaction, user well-being and psychological impact of AI assistants; responsible AI, fairness, human oversight. Cognitive science or psychology PhD or Master's."), { min: 100, primary: "human-centered-ai", shown: true }],
  ["human risk analyst", j("Human Risk Analyst", WW + "Analyse phishing simulation and social engineering data, employee behaviour, cognitive bias and security culture; design behaviour change campaigns."), { min: 75, primary: "human-risk", shown: true }],
  ["soc analyst", j("SOC Analyst", WW + "Monitor SIEM alerts, triage incidents, malware analysis, firewall rules, threat hunting, EDR."), { shown: false, reject: true }],
  // ---- J coaching, K counselor, L corporate well-being
  ["mental health coach part-time", j("Mental Health Coach", WW + "1-on-1 video coaching sessions on stress management, burnout and resilience for members. No clinical license required. ICF a plus.", { employment: ["part-time"] }), { min: 100, primary: "coaching", shown: true, license: "none" }],
  ["counselor license required", j("Remote Counselor", WW + "Provide online counselling to clients via video. Must hold an active license (LPC, LMHC or equivalent) and 2 years of supervised practice."), { primary: "counselor", license: "required", warn: ["License required"], shown: true }],
  ["corporate wellbeing", j("Employee Well-being Specialist", WW + "Run workplace mental health workshops, psychological safety and burnout prevention programs for distributed teams; employee engagement surveys."), { min: 100, primary: "corporate-wellbeing", shown: true }],
  // ---- M content, N persona, O narrative
  ["evidence-based content strategist", j("Content Strategist", WW + "Write evidence-based psychoeducation content, CBT worksheets and course modules for a mental health app; review the scientific literature with clinical psychologists."), { min: 100, primary: "content", shown: true }],
  ["generic seo writer", j("Content Writer", WW + "Write SEO blog posts for e-commerce clients, keyword research, 4 articles a week."), { shown: false }],
  ["ai persona designer", j("AI Persona Designer", WW + "Create personas and character voice for an AI companion; write dialogue with emotional realism and safety boundaries; LLM prompts."), { min: 75, primary: "ai-persona", shown: true }],
  ["narrative designer games", j("Narrative Designer", WW + "Write branching narrative, dialogue and psychologically authentic characters with emotional arcs for an interactive fiction studio; Ink / Twine. Contract."), { min: 75, primary: "narrative-design", shown: true }],
  // ---- P talent, Q consumer, R org psych
  ["talent assessment specialist", j("Talent Assessment Specialist", WW + "Design structured behavioral interviews and competency frameworks, psychometric assessments, candidate evaluation; I/O psychology background."), { min: 75, primary: "talent-assessment", shown: true }],
  ["generic recruiter", j("Recruiter", WW + "Source candidates on LinkedIn, schedule interviews, manage the ATS pipeline, hit hiring targets."), { max: 99 }],
  ["consumer psychologist", j("Consumer Insights Researcher", WW + "Qualitative research on consumer behaviour, decision making and brand perception; in-depth interviews and surveys; behavioral economics. Psychology degree."), { min: 100, primary: "consumer-psychology", shown: true }],
  ["organizational psychologist", j("Organizational Development Consultant", WW + "Team dynamics, psychological safety, change management and culture work with remote teams; employee engagement surveys; facilitation. Organisational psychology Master's."), { min: 100, primary: "organizational-psychology", shown: true }],
  // ---- hard rejects
  ["software engineer", j("Software Engineer", WW + "TypeScript, React, Node.js, PostgreSQL, AWS."), { reject: true }],
  ["psychiatrist", j("Psychiatrist (Telehealth)", WW + "Prescribe medication, MD required."), { reject: true }],
  ["us only", j("Behavioral Scientist", "Remote within the United States only. Behavior change, nudges, experiments, adherence.", { locations: ["United States"], remote: "remote" }), { reject: true, eligibility: "excluded" }],
  ["us only in text", j("Behavioral Scientist", "Remote. Behavior change, nudges, experiments. Must be authorized to work in the US without sponsorship.", { remote: "remote" }), { reject: true }],
  ["hybrid", j("Behavioural Scientist", "Behaviour change, nudges, experiments, adherence. Hybrid: 3 days a week in the London office."), { reject: true, remote: "hybrid" }],
  ["director", j("Director of Behavioral Science", WW + "Lead the behavioral science team; behavior change, nudges, experiments."), { reject: true, warn: ["Director+"] }],
  ["german required", j("Behavioral Scientist", WW + "Behavior change, nudges, experiments. Fluent German (C1) is required."), { reject: true }],
  ["unpaid", j("Mental Health Coach (volunteer)", WW + "Unpaid volunteer role, 1-on-1 support and burnout coaching."), { reject: true }],
  ["mlm", j("Wellness Coach", WW + "Build your own wellness business. Starter kit purchase required, multi-level marketing."), { reject: true }],
  ["no target family", j("Warehouse Associate", WW + "Pick and pack orders."), { reject: true }],
  // ---- eligibility / license / seniority nuances
  ["serbia location", j("UX Researcher", "Remote. Mental health app; user interviews with patients; usability testing; 2 years.", { locations: ["Serbia"], remote: "remote" }), { eligibility: "serbia", shown: true }],
  ["europe location", j("UX Researcher", "Remote. Mental health app; user interviews; usability testing; 2 years.", { locations: ["Europe"], remote: "remote" }), { eligibility: "europe" }],
  ["remote us location string", j("Behavioral Scientist", "Behavior change, nudges, experiments.", { locations: ["Remote - US"], remote: "remote" }), { eligibility: "excluded", reject: true }],
  ["license preferred", j("Behavioral Health Coach", WW + "Coach members on habits and stress; LCSW or LPC preferred but not required."), { license: "preferred", shown: true }],
  ["7+ years", j("Behavioral Scientist", WW + "Behavior change, nudges, experiments. 7+ years of experience required."), { warn: ["7+ years"] }],
  ["junior signal", j("Behavioral Science Associate", WW + "Behavior change, nudges, experiments. Entry level, we will train you."), { badge: ["Junior-friendly"], min: 100 }],
  ["adjacent title + industry only", j("Program Coordinator", WW + "Coordinate our digital mental health program for members; support clinicians and coaches; track member outcomes."), { shown: true }],
  // ---- regressions from the first live runs (26./27.09.2026)
  ["paid volunteer time is a perk, not an unpaid role", j("Campaign Marketing Intern", WW + "Psychoeducation content for our mental health app; behavior change campaigns. As a paid intern you also get 8 hours of paid volunteer time."), { reject: false }],
  ["volunteering role type is unpaid", j("Community Ambassador", WW + "Support our AI safety community events.", { tags: ["Volunteering"] }), { reject: true }],
  ["anywhere in US is US only", j("Behavioral Scientist", "Behavior change, nudges, experiments, adherence.", { locations: ["Anywhere in US"], remote: "remote" }), { eligibility: "excluded", reject: true }],
  ["anywhere in Europe is Europe", j("Behavioral Scientist", "Behavior change, nudges, experiments, adherence.", { locations: ["Anywhere in Europe"], remote: "remote" }), { eligibility: "europe", shown: true }],
  ["hr business partner is not an executive", j("HR Business Partner", WW + "Psychological safety, employee engagement surveys, burnout prevention programs and workplace mental health workshops for distributed teams."), { reject: false, shown: true }],
  ["engineering manager is a software role", j("Engineering Manager - Data Platform", WW + "Lead a team of backend engineers. We offer great benefits, a caring culture, productivity tools and B2B customers."), { reject: true }],
  ["curriculum developer is not a software developer", j("Music Curriculum Developer", WW + "Write evidence-based psychoeducation and course modules for children's well-being programs; work with psychologists."), { reject: false, shown: true }],
  ["field service engineer", j("Field Service Engineer", WW + "Install and repair medical imaging equipment at hospital sites; travel to customer locations."), { reject: true }],
  ["payment advisor with employer boilerplate", j("Merchant Services Virtual Payment Advisor", WW + "Sell payment processing to merchants. Who we are: we value culture, belonging, benefits, wellness and our clients. 401(k), veteran status, E-Verify."), { shown: false }],
  ["ad in spanish", j("Psicólogo/a para plataforma de salud mental", "Buscamos un psicólogo para nuestro equipo. Trabajo remoto con pacientes de la plataforma. Experiencia en terapia cognitivo conductual y salud mental. Ofrecemos contrato para el puesto y formación continua con nuestro equipo."), { reject: true }],
  ["remote areas is not remote work", j("Field Coordinator, remote areas of Turkana", "Mental health and psychosocial support (MHPSS) programs serving hard-to-reach and remote areas of the county.", { locations: ["Kenya"] }), { remote: "unknown" }],
  ["weak concept-only family is not a good match", j("Risk Operations Analyst", "Analyse fraud patterns and payment risk. We offer wellness stipends and mindfulness sessions.", { locations: ["Worldwide"], remote: "remote", locationVerified: true }), { max: 74 }],
  ["hr generalist at a dialysis company is not organisational psychology", j("HR Generalist", "Fresenius Medical Care, dialysis services. Administer payroll, contracts, onboarding paperwork, HR records. Benefits: mental health days, coaching budget, wellness allowance. 2+ years of experience.", { locations: ["Serbia"], remote: "remote", locationVerified: true, employment: ["full-time"] }), { max: 99 }],
  ["bare psychology subfield title is psychology work", j("Developmental Psychology", WW + "Subject-matter expert for AI training data: review child development scenarios and rate model answers. PhD or Master's in psychology.", { remote: "remote" }), { primary: "behavioral-science", shown: true }],
  ["project support specialist is not a coach", j("Project Support Specialist", "Support clinical trial project managers with trackers, meeting minutes and vendor invoices. 2+ years of experience.", { locations: ["Serbia"], remote: "remote", locationVerified: true, employment: ["full-time"] }), { shown: false }],
];

let fail = 0;
for (const [name, job, e] of CASES) {
  const s = scoreJob(job);
  const shown = !hideReason(s);
  const errs: string[] = [];
  if (e.min !== undefined && s.score < e.min) errs.push(`score ${s.score} < ${e.min}`);
  if (e.max !== undefined && s.score > e.max) errs.push(`score ${s.score} > ${e.max}`);
  if (e.primary && s.primaryCategory !== e.primary) errs.push(`primary ${s.primaryCategory} != ${e.primary}`);
  if (e.shown !== undefined && shown !== e.shown) errs.push(`shown=${shown} (${hideReason(s) ?? "visible"}) expected ${e.shown}`);
  if (e.reject !== undefined && !!s.reject !== e.reject) errs.push(`reject=${s.reject} expected ${e.reject}`);
  if (e.license && s.license !== e.license) errs.push(`license ${s.license} != ${e.license}`);
  if (e.eligibility && s.eligibility !== e.eligibility) errs.push(`eligibility ${s.eligibility} != ${e.eligibility}`);
  if (e.remote && s.remoteFinal !== e.remote) errs.push(`remote ${s.remoteFinal} != ${e.remote}`);
  for (const w of e.warn ?? []) if (!s.warnings.includes(w)) errs.push(`missing warning "${w}" (have: ${s.warnings.join(", ")})`);
  for (const b of e.badge ?? []) if (!s.badges.includes(b)) errs.push(`missing badge "${b}" (have: ${s.badges.join(", ")})`);
  const ok = errs.length === 0;
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${String(s.score).padStart(4)} ${(s.primaryCategory ?? "-").padEnd(26)} ${name}${ok ? "" : `\n       ${errs.join("; ")}\n       ${s.reasons.join(" ; ")}`}`);
}
console.log(`\n${CASES.length - fail}/${CASES.length} passed (threshold ${CONFIG.minScore})`);
process.exit(fail ? 1 : 0);
