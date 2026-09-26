# Remote Health-Tech / Psychology / AI Safety Job Scraper — Claude Implementation Brief

## 1. Goal

Build a new local job scraper app for **fully remote roles at the intersection of psychology, health-tech, digital health, AI safety, human-centered AI, coaching, organizational psychology, behavioral science, content, product, and related business/strategy work**.

The scraper should run locally on:

```text
http://localhost:3008
```

There is already a reference project here:

```text
C:\Users\aleks\Desktop\Stanovi\dete-jobs
```

Use that project as the **primary implementation reference**.

The new scraper should use the **same local setup, architecture, UI model, cards, filters, state handling, deduplication, persistence, scan flow, and overall UX** wherever practical.

Do not redesign the application from scratch unless the existing structure genuinely cannot support this use case.

The intended end result is:

> the same scraper product model as `dete-jobs`, but with a new role taxonomy, new search logic, new scoring rules, and a different job domain.

---

# 2. Very Important Matching Rule

Do **NOT** rely on strict title matching.

The jobs in this domain are inconsistent in how companies name them.

For example, a role relevant to `Behavioral Scientist` may instead be posted as:

- Behavioral Science Researcher
- Behavioral Researcher
- Behavioral Insights Specialist
- Applied Behavioral Scientist
- Behavior Change Specialist
- Behavioral Design Lead
- Behavioral Product Researcher
- Health Behavior Researcher
- Behavioral Intervention Designer
- Behavioral UX Researcher

The scraper must therefore use:

1. title keywords
2. description keywords
3. related concepts
4. adjacent job families
5. skill / responsibility signals
6. industry signals
7. semantic similarity where practical

The system should prefer **recall over overly strict filtering**.

A potentially relevant listing should be shown if the responsibilities match, even if the exact title is unfamiliar.

### Example

A job titled:

```text
Research Scientist, Member Experience
```

may still be highly relevant if the description includes:

```text
behavior change
mental health
digital intervention
user research
clinical outcomes
well-being
```

Do not reject that role only because the title does not contain `Behavioral Scientist`.

---

# 3. Core Target Domain

The scraper should focus on roles in these broad areas:

1. Health-Tech & Product Development
2. Digital Mental Health / Digital Therapeutics
3. Behavioral Science / Behavioral Design
4. UX Research in Health / Mental Health
5. AI Safety / Trust & Safety / Responsible AI
6. Human-Centered AI / AI Psychology
7. Cyberpsychology / Human Risk
8. Mental Health Coaching / Well-being
9. Corporate Well-being / Organizational Psychology
10. Evidence-Based Content / Psychoeducation
11. AI Persona / Conversational Experience Design
12. Narrative Design / Psychological Character Design
13. Talent / Behavioral Interviewing
14. Consumer Psychology / Brand Strategy
15. Organizational Design / People Strategy
16. Product / Program / Strategy roles in mental health / health-tech

---

# 4. Main Job Families

## A. Behavioral Science — VERY HIGH PRIORITY

Primary titles:

- Behavioral Scientist
- Behavioural Scientist
- Applied Behavioral Scientist
- Behavioral Science Researcher
- Behavioral Researcher
- Behavioral Insights Specialist
- Behavioral Insights Researcher
- Behavioral Science Consultant
- Behavioral Design Specialist
- Behavioral Designer
- Behavior Change Specialist
- Behaviour Change Specialist
- Behavior Change Scientist
- Behavioral Intervention Specialist
- Behavioral Intervention Designer
- Behavioral Product Researcher
- Behavioral Product Designer
- Health Behavior Scientist
- Health Behavior Researcher
- Behavioral Health Researcher
- Decision Scientist
- Applied Psychology Researcher
- Experimental Psychologist

Related concepts to detect in descriptions:

- behavior change
- behaviour change
- behavioral science
- behavioral economics
- cognitive bias
- habit formation
- motivation
- adherence
- intervention design
- digital intervention
- health behavior
- psychological mechanisms
- decision making
- behavior modification
- engagement science
- persuasive design
- nudges
- behavioral insights

---

## B. Digital Health / Digital Mental Health — VERY HIGH PRIORITY

Primary titles:

- Digital Health Specialist
- Digital Health Researcher
- Digital Health Scientist
- Digital Mental Health Researcher
- Digital Mental Health Specialist
- Digital Health Product Specialist
- Digital Health Program Manager
- Digital Health Program Specialist
- Mental Health Product Specialist
- Behavioral Health Product Specialist
- Digital Behavioral Health Specialist
- Digital Health Consultant
- Health Innovation Specialist
- Health Innovation Manager
- Health-Tech Specialist
- HealthTech Researcher

Industry / description signals:

- digital health
- digital mental health
- mental health platform
- behavioral health
- telehealth
- teletherapy
- remote care
- mental wellness
- digital care
- patient engagement
- member engagement
- health outcomes
- clinical outcomes
- preventive health
- population health

---

## C. Digital Therapeutics / DTx — VERY HIGH PRIORITY

Primary titles:

- Digital Therapeutics Designer
- Digital Therapeutics Specialist
- DTx Designer
- DTx Product Specialist
- DTx Researcher
- Digital Therapeutics Researcher
- Intervention Designer
- Clinical Intervention Designer
- Behavioral Intervention Designer
- Digital Intervention Designer
- Therapeutic Content Designer
- Therapeutic Program Designer
- Digital Care Designer

Description signals:

- digital therapeutics
- DTx
- CBT
- cognitive behavioral therapy
- DBT
- ACT
- evidence-based intervention
- clinical protocol
- therapeutic protocol
- treatment pathway
- care pathway
- psychoeducation
- digital treatment
- intervention modules
- clinical efficacy

---

## D. UX Research / Human Factors in Health — VERY HIGH PRIORITY

Primary titles:

- UX Researcher
- User Researcher
- Health UX Researcher
- Healthcare UX Researcher
- Mental Health UX Researcher
- Behavioral UX Researcher
- Product Researcher
- User Insights Researcher
- Experience Researcher
- Human Factors Researcher
- Human Factors Specialist
- Human-Centered Design Researcher
- Design Researcher
- Qualitative Researcher
- Mixed Methods Researcher

Description signals:

- user testing
- usability testing
- qualitative interviews
- user interviews
- diary studies
- cognitive load
- accessibility
- psychological safety
- sensitive users
- vulnerable populations
- patient research
- participant research
- human factors
- human-centered design
- UX research
- product research
- research synthesis

Do not require the word `health` in the title if the company/product is clearly health-tech or mental-health related.

---

## E. Health-Tech Product Management — VERY HIGH PRIORITY

Primary titles:

- Product Manager
- Health-Tech Product Manager
- Digital Health Product Manager
- Behavioral Health Product Manager
- Mental Health Product Manager
- Product Owner
- Product Specialist
- Product Operations Specialist
- Product Operations Manager
- Product Strategy Associate
- Product Strategy Manager
- Product Program Manager
- Clinical Product Manager
- Clinical Product Specialist

Relevant description signals:

- health-tech
- digital health
- mental health
- clinical requirements
- patient experience
- provider experience
- clinical workflows
- behavioral health
- digital therapeutics
- care delivery
- clinical content
- member outcomes

Important:

`Product Manager` should only match strongly when the **industry or responsibilities** align with this scraper domain.

Generic SaaS PM roles should not rank highly.

---

# 5. AI Safety / Trust & Safety / Responsible AI

## F. AI Mental Health Safety / Evaluation — VERY HIGH PRIORITY

Primary titles:

- AI Safety Evaluator
- AI Evaluator
- AI Quality Evaluator
- AI Behavior Evaluator
- AI Response Evaluator
- Model Evaluator
- LLM Evaluator
- AI Safety Analyst
- AI Safety Specialist
- Trust & Safety Evaluator
- Trust & Safety Analyst
- Trust & Safety Specialist
- Responsible AI Analyst
- Responsible AI Specialist
- AI Risk Analyst
- AI Risk Specialist
- AI Policy Analyst
- Safety Operations Specialist
- Safety Quality Analyst
- Conversation Quality Evaluator
- AI Conversation Reviewer
- AI Quality Reviewer
- AI Trainer
- Human Feedback Specialist
- RLHF Evaluator

Strong description signals:

- mental health
- crisis response
- self-harm safety
- sensitive conversations
- harmful outputs
- hallucinations
- empathetic responses
- safe completion
- model behavior
- response quality
- safety evaluation
- red teaming
- policy evaluation
- trust and safety
- responsible AI
- AI alignment
- human feedback
- LLM evaluation
- conversational AI

Do not require the title to mention mental health if the actual job includes evaluating emotionally sensitive AI interactions.

---

## G. Clinical Prompt / Conversation Design — VERY HIGH PRIORITY

Primary titles:

- Clinical Prompt Engineer
- Prompt Engineer
- Prompt Designer
- Conversation Designer
- Conversational AI Designer
- AI Conversation Designer
- Dialogue Designer
- Conversational UX Designer
- Conversational Experience Designer
- LLM Prompt Specialist
- AI Content Designer
- AI Interaction Designer
- AI Experience Designer
- AI Behavior Designer
- AI Persona Designer

Description signals:

- prompt design
- prompt engineering
- system prompts
- conversation flows
- guardrails
- safety prompts
- emotional input
- sensitive topics
- mental health
- chatbot
- therapeutic chatbot
- AI companion
- AI coach
- conversational UX
- dialogue design
- persona design
- tone of voice
- empathy
- response style
- LLM behavior

Important:

Do not filter out `Prompt Engineer` just because some prompt roles are highly technical.

Inspect whether the role emphasizes psychology, conversation, writing, safety, empathy, and behavior versus primarily software engineering.

---

## H. Human-Centered AI / Responsible AI — VERY HIGH PRIORITY

Primary titles:

- Human-Centered AI Researcher
- Human-Centered AI Specialist
- Human-Centered AI Consultant
- Human AI Interaction Researcher
- Human-AI Interaction Researcher
- Responsible AI Consultant
- Responsible AI Specialist
- AI Ethics Specialist
- AI Ethics Researcher
- AI Ethics Consultant
- Ethical AI Specialist
- AI Governance Associate
- AI Governance Specialist
- AI Policy Researcher
- Responsible Technology Consultant
- Tech Ethics Researcher

Description signals:

- human-AI interaction
- AI ethics
- user well-being
- psychological impact
- responsible AI
- AI governance
- AI safety
- ethical frameworks
- bias
- fairness
- human oversight
- AI accountability
- wellbeing
- digital well-being

---

# 6. Cyberpsychology / Human Risk

## I. Human Risk / Security Behavior — HIGH PRIORITY

Primary titles:

- Human Risk Analyst
- Human Risk Specialist
- Human Factors Security Analyst
- Cyberpsychology Researcher
- Security Behavior Analyst
- Behavioral Security Analyst
- Security Awareness Specialist
- Security Awareness Program Specialist
- Human-Centered Security Researcher
- Social Engineering Researcher
- People Risk Analyst
- Human Cyber Risk Specialist

Description signals:

- phishing
- social engineering
- security awareness
- employee behavior
- cognitive bias
- human error
- insider risk
- remote-work fatigue
- security culture
- behavioral security
- cyberpsychology
- human factors
- user behavior

Exclude roles that are purely technical cybersecurity engineering with no meaningful human/behavioral component.

---

# 7. Direct Client Support / Coaching

## J. Mental Health Coach / Well-being — VERY HIGH PRIORITY

Primary titles:

- Mental Health Coach
- Well-being Coach
- Wellbeing Coach
- Wellness Coach
- Behavioral Health Coach
- Emotional Well-being Coach
- Resilience Coach
- Stress Management Coach
- Burnout Coach
- Life Coach
- Care Coach
- Member Coach
- Health Coach
- Well-being Practitioner
- Mental Health Practitioner
- Wellness Practitioner
- Support Coach

Description signals:

- 1-on-1 support
- burnout
- stress management
- life transitions
- resilience
- well-being
- goal setting
- emotional support
- behavior change
- remote coaching
- video sessions
- member support

### Licensing / Credential Rule

Do not automatically reject coaching roles that do not require clinical licensure.

Clearly distinguish coaching / well-being roles from regulated therapist / psychologist / counselor roles.

---

## K. Counselor / Psychological Consultant — CONDITIONAL PRIORITY

Primary titles:

- Counselor
- Counsellor
- Psychological Counselor
- Psychological Consultant
- Mental Health Consultant
- Mental Wellness Consultant
- Well-being Consultant
- Behavioral Consultant
- Remote Counselor

Many counselor roles are regulated.

The scraper should extract and prominently flag:

- license required
- registration required
- country-specific credentials
- supervised practice requirements

Do not treat `Counselor` and `Coach` as equivalent.

---

## L. Corporate Well-being / Employee Mental Health — VERY HIGH PRIORITY

Primary titles:

- Corporate Well-being Specialist
- Corporate Wellbeing Specialist
- Employee Well-being Specialist
- Employee Wellness Specialist
- Workplace Well-being Specialist
- Well-being Program Manager
- Wellness Program Manager
- Corporate Wellness Consultant
- Employee Experience Specialist
- Psychological Safety Specialist
- Psychological Safety Consultant
- Mental Health Program Manager
- Well-being Program Specialist
- Employee Health Program Specialist
- Burnout Prevention Specialist

Description signals:

- employee well-being
- psychological safety
- burnout prevention
- stress management
- workplace mental health
- workshops
- corporate programs
- distributed teams
- remote workforce
- resilience
- employee engagement

---

# 8. Content / Narrative / Psychological Design

## M. Evidence-Based Content / Psychoeducation — VERY HIGH PRIORITY

Primary titles:

- Evidence-Based Content Strategist
- Health Content Strategist
- Mental Health Content Strategist
- Clinical Content Strategist
- Clinical Content Writer
- Health Content Writer
- Mental Health Writer
- Psychoeducation Content Writer
- Psychoeducational Content Specialist
- Content Researcher
- Health Writer
- Educational Content Designer
- Learning Content Designer
- Clinical Content Designer
- Curriculum Designer
- Learning Experience Designer
- Instructional Designer

Description signals:

- evidence-based
- clinical research
- psychoeducation
- mental health
- worksheets
- workbooks
- course content
- therapeutic exercises
- CBT exercises
- behavioral exercises
- clinical review
- scientific literature
- psychology content
- well-being education

---

## N. AI Persona / Character / Dialogue Design — HIGH PRIORITY

Primary titles:

- AI Persona Designer
- Persona Designer
- AI Character Designer
- Character Writer
- Character Designer
- Dialogue Writer
- Dialogue Designer
- Conversational Writer
- Conversational Designer
- AI Content Writer
- AI Personality Designer
- AI Interaction Writer
- Narrative UX Writer

Description signals:

- persona
- dialogue
- empathy
- emotional realism
- conversational AI
- AI companion
- chatbot personality
- character voice
- relationship dynamics
- human-like conversation
- tone
- safety boundaries

---

## O. Narrative Design / Interactive Media — HIGH PRIORITY

Primary titles:

- Narrative Designer
- Narrative Writer
- Game Writer
- Interactive Narrative Designer
- Story Designer
- Character Narrative Designer
- Quest Writer
- Interactive Fiction Writer
- Narrative Researcher

Description signals:

- psychologically authentic characters
- character relationships
- emotional arcs
- dialogue
- branching narrative
- interactive fiction
- character psychology
- relationship dynamics
- player psychology
- emotional storytelling

Do not require health-tech overlap for this category.

---

# 9. Organizational / Consumer / Talent Roles

## P. Talent / Behavioral Interviewing — HIGH PRIORITY

Primary titles:

- Behavioral Interviewer
- Talent Assessment Specialist
- Talent Assessment Consultant
- Assessment Specialist
- People Assessment Specialist
- Talent Acquisition Specialist
- Talent Acquisition Partner
- Recruiter
- Tech Recruiter
- Executive Recruiter
- Interview Specialist
- Selection Specialist
- Candidate Assessment Specialist
- People Researcher

Description signals:

- behavioral interviewing
- structured interviews
- assessment
- candidate evaluation
- competency framework
- psychometrics
- hiring decisions
- leadership assessment
- executive assessment

Do not over-score generic recruiters unless there is a meaningful assessment / behavioral component.

---

## Q. Consumer Psychology / Behavioral Marketing — VERY HIGH PRIORITY

Primary titles:

- Consumer Psychologist
- Consumer Insights Specialist
- Consumer Insights Researcher
- Consumer Researcher
- Behavioral Marketing Specialist
- Behavioral Marketing Researcher
- Brand Strategist
- Behavioral Brand Strategist
- Customer Insights Specialist
- Customer Insights Researcher
- Audience Insights Analyst
- User Insights Specialist
- Market Researcher
- Market Research Analyst
- Research Strategist
- Brand Researcher

Description signals:

- consumer behavior
- decision making
- cognitive psychology
- customer psychology
- brand perception
- motivation
- audience behavior
- behavioral economics
- qualitative research
- consumer research
- customer insights

---

## R. Organizational Psychology / Organizational Design — VERY HIGH PRIORITY

Primary titles:

- Organizational Psychologist
- Organisational Psychologist
- Organizational Development Specialist
- Organizational Development Consultant
- Organization Design Specialist
- Organizational Designer
- People Strategy Consultant
- People Strategy Specialist
- Team Effectiveness Consultant
- Team Effectiveness Specialist
- Workplace Consultant
- Employee Experience Consultant
- Organizational Effectiveness Specialist
- Culture Consultant
- Culture & Engagement Specialist
- People Experience Specialist
- People Analytics Consultant
- Change Management Consultant

Description signals:

- team dynamics
- organizational behavior
- workplace psychology
- communication processes
- team effectiveness
- remote teams
- distributed teams
- conflict resolution
- organizational design
- culture
- employee engagement
- change management
- psychological safety

---

# 10. Adjacent Role Families — Do Not Miss These

Potentially relevant titles:

- Research Associate
- Research Scientist
- Research Specialist
- Research Consultant
- Research Program Manager
- Program Manager
- Program Specialist
- Program Coordinator
- Clinical Program Specialist
- Innovation Specialist
- Innovation Consultant
- Strategy Consultant
- Strategy Associate
- Health Strategy Consultant
- Product Researcher
- Experience Researcher
- Member Experience Researcher
- Member Experience Specialist
- Patient Experience Specialist
- Patient Engagement Specialist
- Member Engagement Specialist
- Customer Insights Specialist
- User Insights Researcher
- Human Factors Specialist
- Human Factors Researcher
- Learning Experience Designer
- Learning Designer
- Instructional Designer
- Knowledge Specialist
- Community Program Manager
- Community Health Specialist
- Content Researcher
- Safety Specialist
- Policy Specialist
- Policy Analyst
- Research Operations Specialist

These should only rank highly when description / company / industry context supports the psychology, health-tech, AI safety, behavioral, or human-centered use case.

---

# 11. Semantic / Fuzzy Matching Requirement

This is critical.

Do not implement a simple allowlist such as:

```text
if title contains exact_keyword => show
```

Instead, calculate relevance using multiple signals:

```text
Title match
+ Description concept match
+ Industry / company match
+ Responsibilities match
+ Skills match
+ Seniority fit
+ Remote fit
+ Location eligibility
```

Example:

```text
Title: Research Scientist, Engagement
Company: mental health app
Description: behavior change, adherence, intervention experiments, CBT, member outcomes
```

This should rank very highly even though `Behavioral Scientist` is not in the title.

Another example:

```text
Title: Conversation Quality Specialist
Description: evaluates AI companion conversations for empathy, self-harm safety, crisis escalation and policy compliance
```

This should match the AI Mental Health Auditor / Trust & Safety family.

### Suggested implementation approaches

Use whichever best fits the existing scraper architecture:

- synonym groups
- category concept dictionaries
- weighted keyword groups
- fuzzy title matching
- description classification
- optional embeddings / semantic similarity if already available or simple to maintain
- LLM classification only if it does not make scans expensive/unreliable

Do not make the entire scraper depend on an external LLM API unless explicitly approved.

A robust local weighted matcher is preferable for the base system.

---

# 12. Positive Industry Signals

Boost companies / job descriptions mentioning:

- mental health
- behavioral health
- psychology
- psychotherapy
- digital health
- health-tech
- healthcare
- telehealth
- digital therapeutics
- employee well-being
- wellness
- AI companion
- conversational AI
- responsible AI
- AI safety
- trust and safety
- coaching
- behavioral science
- user research
- human-centered design
- human-AI interaction
- workplace psychology
- organizational psychology
- consumer psychology
- game narrative
- interactive media

---

# 13. Useful Skill / Concept Badges

Extract these from descriptions when present.

### Psychology / Behavioral

- CBT
- DBT
- ACT
- behavioral science
- behavior change
- psychology
- cognitive psychology
- motivational interviewing
- psychometrics
- qualitative research
- mixed methods
- experimental design

### Research

- user interviews
- usability testing
- surveys
- research synthesis
- A/B testing
- experiments
- thematic analysis
- quantitative research
- qualitative research

### AI

- LLM
- prompt engineering
- prompt design
- conversational AI
- AI safety
- responsible AI
- trust & safety
- RLHF
- red teaming
- evaluation
- human feedback

### Health

- digital health
- mental health
- behavioral health
- digital therapeutics
- clinical content
- clinical research
- patient experience
- member experience

### Product / Design

- product management
- product strategy
- UX research
- human-centered design
- service design
- product research
- user experience

### Content / Narrative

- content strategy
- psychoeducation
- instructional design
- narrative design
- dialogue writing
- persona design
- curriculum design

### Organizational

- psychological safety
- employee engagement
- organizational development
- team effectiveness
- change management
- workplace well-being

Do not show too many badges on the card. Show only the strongest 4-8.

---

# 14. Licensing / Clinical Credentials

This domain contains regulated roles.

The scraper should extract and classify credential requirements.

Potential hard requirements:

- licensed psychologist
- licensed therapist
- licensed clinical social worker
- LCSW
- LMFT
- LPC
- LMHC
- PsyD
- clinical psychologist license
- state license
- HCPC
- BACP registration
- local clinical registration
- medical license

Store something like:

```text
licenseRequirement:
  none
  preferred
  required
  unclear
```

If a role is a strong match but requires a license, either hard-reject it according to candidate profile config or keep it visible with a strong `License Required` warning badge.

Prefer making this configurable.

---

# 15. Education / Experience Matching

Do not automatically reject roles based on degree wording if the field is adjacent.

Potentially relevant requested degrees:

- Psychology
- Clinical Psychology
- Counseling Psychology
- Behavioral Science
- Cognitive Science
- Social Science
- Human-Computer Interaction
- UX Research
- Public Health
- Health Sciences
- Organizational Psychology
- Industrial-Organizational Psychology
- Neuroscience
- Sociology
- Education
- Communication

Down-rank or reject if the role clearly requires an unrelated technical specialty.

Experience logic:

```text
0-2 years = strong positive
1-3 years = positive
3-5 years = possible depending on role
5+ years = strong negative for junior candidate unless otherwise configured
Senior/Lead/Director = strong negative
```

Do not hard-code seniority only from title; inspect description.

---

# 16. Remote Rules

Primary focus should be remote opportunities.

Positive:

- fully remote
- remote
- remote-first
- distributed team
- work from anywhere
- work from home
- global remote

Potentially valid:

- Europe remote
- EMEA remote
- Eastern Europe
- Worldwide
- Global

Hard reject / hide by default:

- onsite
- hybrid
- office required
- relocation required
- location excludes Serbia

Important:

`Remote` does not automatically mean Serbia is eligible. Check geographic restrictions.

---

# 17. Location Eligibility

Strong positive:

- Serbia
- Worldwide
- Anywhere in the World
- Global
- Eastern Europe
- Balkans
- Europe if Serbia is explicitly accepted
- EMEA if Serbia is accepted

Hard reject if explicit:

- US only
- Canada only
- UK only
- EU-only with Serbia excluded
- must have US work authorization
- specific-country residence required
- relocation required

If eligibility is unclear:

```text
eligibilityStatus = unclear
```

Do not silently assume.

---

# 18. Employment Type

Primary preferred:

- full-time
- permanent
- contract if stable / long-term

Also allow:

- part-time
- freelance
- consulting

if role relevance is very strong.

Do not exclude these categories globally because psychology / content / coaching roles are often contract-based.

Use employment type as a badge and scoring factor, not an absolute keyword filter.

---

# 19. Suggested Scoring Philosophy

Use weighted scoring rather than binary keyword matching.

Example:

```text
+45 exact core role family match
+35 strong description-level concept match
+30 mental health / digital health / behavioral health industry
+30 AI safety / responsible AI / human-centered AI relevance
+25 fully remote
+25 Serbia / Worldwide / EMEA eligibility
+20 psychology / behavioral science responsibilities
+20 user research / UX research responsibilities
+20 digital intervention / DTx relevance
+20 coaching / workplace well-being relevance
+15 content / narrative / psychoeducation relevance
+15 organizational psychology relevance
+15 consumer psychology relevance
+10 adjacent title but strong responsibilities

-100 location excludes Serbia
-100 mandatory professional license not held, if configured as hard reject
-80 purely technical software role
-70 unrelated industry and unrelated responsibilities
-60 director / VP / head / executive role
-50 7+ years mandatory
-40 5+ years mandatory
-30 hybrid / onsite
-25 unclear relevance
```

Suggested labels:

```text
100+ Excellent Match
75+  Strong Match
50+  Possible Match
<50  Hide by default
```

Tune after seeing real results.

---

# 20. Search Query Strategy

Do not run only exact-title searches.

Use several search families.

### Behavioral / Health-Tech

```text
behavioral scientist remote
behavioral science remote
behavior change remote
behavioral health researcher remote
digital health psychology remote
digital mental health remote
digital therapeutics remote
DTx remote
health behavior researcher remote
behavioral design remote
```

### UX / Research

```text
UX researcher mental health remote
UX researcher healthcare remote
user researcher digital health remote
human factors healthcare remote
product researcher health remote
behavioral UX researcher remote
member experience researcher remote
patient experience researcher remote
```

### Product

```text
mental health product manager remote
digital health product manager remote
behavioral health product manager remote
clinical product specialist remote
healthtech product remote
```

### AI Safety / Responsible AI

```text
AI safety evaluator remote
LLM evaluator psychology remote
trust safety mental health remote
responsible AI psychology remote
AI conversation evaluator remote
AI quality evaluator remote
human centered AI remote
AI ethics remote
AI companion safety remote
conversational AI psychology remote
```

### Prompt / Conversation / Persona

```text
clinical prompt engineer remote
conversation designer AI remote
conversational UX remote
AI persona designer remote
AI dialogue designer remote
prompt designer mental health remote
AI interaction designer remote
```

### Coaching / Well-being

```text
mental health coach remote
wellbeing coach remote
behavioral health coach remote
corporate wellbeing remote
psychological safety remote
employee wellbeing specialist remote
burnout prevention remote
```

### Content

```text
mental health content strategist remote
clinical content writer remote
psychoeducation content remote
health content strategist remote
evidence based content psychology remote
instructional designer mental health remote
```

### Consumer / Organization / Talent

```text
consumer psychologist remote
consumer insights psychology remote
organizational psychologist remote
organizational development remote
people strategy psychology remote
behavioral interviewer remote
talent assessment specialist remote
team effectiveness remote
```

### Narrative

```text
narrative designer remote psychology
AI persona writer remote
character writer remote
interactive narrative designer remote
conversation writer AI remote
```

Search broad variants and let the relevance engine decide.

---

# 21. Source Strategy

Use the same source / adapter model already present in `dete-jobs` if available.

If that project already has working job-board integrations, reuse them.

Good source families to consider:

- LinkedIn Jobs
- Wellfound
- Himalayas
- Remote OK
- We Work Remotely
- Working Nomads
- Remotive
- Jobgether
- Indeed
- Glassdoor
- direct company career pages
- startup job boards
- health-tech company career pages
- AI company career pages

Do not assume every source is scrapeable. Test capability first.

---

# 22. Companies / Industry Types Worth Detecting

Do not use a static company allowlist, but company type can influence relevance.

High-value company categories:

- digital mental health platforms
- therapy platforms
- coaching platforms
- digital health startups
- telehealth companies
- behavioral health companies
- employee well-being platforms
- HR tech / people science companies
- AI companion companies
- conversational AI companies
- AI safety companies
- responsible AI teams
- gaming / interactive narrative studios
- UX research consultancies
- behavioral science consultancies
- organizational psychology consultancies
- consumer insights agencies

---

# 23. Job Card UI

Use the **same UI model as `dete-jobs`**.

Each job card should show:

- company name
- company logo if available
- source badge
- job title
- location
- remote / employment type badges
- primary category badges
- secondary skill/concept badges
- salary if available
- short 2-4 line summary
- optional match explanation
- warnings such as `License Required`, `US Only`, `5+ Years`, `Hybrid`

Examples of primary badges:

```text
Remote
Full-Time
Behavioral Science
Mental Health
AI Safety
UX Research
DTx
Psychology
```

Examples of secondary badges:

```text
CBT
LLM
Prompt Design
User Research
Psychological Safety
Psychoeducation
Conversational AI
```

Actions should reuse existing behavior:

- Favorite
- Applied
- Reject
- Open

Preserve state across rescans.

---

# 24. Filters

Reuse existing navigation and filtering patterns.

Useful filters:

- New
- Favorites
- Applied
- Rejected
- All Sources
- Behavioral Science
- Digital Health
- Digital Therapeutics
- UX Research
- Product
- AI Safety
- Responsible AI
- Prompt / Conversation Design
- Coaching
- Corporate Well-being
- Content / Psychoeducation
- Narrative Design
- Organizational Psychology
- Consumer Psychology
- Talent / Assessment
- Fully Remote
- Serbia Eligible
- License Not Required
- Full-Time
- Contract
- Salary Listed

Do not overcomplicate the initial UI.

---

# 25. Deduplication

Deduplication is mandatory.

The same job may appear on employer career page, LinkedIn, Indeed, remote boards, and aggregators.

Use:

1. canonical URL
2. source job ID
3. normalized company
4. normalized title
5. location
6. description similarity
7. posted date

Prefer direct employer career page as the primary `Open` link.

Store alternate sources internally.

Do not re-create a new card when the same role appears from another source later.

---

# 26. Persistence

Use the same persistence approach as `dete-jobs`.

Persist:

- Favorite
- Applied
- Rejected
- hidden company if feature exists
- discoveredAt
- firstSeen
- lastSeen
- match score
- user state after dedup

State must survive refresh, rescan, and app restart.

---

# 27. Scan Behavior

Reuse existing scan flow.

Expected behavior:

1. scan sources independently
2. collect listings
3. normalize
4. enrich descriptions if needed
5. calculate domain relevance
6. classify job family
7. evaluate location / license / seniority
8. calculate match score
9. deduplicate
10. persist
11. update UI

One broken scraper must not stop the others.

---

# 28. Logging / Diagnostics

For each source log:

- source
- query
- pages scanned
- jobs found
- jobs accepted
- jobs rejected
- jobs hidden for low score
- errors
- duration

Example:

```text
[Himalayas] query="behavioral scientist" found=31 accepted=12 lowScore=15 rejected=4 duration=2.0s
```

For rejected jobs, keep a reason during development:

```text
Rejected: US-only
Rejected: mandatory clinical license
Rejected: purely technical ML engineer
Rejected: Director-level
```

---

# 29. Match Explanation / Classification

Every accepted job should internally store:

```text
primaryCategory
secondaryCategories
matchScore
matchReasons
negativeReasons
```

Example:

```text
primaryCategory: AI Safety
secondaryCategories:
  - Mental Health
  - Conversational AI

matchReasons:
  + evaluates AI responses
  + crisis / self-harm safety
  + conversational quality
  + psychology background preferred
  + fully remote
```

This is essential because many titles will not be obvious.

---

# 30. False Positive Prevention

### `AI Safety Engineer`

If primarily infrastructure, adversarial ML, model internals, Python/C++, or security engineering, probably not a fit.

If primarily model behavior, human evaluation, trust & safety, policy, or harmful output evaluation, it may be a strong fit.

### `UX Researcher`

Generic enterprise SaaS UXR = possible but lower score.

Mental health / health-tech / sensitive users / human-AI interaction = strong score.

### `Research Scientist`

Machine learning research = likely reject.

Behavior change / psychology / user research / mental health = strong match.

### `Product Manager`

Generic fintech PM = low score.

Mental health / digital therapeutics / clinical product PM = strong match.

### `Content Writer`

Generic SEO writer = low score.

Evidence-based psychology / health content = strong score.

---

# 31. Hard Reject Categories

Unless description indicates a human/psychology angle, reject:

- software engineer
- frontend engineer
- backend engineer
- DevOps engineer
- ML infrastructure engineer
- data engineer
- cloud engineer
- QA engineer
- cybersecurity engineer
- SOC analyst
- penetration tester
- psychiatrist requiring medical license
- physician
- nurse
- unrelated accounting / finance roles
- unrelated legal roles

Do not reject `AI`, `security`, `research`, or `product` roles by title alone. Inspect responsibilities first.

---

# 32. Configurability

Do not scatter keywords across scraper adapters.

Centralize:

```text
config/
  jobFamilies
  synonymGroups
  conceptKeywords
  industrySignals
  positiveSignals
  negativeSignals
  licensingRules
  remoteRules
  eligibilityRules
  seniorityRules
  scoringRules
  sources
```

The taxonomy will evolve after real-world testing.

Make it easy to add a synonym, new job family, description concept, hard reject, or scoring weight without editing scraper logic.

---

# 33. Port / Local Setup

Run the new app on:

```text
PORT=3008
```

Expected URL:

```text
http://localhost:3008
```

Use the same startup / package / environment variable pattern as:

```text
C:\Users\aleks\Desktop\Stanovi\dete-jobs
```

Avoid port conflicts with the other local scraper apps.

---

# 34. Implementation Instructions for Claude

Before writing significant code:

1. Open and inspect:

```text
C:\Users\aleks\Desktop\Stanovi\dete-jobs
```

2. Understand:

- framework
- server setup
- frontend structure
- storage
- scraper adapters
- source config
- job normalization
- deduplication
- Favorite / Applied / Reject behavior
- new-job detection
- card UI
- filtering
- scan button
- persistence
- port configuration

3. Reuse the same architecture and patterns wherever appropriate.

4. Create this new scraper as an **identical product model with different domain logic**.

5. Do not stop after writing a plan.

6. Implement end-to-end unless a genuine blocker requires user input.

7. Keep the matching logic broad and semantic enough that similar jobs are not missed simply because the company uses an unexpected title.

---

# 35. Acceptance Criteria

The project is complete when:

- app runs on `localhost:3008`
- UI follows the same design / interaction model as `dete-jobs`
- multiple sources can be scanned
- one failed source does not break the full scan
- matching is not strict-title-only
- related / adjacent titles are captured
- description concepts affect ranking
- job family classification works
- behavioral science roles are found
- digital health roles are found
- DTx roles are found
- mental-health UX roles are found
- health-tech product roles are found
- AI safety / trust & safety roles are found
- prompt / conversational AI roles are found
- coaching / well-being roles are found
- evidence-based content roles are found
- narrative / persona roles are found
- organizational psychology roles are found
- consumer psychology roles are found
- behavioral talent / assessment roles are found
- location eligibility is visible
- licensing requirement is visible
- salary is shown when provided
- Favorite works
- Applied works
- Reject works
- state persists
- duplicate jobs are merged
- employer direct URL is preferred
- scoring reasons are inspectable
- taxonomy / keywords are centrally configurable

---

# 36. Final Instruction

The core design principle is:

> **Do not miss a relevant job because the employer used a different title. Match the underlying work, not just the label.**

A title is only one signal.

The scraper should identify whether the actual work involves one or more of:

- psychology
- behavior change
- mental health
- digital health
- user research
- digital therapeutics
- AI safety
- responsible AI
- conversational AI
- human-AI interaction
- coaching
- well-being
- psychoeducation
- organizational psychology
- consumer behavior
- behavioral interviewing
- narrative psychology

and rank accordingly.
