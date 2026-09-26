# Company career pages (config.json → careers)

**463 companies (448 enabled) across 10 ATS kinds.** Built 26.09.2026 in two steps: (1) a WebSearch/GitHub research pass over ~660 companies in digital mental health, DTx, coaching & corporate well-being, AI labs & safety orgs, human-data / trust-and-safety vendors, conversational-AI & companion apps, people-science / research agencies and narrative game studios; (2) every slug cross-checked against public ATS tenant directories (kalil0321/ats-scrapers ≈ 36k tenants, kalebconfer-sys/job-board-directory with observed job counts, an autoapply validated snapshot from 12.09.2026, lucabarattini/project-x AI boards), which also corrected 34 slugs and contributed a few dozen more companies.

The build container had no direct network access to ATS hosts, so **nothing was requested live**. On the target PC run `npm run check -- --careers`: a wrong slug only logs `HTTP 404` for that company and the pass continues. Set `"enabled": false` for dead ones.

| Status | Meaning | Count |
|---|---|---:|
| directory | slug found verbatim in a public ATS tenant directory | 348 |
| corrected | research slug replaced by the directory's slug for that company name | 31 |
| discovered | added from the directories by domain keyword (coaching, mental health, psychology, …) | 28 |
| unverified | only from research memory; enabled unless confidence was low | 56 |

| ATS | companies |
|---|---:|
| ashby | 115 |
| bamboohr | 17 |
| greenhouse | 157 |
| lever | 58 |
| personio | 9 |
| recruitee | 5 |
| smartrecruiters | 21 |
| teamtailor | 4 |
| workable | 48 |
| workday | 29 |

| Company | ATS | Slug | Tags | Status | Open roles (directory snapshot) | Research notes | On |
|---|---|---|---|---|---:|---|---|
| 80,000 Hours | ashby | `80000hours` | ai-safety, responsible-ai | directory |  | London; remote-friendly within UK-adjacent time zones Careers advising nonprofit; advising, research, content roles. | on |
| 9amHealth | ashby | `join9am` | digital-health | directory | 18 | US remote; founders ex-mySugr (Vienna) so some EU Cardiometabolic virtual clinic | on |
| Alan | ashby | `alan` | digital-health | directory | 90 | France/Belgium/Spain/Canada; remote within EU common Digital health insurance + virtual clinic; prevention & mental well-being | on |
| Aleph Alpha | ashby | `alephalpha` | ai-safety, responsible-ai | directory | 1 | Heidelberg/Berlin; mostly Germany Sovereign European LLM provider; slug appears as 'alephalpha'/'AlephAlpha' in three lists. | on |
| Babbel | ashby | `babbel` | conversational-ai, ai-companion | directory |  | Berlin; EU kalil ashby.csv row. | on |
| Beamery | ashby | `beamery` | people-science, research | directory | 8 | London/US; some remote UK/EU 8 postings observed 2026-09. | on |
| BetterUp | ashby | `betterup` | conversational-ai, ai-companion | directory | 18 | US remote mostly 18 observed jobs; behavioral science and coaching roles. | on |
| Bland AI | ashby | `bland` | conversational-ai, ai-companion | directory | 17 | SF; mostly US 17 observed jobs; career-ops note 'Voice phone agents. $65M Series B'. | on |
| BlueDot Impact | ashby | `bluedot` | ai-safety, responsible-ai | directory |  | London; remote UK/EU-friendly AI safety courses; course design/ops/teaching roles. | on |
| Braintrust | ashby | `braintrust` | ai-safety, responsible-ai | directory | 24 | SF; US LLM eval tooling. SmartRecruiters 'braintrust' is a different BrainTrust. | on |
| Brightline | ashby | `hellobrightline` | mental-health, digital-health | directory | 10 | US Pediatric/teen mental health (formerly Emilio Health). | on |
| Bumble | ashby | `bumble` | ai-safety, trust-and-safety, human-feedback | corrected-exact (was greenhouse/bumble) |  | London/Barcelona/Austin hybrid; T&S roles often UK/EU | on |
| Cambly | ashby | `Cambly` | conversational-ai, ai-companion | directory | 8 | SF; some remote 8 observed jobs. | on |
| Cambridge Boston Alignment Initiative | ashby | `cbai` | ai-safety, responsible-ai | directory | 7 | Cambridge MA; US From Ashby registry. | on |
| Cartesia | ashby | `cartesia` | conversational-ai, ai-companion | directory | 30 | SF on-site 30 observed jobs; voice models. | on |
| Centre for Effective Altruism | ashby | `centreforeffectivealtruism` | ai-safety, responsible-ai | directory | 4 | Oxford/remote; hires internationally Community/events/ops roles; from Ashby registry. | on |
| Character.AI | ashby | `character` | ai-safety, trust-and-safety, human-feedback | corrected-prefix (was greenhouse/characterai) | 13 | Menlo Park onsite mostly Safety / persona-quality roles | on |
| ChartHop | ashby | `charthop` | people-science, research | unverified |  | US remote Seen in two independent 2026 company lists. | on |
| Cinder | ashby | `cinder` | ai-safety, trust-and-safety, human-feedback | directory | 7 | US remote (T&S tooling startup) | on |
| CoachHub | ashby | `coachhub` | coaching, well-being, mental-health | unverified (disabled) |  | Berlin; EU remote Slug contains a space - URL-encode as CoachHub%20Careers. | off |
| Coefficient Giving (formerly Open Philanthropy) | ashby | `coefficientgiving` | ai-safety, responsible-ai | directory | 2 | SF/DC; remote US, some international Renamed 2025; legacy board jobs.ashbyhq.com/openphilanthropy appears in the dataset - scra | on |
| Cohere | ashby | `cohere` | ai-safety, trust-and-safety, human-feedback | directory | 142 | Remote roles in Europe, UK, Canada, US (postings say 'Remote, Europe') Data / safety / evaluation roles | on |
| Credo AI | ashby | `credo.ai` | ai-safety, responsible-ai | directory | 4 | Remote US; some international AI governance platform; policy/responsible-AI roles; 6 postings in dataset. | on |
| Decagon | ashby | `decagon` | conversational-ai, ai-companion | directory | 123 | SF/NY/London; some EU 136-140 observed jobs; locations incl. 'Germany / Austria / London'. | on |
| Deel | ashby | `Deel` | people-science, research | directory |  | Worldwide remote; Serbia explicitly listed among hiring locations Large board; filter by title keywords. | on |
| Deepgram | ashby | `deepgram` | conversational-ai, ai-companion | directory | 83 | Remote US mostly Multiple directories; voice AI (STT/TTS, voice agents). | on |
| Delphi (digital clones) | ashby | `delphi` | conversational-ai, ai-companion | directory | 6 | SF; unknown 6 observed jobs; identity assumed to be the SF 'Delphi' AI-clone company (a SmartRecruiter | on |
| Docplanner | ashby | `docplanner` |  | directory | 36 | Poland/Spain/Italy/Brazil; remote EU (memory) 3 registry files; Workable/SmartRecruiters 'docplanner' legacy. | on |
| Dovetail | ashby | `dovetail` | people-science, research | directory | 4 | Sydney/SF; limited remote 4 postings observed. | on |
| Eight Sleep | ashby | `eightsleep` | digital-health | corrected-exact (was greenhouse/eightsleep) | 50 | NYC/SF, some US remote Search summary said applications go through Greenhouse but slug not shown — verify token | on |
| ElevenLabs | ashby | `elevenlabs` | ai-safety, responsible-ai | directory | 228 | Remote-first, hires widely across Europe (UK/PL/DE etc.); strong fit Voice AI; safety/T&S, conversational AI design roles. | on |
| Elicit | ashby | `elicit` | ai-safety, responsible-ai | directory | 10 | Oakland or remote within US time zones; effectively US-only AI research assistant (ex-Ought). Multiple 2025-2026 posting URLs. | on |
| Equip | ashby | `equip` | mental-health, digital-health | directory | 65 | US remote Virtual eating disorder treatment; remote ops/L&D roles. | on |
| Faculty | ashby | `faculty` | ai-safety, responsible-ai | directory | 67 | London hybrid; UK London applied-AI consultancy with an AI Safety practice (works with UK AISI); 80+ roles. | on |
| FAR.AI | ashby | `far.ai` | ai-safety, responsible-ai | directory | 15 | Berkeley; several roles listed 'Remote, Global' Own careers site embeds Ashby (ashby_jid params); registry slug 'far.ai'. Ops/events/peopl | on |
| Fiddler AI | ashby | `fiddler-ai` | ai-safety, responsible-ai | directory | 8 | Palo Alto; US AI observability. | on |
| Focus Entertainment | ashby | `focus` | games, narrative | directory | 2 | Paris | on |
| Gardens Interactive | ashby | `gardens` | games, narrative | directory |  | Remote US/Canada only, no visa help | on |
| Genies | ashby | `genies` | conversational-ai, ai-companion | directory | 1 | US (LA); unknown remote 1 observed job; avatar/AI persona company, LA. | on |
| Great Question | ashby | `greatquestion` | people-science, research | directory | 2 | US remote 2 postings observed. | on |
| Handshake AI | ashby | `handshake` | ai-safety, trust-and-safety, human-feedback | directory | 66 | Mostly US; AI expert-network contractor roles largely US-based | on |
| Headway | ashby | `headway` | mental-health, digital-health | directory |  | US-only Corporate roles on Ashby; therapist recruiting on Greenhouse token 'headway' (job-boards.g | on |
| Hims & Hers | ashby | `hims-and-hers` | digital-health | directory | 108 | US remote-first Telehealth incl. mental health | on |
| Hinge Health | ashby | `hinge-health` | digital-health | directory | 71 | US (SF/Portland/Minneapolis/Chicago + US remote) Digital MSK clinic; careers.hingehealth.com embeds Ashby | on |
| Hyperbound (AI sales roleplay) | ashby | `Hyperbound` | conversational-ai, ai-companion | directory | 3 | SF; US 3 observed jobs; builds AI buyer personas - persona/dialogue design fit. | on |
| HyperHug | ashby | `hyperhug` | games, narrative | directory |  | Worldwide remote (posting location 'Worldwide') | on |
| Inworld AI | ashby | `inworld-ai` | conversational-ai, ai-companion | directory | 18 | Mountain View + remote US; some Europe 18 observed jobs (kaleb 2026). AI characters/NPC engine - narrative & character design rol | on |
| Lakera | ashby | `lakera.ai` | ai-safety, responsible-ai | directory |  | Zurich/SF; EU-friendly (CH) AI security/guardrails; registry + career-ops list. | on |
| Lark Health | ashby | `lark` | digital-health | directory | 2 | US remote AI coaching for cardiometabolic care; PM Core App/AI coaching roles | on |
| Latitude (AI Dungeon) | ashby | `latitude` | conversational-ai, ai-companion | directory |  | Remote-first US historically kalil row 'Latitude,latitude,https://jobs.ashbyhq.com/latitude'. WARNING: Greenhouse token | on |
| Leapsome | ashby | `leapsome` | people-science, research | directory | 18 | Berlin/NYC; hires remote across EU 18 postings observed on the Ashby board (directory crawl 2026-09). Slug case-insensitive ( | on |
| Legion Health | ashby | `legionhealth` | mental-health, digital-health | directory | 154 | US (in-person for some roles) AI-native psychiatry clinic (YC). | on |
| Limbic | ashby | `limbic` | mental-health, digital-health | directory | 5 | UK + US remote AI therapy assistant used by NHS; hiring AI/ML and Peer Support Specialist roles. | on |
| Listen Labs | ashby | `listenlabs` | people-science, research | directory | 28 | US (SF) 31 postings observed. | on |
| LiveKit | ashby | `livekit` | conversational-ai, ai-companion | directory | 31 | Remote US + some global 31 observed jobs. | on |
| Machine Intelligence Research Institute (MIRI) | ashby | `miri` | ai-safety, responsible-ai | directory | 1 | Berkeley; some remote US Comms/policy roles since 2024 pivot. | on |
| Marvin Behavioral Health | ashby | `meetmarvin` | people-science, research | directory | 5 | US 5 postings observed. This is meetmarvin.com (mental health for clinicians), not the HeyMar | on |
| Maze | ashby | `mazedesign` | people-science, research | directory | 5 | Fully remote (EU/US) 5 postings observed. jobs.ashbyhq.com/mazehq is the unrelated security company. | on |
| Mercor | ashby | `mercor` | ai-safety, trust-and-safety, human-feedback | directory | 78 | Corporate roles SF; Ashby board also lists expert/contractor AI-training roles that are remote worldwide (incl. Europe) Very high volume of psychology/clinical/domain-expert AI trainer postings | on |
| Mistral AI | ashby | `mistral.ai` | ai-safety, responsible-ai | directory | 167 | Paris/London/Marseille mostly on-site; EU only Migrated from Lever 'mistral' (now permanently empty) to Ashby 'mistral.ai' (~160 roles pe | on |
| Morning Consult | ashby | `morningconsult` | people-science, research | directory | 11 | US 11 postings observed; older Lever board also listed. | on |
| Nous Research | ashby | `nousresearch` | ai-safety, responsible-ai | unverified |  | Remote, Americas time zones Open AI lab; evals roles (benchmark design, LLM-as-judge). | on |
| OpenAI | ashby | `openai` | ai-safety, trust-and-safety, human-feedback | directory | 734 | Mostly SF onsite/hybrid; a few remote-US Trust & safety, policy, human data, model behavior roles; red-team contractors are via ven | on |
| Outset | ashby | `outset` | people-science, research | directory | 16 | US 16 postings observed. | on |
| Oyster | ashby | `oyster` | people-science, research | corrected-exact (was greenhouse/oysterhr) | 23 | Worldwide remote | on |
| Pareto.AI | ashby | `pareto-ai` | ai-safety, trust-and-safety, human-feedback | directory | 3 | US corporate; expert-contractor data work worldwide via platform | on |
| Patreon | ashby | `patreon` | ai-safety, trust-and-safety, human-feedback | directory | 10 | US remote/hybrid T&S policy team | on |
| Pave | ashby | `pave` | people-science, research | directory |  | US Low relevance to psychology roles; included as people-ops target. | on |
| Perplexity | ashby | `perplexity` | ai-safety, responsible-ai | directory | 89 | SF/NYC hybrid; US Legacy Greenhouse 'perplexityai' and SmartRecruiters 'perplexity' exist in old lists; Ashb | on |
| Playgig | ashby | `playgig` | games, narrative | unverified |  | Remote-first US (Kingdom Come mobile etc.) | on |
| Preply (AI tutoring) | ashby | `preply` | conversational-ai, ai-companion | directory | 118 | Barcelona/Kyiv; remote across Europe 118 observed jobs. | on |
| Quora (Poe) | ashby | `quora` | ai-safety, trust-and-safety, human-feedback | directory | 6 | Remote-first; hires in many countries (US, Canada, UK, others) Moderation / policy roles | on |
| Rasa | ashby | `rasa` | conversational-ai, ai-companion | directory | 4 | Remote (Germany/EU) and US Live Ashby API verified 2026-09 with location 'Remote - Germany'. Older BambooHR 'rasa' an | on |
| Reality Defender | ashby | `realitydefender` | ai-safety, responsible-ai | directory | 6 | NYC; US Deepfake detection. | on |
| Regression Games | ashby | `regressiongg` | games, narrative | unverified |  | Remote US | on |
| Replicant | ashby | `Replicant` | conversational-ai, ai-companion | directory | 6 | Remote US/Canada 6 observed jobs; conversation designer roles historically. Older Lever 'replicant'. | on |
| Retell AI | ashby | `retell-ai` | conversational-ai, ai-companion | directory | 35 | SF; mostly US 35 observed jobs. Voice agents; conversation-quality roles. | on |
| Rula (formerly Path Mental Health) | ashby | `rula` | mental-health, digital-health | directory | 44 | US-only (most states except Hawaii) Remote-first; 250-330 open roles incl. product, strategy & ops. | on |
| Runway | ashby | `runway-ml` | ai-safety, responsible-ai | directory | 42 | NYC/SF hybrid; US Two boards seen: Ashby 'runway-ml' (validated watchlist, 'runway' is an unrelated finance  | on |
| Sailor Health | ashby | `sailorhealth` | mental-health, digital-health | directory | 155 | US remote (state-licensed) Virtual psychotherapy for seniors. | on |
| Sesame (Maya/Miles voice companion) | ashby | `sesame` | conversational-ai, ai-companion | directory | 26 | SF / Bellevue / NYC; largely on-site US 26 observed jobs (kaleb 2026). Older Lever site 'sesame' also listed. Voice companion/pers | on |
| Sidekick Health | ashby | `sidekick` | digital-health | directory |  | Reykjavik HQ, US and UK offices 'Sidekick Jobs' Ashby board surfaced with Sidekick Health query; verify org matches | on |
| Sierra | ashby | `sierra` | conversational-ai, ai-companion | directory | 192 | SF/NY/Atlanta/London/Munich; largely on-site 190-210 observed jobs; live-verified 2026-09 incl. Munich. Agent-experience/conversation d | on |
| Slingshot AI (Ash) | ashby | `slingshotai` | mental-health, digital-health | directory | 5 | NYC + London (hybrid); some remote Foundation model for psychology; posts Conversation Designer and Clinical Lead roles. High | on |
| Smallest.ai | ashby | `smallest` | conversational-ai, ai-companion | directory |  | India/US kalil ashby.csv row; voice AI. | on |
| SonderMind | ashby | `sondermind` | mental-health, digital-health | corrected-exact (was greenhouse/sondermind) |  | US (Denver / remote-US) Also has an Ashby org 'sondermind' (jobs.ashbyhq.com/sondermind) with therapist postings;  | on |
| Speak (AI language tutor) | ashby | `speak` | conversational-ai, ai-companion | directory | 43 | SF, Seoul, Tokyo, Ljubljana office (Slovenia) - some Europe 39 observed jobs; conversational tutor with dialogue/curriculum design roles. | on |
| Sprig | ashby | `sprig` | people-science, research | directory | 4 | US 4 postings observed. | on |
| Strava | ashby | `strava` | digital-health | corrected-exact (was greenhouse/strava) | 29 | US (SF), some remote Ashby board jobs.ashbyhq.com/Strava also live — may be migrating | on |
| Supercell | ashby | `supercell` | games, narrative | directory | 45 | Helsinki onsite (relocation offered) Not on Greenhouse (0 hits); RenderJobs verified Ashby slug supercell 2026-06 | on |
| Surge AI | ashby | `surge-ai` | ai-safety, trust-and-safety, human-feedback | directory | 30 | US-only remote for FTE roles (postings say 'United States - Remote'); worldwide contributor platform is separate (surgehq.ai, custom) ~30 postings; evaluation, data quality, RL environments | on |
| SurveyMonkey | ashby | `surveymonkey` | people-science, research | directory |  | US/Canada/EU (Dublin) Also surveymonkey.breezy.hr listed (likely older). | on |
| Suzy | ashby | `suzy` | people-science, research | directory |  | US | on |
| Synthesia | ashby | `synthesia` | ai-safety, responsible-ai | directory | 71 | London HQ; remote roles across UK/EU AI video; T&S / content moderation roles. | on |
| Synthflow AI | ashby | `synthflow` | conversational-ai, ai-companion | directory |  | Berlin HQ; EU-friendly FastApply SQL + kalil; voice agents. | on |
| Talkdesk | ashby | `talkdesk` | conversational-ai, ai-companion | directory |  | Lisbon; EMEA remote kalil ashby.csv; career-ops note 'Lisbon. Contact center AI. EMEA friendly.' | on |
| TapBlaze | ashby | `tapblaze` | games, narrative | directory | 5 | Los Angeles onsite; Senior Narrative Designer roles | on |
| Tavus | ashby | `tavus` | conversational-ai, ai-companion | directory | 15 | SF; US 15 observed jobs. | on |
| TELUS Digital (TELUS International AI) | ashby | `telus-digital` | ai-safety, trust-and-safety, human-feedback | directory | 93 | Worldwide AI-data crowd (AI Community) via custom portal; Ashby board is corporate, many remote roles Also Workday: telusinternational/wd3/External | on |
| TestGorilla | ashby | `testgorilla` | people-science, research | directory | 3 | Remote-first (NL HQ); hires across Europe and beyond 3 postings observed 2026-09. Older testgorilla.applytojob.com (JazzHR) also exists. | on |
| Textio | ashby | `textio` | people-science, research | directory |  | US remote From ATS directory list only. | on |
| thatgamecompany | ashby | `thatgamecompany` | games, narrative | directory |  | Remote - US only Sky/Journey studio | on |
| Tolan (Portola) | ashby | `tolan` | conversational-ai, ai-companion | directory |  | SF; unknown kalil ashby.csv row 'Tolan,tolan'. Alien-companion app; character/persona writing roles. | on |
| Unmind | ashby | `unmind` | mental-health, digital-health | corrected-exact (was workable/unmind) |  | Remote-first within the UK; occasional US roles Workplace mental health platform, London. | on |
| Valence | ashby | `valence` | coaching, well-being, mental-health | directory |  | US/UK/Canada AI coaching (Nadia). Unverified guess. | on |
| Vapi | ashby | `vapi` | conversational-ai, ai-companion | directory | 31 | SF on-site heavy 31 observed jobs. Voice-agent infrastructure. | on |
| Virta Health | ashby | `virtahealth` | digital-health | directory | 19 | US remote Type 2 diabetes reversal; enrollment, product, engineering | on |
| Voicemod | ashby | `voicemod` | conversational-ai, ai-companion | directory |  | Valencia, Spain; remote Spain/EU kalil ashby.csv row. | on |
| Voodoo | ashby | `voodoo` | games, narrative | corrected-exact (was lever/voodoo) | 102 | Paris; some remote-in-EU roles Lever board active through early 2026 (34 postings at June 2026 probe); a June 2026 postin | on |
| Whatnot | ashby | `whatnot` | ai-safety, trust-and-safety, human-feedback | directory |  | US, Ireland, UK, Germany; some remote T&S / marketplace integrity team | on |
| WHOOP | ashby | `whoop` | digital-health | directory | 159 | Boston-centric, US Legacy Lever board jobs.lever.co/whoop also exists — Ashby appears current | on |
| Wispr Flow | ashby | `wispr-flow` | conversational-ai, ai-companion | directory | 25 | SF on-site 24 observed jobs. | on |
| Woebot Health | ashby | `woebot-health` | mental-health, digital-health | unverified |  | US + Ireland (Dublin) AI CBT chatbot; has 'Don't see a fit? Apply here' general posting. Offices SF, Boston, Dub | on |
| Yubo | ashby | `yubo` | ai-safety, trust-and-safety, human-feedback | directory | 5 | Paris; some remote in France/EU Youth-safety focused social app | on |
| ZOE | ashby | `zoe` | digital-health | directory | 6 | UK + US, remote-first Legacy Lever board 'joinzoe' (jobs.lever.co/joinzoe) also seen; nutrition science, coachin | on |
| Alida | bamboohr | `alida` | people-science, research | directory |  | Canada Also alida.applytojob.com; current board unverified. | on |
| Brightside Health | bamboohr | `brightside` |  | directory |  | US-only (memory) 2 registry files. | on |
| Cognigy (NICE) | bamboohr | `cognigy` | conversational-ai, ai-companion | directory |  | Düsseldorf; EMEA remote possible BambooHR careers list; careers.cognigy.com is the front. Conversation designer roles histo | on |
| Conjecture | bamboohr | `conjecture` | ai-safety, responsible-ai | directory |  | London; unknown From BambooHR tenant registry; small London alignment lab. | on |
| Criteria Corp | bamboohr | `criteriacorp` | people-science, research | directory |  | US/AU From ATS directory list. | on |
| InMoment | bamboohr | `inmoment` | people-science, research | directory |  | US/UK/DE | on |
| Innersloth | bamboohr | `innersloth` | games, narrative | directory |  | Remote contract writer roles (Senior Writer, contract, remote - June 2026); US company, contractor location may be flexible BambooHR list endpoint innersloth.bamboohr.com/careers/list | on |
| Krisp | bamboohr | `krisp` | conversational-ai, ai-companion | directory |  | Yerevan/US; remote-friendly kalil bamboohr.csv row. | on |
| Little Otter | bamboohr | `littleotter` | mental-health, digital-health | corrected-exact (was greenhouse/littleotter) |  | US remote (state-licensed clinicians) Childhood mental health (0-14). | on |
| Logically | bamboohr | `logically` | ai-safety, responsible-ai | directory |  | UK/India Misinformation/OSINT; T&S analyst roles. | on |
| Nimble Giant Entertainment | bamboohr | `nimble` | games, narrative | corrected-prefix (was greenhouse/nimblegiant) |  | Buenos Aires; some remote LatAm | on |
| Offworld Industries | bamboohr | `owi` | games, narrative | directory |  | New Westminster, Canada | on |
| Ogilvy (incl. Ogilvy Consulting Behavioural Science) | bamboohr | `ogilvy` | people-science, research | corrected-prefix (was greenhouse/ogilvy) |  | Global offices; mostly hybrid boards.greenhouse.io/ogilvy redirects to ogilvy.com/work-with-us (Greenhouse-embedded). | on |
| Optimal Workshop | bamboohr | `optimalworkshop` | people-science, research | directory |  | New Zealand; some remote | on |
| Savanta | bamboohr | `savanta` | people-science, research | directory |  | UK/US | on |
| TELUS Health (LifeWorks) | bamboohr | `telushealth` | coaching, well-being, mental-health | corrected-prefix (was workday/telus|wd3|TELUS_Careers) |  | Canada/UK/AU; global counsellor network Unverified guess at tenant/site; TELUS Health also lists on telushealth.com. Global EAP wi | on |
| Voiceflow | bamboohr | `voiceflow` | conversational-ai, ai-companion | directory |  | Toronto; remote Canada/US kalil bamboohr.csv row. | on |
| 2K | greenhouse | `2k` | games, narrative | directory | 115 | Global offices (Canada, US, EU); mostly onsite/hybrid | on |
| Ada (ada.cx) | greenhouse | `ada` | conversational-ai, ai-companion | unverified |  | Toronto + remote Canada/US career-ops portals: 'Toronto + remote. AI customer service.' kaleb directory instead shows | on |
| Ada Health | greenhouse | `adahealth` | digital-health | directory |  | Berlin HQ, 45 nationalities; EU remote-friendly AI symptom assessment; medical/AI/quality roles; strong fit for Serbia-based applicants | on |
| AI Alignment Foundation (AIAF) | greenhouse | `aiaf` | ai-safety, responsible-ai | directory |  | unknown From Greenhouse registry; org details unverified. | on |
| Aisera | greenhouse | `aiserajobs` | conversational-ai, ai-companion | directory |  | US/India kalil greenhouse.csv row. | on |
| Allen Institute for AI (Ai2) | greenhouse | `thealleninstitute` | ai-safety, responsible-ai | directory | 24 | Seattle; US Open AI research nonprofit; responsible-AI roles. | on |
| Alma | greenhouse | `alma` | mental-health, digital-health | directory |  | US (NYC / remote-US) Therapist insurance/practice platform (helloalma.com). Also an Ashby org 'tryalma' appeare | on |
| AlphaSights | greenhouse | `alphasights` | people-science, research | directory | 83 | Global offices; office-based Greenhouse-embedded; token inferred from company name. Low fit for psychology roles. | on |
| Amae Health | greenhouse | `amaehealth` | mental-health, digital-health | directory | 29 | US Serious mental illness care model. | on |
| Amplitude Studios | greenhouse | `amplitude` | games, narrative | directory | 38 | Paris; 53 postings at June 2026 probe | on |
| Amwell | greenhouse | `amwell` |  | directory | 10 | US-only (memory) 3 registry files. Owns SilverCloud (digital CBT). | on |
| Anthropic | greenhouse | `anthropic` | ai-safety, trust-and-safety, human-feedback | directory | 396 | SF/London/Dublin/Zurich hybrid; limited remote Safeguards, policy, model welfare, societal impacts roles | on |
| Arize AI | greenhouse | `arizeai` | ai-safety, responsible-ai | directory | 27 | Remote US LLM observability/evals; remote postings seen. | on |
| AssemblyAI | greenhouse | `assemblyai` | conversational-ai, ai-companion | directory | 12 | Remote-first (US, some global) 12 vendor-observed jobs; older Workable 'assemblyai'. | on |
| Attest | greenhouse | `attest` | people-science, research | unverified |  | UK (London); UK remote | on |
| Automattic | greenhouse | `automatticcareers` | ai-safety, trust-and-safety, human-feedback | directory | 16 | Fully distributed, hires worldwide incl. Serbia Older token 'automattic' also seen; T&S for WordPress.com/Tumblr | on |
| Bandai Namco | greenhouse | `bandainamco` | games, narrative | directory |  | Global offices; onsite | on |
| BetterHelp | greenhouse | `betterhelpcom` | mental-health, digital-health | directory | 14 | US (some remote-US) Part of Teladoc Health. ~28 corporate roles incl. product design, ML. | on |
| Boulder Care | greenhouse | `bouldercare` | mental-health, digital-health | directory | 14 | US remote Digital addiction clinic; 100% remote W2 roles. | on |
| Bungie | greenhouse | `bungie` | games, narrative | directory | 2 | US-only remote (postings say 'Remote - United States'); many contract design roles Sept 2026 postings seen; Destiny narrative/design roles recur | on |
| Calibrate | greenhouse | `calibratecareers` | digital-health | unverified |  | US remote GLP-1 + 1:1 video coaching | on |
| Calm | greenhouse | `calm` | mental-health, digital-health | directory |  | US (roles listed 'anywhere in the U.S.') Consumer meditation/sleep app plus Calm Health B2B. | on |
| Carrot Fertility | greenhouse | `carrotfertility` | digital-health | directory | 20 | Global fertility platform; 'Best Companies for Remote Workers'; some international (English-speaking) ops roles | on |
| Cerebral | greenhouse | `cerebral` | mental-health, digital-health | directory |  | US fully remote Second token 'cerebralgoogle' also exists (job-boards.greenhouse.io/cerebralgoogle). | on |
| Charlie Health | greenhouse | `charliehealth` | mental-health, digital-health | directory | 294 | US (100% remote therapists, US-licensed) Main token 'charliehealth'; additional boards 'charliehealthbehavioralhealthoperations' an | on |
| Click Therapeutics | greenhouse | `clicktherapeutics` | mental-health | discovered in directory | 7 |  | on |
| Clover Health | greenhouse | `cloverhealth` | digital-health | directory | 65 | US remote; has Hong Kong tech office | on |
| Cresta | greenhouse | `cresta` | conversational-ai, ai-companion | directory | 94 | US/Canada remote; some India 6 directory sources; older Lever 'cresta' board retired. | on |
| Culture Amp | greenhouse | `cultureamp` | people-science, research | directory | 34 | Mostly AU/US/UK/NZ; some remote within those countries Greenhouse token literally seen in multiple job URLs (2018-2026). A stale config also list | on |
| Data & Society Research Institute | greenhouse | `datasocietyresearchinstitute` | ai-safety, responsible-ai | directory |  | NYC / remote US Tech & society research; registry + dataset. | on |
| Daybreak Health | greenhouse | `daybreakhealth` | mental-health, digital-health | directory | 23 | US remote School-district teletherapy; 40+ roles incl. product manager. | on |
| Dialpad | greenhouse | `dialpad` | conversational-ai, ai-companion | directory | 85 | US/Canada/Philippines; remote Multiple directories incl. API URL. | on |
| Digital Extremes | greenhouse | `digitalextremes` | games, narrative | directory | 3 | London, Ontario; onsite | on |
| Discord | greenhouse | `discord` | ai-safety, trust-and-safety, human-feedback | directory | 48 | US remote Large T&S / safety policy team | on |
| Doctolib | greenhouse | `doctolib` | digital-health | directory | 140 | France/Germany/Italy/Netherlands; hybrid, EU Also SmartRecruiters 'Doctolib1' (careers.smartrecruiters.com/Doctolib1) — scrape both | on |
| Dreem Health | greenhouse | `dreemhealth` | mental-health, digital-health | directory |  | US Sleep health / insomnia (CBT-I) telehealth; Greenhouse board API URL appeared directly in  | on |
| dscout | greenhouse | `dscout` | people-science, research | corrected-exact (was ashby/dscout) |  | US remote (Chicago HQ) Observed 2026-09; older dscout.bamboohr.com also listed. | on |
| Duolingo | greenhouse | `duolingo` | ai-safety, trust-and-safety, human-feedback | directory | 89 | Pittsburgh/NYC onsite mostly Learning science / AI content quality roles | on |
| Eleanor Health | greenhouse | `eleanorhealth` | mental-health, digital-health | unverified |  | US Addiction + mental health care. | on |
| Eleos Health | greenhouse | `eleoshealth` | mental-health, digital-health | directory | 17 | US remote + Israel EU-hosted Greenhouse board (try boards-api.eu.greenhouse.io if standard API returns nothin | on |
| Epic Games (incl. 3Lateral Novi Sad) | greenhouse | `epicgames` | games, narrative | directory | 164 | Global; Serbia via 3Lateral (Novi Sad); hybrid/onsite Appears in many 2026 scraper configs | on |
| Eucalyptus (Juniper/Pilot/Kin) | greenhouse | `eucalyptus` | digital-health | directory | 110 | Australia, UK, Germany Telehealth group; EU/UK roles | on |
| Ezra | greenhouse | `ezra` | coaching, people-science | discovered in directory |  |  | on |
| Fantastic Pixel Castle | greenhouse | `fantasticpixelcastle` | games, narrative | unverified |  | Fully remote studio (mostly US/Canada eligibility) | on |
| Five9 | greenhouse | `five9` | conversational-ai, ai-companion | directory | 120 | US remote + Portugal/EU offices Multiple directories incl. API URL. | on |
| Flo Health | greenhouse | `flohealth` | digital-health | directory | 34 | London + Vilnius, some remote (EU) Women's health app; medical advisory, product design, research | on |
| Forethought | greenhouse | `forethought` | conversational-ai, ai-companion | directory |  | SF; US kalil greenhouse.csv row. | on |
| Galileo | greenhouse | `galileo` | ai-safety, responsible-ai | directory | 13 | SF; US Registry row exists but a validated watchlist flagged the short 'galileo' slug as mapping  | on |
| Goodfire | greenhouse | `goodfire` | ai-safety, responsible-ai | directory | 30 | SF in-person Interpretability startup; 9 postings in dataset. | on |
| Google DeepMind | greenhouse | `deepmind` | ai-safety, responsible-ai | directory | 10 | On-site/hybrid London, Mountain View, NYC, Zurich; not remote Board token confirmed by multiple 2025-2026 posting URLs (e.g. Research Scientist, Gemini  | on |
| Grow Therapy | greenhouse | `growtherapy` | mental-health, digital-health | directory |  | US Recruiters also use Ashby per job descriptions, but public board found is Greenhouse. | on |
| Guerrilla Games | greenhouse | `guerrilla-games` | games, narrative | directory | 1 | Amsterdam onsite/hybrid From Baluffo url_patches (job-boards.greenhouse.io/guerrilla-games) | on |
| Haize Labs | greenhouse | `haizelabs` | ai-safety, responsible-ai | directory | 6 | NYC in-person Red-teaming/evals startup. | on |
| Hazel Health | greenhouse | `hazel` | mental-health, digital-health | directory | 18 | US School-based telehealth incl. mental health. | on |
| Headspace | greenhouse | `hs` | mental-health, digital-health | directory | 9 | Mostly US (some remote-US); a few UK roles; clinical/coach roles US-only Main corporate board. Ginger merged into Headspace. Sister boards: headspaceproviders (US- | on |
| Headspace Providers | greenhouse | `headspaceproviders` | mental-health, digital-health | directory | 8 | US-only (state licensure) Separate Greenhouse board for therapists/psychiatrists. | on |
| Headspace Sourcing (Coaches) | greenhouse | `headspacesourcing` | mental-health, digital-health | directory |  | US-focused Mental Health Coach (NBC-HWC or ICF certified) talent community board. | on |
| HiBob | greenhouse | `hibob` | coaching, well-being, mental-health | unverified (disabled) |  | IL/UK/US Unverified guess. | off |
| HiddenLayer | greenhouse | `hiddenlayer` | ai-safety, responsible-ai | directory | 12 | Remote US AI security vendor. | on |
| Highdive | greenhouse | `highdive` | games, narrative | directory | 11 | Montreal | on |
| Hinge | greenhouse | `hinge` | ai-safety, trust-and-safety, human-feedback | unverified |  | NYC hybrid Separate Greenhouse board from Match Group | on |
| Hive (thehive.ai) | greenhouse | `hive` | ai-safety, trust-and-safety, human-feedback | directory | 11 | SF onsite mostly Token 'hive' seen in company lists; confirm it is the moderation-AI Hive | on |
| Hone | greenhouse | `hone` | coaching, well-being, mental-health | corrected-exact (was ashby/hone) | 2 | US remote honehq.com live leadership coaching. Unverified guess. | on |
| Housemarque | greenhouse | `housemarque` | games, narrative | directory | 1 | Helsinki onsite | on |
| HoYoverse | greenhouse | `hoyoverse` | games, narrative | directory |  | Singapore, Montreal, LA, Tokyo; onsite; hires writers/localization | on |
| HumanSignal (Label Studio) | greenhouse | `humansignal` |  | directory | 45 | Remote (memory) 5 registry files. | on |
| Hume AI | greenhouse | `humeai` |  | directory | 5 | NYC; some remote US (memory) 7 registry files. Psychology-heavy research roles. | on |
| Inflection AI (Ashby board) | greenhouse | `inflectionai` | conversational-ai, ai-companion | directory | 6 | US Listed in FastApply import SQL and kalil ashby.csv as 'Inflection AI'. | on |
| Innodata Inc. | greenhouse | `innodatainc` | ai-safety | discovered in directory | 110 |  | on |
| Insomniac Games | greenhouse | `insomniac` | games, narrative | directory | 3 | Remote - United States only (many contract roles) Sept 2026 postings | on |
| Intercom (Fin) | greenhouse | `intercom` | conversational-ai, ai-companion | directory | 120 | Dublin/London/SF; hybrid, EMEA Many literal job URLs (2026); API boards-api.greenhouse.io/v1/boards/intercom/jobs. Also a | on |
| Invisible Technologies | greenhouse | `invisibletech` | ai-safety, trust-and-safety, human-feedback | directory | 16 | Remote-first, hires worldwide contractors and FTEs (some roles 'Remote US') EU-hosted Greenhouse board (job-boards.eu.greenhouse.io); if boards-api.greenhouse.io 404s | on |
| K Health | greenhouse | `khealthcareers` | digital-health | directory | 24 | US (NYC) + Israel (Tel Aviv) AI-enabled primary care | on |
| Kasisto | greenhouse | `kasisto` | conversational-ai, ai-companion | directory | 2 | US 2 vendor-observed jobs; banking conversational AI. | on |
| Koa Health | greenhouse | `koahealth` | mental-health, digital-health | unverified |  | EU (Spain) + US + UK EU-hosted Greenhouse board (job-boards.eu.greenhouse.io). Try boards-api.greenhouse.io/v1/ | on |
| Labelbox / Alignerr | greenhouse | `labelbox` | ai-safety, trust-and-safety, human-feedback | directory | 10 | Labelbox FTE mostly US; Alignerr expert-contractor program is worldwide via custom portal (alignerr.com) | on |
| Lantern | greenhouse | `lanternstudiosinc` | psychology | discovered in directory |  |  | on |
| Lantern (Employer Direct Healthcare) | greenhouse | `employerdirecthealthcare` | digital-health | directory |  | US | on |
| Lattice | greenhouse | `lattice` | people-science, research | corrected-exact (was lever/latticehq) | 8 | US-centric Lever site is latticehq (not lattice). Also a job-boards.greenhouse.io/lattice candidate a | on |
| League | greenhouse | `leagueinc` | coaching, well-being, mental-health | corrected-prefix (was greenhouse/league) | 12 | Canada/US Unverified guess. | on |
| LetsGetChecked | greenhouse | `letsgetchecked` | digital-health | directory |  | Ireland + US; EU EU Greenhouse host — try boards-api.eu.greenhouse.io/v1/boards/letsgetchecked/jobs if the  | on |
| LivePerson | greenhouse | `liveperson` | conversational-ai, ai-companion | directory | 17 | Remote US + EMEA (incl. Europe) API URL boards-api.greenhouse.io/v1/boards/liveperson/jobs listed; career-ops note 'Remote | on |
| manatee | greenhouse | `manatee` | psychology | discovered in directory |  | US Postings found only on Techstars Getro board; underlying ATS unknown. | on |
| Mantra Health | greenhouse | `mantrahealth` | mental-health, digital-health | directory | 16 | US remote College mental health; remote ops/people roles. | on |
| Maven Clinic | greenhouse | `mavenclinic` | digital-health | directory | 29 | US primarily, some UK; remote-friendly Women's/family health; separate provider board 'mavenclinicproviders' | on |
| Meru Health | greenhouse | `meruhealth` | mental-health, digital-health | directory | 1 | US (San Mateo / Denver) Finnish-founded, US-based online mental health program. | on |
| Midi Health | greenhouse | `midihealth` | digital-health | directory | 29 | US remote Menopause virtual care | on |
| Midsummer Studios | greenhouse | `midsummerstudios` | games, narrative | unverified |  | Remote-first US studio; check location eligibility per posting Narrative-heavy project; from curated studio careers list | on |
| Mintel | greenhouse | `mintel` | people-science, research | directory | 19 | Global offices (London, Chicago, APAC) mintel.com job pages carry gh_jid. | on |
| Modern Health | greenhouse | `modernhealth` | mental-health, digital-health | directory | 16 | Remote - US Employer mental health benefits platform. | on |
| Monomi Park | greenhouse | `monomipark` | games, narrative | unverified |  | San Mateo; board empty Sept 2026 | on |
| Moveworks | greenhouse | `moveworks` | conversational-ai, ai-companion | directory |  | US/India/Canada kalil greenhouse.csv row. | on |
| Naughty Dog | greenhouse | `naughtydog` | games, narrative | directory | 16 | Santa Monica; US Slug verified live by RenderJobs on 2026-06-02 | on |
| Nextdoor | greenhouse | `nextdoor` | ai-safety, trust-and-safety, human-feedback | directory | 19 | US Also 'nextdoorcampus' board | on |
| NICE (CXone, incl. Cognigy) | greenhouse | `nice` | conversational-ai, ai-companion | directory | 185 | Global; Israel/US/EU 185 vendor-observed jobs. | on |
| NOCD | greenhouse | `nocdinc` | mental-health, digital-health | unverified |  | US remote OCD telehealth; rolling therapist applications. | on |
| Noom | greenhouse | `noom` | digital-health | unverified |  | US (NY/Princeton) plus Tokyo board; some US remote Second board token 'noomgrowth' (Noom US: growth, product, design & research) seen at boar | on |
| Nourish | greenhouse | `usenourish` | digital-health | directory | 73 | US remote Dietitian telehealth, AI-native | on |
| Observe.AI | greenhouse | `observeai` | conversational-ai, ai-companion | directory | 18 | US remote + Bangalore 18 vendor-observed jobs; CareerView watchlist. | on |
| Octave | greenhouse | `octave` | mental-health, digital-health | directory | 30 | US Embed board also at boards.greenhouse.io/embed/job_board?for=octave. | on |
| Omada Health | greenhouse | `omadahealth` | digital-health | directory | 20 | 100% remote workforce, US-only hiring Chronic condition prevention/behavior change; health coach, PM, clinical roles | on |
| Ophelia | greenhouse | `ophelia` | mental-health, digital-health | directory | 15 | US remote Opioid use disorder telehealth. | on |
| Oscar Health | greenhouse | `oscar` | digital-health | directory | 288 | US Tech-driven insurer | on |
| Otter.ai | greenhouse | `otterai` | conversational-ai, ai-companion | directory | 22 | US 22 vendor-observed jobs. | on |
| Oula | greenhouse | `oulahealth` | digital-health | directory | 10 | US (clinic-based, some remote) Maternity care | on |
| Oura | greenhouse | `oura` | digital-health | directory | 107 | US (SF hybrid) and Finland (Oulu/Helsinki); limited remote Wearables; women's health design, research roles | on |
| Oviva | greenhouse | `oviva` | coaching, well-being, mental-health | unverified (disabled) |  | UK/DE/CH/FR/PL remote Unverified guess; digital dietetic coaching, hires coaches/dietitians remotely in several  | off |
| Parloa | greenhouse | `parloa` | conversational-ai, ai-companion | directory | 50 | Berlin/Munich HQ, EMEA + NYC; EU-friendly 50 vendor-observed jobs; EU board job-boards.eu.greenhouse.io/parloa. Conversation design  | on |
| Pelago (formerly Quit Genius) | greenhouse | `pelago` | mental-health, digital-health | directory | 17 | US remote + NYC; UK origins Substance use management; contract coach and product roles. | on |
| Peloton | greenhouse | `peloton` | digital-health | directory | 47 | US/UK/Germany, hybrid Also 'ptontalentcommunity' board | on |
| PlayQ | greenhouse | `playq` | games, narrative | directory | 1 | Santa Monica; US | on |
| Pocket Gems (Episode) | greenhouse | `pocketgems` | games, narrative | unverified |  | San Francisco; US; Episode also takes freelance writers via its writer portal Older postings (2019-2022) seen; verify board still live | on |
| PolyAI | greenhouse | `polyai` | conversational-ai, ai-companion | directory | 13 | London HQ; UK/EU + US; hybrid/remote in UK 13 vendor-observed jobs; EU-hosted board job-boards.eu.greenhouse.io/polyai (boards-api.gr | on |
| Pomelo Care | greenhouse | `pomelocare` | digital-health | directory | 53 | US remote Virtual maternal/pediatric care | on |
| Qualtrics | greenhouse | `qualtrics` | people-science, research | directory | 50 | US/EU (Krakow, Dublin)/AU; limited remote Current careers site embeds Greenhouse (qualtrics.com/careers/...?gh_jid=). A separate job | on |
| Reddit | greenhouse | `reddit` | ai-safety, trust-and-safety, human-feedback | directory | 144 | 'Remote - United States'; some Ireland/UK/Netherlands roles Safety operations, policy, community roles | on |
| Remesh | greenhouse | `remesh` | people-science, research | directory | 2 | US-only remote (posting states must be in the United States) | on |
| Remote.com | greenhouse | `remotecom` | people-science, research | directory | 224 | Worldwide remote | on |
| Riot Games | greenhouse | `riotgames` | games, narrative | directory | 160 | Mostly onsite/hybrid in LA and regional offices (incl. Dublin, Singapore); ~185 postings; writers/narrative roles appear occasionally Seen in multiple 2026 scraper configs (ever-jobs, CareerView); boards-api works with token | on |
| Robinhood | greenhouse | `robinhood` | ai-safety, trust-and-safety, human-feedback | directory | 128 | US/Canada Marginal: fraud/T&S ops only | on |
| Roblox | greenhouse | `roblox` | ai-safety, trust-and-safety, human-feedback | directory | 221 | Mostly onsite San Mateo; not remote-friendly Civility/T&S team | on |
| Sama | greenhouse | `samainc` |  | directory | 3 | Kenya/US; some remote (memory) 3 registry files; SmartRecruiters 'samasource' legacy. | on |
| Scale AI | greenhouse | `scaleai` | ai-safety, trust-and-safety, human-feedback | directory | 211 | Mostly US/UK hybrid for FTE; contractor rater work goes through Outlier/Remotasks (custom portals, worldwide) Greenhouse board also carries Generative AI trainer / quality / T&S policy roles | on |
| Scopely | greenhouse | `scopely` | games, narrative | directory | 158 | US, Barcelona, Dublin, Seville etc.; some remote; hires AI game designers/writers Aug 2026 postings on Greenhouse; a catalog also lists jobs.ashbyhq.com/scopely - Greenhous | on |
| Snorkel AI | greenhouse | `snorkelai` | ai-safety, trust-and-safety, human-feedback | directory | 37 | Mostly US Has expert data / evaluation roles | on |
| SoundHound AI (incl. Amelia) | greenhouse | `soundhoundinc` | conversational-ai, ai-companion | unverified |  | US/Canada/Germany/France offices; some remote Multiple literal job URLs boards.greenhouse.io/soundhoundinc/jobs/... | on |
| Speechify | greenhouse | `speechify` | conversational-ai, ai-companion | directory | 1287 | Remote worldwide (contractor-heavy) Very large listing count (1287 vendor-observed); remote global contractor roles frequent. | on |
| Spring Health | greenhouse | `springhealth66` | mental-health, digital-health | directory | 65 | US (remote-US and NYC hybrid) Note the '66' suffix in the board token. | on |
| Stability AI | greenhouse | `stabilityai` | ai-safety, responsible-ai | unverified |  | London/SF; remote UK/US Seen in two curated portal lists; no individual job URL captured. | on |
| starfishneuroscience | greenhouse | `starfishneuroscience` | psychology | discovered in directory | 1 |  | on |
| Talkspace | greenhouse | `talkspacetherapist` | mental-health, digital-health | directory | 48 | US-only Greenhouse board found is the therapist (W-2/1099) board. Corporate roles are listed on ta | on |
| teamLFG | greenhouse | `teamlfg` | games, narrative | directory | 13 | Remote USA | on |
| That's No Moon | greenhouse | `thatsnomoonentertainment` | games, narrative | directory | 1 | US (LA/San Diego) with remote-friendly roles, US only | on |
| Thorn | greenhouse | `thorn` | ai-safety, responsible-ai | directory | 5 | Remote US Child-safety nonprofit; T&S, research, data roles. | on |
| Thrive Global | greenhouse | `thrive` | coaching, well-being, mental-health | corrected-prefix (was greenhouse/thriveglobal) | 3 | US remote; small international presence Unverified memory. | on |
| Tia | greenhouse | `tia` |  | directory | 30 | US-only (memory) 3 registry files. | on |
| Turing | greenhouse | `turing` | ai-safety, trust-and-safety, human-feedback | directory | 24 | Fully remote, hires worldwide (India, LatAm, Europe); LLM trainer/evaluator roles | on |
| Twill (Happify) | greenhouse | `twill` | coaching, well-being, mental-health | unverified (disabled) |  | US Unverified guess. | off |
| Two Chairs | greenhouse | `twochairs` | mental-health, digital-health | directory | 25 | US Hybrid clinics CA/WA plus virtual. | on |
| UK AI Security Institute (AISI) | greenhouse | `aisi` | ai-safety, responsible-ai | directory | 7 | London; UK-based civil-service roles only, no overseas remote EU-hosted Greenhouse: board lives at boards.eu.greenhouse.io/aisi, so try boards-api.eu.gr | on |
| Urban Sports Club | greenhouse | `urbansportsclub` | coaching, well-being, mental-health | directory | 4 | DE/FR/ES/PT/BE/NL Unverified guess. | on |
| User Interviews | greenhouse | `userinterviews` | people-science, research | unverified |  | US remote Older jobs.lever.co/userinterviews config exists; Greenhouse is current. | on |
| Valera Health | greenhouse | `valerahealth` | mental-health, digital-health | directory | 4 | US remote Tele-mental health; remote HR/ops roles. | on |
| Volley | greenhouse | `volleythat` | games, narrative | unverified |  | San Francisco; hybrid; hires writers/narrative for voice games Slug appears in a scraped Greenhouse company list | on |
| Wargaming (incl. Belgrade office) | greenhouse | `wargamingen` | games, narrative | directory | 45 | Offices in Belgrade, Vilnius, Nicosia, Guildford, Prague; hybrid; July 2026 Belgrade postings seen A 2026 catalog also lists apply.workable.com/wargaming as an alternate board - verify both | on |
| Weights & Biases (CoreWeave) | greenhouse | `coreweave` | ai-safety, responsible-ai | directory | 290 | US; remote US Acquired by CoreWeave 2025; jobs.lever.co/wandb now 404 per career-ops notes. | on |
| WeightWatchers | greenhouse | `ww` | coaching, well-being, mental-health | directory | 77 | US/DE/UK Unverified guess. | on |
| Wellhub (formerly Gympass) | greenhouse | `gympass` | coaching, well-being, mental-health | directory | 102 | Brazil/US/UK/PT/ES/DE/IT; remote in those countries Try tokens 'wellhub' and legacy 'gympass'. Unverified. | on |
| Wellthy | greenhouse | `wellthy-care-network` | digital-health | directory | 145 | US This board is the caregiver network (gig roles); corporate roles listed on wellthy.com/car | on |
| Wikimedia Foundation | greenhouse | `wikimedia` | ai-safety, responsible-ai | directory | 18 | Remote worldwide (hires via contractors in many countries) - strong fit Bonus: T&S, research and policy roles at a remote-first nonprofit. | on |
| Wizards of the Coast / Hasbro (digital D&D, MTG) | greenhouse | `hasbro` | games, narrative | directory | 156 | Renton WA hybrid/onsite; narrative designer contracts 2026 Board token is hasbro (older wizardsofthecoast board also existed) | on |
| Wooga | greenhouse | `wooga` | games, narrative | directory |  | Berlin, hybrid; EU work permit friendly; hires narrative designers/writers 2026 job files seen | on |
| Workit Health | greenhouse | `workithealth` | mental-health, digital-health | directory | 9 | US Substance use telemedicine. | on |
| xAI | greenhouse | `xai` | ai-safety, responsible-ai | directory | 253 | On-site Palo Alto/SF/Memphis; AI Tutor roles remote but mostly US 121+ distinct job URLs indexed 2023-2025; 'AI Tutor' human-data roles are frequent. | on |
| Yoodli (AI roleplays / communication coaching) | greenhouse | `yoodliinc` | conversational-ai, ai-companion | directory | 15 | Seattle; US 15 vendor-observed jobs. | on |
| YuLife | greenhouse | `yulife` | coaching, well-being, mental-health | unverified (disabled) |  | UK Unverified guess. | off |
| Zynga | greenhouse | `zyngacareers` | games, narrative | directory | 50 | US, Turkey, India, EU; some remote roles Old board token 'zynga' now returns 404 - use zyngacareers | on |
| 15Five | lever | `15five` | people-science, research | directory |  | US plus EU remote roles seen (Poland, Portugal, Spain, Netherlands, Hungary) apply.workable.com/15five also listed in a directory; check both, Lever has job-level URL  | on |
| Alignerr (Labelbox) | lever | `labelbox` | ai-safety, responsible-ai | directory |  | Worldwide contractors Lever tenant named 'Alignerr'; Labelbox corporate is Greenhouse 'labelbox'. | on |
| Apollo Research | lever | `apolloresearch` | ai-safety, responsible-ai | directory |  | London hybrid; UK visa sponsorship; not remote Evals/interpretability/governance; apolloresearch.ai/careers wraps this Lever board. | on |
| Appen | lever | `appen-2` | ai-safety, trust-and-safety, human-feedback | directory |  | Americas/Europe remote FTE roles; crowd work via CrowdGen (worldwide) Corporate board | on |
| Asobo Studio | lever | `asobostudio` | games, narrative | directory | 7 | Bordeaux onsite; EU Lever host Use api.eu.lever.co | on |
| Behaviour Interactive | lever | `bhvr` | games, narrative | directory |  | Montreal/Toronto hybrid; narrative designer internships/roles | on |
| Big Health (Sleepio, Daylight) | lever | `bighealth` | mental-health, digital-health | directory |  | Remote-first, US and UK Digital therapeutics for insomnia and anxiety; Content Manager roles seen on Lever. | on |
| Blink UX | lever | `blinkux` | people-science, research | directory |  | US | on |
| Busara Center for Behavioral Economics | lever | `BusaraCenter` | ai-safety, responsible-ai | directory |  | Nairobi; some remote Outside this category but directly relevant to the brief's behavioral-science family; case | on |
| Carbon Health | lever | `carbonhealth` |  | directory |  | US-only (memory) 3 files on Lever; Ashby/SmartRecruiters/Workday variants also listed. | on |
| Center for AI Safety (CAIS) | lever | `aisafety` | ai-safety, responsible-ai | directory |  | SF; some remote US Multiple 2025-2026 postings (Special Projects, comms, research). Site safe.ai/careers. | on |
| Center for Humane Technology | lever | `humanetech` | ai-safety, responsible-ai | directory |  | Remote US From Lever tenant registry (several copies). | on |
| Cogito Corp | lever | `cogitocorp` | ai-safety, trust-and-safety, human-feedback | unverified |  | Boston/US Behavioral/emotion AI for call centers (hires behavioral scientists); not Cogito Tech anno | on |
| ControlAI | lever | `controlai` | ai-safety, responsible-ai | directory | 3 | London; UK EU-hosted Lever: use https://api.eu.lever.co/v0/postings/controlai?mode=json (US host will | on |
| ConverseNow | lever | `ConverseNow` | conversational-ai, ai-companion | directory |  | US (Austin) kalil lever.csv row; restaurant voice AI. | on |
| Conversica | lever | `conversica` | conversational-ai, ai-companion | directory |  | US remote kalil lever.csv row. | on |
| CrowdGen by Appen | lever | `appen` | ai-safety, trust-and-safety, human-feedback | directory |  | Worldwide contractor/rater projects Separate Lever site for crowd projects | on |
| Encord | lever | `CordTechnologies` | ai-safety, trust-and-safety, human-feedback | directory |  | London/SF Data annotation platform | on |
| Epoch AI | lever | `epoch-ai` | ai-safety, responsible-ai | directory |  | Fully remote, hires worldwide (contractor-friendly) - strong fit AI trends research; data/analyst/comms roles. Registry + dataset corroborated. | on |
| Future of Life Institute | lever | `futureof-life` | ai-safety, responsible-ai | directory |  | Remote, US and Europe - strong fit Policy, comms, grants roles; two 2026 posting URLs seen. Note the unusual slug spelling. | on |
| Gobrightside | lever | `gobrightside` | psychology | discovered in directory |  |  | on |
| Gupshup | lever | `gupshup` | conversational-ai, ai-companion | unverified |  | India-centric Single India company-database row. | on |
| Haptik (Jio) | lever | `haptik` | conversational-ai, ai-companion | unverified |  | India-only Single 2026 seed list (Suraj0791/jobs) row. | on |
| Included Health | lever | `includedhealth` | digital-health | directory |  | US remote Virtual care + navigation, behavioral health | on |
| Innodata | lever | `innodata` | ai-safety, trust-and-safety, human-feedback | directory | 3 | Global (India, Philippines, Canada, US, Israel, Germany); remote annotation/evaluation roles | on |
| InnoGames | lever | `innogames` | games, narrative | corrected-exact (was personio/innogames) | 6 | Hamburg; hybrid/remote within Germany-EU XML: innogames.jobs.personio.de/xml | on |
| Jam City (incl. Ludia) | lever | `jamcity` | games, narrative | directory |  | US/Canada (Montreal via Ludia); some remote Older catalogs list boards.greenhouse.io/jamcity; 2026 verified list says Lever - check bo | on |
| Kabam | lever | `kabam` | games, narrative | corrected-exact (was greenhouse/kabam) |  | Vancouver/LA/Montreal; hybrid From a catalog file; not seen in 2026 postings | on |
| Larian Studios | lever | `larian` | games, narrative | directory |  | Onsite (Ghent, Dublin, Quebec, Barcelona, Warsaw, KL); open applications accepted Custom page larian.com/careers is backed by Lever | on |
| lionbridge | lever | `lionbridge` | ai-safety | discovered in directory | 43 | Worldwide freelance AI raters/search evaluators (custom portal); FTE via Darwinbox Darwinbox not supported | on |
| Luzia (WhatsApp AI assistant) | lever | `luzia` | conversational-ai, ai-companion | unverified |  | Madrid; Spain/EU kalil lists both Lever 'luzia' and luzia.teamtailor.com. | on |
| Lyra Collective | lever | `lyracollective` | psychology | discovered in directory |  |  | on |
| Lyra Health | lever | `lyrahealth` | mental-health, digital-health | directory | 558 | Primarily US; some international via Lyra International 800+ open roles; also careers.lyrahealth.com custom site. Includes Lyra International (ICA | on |
| Mahana Therapeutics | lever | `mahanatherapeutics` | digital-health | unverified |  | US Prescription DTx (IBS CBT) | on |
| Match Group (Tinder, Hinge, OkCupid) | lever | `matchgroup` | ai-safety, trust-and-safety, human-feedback | directory |  | US/Canada/Europe hybrid | on |
| Medallia | lever | `medallia` | people-science, research | unverified |  | Global offices; remote varies Job-level Lever URLs exist but are older (2018-2019); may have migrated. Not present in 20 | on |
| MERU | lever | `wearemeru` |  | directory |  | US (memory) 2 registry files. | on |
| METR | lever | `metr` | ai-safety, responsible-ai | directory |  | Berkeley, in-person preferred; occasional remote US Public careers page hiring.metr.org / metr.org/careers; 4 postings in an AI-safety dataset | on |
| Mindful | lever | `mindful` | mental-health | discovered in directory |  |  | on |
| Modulate | lever | `modulate` | ai-safety, trust-and-safety, human-feedback | directory |  | Boston/US; voice T&S (ToxMod) | on |
| Mountaintop Studios | lever | `mountaintop` | games, narrative | unverified |  | Remote US | on |
| Neowiz | lever | `neowiz` | games, narrative | directory |  | Seongnam onsite | on |
| Netomi | lever | `netomi` | conversational-ai, ai-companion | directory |  | US/India kalil lever.csv; also SmartRecruiters 'netomi' career page. | on |
| Nielsen | lever | `nielsen` | people-science, research | directory |  | Global Job-level Lever URLs seen. | on |
| Numan | lever | `numan` | digital-health | directory | 9 | UK EU Lever host — use api.eu.lever.co/v0/postings/numan | on |
| peppy | lever | `peppy` | psychology | discovered in directory | 1 | UK ATS not surfaced | on |
| Quantic Dream | lever | `quanticdream` | games, narrative | directory | 3 | Paris/Montreal onsite; EU Lever instance (use api.eu.lever.co/v0/postings/quanticdream) EU-hosted Lever - the scraper needs the eu API host | on |
| Quiq | lever | `quiq` | conversational-ai, ai-companion | directory |  | US (Bozeman) remote US kalil lever.csv row. | on |
| Resiliencelab | lever | `resiliencelab` | mental-health | discovered in directory |  |  | on |
| Respondent | lever | `respondent` | people-science, research | unverified |  | US remote Multiple lists; no job-level URL seen. | on |
| RWS TrainAI | lever | `rws` | ai-safety, trust-and-safety, human-feedback | directory | 67 | Worldwide freelance/remote AI data & linguist roles RWS corporate uses iCIMS (uscareers-rws.icims.com), unsupported | on |
| Skydance (Games/Animation) | lever | `skydance` | games, narrative | directory |  | LA onsite | on |
| SuperAnnotate | lever | `superannotate` | ai-safety, trust-and-safety, human-feedback | directory |  | US/Armenia; some remote | on |
| Sword Health | lever | `swordhealth` | digital-health | directory |  | US + Portugal; many roles remote Lever board existed but showed no open postings at search time; primary careers site sword | on |
| System1 | lever | `system1` | coaching, people-science | discovered in directory | 4 |  | on |
| Vida Health | lever | `vida` | digital-health | directory | 6 | US, 100% remote roles Health coaches (motivational psychology background), dietitians, physicians | on |
| Wildlight Entertainment | lever | `wildlight` | games, narrative | unverified |  | Remote-first but US and Canada only | on |
| Wysa | lever | `wysa` | coaching, well-being, mental-health | unverified (disabled) |  | UK/India remote Unverified guess; UK/India AI mental health. | off |
| 7Mind | personio | `7mind` | coaching, well-being, mental-health | unverified (disabled) |  | Germany remote Unverified guess; Berlin. | off |
| Daedalic Entertainment | personio | `daedalic` | games, narrative | unverified |  | Hamburg; EU; publisher side still hires Personio XML: daedalic.jobs.personio.de/xml | on |
| HelloBetter | personio | `geton` | mental-health, digital-health | unverified |  | Germany (Berlin/remote DE) Berlin DiGA provider (GET.ON Institut). Personio XML: geton.jobs.personio.de/xml. Roles mo | on |
| Likeminded | personio | `likeminded` | coaching, well-being, mental-health | unverified (disabled) |  | Germany/EU remote Unverified guess; Berlin. | off |
| Nilo Health | personio | `nilohealth` | coaching, well-being, mental-health | unverified (disabled) |  | Germany/EU remote Unverified guess; Berlin. | off |
| Quantilope | personio | `quantilope` | people-science, research | unverified |  | Germany (Hamburg); remote within Germany/EU | on |
| Selfapy | personio | `selfapy` | mental-health, digital-health | unverified |  | Germany Berlin DiGA; now part of MEDICE Health Family (2025), board mostly speculative application | on |
| Sharpist | personio | `sharpist` | coaching, well-being, mental-health | unverified (disabled) |  | Germany/EU remote Berlin coaching platform. Unverified guess. | off |
| Travian Games | personio | `traviangames` | games, narrative | corrected-exact (was personio/travian) | 3 | Munich; remote-friendly | on |
| BV Peak Coaching | recruitee | `jobspeakcoaching` | mental-health | discovered in directory | 11 |  | on |
| Innova Market Insights | recruitee | `innovamarketinsights` | people-science, research | directory | 9 | Netherlands 9 postings observed. | on |
| OpenUp | recruitee | `openup` | coaching, well-being, mental-health | unverified (disabled) |  | NL/DE/ES/BE/FR; remote psychologists across Europe Unverified guess; hires psychologists in many European languages, often remote. High relev | off |
| Talkie.ai (Poland voicebots) | recruitee | `talkieai` | conversational-ai, ai-companion | directory |  | Warsaw; Poland/EU remote kalil recruitee.csv 'Talkie sp. z o.o.'; not the MiniMax 'Talkie' app. | on |
| TaskUs | recruitee | `taskus` | ai-safety, trust-and-safety, human-feedback | directory |  | Global BPO with large T&S/content-moderation and AI-data teams; EU sites (Greece, Ireland), some remote Also Workday: tenant taskus/wd1/careers (https://taskus.wd1.myworkdayjobs.com/careers) | on |
| CD Projekt Red | smartrecruiters | `CDPROJEKTRED` | games, narrative | directory | 36 | Warsaw, Krakow, Boston, Vancouver; onsite/hybrid; Senior Narrative Designer and Senior Writer roles seen 2026 Also lists on cdprojektred.com/en/jobs | on |
| Cint | smartrecruiters | `Cint` | people-science, research | directory | 29 | Sweden/UK/US; global 29 postings. | on |
| Don't Nod | smartrecruiters | `Dontnod` | games, narrative | directory | 3 | Paris/Montreal; onsite/hybrid; 5 postings at June 2026 probe companyIdentifier Dontnod verified by RenderJobs probe | on |
| Freshworks (Freddy AI) | smartrecruiters | `Freshworks` | conversational-ai, ai-companion | directory | 166 | India/US; some EU API URL literally listed in directory. | on |
| Gameloft | smartrecruiters | `Gameloft` | games, narrative | directory | 51 | Global studios (Barcelona, Montreal, Kharkiv, Sofia...); mostly onsite; 79 postings at June 2026 probe | on |
| GymPass | smartrecruiters | `gympass` | coaching, people-science | discovered in directory |  |  | on |
| HireVue | smartrecruiters | `HireVue` | people-science, research | directory |  | US-centric, some UK companyIdentifier HireVue (case as shown). | on |
| Ipsos | smartrecruiters | `Ipsos` | people-science, research | directory |  | Global incl. Serbia office Also runs Oracle HCM (ecqf.fa.em2.oraclecloud.com) and a Pinpoint board; SmartRecruiters c | on |
| Kaia Health | smartrecruiters | `kaiahealth` | digital-health | unverified |  | Germany (Munich) + US (NYC); remote + on-site mix MSK/COPD DTx; EU-friendly | on |
| Keywords Studios | smartrecruiters | `keywordsstudios` | games, narrative | discovered in directory | 51 |  | on |
| Levels | smartrecruiters | `levelset` | digital-health | corrected-prefix (was workable/levelshealth) |  | Remote-first since day 1, US CGM metabolic health | on |
| Netflix (Games) | smartrecruiters | `netflix` | games, narrative | corrected-prefix (was lever/netflix) |  | Mostly US; narrative designer roles posted historically Public Lever API api.lever.co/v0/postings/netflix | on |
| NielsenIQ (NIQ, incl. GfK) | smartrecruiters | `NielsenIQ` | people-science, research | directory | 428 | Global incl. Belgrade office 428 postings; GfK merged into NIQ. | on |
| Paradox (paradox.ai, incl. Traitify) | smartrecruiters | `paradox` | people-science, research | directory | 6 | US (Scottsdale); unknown remote Caution: jobs.ashbyhq.com/paradox is Paradox Group (French EdTech), not paradox.ai. SmartR | on |
| People Can Fly | smartrecruiters | `PeopleCanFly` | games, narrative | directory | 17 | Remote only within Poland or Canada | on |
| Reward Gateway / Edenred | smartrecruiters | `rewardgateway` | coaching, well-being, mental-health | corrected-prefix (was greenhouse/rewardgateway) |  | UK/BG/AU/US Unverified guess; employee engagement/well-being platform with a large Plovdiv (Bulgaria)  | on |
| Sama (Samasource) | smartrecruiters | `samasource` | ai-safety, trust-and-safety, human-feedback | directory |  | Kenya/Uganda/India delivery centers; some US/remote corporate roles companyIdentifier 'samasource' from third-party ATS index; verify live | on |
| Techland | smartrecruiters | `TechlandSA` | games, narrative | directory | 36 | Wroclaw/Warsaw onsite | on |
| The Nielsen Company | smartrecruiters | `thenielsencompany` | coaching, people-science | discovered in directory | 136 |  | on |
| Twitch | smartrecruiters | `twitch` | ai-safety, trust-and-safety, human-feedback | directory |  | US Indexed SmartRecruiters id may be stale; Twitch mostly posts on amazon.jobs/twitch.tv/jobs | on |
| Ubisoft (incl. Ubisoft Belgrade) | smartrecruiters | `Ubisoft2` | games, narrative | directory | 277 | Global offices incl. Belgrade; mostly onsite/hybrid; ~100 live postings via public SmartRecruiters API companyIdentifier Ubisoft2 (case-insensitive ubisoft2 also works); Sept 2026 postings seen | on |
| Askable | teamtailor | `askable` | coaching, people-science | discovered in directory |  | Australia Also askable.breezy.hr and careers.smartrecruiters.com/askable listed; current board unver | on |
| Lingoda | teamtailor | `lingoda` | conversational-ai, ai-companion | corrected-exact (was lever/lingoda) |  | Berlin; remote EU kalil lever.csv row. | on |
| Paradox Interactive | teamtailor | `paradox-interactive` | coaching, people-science | discovered in directory |  | Stockholm/EU; hybrid; occasional writers Teamtailor JSON: https://career.paradoxplaza.com/jobs.json (custom domain) | on |
| Simple Life App / Zing Coach | teamtailor | `palta` | mental-health | discovered in directory |  |  | on |
| Acuity Insights | workable | `acuity-insights` | people-science, research | directory | 18 | Canada remote 18 postings observed; Casper situational-judgement test maker. | on |
| BetterSleep | workable | `bettersleep` | mental-health | discovered in directory |  |  | on |
| Botpress | workable | `botpress` | conversational-ai, ai-companion | directory | 11 | Montreal; remote-friendly (Canada/US, some global) 11 observed jobs; widget API apply.workable.com/api/v1/widget/accounts/botpress listed. Ol | on |
| Cambridge Healthcare Research | workable | `cambridge-healthcare-research` | people-science, research | directory | 8 | UK 8 postings observed. | on |
| CloudFactory | workable | `cloudfactory` | ai-safety, trust-and-safety, human-feedback | directory | 95 | UK/US/Nepal/Kenya; some remote SmartRecruiters 'cloudfactory' also indexed; probe both | on |
| Devoted Studios | workable | `devoted-studios-1` | games, narrative | directory | 18 | Remote contract roles (worldwide contractors; Ukraine/Canada base) incl. game/level designers Good worldwide-contract source | on |
| Elevate Labs (Balance) | workable | `elevate-7` | coaching, well-being, mental-health | corrected-prefix (was greenhouse/elevatelabs) |  | Fully remote, US/EU time zones Unverified guess; fully remote company. | on |
| Elvie | workable | `elvie` |  | directory |  | UK (memory) 2 registry files. | on |
| Euromonitor International | workable | `euromonitor` | people-science, research | directory | 58 | Global offices (London, Vilnius, etc.) 58 postings observed. | on |
| Fabulous | workable | `fabulousco` | coaching, well-being, mental-health | corrected-exact (was workable/fabulous) | 31 | Historically remote worldwide thefabulous.co, Paris; unverified guess. Behavioral-science-heavy product team. | on |
| Giskard | workable | `giskard` | ai-safety, responsible-ai | directory | 5 | Paris; remote EU-friendly LLM evaluation/red-teaming; Paris. | on |
| Hugging Face | workable | `hugging-face` | ai-safety | discovered in directory |  | Remote-first, hires across EU/US (Paris/NYC hubs); one of the better fits from Serbia Ethics/society, evaluation, community roles. Registry also lists 'hugging-face' as a secon | on |
| Hugging Face (Argilla) | workable | `huggingface` | ai-safety, trust-and-safety, human-feedback | directory | 7 | Worldwide remote Argilla (data-labeling) was acquired by HF; roles appear on HF board | on |
| Hutch | workable | `hutch` | games, narrative | directory |  | London; remote-friendly UK/EU | on |
| ieso | workable | `ieso` | psychology | discovered in directory |  |  | on |
| ieso Digital Health | workable | `ieso-careers` | mental-health, digital-health | unverified |  | UK remote Typed-CBT provider and DTx developer (ieso Group); service design, product data analyst ro | on |
| ifeel | workable | `ifeel` | mental-health, digital-health | unverified |  | Spain / EU remote Madrid online therapy platform for organizations; Workable confirmed via jobs.workable.com | on |
| Insight Timer | workable | `insight-network-inc` |  | directory | 9 | Australia/US; remote (memory) 3 registry files. | on |
| Intellect | workable | `intellecthq` | mental-health, digital-health | directory | 338 | APAC; remote provider roles Largest APAC mental health tech; remote freelance provider roles. | on |
| Keywords Studios (incl. Sperasoft Belgrade, narrative/writing division) | workable | `keywords-intl1` | games, narrative | directory | 293 | Worldwide offices incl. Belgrade (Sperasoft); many remote/freelance writing, narrative and localization roles Best single ATS for freelance game-writing work; Workable widget API: apply.workable.com/a | on |
| Kooth | workable | `koothjobs` | mental-health, digital-health | directory | 6 | UK + US remote UK youth digital mental health (Kooth/Qwell) plus US (Soluna) expansion; remote US program | on |
| Meditopia | workable | `meditopia` | coaching, well-being, mental-health | unverified (disabled) |  | Remote-friendly (TR/EU) Unverified guess; Istanbul/Berlin. | off |
| Mila - Quebec AI Institute | workable | `mila-2` | ai-safety, responsible-ai | directory |  | Montreal; Canada AI Governance Advisor and safety roles; BambooHR 'mila' also exists (older). | on |
| Oliva | workable | `oliva1` | mental-health, digital-health | directory |  | Europe-wide remote (freelance clinicians); HQ team UK/Spain Employer-funded therapy/coaching. Also has a Teamtailor site (olivahealth.teamtailor.com). | on |
| Omilia | workable | `omilia-natural-language-solutions-ua-ltd` | conversational-ai, ai-companion | directory | 79 | Greece/Cyprus/Ukraine; remote within Europe - good Serbia fit 79 observed jobs; conversational AI for contact centers; conversation/dialogue designer ro | on |
| OpenMined | workable | `openmined` | ai-safety, responsible-ai | directory | 14 | Remote worldwide Privacy-preserving AI / AI governance nonprofit; 3 postings in dataset. | on |
| Owlchemy Labs | workable | `owlchemy-labs` | games, narrative | unverified |  | Austin; US | on |
| Pinterest | workable | `pinterest` | ai-safety, trust-and-safety, human-feedback | directory |  | US Main careers site is custom (pinterestcareers.com); Workable/SmartRecruiters ids likely st | on |
| Plum | workable | `plum-inc` | people-science, research | directory | 6 | Canada; remote within Canada/US 6 postings observed on 'plum-inc'; mapping to plum.io not confirmed (withplum is the UK fi | on |
| Prolific | workable | `prolific-world` | ai-safety, trust-and-safety, human-feedback | directory |  | UK-based, remote across UK/EU; behavioral-science-heavy research platform | on |
| Psychology Today | workable | `psychology-today` |  | directory |  | US remote (memory) 2 registry files. Editorial/content roles relevant to psychoeducation. | on |
| pymetrics | workable | `pymetrics` | people-science, research | directory |  | unknown Also careers.smartrecruiters.com/pymetrics listed; both boards likely stale post-acquisiti | on |
| RAND Europe | workable | `rand-europe` | ai-safety, responsible-ai | directory | 1 | Cambridge UK / Brussels; UK/EU From Workable tenant registry. | on |
| Rebellion | workable | `rebellion` | games, narrative | directory | 39 | UK-only (permanent right to work in UK required, no sponsorship) Not applicable from Serbia | on |
| Sama (coaching) | workable | `samacoaching` |  | directory |  | UK (memory) 2 registry files. Not the data-annotation Sama. | on |
| Second Nature | workable | `secondnature` | digital-health | directory | 9 | UK (NHS programmes); UK-based Behavioral-science-led habit change; health coach roles | on |
| Speech Graphics / Rapport (digital humans) | workable | `speech-graphics` | conversational-ai, ai-companion | directory |  | Edinburgh UK kalil workable.csv row. | on |
| Speechmatics | workable | `speechmatics-cantab` | conversational-ai, ai-companion | corrected-exact (was greenhouse/speechmatics) |  | Cambridge UK; UK hybrid career-ops portal + API URL; older Workable 'speechmatics-cantab'. | on |
| Spill | workable | `spill` | coaching, well-being, mental-health | unverified (disabled) |  | UK; some EU spill.chat; unverified guess. | off |
| Teleperformance | workable | `teleperformance-spain` | ai-safety, trust-and-safety, human-feedback | directory |  | Spain-focused Workable account (multilingual content moderation, some remote-in-Spain); global careers otherwise on iCIMS/custom Also Workday teleperformance/wd1/allianceone (US subsidiary). Main global site is custom. | on |
| TherapyNotes.com | workable | `therapynotes` | mental-health | discovered in directory | 2 |  | on |
| Thomas International (Thomas) | workable | `thomas-5a` | people-science, research | directory |  | UK Workable account named just 'Thomas'; identity with Thomas International not confirmed. | on |
| ThoughtFull™ World | workable | `thoughtfull-world` | psychology | discovered in directory |  |  | on |
| Toloka (Mindrift) | workable | `toloka-ai` | ai-safety, trust-and-safety, human-feedback | directory | 1014 | Worldwide freelance 'AI tutor' roles incl. Serbia; many domain-expert (psychology, healthcare) postings Workable account is branded Mindrift (Toloka's expert-freelancer brand) | on |
| toloka-annotators | workable | `toloka-annotators` | ai-safety | discovered in directory | 923 |  | on |
| Unitary | workable | `unitary` | ai-safety, trust-and-safety, human-feedback | directory | 7 | UK/EU remote (AI content moderation) | on |
| Velan Studios | workable | `velanstudios` | games, narrative | directory | 6 | Troy NY / Toronto hybrid (3 days onsite); Narrative Designer Sr+ open Sept 2026 | on |
| Yellow.ai | workable | `yellowleaf` | conversational-ai, ai-companion | corrected-prefix (was lever/yellowai) |  | India-centric; unlikely to hire in Serbia Literal URL in several (older) India company lists; verify still live. | on |
| Activision (Infinity Ward, Treyarch, Sledgehammer...) | workday | `xboxgaming|wd1|External` | games, narrative | unverified |  | Remote USA only (Narrative Designer temp seen 2026); some Warsaw freelance quest design via Hitmarker Same Workday tenant as Blizzard/King | on |
| Blizzard Entertainment | workday | `xboxgaming|wd1|Blizzard_External_Careers` | games, narrative | directory | 35 | US; some work-from-home US roles (Senior Writer temp seen 2026) Workday cxs endpoint: xboxgaming.wd1.myworkdayjobs.com/wday/cxs/xboxgaming/Blizzard_Extern | on |
| Carelon Behavioral Health (Elevance) | workday | `elevancehealth|wd1|EXT` | coaching, well-being, mental-health | unverified (disabled) |  | US-only Unverified guess at tenant/site. | off |
| Centific (OneForma) | workday | `centific|wd1|centific_global` | ai-safety, trust-and-safety, human-feedback | directory | 154 | Global; crowd/AI-data work via OneForma portal (custom, worldwide) | on |
| Cerence | workday | `cerence|wd5|Cerence` | conversational-ai, ai-companion | directory |  | US/Germany/Canada; hybrid kalil workday.csv row. | on |
| Cigna / Evernorth (EAP) | workday | `cigna|wd5|cignacareers` | coaching, well-being, mental-health | directory |  | US-only Unverified guess at tenant/site. | on |
| Cityblock Health | workday | `cityblockhealth|wd1|cityblockexternalcareersite` | digital-health | corrected-exact (was greenhouse/cityblockhealth) | 30 | US Also Workday cityblockhealth/wd1/CityblockExternalCareerSite | on |
| CSET (Georgetown University) | workday | `georgetown|wd1|georgetown_admin_careers` | ai-safety, responsible-ai | directory | 136 | Washington DC; US CSET roles post through Georgetown's Workday site; filter by 'CSET' in title/department. | on |
| Dynata | workday | `dynata|wd108|careers` | people-science, research | directory |  | Global | on |
| Forrester | workday | `forrester|wd501|careers` | people-science, research | directory |  | US/UK; some remote | on |
| Interactions LLC | workday | `interactions|wd1|interactions` | conversational-ai, ai-companion | directory |  | US remote mostly kalil workday.csv row; conversational IVR company with conversation designer roles. | on |
| Kantar | workday | `kantar|wd3|KANTAR` | people-science, research | directory | 75 | Global incl. Belgrade office 75 postings via wday/cxs endpoint. Other sites on same tenant: KANTART and Kantar_Careers. | on |
| KANTAR Kantar (KANTART) | workday | `kantar|wd3|kantart` | coaching, people-science | discovered in directory |  |  | on |
| King | workday | `xboxgaming|wd1|King_External_Careers` | games, narrative | unverified |  | Stockholm, London, Barcelona, Berlin; onsite/hybrid | on |
| LifeStance Health | workday | `lifestance|wd5|Careers` | mental-health, digital-health | directory | 111 | US Large outpatient + telehealth provider; mostly clinical roles. | on |
| Lifeworks | workday | `lifeworks|wd3|external` | coaching, people-science | discovered in directory |  |  | on |
| Optum / UnitedHealth Group | workday | `uhg|wd1|External` | coaching, well-being, mental-health | unverified (disabled) |  | US mostly; IE/IN/PH offices Unverified guess at tenant/site. | off |
| Progyny | workday | `progyny|wd5|progyny` | digital-health | directory | 18 | US Fertility & women's health benefits | on |
| RAND Corporation | workday | `rand|wd5|External_Career_Site` | ai-safety, responsible-ai | directory | 9 | US offices; some remote US; not worldwide Technology and Security Policy (TASP) fellows and AI policy roles; registry lists site as  | on |
| Sharecare | workday | `sharecare|wd1|sharecare_careers` | coaching, well-being, mental-health | corrected-exact (was greenhouse/sharecare) | 37 | US remote Unverified guess. | on |
| Sprinklr | workday | `sprinklr|wd1|careers` | conversational-ai, ai-companion | directory | 90 | Global; India/US heavy 90 vendor-observed jobs. | on |
| Teladoc Health | workday | `teladoc|wd503|teladochealth_is_hiring` |  | corrected-prefix (was workday/teladoc|wd1|teladochealth_is_hiring) |  | US mostly; some international (memory) 2 registry files. | on |
| Thriveworks | workday | `thriveworks|wd5|Thriveworks` | mental-health, digital-health | directory |  | US Therapy/psychiatry provider network. | on |
| Uniphore | workday | `uniphore|wd503|Uniphore` | conversational-ai, ai-companion | directory | 39 | US + India; some remote US kaleb workday.csv lists the cxs jobs endpoint. Older Lever 'uniphore' too. | on |
| UserTesting | workday | `usertesting|wd12|UserTesting` | people-science, research | directory | 12 | US/UK; some remote 12 postings. | on |
| Warner Bros. Games (Avalanche, WB Games) | workday | `warnerbros|wd5|global` | games, narrative | directory | 342 | US onsite/hybrid; Lead Writer roles seen 2026 | on |
| Welocalize | workday | `welocalize|wd1|welocalize` | ai-safety, responsible-ai | unverified |  | Worldwide remote contractors AI data/rater and linguist roles; Lever 'welocalize' also listed. | on |
| YouGov | workday | `yougov|wd103|yougov_external_careers` | people-science, research | directory |  | Global; some remote EU | on |
| Zendesk (AI agents) | workday | `zendesk|wd1|zendesk` | conversational-ai, ai-companion | directory | 93 | Global; Krakow/Lisbon/Dublin EU hubs; remote in listed countries cxs endpoint listed in kaleb workday.csv; conversation designer roles appear periodically. | on |

## Researched companies without a key-less ATS (198)

Custom career sites, iCIMS, Rippling, Workday tenants that were not identified, etc. Worth a manual look when tuning:

- **ActiveFence** (ai-safety-labs) – unknown – T&S intelligence vendor; custom careers (likely Comeet). 3 postings in dataset.
- **Ada Lovelace Institute** (ai-safety-labs) – other – Uses Applied (beapplied.com); listings mirrored at adalovelaceinstitute.org/job/... (HTML).
- **AI21 Labs** (ai-safety-labs) – unknown – Israeli lab; believed to use Comeet (memory).
- **Arthur AI** (ai-safety-labs) – unknown – Ashby 'arthur' is Arthur Robotics, not Arthur AI; no board found.
- **Centre for Long-Term Resilience** (ai-safety-labs) – unknown – Custom site.
- **Centre for the Governance of AI (GovAI)** (ai-safety-labs) – unknown – Custom site (governance.ai/opportunities); no ATS URL found.
- **Constellation** (ai-safety-labs) – unknown – Berkeley AI-safety hub posts on own site; a Lever tenant 'constellation' named 'Constellation Institute' exists but iden
- **Encode** (ai-safety-labs) – unknown – Applications via Google Forms in dataset.
- **Holistic AI** (ai-safety-labs) – unknown – No ATS URL found.
- **Humanloop** (ai-safety-labs) – unknown – Acqui-hired by Anthropic (2025); no active board expected. Skip.
- **MATS** (ai-safety-labs) – unknown – Custom site/Airtable applications.
- **Midjourney** (ai-safety-labs) – unknown – Custom site; rarely posts.
- **Palisade Research** (ai-safety-labs) – unknown – Custom site; no ATS found.
- **Partnership on AI** (ai-safety-labs) – unknown – No ATS URL found in any search; assume custom careers page.
- **Patronus AI** (ai-safety-labs) – other – Uses Rippling ATS (no public API); short Ashby/Greenhouse slugs failed validation in a watchlist.
- **Redwood Research** (ai-safety-labs) – unknown – Custom careers page; no ATS URL found.
- **Rethink Priorities (incl. IAPS)** (ai-safety-labs) – other – Custom careers subdomain with Pinpoint-style /postings/<uuid> URLs; try https://careers.rethinkpriorities.org/postings.j
- **SaferAI** (ai-safety-labs) – unknown – Custom site; Paris-based risk-management nonprofit.
- **The Alan Turing Institute** (ai-safety-labs) – other – Uses Cezanne OnDemand (no public API); 12 roles in dataset.
- **Timaeus** (ai-safety-labs) – unknown – Not found in any registry; small remote team (memory).
- **Transluce** (ai-safety-labs) – other – Uses Gem ATS (JS-only board, no public API). AI Behavior Engineer / evaluator roles.
- **Aduro** (coaching-wellbeing) – unknown – Unverified.
- **Auntie** (coaching-wellbeing) – unknown – Finnish preventive mental well-being service; contracts 'Auntie Professionals' (coaches/psychologists) across Europe in 
- **Aura Health** (coaching-wellbeing) – unknown – Unverified.
- **Bloom (enjoybloom)** (coaching-wellbeing) – unknown – Berlin CBT app. Unverified.
- **Bravely** (coaching-wellbeing) – unknown – workbravely.com. Unverified.
- **Breethe** (coaching-wellbeing) – unknown – Unverified.
- **Burnalong** (coaching-wellbeing) – unknown – Unverified.
- **Champion Health** (coaching-wellbeing) – unknown – UK workplace well-being platform. Unverified.
- **ComPsych** (coaching-wellbeing) – unknown – Custom/iCIMS style careers. Unverified.
- **Ezra (LHH)** (coaching-wellbeing) – unknown – Part of LHH/Adecco; careers likely on helloezra.com or Adecco Workday. Unverified.
- **Finch** (coaching-wellbeing) – unknown – finchcare.com; small. Unverified.
- **Grokker** (coaching-wellbeing) – unknown – Unverified.
- **Growthspace** (coaching-wellbeing) – other – Israeli company; likely Comeet (growthspace.comeet.co) which the scraper does not support. Unverified.
- **Happier (Ten Percent Happier)** (coaching-wellbeing) – unknown – Unverified.
- **headversity** (coaching-wellbeing) – unknown – Canadian; possibly BambooHR. Unverified.
- **Journey (journey.live)** (coaching-wellbeing) – unknown – Unverified.
- **Kara Connect** (coaching-wellbeing) – unknown – Iceland/UK. Unverified.
- **Kilo Health** (coaching-wellbeing) – unknown – Vilnius; many health/wellness apps; hires remotely across Europe. ATS unknown (possibly Teamtailor or custom).
- **Magellan Health** (coaching-wellbeing) – unknown – Unverified.
- **Mento** (coaching-wellbeing) – unknown – mento.co; small team. Unverified.
- **Mindgram** (coaching-wellbeing) – unknown – Poland/Spain. Unverified.
- **moka.care** (coaching-wellbeing) – unknown – Paris; possibly Lever/Welcome to the Jungle. Unverified.
- **Nivati** (coaching-wellbeing) – unknown – Unverified.
- **Plumm** (coaching-wellbeing) – unknown – heyplumm.com; possibly Workable. Unverified.
- **Reflectly** (coaching-wellbeing) – unknown – Denmark. Unverified.
- **Sama (sama.io)** (coaching-wellbeing) – unknown – UK coaching platform; possibly Workable. Unverified.
- **Simple Habit** (coaching-wellbeing) – unknown – Likely dormant hiring.
- **Sounding Board** (coaching-wellbeing) – unknown – soundingboardinc.com. Unverified.
- **Teladoc Health (BetterHelp)** (coaching-wellbeing) – unknown – Possibly Workday; BetterHelp therapists US-only; Teladoc has Barcelona hub.
- **Torch** (coaching-wellbeing) – unknown – torch.io; possibly Lever or Greenhouse. Unverified.
- **WebMD Health Services (Limeade)** (coaching-wellbeing) – unknown – Limeade acquired 2023. Unverified.
- **Wellable** (coaching-wellbeing) – unknown – Boston; small. Unverified.
- **Wellics** (coaching-wellbeing) – unknown – Greece. Unverified.
- **Workplace Options** (coaching-wellbeing) – unknown – Global EAP with Lisbon/Europe hubs; hires remote counsellors and well-being consultants in many countries and languages.
- **Yerbo** (coaching-wellbeing) – unknown – LATAM/Spain. Unverified.
- **Chai Research** (conversational-ai-companion) – unknown – Ashby 'chaidiscovery' is an unrelated biotech.
- **Charisma.ai** (conversational-ai-companion) – unknown – No ATS found; small UK studio.
- **Convai** (conversational-ai-companion) – unknown – No Ashby/Lever URL found.
- **Intuition Robotics (ElliQ)** (conversational-ai-companion) – other – Israeli company; likely Comeet ATS (not supported).
- **Kindroid** (conversational-ai-companion) – unknown – No ATS presence found; tiny team.
- **Kore.ai** (conversational-ai-companion) – other – Only a Rippling ATS India board found; US roles on kore.ai/careers (custom). Rippling has a public JSON at ats.rippling.
- **MiniMax (Talkie)** (conversational-ai-companion) – unknown – Custom careers site; no Western ATS found.
- **Nomi.ai (Glimpse AI)** (conversational-ai-companion) – unknown – No ATS found ('nomihealth' and 'nomic' are unrelated).
- **NovelAI / Sudowrite** (conversational-ai-companion) – unknown – No ATS found; tiny teams, occasional persona/writing gigs on custom pages.
- **Personal AI** (conversational-ai-companion) – unknown – No ATS found.
- **Ready Player Me** (conversational-ai-companion) – unknown – No Lever/Ashby URL found.
- **Replika (Luka Inc)** (conversational-ai-companion) – unknown – No ATS URL found in any directory or code search; custom careers page. Worth an HTML probe.
- **Soul Machines** (conversational-ai-companion) – unknown – No Lever/Greenhouse URL found in code search.
- **Akili Interactive** (digital-health-dtx) – unknown – Acquired by Virtual Therapeutics (Jul 2024) — low hiring expected
- **Cleo** (digital-health-dtx) – unknown – Family benefits / caregiving
- **Clue (BioWink)** (digital-health-dtx) – unknown – ATS not surfaced
- **DarioHealth** (digital-health-dtx) – other – Comeet ATS (public JSON at comeet.com/careers-api requires token); acquired Twill (Happify). No openings at search time
- **Fay** (digital-health-dtx) – unknown – Dietitian marketplace; seed stage
- **Found** (digital-health-dtx) – unknown – Weight care with behavior change
- **Freespira** (digital-health-dtx) – unknown – FDA-cleared panic/PTSD DTx; small
- **Holly Health** (digital-health-dtx) – unknown – AI + behavior-change psychology coaching; small team
- **Huma** (digital-health-dtx) – unknown – Custom careers portal
- **Infermedica** (digital-health-dtx) – unknown – AI triage; custom careers page (ATS not surfaced)
- **Kindbody** (digital-health-dtx) – unknown
- **Mediately** (digital-health-dtx) – unknown – No openings at search time; CV to jobs@mediately.com
- **Nutrisense** (digital-health-dtx) – other – Manatal careers page (HTML)
- **Ovia Health (Labcorp)** (digital-health-dtx) – unknown – Likely under Labcorp Workday; not verified
- **Pelago (Quit Genius)** (digital-health-dtx) – unknown – Custom careers page; also on Grey Matter Capital Getro board
- **Peppy** (digital-health-dtx) – unknown – ATS not surfaced
- **Perx Health** (digital-health-dtx) – unknown – Behavioral engagement DTx
- **Ro** (digital-health-dtx) – unknown – Custom careers site; multiple Greenhouse/Lever slug guesses found nothing
- **Season Health** (digital-health-dtx) – unknown – Food-as-medicine
- **Thriva** (digital-health-dtx) – unknown – ATS not surfaced
- **Twin Health** (digital-health-dtx) – unknown – Metabolic digital twin
- **Vori Health** (digital-health-dtx) – unknown – MSK care with health coaches
- **Welldoc** (digital-health-dtx) – unknown – ATS not surfaced
- **Zava** (digital-health-dtx) – unknown – ATS not surfaced
- **7 Cups** (digital-mental-health) – unknown – Peer support platform; no ATS surfaced.
- **Amwell / SilverCloud** (digital-mental-health) – unknown – Custom careers site; SilverCloud careers page at silvercloud.amwell.com/about-us/careers. ATS host not surfaced (possibl
- **Bend Health** (digital-mental-health) – unknown – Pediatric mental health; postings seen on Built In and recorder.com boards; ATS not surfaced.
- **Bicycle Health** (digital-mental-health) – unknown – OUD telemedicine; ATS not surfaced.
- **Earkick** (digital-mental-health) – unknown – AI mental health companion (Zurich/SF); no ATS surfaced.
- **Ellipsis Health** (digital-mental-health) – unknown – Voice AI for mental health; no ATS surfaced.
- **Kintsugi** (digital-mental-health) – unknown – Voice-biomarker AI; custom careers page; roles mirrored on WeWorkRemotely, Insight Partners and Techstars boards.
- **Likeminded x nilo.health** (digital-mental-health) – unknown – Berlin workplace mental health; merged Nov 2024. ATS not surfaced.
- **Lyssn** (digital-mental-health) – unknown – AI psychotherapy quality/training; custom careers page.
- **Manatee** (digital-mental-health) – other – Postings found only on Techstars Getro board; underlying ATS unknown.
- **MindDoc (Schön Klinik)** (digital-mental-health) – other – Uses onlyfy (Prescreen) job portal at minddoc.onlyfy.jobs; HTML scrape target.
- **Mindsera** (digital-mental-health) – unknown – AI journaling for mental wellbeing; custom careers page.
- **Monument** (digital-mental-health) – unknown – Alcohol treatment telehealth; absorbed Tempest. ATS not surfaced.
- **Sonia** (digital-mental-health) – unknown – AI therapist app (SF, ETH Zurich founders); 0 open roles at search time.
- **Talkiatry** (digital-mental-health) – unknown – Custom careers site; 270+ roles; also on a16z Getro board (jobs.a16z.com/jobs/talkiatry). ATS not surfaced.
- **ThoughtFull** (digital-mental-health) – unknown – APAC digital mental health; no ATS surfaced.
- **Thymia** (digital-mental-health) – unknown – AI mental health biomarkers (London); no ATS surfaced.
- **TimelyCare** (digital-mental-health) – other – Careers portal on hrmdirect (timelycare.hrmdirect.com); company also references lever.timelycare.com for candidate comms
- **Togetherall** (digital-mental-health) – unknown – UK peer-support community platform; custom careers page.
- **Twill (Happify) by Dario** (digital-mental-health) – unknown – Happify Health -> Twill -> acquired by DarioHealth. Custom careers page.
- **Uwill** (digital-mental-health) – unknown – College teletherapy; no ATS surfaced.
- **Wellnite** (digital-mental-health) – unknown – Therapist postings via LinkedIn/ZipRecruiter; ATS not surfaced.
- **Youper** (digital-mental-health) – unknown – AI mental health chatbot (SF). No careers page/ATS surfaced.
- **Amber** (games-narrative) – other – Jobvite (jobs.jobvite.com/amberstudiocareers) - not in scraper's ATS list; HTML
- **Choice of Games / Hosted Games** (games-narrative) – unknown – Not a job board; permanent open call for writers
- **Crater Studios** (games-narrative) – unknown – Static careers page
- **Crazy Maple Studio (Chapters)** (games-narrative) – unknown – No ATS URL found
- **Crows Crows Crows** (games-narrative) – unknown
- **Dorian** (games-narrative) – unknown – Squarespace site; no ATS found
- **Electronic Arts / BioWare** (games-narrative) – unknown – Custom EA careers platform; no public ATS API
- **Embark Studios** (games-narrative) – unknown – Custom site
- **Failbetter Games** (games-narrative) – unknown – Custom page
- **Finitude** (games-narrative) – unknown – Small studio; custom site
- **Goodgame Studios** (games-narrative) – unknown – Custom page
- **Hidden Door** (games-narrative) – unknown – No ATS URL found
- **Homa Games** (games-narrative) – unknown – No evidence found
- **Inkle** (games-narrative) – unknown – Custom site; no ATS found
- **Lionbridge Games** (games-narrative) – unknown – Custom Phenom-style careers site; needs HTML adapter
- **Mad Head Games** (games-narrative) – unknown – Custom careers subdomain
- **Magic Media** (games-narrative) – unknown – Custom careers page; strong Serbia fit
- **NCSoft West** (games-narrative) – unknown – No evidence found
- **Nordeus** (games-narrative) – unknown – Custom careers page
- **Obsidian Entertainment** (games-narrative) – unknown – Custom careers site (posting slugs like wUsm5pMzk3); no public ATS found
- **Owlcat Games** (games-narrative) – unknown – Custom careers page
- **Pixelberry Studios (Choices)** (games-narrative) – unknown – Custom careers page
- **Playrix** (games-narrative) – unknown – Custom jobs site (JSON behind it); needs HTML/JSON adapter
- **Playstudios (Belgrade office)** (games-narrative) – unknown – No evidence found
- **PTW / Side (Pole To Win)** (games-narrative) – unknown – Custom site; side.inc/careers redirects to ptw.com
- **Remedy Entertainment** (games-narrative) – unknown – Custom site
- **Rovio** (games-narrative) – unknown – No Greenhouse/Lever hits; custom page
- **Sumo Digital (incl. Sumo India)** (games-narrative) – other – HiBob careers (careers.hibob.com) - custom HTML/JSON; not one of the supported ATS
- **Supermassive Games** (games-narrative) – unknown – Custom page
- **Sweet Baby Inc.** (games-narrative) – unknown – No ATS; watch site
- **Twin Swans** (games-narrative) – unknown
- **Virtuos** (games-narrative) – unknown
- **Andela** (general-remote-aggregators) – unknown – Talent network; no ATS URL surfaced in code search.
- **Crossover** (general-remote-aggregators) – unknown – Own marketplace SPA (app.crossover.com); assessment-based hiring; no public jobs API.
- **RemoteBase** (general-remote-aggregators) – unknown – Dev-only talent network; skip for psychology roles.
- **Toptal** (general-remote-aggregators) – unknown – Talent network (freelancers) plus core-team careers page; no Greenhouse/Lever/Ashby URL found in public code.
- **ActiveFence (now Alice)** (human-data-tns) – unknown – Rebranded to Alice (alice.io); historically Comeet; also absorbed Spectrum Labs
- **Besedo** (human-data-tns) – unknown – Content moderation vendor
- **Checkstep** (human-data-tns) – unknown – No public ATS found
- **Clickworker** (human-data-tns) – unknown – Custom
- **Concentrix** (human-data-tns) – unknown
- **DataAnnotation** (human-data-tns) – unknown – Custom portal
- **Defined.ai** (human-data-tns) – unknown
- **iMerit** (human-data-tns) – unknown – Custom careers page
- **Lionbridge** (human-data-tns) – other – Darwinbox not supported
- **Micro1** (human-data-tns) – unknown – Ashby 'micro1' not found
- **Outlier (Scale AI)** (human-data-tns) – unknown – Custom portal, no ATS
- **Remotasks (Scale AI)** (human-data-tns) – unknown – Custom portal
- **Shaip** (human-data-tns) – unknown
- **Sightengine** (human-data-tns) – unknown
- **Tech Coalition** (human-data-tns) – unknown
- **Tremau** (human-data-tns) – unknown – T&S compliance tooling (DSA)
- **Trust & Safety Professional Association (TSPA)** (human-data-tns) – unknown – Runs a T&S job board (see boards)
- **WebPurify** (human-data-tns) – unknown
- **AnswerLab** (people-science-research-consultancies) – unknown – Not found.
- **Arctic Shores** (people-science-research-consultancies) – unknown – Not found in ATS directories.
- **Behavioural Insights Team (BIT / Nesta)** (people-science-research-consultancies) – unknown – No ATS URL surfaced.
- **BEworks** (people-science-research-consultancies) – unknown – Not found in ATS directories.
- **Cangrade** (people-science-research-consultancies) – unknown – Not found in ATS directories.
- **Condens** (people-science-research-consultancies) – unknown – Not found.
- **Cowry Consulting** (people-science-research-consultancies) – unknown – Not found.
- **Eightfold** (people-science-research-consultancies) – other – Runs its own Eightfold career site; not on a supported public API.
- **Gallup** (people-science-research-consultancies) – unknown – Custom careers site; not on public-API ATS.
- **Harver (incl. pymetrics, OutMatch)** (people-science-research-consultancies) – other – Rippling ATS; public JSON at api.rippling.com/platform/api/ats/v1/board/careers-at-harver/jobs (4 jobs observed).
- **Hogan Assessments** (people-science-research-consultancies) – unknown – Not found in ATS directories.
- **ideas42** (people-science-research-consultancies) – unknown – jobs.lever.co/ideas42 not found; likely custom site.
- **Irrational Labs** (people-science-research-consultancies) – unknown – Not found in ATS directories.
- **Korn Ferry** (people-science-research-consultancies) – unknown – Custom careers site; not in ATS directories.
- **Lookback** (people-science-research-consultancies) – unknown – Not found.
- **Multiplier** (people-science-research-consultancies) – other – Directories list Pinpoint (multiplier-careers), BambooHR (multiplier.bamboohr.com) and Gem (multiplierhq); current one u
- **Perceptyx (incl. Humu)** (people-science-research-consultancies) – other – Uses Gem job board (jobs.gem.com/perceptyx); not one of the supported APIs. Humu was acquired by Perceptyx.
- **Personify Health (Virgin Pulse)** (people-science-research-consultancies) – other – iCIMS; not a supported API.
- **Sapia.ai** (people-science-research-consultancies) – unknown – Not found in ATS directories.
- **SHL** (people-science-research-consultancies) – unknown – Not found on any public-API ATS in directories; only a Greek distributor (evalion-shl) on Workable.
- **System1 Group** (people-science-research-consultancies) – other – JazzHR (applytojob.com). Note jobs.lever.co/system1 is the unrelated US ad-tech company.
- **Talogy (PSI)** (people-science-research-consultancies) – unknown – Not found in ATS directories.
- **The Decision Lab** (people-science-research-consultancies) – unknown – Not found.
- **The Predictive Index** (people-science-research-consultancies) – unknown – Not found in ATS directories.
- **Toluna** (people-science-research-consultancies) – unknown – Not found in ATS directories.
- **Vervoe** (people-science-research-consultancies) – unknown – Not found in ATS directories.
- **Visier** (people-science-research-consultancies) – unknown – Not found in ATS directories.
- **Zappi** (people-science-research-consultancies) – unknown – Not found on Lever or Greenhouse.

## Job boards catalogued during the research (168)

Boards with a usable RSS / JSON access are wired in `config.json` (`rss.feeds`, `workablesearch`, `hiringcafe`, `eures`, `reliefweb`, `eightyk`); the rest are listed for future batches.

| Board | Access | Feed / API | Coverage | Confidence | Notes |
|---|---|---|---|---|---|
| 4dayweek.io | json-api | https://4dayweek.io/rss  (robots.txt also allows /api/v1 and /api/v2 — undocumented public API) | 4-day-week and remote jobs, ~1.5k listings, includes non-tech | low | RSS was disabled in one scraper for low volume/high duplicate overlap; API paths only inferred from robots.txt (MaheshBhushan/eve). |
| 80,000 Hours Job Board | json-api | POST https://W6KM1UDIB3-dsn.algolia.net/1/indexes/jobs_prod/query | ~900+ roles across ~380 orgs: AI safety/alignment, AI governance & policy, trust & safety, ops/comms/research at EA and global-health orgs; large share remote-w | high | Board is a Nuxt app on a public Algolia index. Headers: x-algolia-application-id: W6KM1UDIB3, x-algolia-api-key: d1d7f2c8696e7b36837d5ed337c4a319 (search-only k |
| AI Safety / policy jobs dataset (MULTIVERSE) | json-api | https://raw.githubusercontent.com/jiahui2284/MULTIVERSE/main/checked0.csv | ~1,400 AI safety/policy/civic-tech postings from 558 orgs with apply URLs and remote/nonprofit flags (static snapshot, 2025-2026) | medium | Static CSV, not live; valuable as a seed list of organizations and their careers hosts. |
| Arbeitnow | json-api | https://www.arbeitnow.com/api/job-board-api?remote=true&page=1  (also ?search=<kw>, ?visa_sponsorship=true; follow links.next) | EU/Germany-heavy but global; mixed tech + non-tech (marketing, HR, ops); has boolean remote field and tags | high | No key. JSON {data:[{slug,company_name,title,description,remote,url,tags,job_types,location,created_at}],links:{next}}. Returns 429 if hammered; site asks not t |
| Arbeitnow remote job API | json-api | https://www.arbeitnow.com/api/job-board-api | EU-centric remote jobs incl. Germany-based AI companies | high | Free JSON, paginated, no key; supports remote filter and tags. |
| ats-scrapers hosted job dataset (jobhive) | json-api | https://storage.stapply.ai/jobhive/v1/manifest.json | Live jobs from thousands of Greenhouse/Lever/Ashby/Workday/SmartRecruiters/SuccessFactors tenants, normalized; no API key | medium | README says querying needs no key/account; the host was blocked by my sandbox proxy (403) so unverified. Could replace dozens of per-company adapters if reachab |
| ats-scrapers tenant lists (per-ATS CSV) | json-api | https://raw.githubusercontent.com/kalil0321/ats-scrapers/main/ats-companies/greenhouse.csv | name,slug,url for ~3.3k Ashby, ~5.8k Greenhouse, ~2.4k Lever, ~4.7k Workable, ~2.4k SmartRecruiters tenants plus Workday/Recruitee/Personio/BambooHR/Teamtailor  | high | Plain CSV over raw GitHub (fetched successfully). Use for auto-discovering more employers by name keyword (e.g. 'mental', 'health', 'behavior', 'safety'). Files |
| Braintrust (freelance/contract network) | json-api | https://app.usebraintrust.com/api/jobs/?limit=50&offset=0&ordering=-created_at&search=behavioral | Contract/freelance roles worldwide; tech-heavy but has UX research, product, marketing, AI training/eval gigs | high | Unauthenticated (a scraper notes 'Verified 2026-07-17'); server-side search filter; DRF-style pagination via next (returned as http://, force https). Seen in hi |
| Built In | json-api | https://api.builtin.com/api/jobs?title=user%20researcher&remote=true&page=1&perPage=20 | US tech-hub board (Chicago/NYC/SF/etc.) with a remote section; product, design, HR, marketing besides engineering; mostly US-only | medium | api.builtin.com is the site's declared external API host (data-external-api in page header) but only one scraper (ai-products-builder/jobify) uses this jobs end |
| CareerView validated ATS watchlist | json-api | https://raw.githubusercontent.com/ColeSlad/CareerView/main/docs/watchlist.md | ~200 AI-company boards with validated ATS slug + API URL (Ashby/Greenhouse) | high | Markdown table; useful cross-check for slug validity (it records failed validations). |
| Consider VC boards (platform) | json-api | POST {board-host}/api-boards/search-jobs | VC portfolio boards: jobs.sequoiacap.com, Lightspeed, Bessemer, GV, First Round, Kleiner Perkins, Balderton, Creandum, Peak XV, Griffin Gaming; health-tech port | medium | Same-origin JSON endpoint; first GET {board}/jobs to obtain cookie + x-csrf-token, then POST. Documented in career-ops and applypack open-source projects (2026) |
| EURES (EU job mobility portal) public search API | json-api | POST https://europa.eu/eures/api/jv-searchengine/public/jv-search/search  Content-Type: application/json  body {"resultsPerPage":50,"page":1,"sortSearch":"BEST_ | All EU/EEA public employment service vacancies, every occupation; no remote flag (use keywords 'remote'/'home-based'); Serbia not a member but cross-border-frie | high | Keyless. resultsPerPage max 50 (>50 = 400), page max 200. Old path europa.eu/eures/eures-apps/searchengine/page/jv-search/search now 404s. Documented in rorar/E |
| Getro VC talent-network boards (platform) | json-api | POST https://api.getro.com/api/v2/collections/{collection_id}/search/jobs | One board per VC/accelerator aggregating all portfolio companies' openings; relevant health/impact boards: General Catalyst, Khosla (id 257), Accel (id 8672), a | high | Body {"hitsPerPage":50,"page":0,"filters":{"page":0},"query":""} with Accept: application/json and Referer set to the board URL; response results.jobs[] {title, |
| Hacker News 'Who is Hiring' (monthly thread) | json-api | https://hacker-news.firebaseio.com/v0/user/whoishiring.json | Hundreds of AI startups monthly incl. voice/conversational AI; many REMOTE-tagged posts | high | Free Firebase JSON API: fetch user 'whoishiring' submissions, then /v0/item/<id>.json for the thread and each comment; filter for REMOTE and keywords (conversat |
| hiring.cafe (multi-ATS aggregator) | json-api | POST https://hiring.cafe/api/search-jobs | Millions of postings pulled from company ATSs worldwide with structured remote/role filters; the best single place to catch unusual titles (behavioral scientist | high | Unofficial JSON API used by RSSHub (lib/routes/hiring.cafe/jobs.tsx is a ready reference implementation) and several 2025-26 scrapers; body like {"size":40,"pag |
| IGDA Game Writing SIG jobs (game-writing.com) | json-api | https://raw.githubusercontent.com/gwsig-tech/game-writing.com/main/src/data/jobs/job-postings.csv | Curated game writing / narrative design postings with canonical ATS URLs, location, remote_type | medium | CSV committed to public GitHub repo (branch name unverified); most narrative-specific source found |
| Jobicy Remote Jobs API | json-api | https://jobicy.com/api/v2/remote-jobs?count=50&tag=psychology | General remote jobs worldwide; has a Mental Health Care company category; filters by geo/industry/tag | high | No token required. Also RSS at jobicy.com/jobs-rss-feed. Keyword-filter results for psychology/mental health/UX research. |
| Landing.jobs | json-api | https://landing.jobs/api/v1/jobs?limit=50&offset=0 | Tech/product roles, Europe (Portugal-heavy); remote flag per job; little psychology content, some UX research | high | Keyless JSON array (page size 50). Company derived from posting URL slug (/at/<company>/<job>). Seen in career-ops-hq/career-ops, strelov1/freehire, ever-jobs/e |
| lucabarattini/project-x ashby/greenhouse board JSON | json-api | https://raw.githubusercontent.com/lucabarattini/project-x/main/data/ashby-boards.json | ~300 curated AI-company boards with apiUrl | high | Also greenhouse-boards.json; small but AI-focused. |
| Outscal OpenJobs (studio ATS seed list) | json-api | https://raw.githubusercontent.com/outscal/OpenJobs/main/adapters/_samples.json | Curated list of game studios with ats_url (Greenhouse/Lever/Ashby) - useful seed for more boards | medium | Public repo; branch unverified |
| Reddit hiring threads (r/UXResearch, r/forhire, r/RemoteJobs) | json-api | https://www.reddit.com/r/UXResearch/search.json?q=hiring&restrict_sr=1&sort=new&limit=25 | Ad-hoc hiring posts; noisy but catches small studios and consultancies | medium | Public JSON needs a descriptive User-Agent and ~1 req/2 s; seen in a 2026 source-probe script. |
| ReliefWeb Jobs API | json-api | GET https://api.reliefweb.int/v1/jobs?appname=psy-jobs&profile=full&limit=100&sort[]=date:desc&query[value]=psychosocial%20OR%20%22mental%20health%22%20OR%20%22 | Humanitarian/NGO sector worldwide: MHPSS (mental health & psychosocial support) advisers, psychologists, staff well-being, social & behaviour change (SBC) speci | high | Official open API, no key; appname parameter is mandatory; supports POST JSON filters (fields title/body/country/experience); fair-use ~1000 calls/day. Confirme |
| Teamtailor / Pinpoint / Lever-EU public feeds (adapter notes, not boards) | json-api | https://<sub>.teamtailor.com/jobs.json (also /jobs.rss, works on custom domains); https://<sub>.pinpointhq.com/jobs.rss (full text); https://api.eu.lever.co/v0/ | Nordic/UK/EU employers (e.g. Mindler, Askable, Founders Pledge on Teamtailor; many UK studios on Pinpoint; EU Lever tenants such as Asobo/Frontier) | high | Teamtailor returns JSON Feed with date_published and content_html. Lever has a separate EU tenant: api.lever.co returns 404 for those companies, so try api.eu.l |
| The Hub (thehub.io) | json-api | https://thehub.io/api/v2/jobsandfeatured?page=1&countryCode=EU   plus a second pass with &isRemote=true | Nordic/EU startup jobs incl. people/HR, marketing, product, design; remote filter is a separate query mode | medium | Keyless; results scoped by geo-IP unless countryCode is sent; payload has no publication date. Documented in career-ops-hq/career-ops SUPPORTED_JOB_BOARDS. |
| The Muse | json-api | https://www.themuse.com/api/public/jobs?page=0&location=Flexible%20%2F%20Remote&category=Healthcare  (repeat per category; optional &level=Mid%20Level&api_key=) | US-heavy curated employers; strong non-tech categories: Healthcare, Human Resources and Recruitment, Design and UX, Data and Analytics, Writing and Editing, Pro | high | Keyless (api_key only raises rate limit). Response {results:[{name,company:{name},locations:[{name}],categories,levels,refs:{landing_page},contents(html),public |
| Torre (torre.ai) | json-api | POST https://search.torre.co/opportunities/_search?size=20  body {"skill/role":{"text":"psychology","experience":"1-plus-year"},"remote":{"term":true}} | Pan-LatAm marketplace with many remote roles (coaching, HR, customer success, design) that never reach Greenhouse/Lever | medium | Zero-auth JSON but quirky: size caps at 20, no pagination works, unknown filter keys silently ignored, and skill/role.text without experience returns 500; widen |
| Welcome to the Jungle | json-api | POST https://csekhvms53-dsn.algolia.net/1/indexes/wttj_jobs_production_en/query | France/EU startups and scaleups incl. mental-health and health-tech players (moka.care, teale, Alan, Doctolib, Qare...); many roles tagged remote (EU) | high | Public Algolia index; headers x-algolia-application-id: CSEKHVMS53 plus the search-only key embedded in the site (a 2026 scraper uses 4bd8f6215d0cc52b2643076576 |
| Workable global job search | json-api | GET https://jobs.workable.com/api/v1/jobs?query=behavioural+scientist&location=Remote | Every public Workable employer worldwide (thousands of SMBs; strong for UK/EU health, coaching, L&D and research agencies) | high | Searches all Workable tenants at once; max limit=20 per call, paginate with pageToken; day_range=7 returns every posting created in the window (~6k/day, too bro |
| Working Nomads - Remote Medical Jobs Europe | json-api | https://www.workingnomads.com/api/exposed_jobs/ | Fully remote medical/health roles filtered for Europe | medium | Public JSON endpoint historically available; verify still open |
| AFJV | rss |  | French game industry jobs | medium | RSS used by RenderJobs; French-language, low relevance for Serbia |
| aijobs.net (formerly ai-jobs.net) | rss | https://aijobs.net/feed/ | AI/ML roles worldwide incl. prompt engineers, AI trainers, conversation designers; remote filter | medium | Feed URL from memory - verify; site is SSR and also exposes category pages. |
| APA PsycCareers | rss | https://www.psyccareers.com/jobs/?display=rss&keywords=remote&resultsPerPage=100 | US psychology jobs (academic, clinical, industry research); some remote research/UX-adjacent roles | medium | YM Careers board; this exact display=rss pattern for psyccareers.com appears in an older open-source scraper, and the YM pattern is confirmed on other associati |
| Authentic Jobs | rss | https://authenticjobs.com/?feed=job_feed   (alt https://authenticjobs.com/feed/) | Design/creative/dev; low volume; occasional UX research and content roles | medium | WP Job Manager feed. Seen in CodersShip101 rss.ts and Anuj-PratapSingh/scout. |
| BPS Jobs (British Psychological Society) | rss | https://jobs.bps.org.uk/jobsrss/?keywords=remote | UK psychology roles (clinical, occupational, research, assistant psychologist); mostly UK-based, some remote | low | From memory the board is Madgex-powered; the Madgex /jobsrss/?keywords=...&page=N pattern is confirmed on THE unijobs, Inside Higher Ed, Chronicle, Nature Caree |
| CharityJob | rss | https://www.charityjob.co.uk/jobs/rss?keywords=mental+health | UK charity sector incl. mental health, many remote | low | RSS URL pattern unverified. |
| Chronicle of Higher Education Jobs | rss | https://jobs.chronicle.com/jobsrss/?countrycode=US&keywords=psychology | US academic roles | high | Madgex board. |
| Dynamite Jobs | rss | https://dynamitejobs.com/feed/ | Remote-first small companies; heavy on marketing, ops, support, EA/VA roles; worldwide-friendly | low | Single scraper reference (zawaditechnologiesllc/S-PAY); confirm the feed actually contains job posts. |
| Empllo | rss | https://empllo.com/feeds/remote-jobs.rss | Remote tech/startup roles incl. product/design/marketing | medium | Feed URL from TheineAddict/Null-Expected source config (enabled). |
| EU Remote Jobs | rss | https://euremotejobs.com/?feed=job_feed&posts_per_page=50   (region feeds: https://euremotejobs.com/job-region/remote-jobs-worldwide/feed/ , /job-region/remote- | Remote roles for Europe/EMEA/Worldwide; roughly one third engineering, rest marketing, support, ops, HR, finance | high | WP Job Manager feed; job_listing:location values like 'UK', 'EMEA', 'Worldwide', 'Europe, Netherlands'. Seen in applypack/applypack, Akius1/jobradar, waleedba19 |
| GameJobs.co | rss | https://gamejobs.co/?format=atom | Game dev jobs, strong remote share; ~100 latest entries, title 'Role at Studio' only | high | Atom feed needs no key; site itself is Cloudflare/SPA |
| Games-Career.com | rss | https://www.games-career.com/rss/Joboffer | European (esp. German) game industry jobs | high | Open global RSS feed |
| Guardian Jobs | rss | https://jobs.theguardian.com/jobsrss/?keywords=wellbeing | UK jobs incl. mental health/wellbeing | low | RSS URL pattern unverified. |
| HERC Jobs | rss | https://main.hercjobs.org/jobs/?display=rss&keywords=psychology | US higher-ed consortium jobs | medium | YM Careers board pattern, seen in two scraper configs. |
| HigherEdJobs | rss | https://www.higheredjobs.com/rss/ (category feeds by numeric catID, e.g. 68 = Higher Education, 22 = Career Development; pick Psychology / Counseling / Health c | US higher-ed roles: psychology/counseling faculty, student well-being, online-teaching (some remote) | medium | Public no-auth category RSS; verified usable 2026-08 by one project. Exact psychology catID must be read from the index page. |
| Inside Higher Ed Careers | rss | https://careers.insidehighered.com/jobsrss/?keywords=psychology | US academic/administrative roles incl. psychology, counseling, student well-being | high | Madgex board; 20 per page; &countrycode=US supported. |
| Jobgether | rss | https://jobgether.com/feed/ | Large aggregator, many non-tech roles, worldwide filter on site | low | Only one repo (zawaditechnologiesllc/S-PAY) pulls this feed and it may be the blog feed rather than jobs; job pages are SPA. Treat as unverified. |
| jobs.ac.uk | rss | https://www.jobs.ac.uk/search/rss?keywords=behavioural+science | UK (plus some EU/international) academic and research roles: psychology lecturers, behavioural-science research fellows/associates, digital-health researchers;  | medium | Per-keyword search RSS (repeat for psychology, 'digital health', 'mental health', 'behaviour change'); used in a 2026 n8n workflow. The old /feeds/subject-areas |
| JobsCollider | rss | https://jobscollider.com/remote-jobs.rss  (category feeds e.g. https://jobscollider.com/remote-writing-jobs.rss , /remote-project-management-jobs.rss , /remote- | Tens of thousands of remote jobs from 10k+ companies worldwide; categories cover non-tech (writing, customer service, HR, project management, 'all others') | medium | Free; terms require linking/crediting JobsCollider and forbid re-posting to LinkedIn/Google Jobs; listings appear ~1 day after posting. Seen in SummonIQ/gimme-j |
| JobsCollider Remote Jobs RSS | rss | https://github.com/JobsCollider/remote-jobs-rss | Remote jobs by category, hourly updates | medium | Feed URLs listed in the GitHub README. |
| Jobspresso | rss | https://jobspresso.co/?feed=job_feed   (alt: https://jobspresso.co/feed/?post_type=job_listing) | Curated remote jobs; good share of marketing, customer support, writing, design, some HR | high | WordPress WP Job Manager feed with job_listing:location / job_listing:company / job_listing:job_type elements. Seen in career-ops-hq/career-ops SUPPORTED_JOB_BO |
| NoDesk | rss | https://nodesk.co/remote-jobs/index.xml | Broad remote board incl. non-tech (customer support, marketing, ops, writing, HR) | high | Static-site XML feed (not WP). Seen in career-ops-hq/career-ops, animesh8787/nexus-os, Akius1/jobradar. (nodesk.substack.com/feed is the newsletter, not jobs.) |
| Real Work From Anywhere | rss | https://www.realworkfromanywhere.com/rss.xml  (category feeds: https://www.realworkfromanywhere.com/remote-<category>-jobs/rss.xml e.g. remote-product-manager-j | Only 'work from anywhere' (no country restriction) roles — ideal for Serbia; mixed tech/non-tech | medium | Keyless RSS. Seen in SummonIQ/gimme-job and caitingYUE/haigoo-remote. |
| Remote.co | rss | https://remote.co/remote-jobs/feed/   (category feeds: https://remote.co/remote-jobs/{developer/data-science/healthcare/human-resources/marketing/writing/custom | FlexJobs-owned board; broad non-tech categories; US-leaning | medium | Feed URLs appear in several scrapers but one lists them under 'quarantine' and another has the source disabled, so treat as possibly stale/blocked and validate  |
| Remote.io | rss | https://s3.remote.io/feed/rss.xml | Tech-heavy remote board, noisy | low | From an elfeed config (dcluna/dotfiles); tagged 'varied:noisy'. |
| RemoteFirstJobs | rss | https://remotefirstjobs.com/rss | Remote-first companies; per-category and per-skill RSS feeds updated every 10 minutes | medium | Filter by keywords client-side. |
| RemoteYeah | rss | https://remoteyeah.com/jobs.rss | General remote board (tech-leaning) | low | Single reference (MEMAtest/job-digest-portal boards.py). |
| Remotive | rss | https://remotive.com/remote-jobs/rss-feed | General remote jobs, worldwide-friendly | high | Also JSON at https://remotive.com/api/remote-jobs?search=psychology |
| SkipTheDrive | rss | https://www.skipthedrive.com/feed/ | US-heavy telecommute board with many non-tech listings (healthcare, HR, customer service, education) | medium | WordPress main feed (jobs are posts). Two scraper configs use it (dcluna/dotfiles elfeed, CodersShip101 rss.ts); one older CSV claimed 'no RSS' so verify item c |
| THE unijobs (Times Higher Education) | rss | https://www.timeshighereducation.com/unijobs/jobsrss/?keywords=psychology&page=1 | Global academic jobs incl. psychology/behavioural science; UK-heavy | high | Madgex board; 20 items per page, paginate with &page=N; verified working 2026-08 by an academic-RSS ingester. |
| WorkAnywhere.io | rss | https://workanywhere.io/jobs.rss | General remote board | low | Single reference (MEMAtest/job-digest-portal). |
| Adzuna API | api-key | https://api.adzuna.com/v1/api/jobs/{country}/search/{page}?app_id=APP_ID&app_key=APP_KEY&what=behavioural%20scientist&where=remote&results_per_page=50&sort_by=d | All occupations; countries gb,us,de,nl,at,fr,be,ch,es,it,pl,ca,au,nz,in,sg,za,br,mx (no Serbia); remote only via keyword/where | high | Free developer key (app_id + app_key). Response {results:[{title,company.display_name,location.display_name,redirect_url,description,created,category.label}],co |
| Careerjet | api-key | https://public.api.careerjet.net/search | Aggregator, many countries | low | Free affiliate key required. |
| Careerjet public search API | api-key | http://public.api.careerjet.net/search?keywords=psychologist&location=remote&locale_code=en_GB&affid=AFFILIATE_ID&user_ip=1.2.3.4&user_agent=Mozilla/5.0&pagesiz | All occupations, ~90 country locales (en_GB, en_US, de_DE, ...); no explicit remote filter | high | Needs free affiliate id (affid) plus user_ip and user_agent params or it returns 'missing param'/'Undeclared referrer'. Historically http-only endpoint. Respons |
| Jooble | api-key | https://jooble.org/api/ | Aggregator incl. Serbia (rs.jooble.org) | low | Free API key required. |
| Jooble API | api-key | POST https://jooble.org/api/{API_KEY}  Content-Type: application/json  body {"keywords":"psychologist remote","location":"Serbia","radius":"","page":"1","Result | Aggregator of all occupations; has a Serbian portal (rs.jooble.org) so location=Serbia and 'remote' keywords both work | high | Free key by e-mail registration; key is in the URL path. Response {totalCount, jobs:[{title,location,snippet,salary,source,type,link,company,updated,id}]}. Seen |
| Reed API (UK) | api-key | https://www.reed.co.uk/api/1.0/search?keywords=psychologist%20remote&resultsToTake=100&resultsToSkip=0   (HTTP Basic: key as username, empty password); detail:  | UK-centric, all occupations incl. psychology/wellbeing/HR; many 'Remote' postings but UK right-to-work often required | high | Free key. Max 100 per page. Seen in strelov1/freehire, ever-jobs/ever-jobs, maccydee/job-radar, lukebrewerton/job-finder. |
| Reed.co.uk | api-key | https://www.reed.co.uk/api/1.0/search | UK incl. remote coaching/wellbeing roles | low | Free API key; unverified in this session. |
| Welcome to the Jungle | api-key |  | EU startups (Doctolib, Alan, Huma, Oviva, 9amHealth, Eucalyptus, HelloBetter) | medium | Algolia-backed search needs app key; company pages SSR |
| Y Combinator Work at a Startup | api-key | https://www.workatastartup.com/companies | YC startups incl. many voice/conversational-AI companies (Vapi, Retell, Bland, Decagon are YC) | medium | Backed by Algolia; public search key is embedded in page JS but is not an official API. |
| 80 Level Jobs | html-ssr | https://80.lv/jobs (parse __NEXT_DATA__ JSON) | Game art/dev jobs, ~70 listings, 10 per page | high | Next.js embedded JSON; _next/data endpoints |
| Behavioral Scientist Jobs | html-ssr |  | Behavioral science roles worldwide, incl. remote | low | Unverified; WordPress-based so /feed/ may exist. |
| BehavioralEconomics.com Jobs | html-ssr |  | Behavioral science / applied behavioral research roles incl. remote (e.g., Lead UX Behavioral Scientist, Behavioral Research Lead) | medium | WordPress site; likely has /jobs/feed/ RSS |
| Built In (company job pages) | html-ssr |  | US tech companies incl. Equip, Talkiatry, Bend Health, Mantra, Big Health, Charlie Health | medium | Server-rendered listing pages; per-company /company/<slug>/jobs. |
| Consider.com VC boards | html-ssr |  | Portfolio job boards (NEA: Vori Health; Kry board at /boards/co/kry) | low |  |
| Digital Health Jobs | html-ssr |  | 5,000+ digital health roles, strong on European digital mental health (HelloBetter, MindDoc, Selfapy); remote filter available | medium | Company pages at /companies/<slug>; no public feed found. |
| Diversify Dietetics Job Board | html-ssr |  | Dietitian/nutrition roles incl. remote telehealth (Nourish) | low | Niche; low volume |
| EAWOP Job Board | html-ssr |  | European work & organizational psychology | low | Unverified. |
| Escape the City | html-ssr |  | UK purpose-driven employers incl. Unmind, ieso, Spill | low | Organisation pages list open roles. |
| Escape the City | html-ssr |  | UK purpose-driven roles incl. Oviva | low |  |
| Flexa Careers | html-ssr |  | Verified flexible/remote employers incl. Oliva, Unmind | low | Useful for EU remote-friendly employers. |
| Games Jobs Direct | html-ssr | https://www.gamesjobsdirect.com/jobs-with-<id>_<studio> | UK/EU-centric game jobs incl. studio pages | medium | Listing pages public; detail may require login |
| Getro-powered VC portfolio boards (Techstars, a16z, Owl Ventures, AI Fund, Insight, Primary, Anthemis, Necessary, Meridian Street, Greenfield) | html-ssr |  | Portfolio mental-health startups: Manatee, Kintsugi, Woebot, Talkiatry, NOCD, Eleos, Unmind, Modern Health, Alma | medium | Same Getro platform across jobs.a16z.com, careers.owlvc.com, careers.aifund.ai, jobs.insightpartners.com, jobs.primary.vc, jobs.anthemis.com, jobs.necessary.vc, |
| GrackleHQ | html-ssr | https://www.gracklehq.com | Game industry aggregator, 4000+ live listings | medium | One scraper fetches it over plain HTTP, another reports a JS app; volatile |
| HelloWorld.rs | html-ssr |  | Serbia IT/product/UX | low | Unverified. |
| Hitmarker | html-ssr | https://hitmarker.net/sitemap-jobs.xml | Largest gaming/esports job board (~5000 URLs), worldwide incl. remote | high | List page is HTMX/Sprig; use sitemap + JSON-LD JobPosting on each job page |
| ICF Career Center | html-ssr |  | Coaching roles, US-centric | low | Unverified. |
| Idealist | html-ssr |  | Nonprofit incl. mental health, some remote | low | Unverified. |
| InGameJob | html-ssr |  | Eastern Europe / CIS game industry jobs incl. remote | low | From memory; relevant regionally for Serbia |
| Integrity Institute careers | html-ssr |  | The institute's own roles only (e.g. Community Lead, Remote); its member job board is Slack-only | medium | URL appears in multiple validated job-link datasets (2026). |
| Jobgether | html-ssr |  | Remote jobs aggregator with company pages (HelloBetter) | low | Aggregator; may lag source boards. |
| kalebconfer-sys/job-board-directory (CSV with observed job counts) | html-ssr | https://raw.githubusercontent.com/kalebconfer-sys/job-board-directory/main/greenhouse.csv | ~12k boards with API URL and 2026 observed job counts (ashby, greenhouse, lever, workable, smartrecruiters, recruitee, personio, workday) | high | Columns: ats,slug,name,boardUrl,apiUrl,jobCount,source. Job counts make it easy to skip dead boards. |
| NASW JobLink | html-ssr |  | US clinical/social work roles (Talkspace, Octave, Amwell) | low | US-licensure roles; low relevance for Serbia. |
| Poslovi Infostud | html-ssr |  | Serbia (incl. remote/psychology/HR roles) | low | Local Serbian board; unverified RSS. |
| PsychJOB | html-ssr |  | Psychology jobs across Europe (DE/AT/CH heavy) incl. digital providers like MindDoc | medium | Company pages at /en/company/<slug>. |
| Remote Game Jobs | html-ssr | https://remotegamejobs.com | Remote-only game jobs worldwide | high | Scrapeable with cheerio (no browser) |
| Remote Impact - Remote Mental Health Careers guide | html-ssr |  | Curated list of remote mental health employers and non-clinical role types | low | Reference article, not a live board. |
| Remote Rocketship | html-ssr | https://www.remoterocketship.com/sitemap_job_openings_worldwide.xml  and  https://www.remoterocketship.com/sitemap_job_openings_rest_of_world.xml  (then fetch e | Large aggregator incl. non-tech; per-region sitemaps let you target 'worldwide'/'rest of world' | medium | No API/RSS; HTML pages return 403 to plain curl (bot-blocked) so send a browser UA and throttle. Sitemap usage seen in TheineAddict/Null-Expected; 403 noted in  |
| Remote-jobs GitHub lists (remoteintech/remote-jobs, lukasz-madon/awesome-remote-job, tramcar/awesome-job-boards) | html-ssr | https://raw.githubusercontent.com/remoteintech/remote-jobs/main/README.md  (markdown table Name / Website / Region; per-company profiles at https://raw.githubus | Not job postings — lists of remote-friendly companies (with Region: Worldwide/Europe/USA) and job boards; use as a seed for ATS discovery | high | Plain raw markdown, keyless. Several scrapers parse the README to extract careers links and ATS slugs (Suhel-Kap/job-search-agent, navgurukul/jobLead, premxai/j |
| Rock Health Job Board | html-ssr |  | US digital health startups | low | Unverified; US-centric. |
| SIOP JobNet | html-ssr |  | I-O psychology jobs, US-centric | low | Unverified. |
| Startit Jobs | html-ssr |  | Serbia startup jobs | low | Unverified. |
| startup.jobs | html-ssr |  | Startup roles incl. HelloBetter, ieso, OpenUp | low | Per-company pages; check robots. |
| startup.jobs | html-ssr |  | Startup roles incl. Levels, Oviva, HelloBetter, Ada Health, Second Nature | medium | Company pages at /company/<slug> |
| TSPA Job Board (Trust & Safety Professional Association) | html-ssr |  | Trust & safety policy, content-moderation operations, T&S research and integrity roles at platforms and vendors; many US, a fair number remote | medium | WordPress page with listings; a 2026 open-source aggregator (criminology-jobs) scrapes it via an LLM extractor, i.e. no feed found. TSPA's own openings: https:/ |
| UX Jobs aggregator | html-ssr |  | UX/product design & research roles aggregated from Greenhouse (546) and Lever (135) boards daily | medium | Companion Substack 'Remote Jobs Weekly' lists Maven, Talkspace roles |
| WELCOA Career Center | html-ssr |  | US corporate wellness roles | low | Unverified. |
| Behavioral Health Tech Job Board | spa-or-blocked |  | Behavioral health tech, mostly US | low | Likely Pallet-hosted SPA. |
| Built In - HealthTech companies hiring remote | spa-or-blocked |  | US healthtech / digital health & therapeutics companies (also /companies/type/digital-health-therapeutics-companies) | medium | US-centric; heavy JS |
| Contra | spa-or-blocked |  | Freelance marketplace (design, content, marketing); opportunities feed requires account | low | No public API references; one repo notes 'no browsable board' for matched briefs. |
| Crossover | spa-or-blocked | https://app.crossover.com/x/marketplace/available-jobs (SPA) | Worldwide contractor roles for Trilogy/ESW portfolio; some non-dev (ops, coaching, support) but assessment-gated | low | Only internal authenticated api.crossover.com endpoints found; no public jobs API. |
| FlexJobs | spa-or-blocked |  | Paywalled; strong non-tech remote coverage but listings hidden behind subscription (owns Remote.co) | low | No public feed. Use Remote.co feeds as the free proxy. |
| General Catalyst Job Board (Getro) | spa-or-blocked |  | GC portfolio: Fay, Cityblock, and many digital health cos | medium | Similar Getro boards: careers.redpoint.com, jobs.thrivecap.com, careers.owlvc.com, jobs.highfivepartners.com, jobs.threshold.vc, careers.greymattercapital.com,  |
| Health Talent Exchange (AQP Search) | spa-or-blocked |  | Digital health companies (Kaia, Cityblock listed) | medium | Getro-powered |
| Health Tech Nerds Job Board | spa-or-blocked |  | US health tech | low | Likely Pallet-hosted SPA. |
| In Women's Health Job Board | spa-or-blocked |  | Women's health startups (e.g., Midi) | medium | Getro-style board; JSON may be exposed via consider.com |
| Jobgether | spa-or-blocked |  | Remote jobs worldwide with country eligibility | low | Next.js SPA; unverified. |
| MeetFrank | spa-or-blocked |  | Baltic/EU startups (Flo Health, HelloBetter) | low |  |
| Otta | spa-or-blocked | https://api.otta.com/graphql (requires login session) | UK/EU startup jobs; folded into Welcome to the Jungle | medium | Only login-gated GraphQL found (lilyispuppy/GPT3IsAGoodSoftwareEngineer). Use the WTTJ Algolia index instead. |
| Power to Fly | spa-or-blocked |  | Diversity/women-focused board, US-heavy, many non-tech roles | low | No RSS/API references found anywhere in public code; listings render client-side. |
| Startup.jobs | spa-or-blocked |  | Startup roles incl. non-tech; note it republishes closed postings long after they close | low | No API/RSS found; one job-search log (MisterZogs/recherche-taf) warns about stale reposts. |
| Virtual Vocations | spa-or-blocked |  | Paywalled US telecommute board, many healthcare/education/HR roles | low | No feed evidence. |
| Welcome to the Jungle (formerly Otta) | spa-or-blocked |  | UK/EU startups: Limbic, Unmind, Oliva, Spill, Eleos, HelloBetter, OpenUp, BetterUp | medium | SPA; discovery only. |
| Wellfound (AngelList Talent) | spa-or-blocked |  | Startup jobs incl. Sword, Whoop, ZOE, Big Health, 9amHealth, Oviva | medium | Requires login for most data |
| Wellfound (AngelList Talent) - Mental Health startups | spa-or-blocked |  | Startup jobs incl. Modern Health, BetterHelp, Big Health, Unmind, Noom, Slingshot AI | medium | JS-rendered and bot-protected; use for discovery only. |
| Work With Indies | spa-or-blocked |  | Indie game jobs, many remote narrative/writer roles | high | /jobs and /api/jobs return 404; data via hidden embed; needs browser |
| ABSA Job Board (Applied Behavioral Science Association) | unknown |  | Applied behavioral science roles | low |  |
| Action Design Network Job Board | unknown |  | Behavioral design roles and team directory | low | Referenced in Habit Weekly article; URL not verified |
| AI Safety boards (aisafety.careers / alignmentjobs / AI Safety Jobs) | unknown |  | Curated AI-safety roles; largely mirrors the 80,000 Hours board | low | No machine-readable surface found in any open-source scraper; prefer the 80k Algolia index. |
| AI Safety job boards (aisafety.com / aisafety.careers) | unknown |  | Community-maintained AI safety role lists | low | From memory only; not found via GitHub evidence. Verify from desktop. |
| aijobs.ai | unknown |  | General AI job aggregator | low | Seen as apply host for several companies; not verified. |
| aisafety.training (deadline board) | unknown |  | AI-safety programs, fellowships and course deadlines (Airtable-backed) | low | A 2026 job-search pipeline calls it 'the single best AI-safety/alignment deadline board'; no API found. |
| All Tech Is Human Responsible Tech Job Board | unknown |  | Responsible AI, T&S, AI ethics, policy roles | low | Not verified in this session |
| All Things in Moderation jobs | unknown |  | Content moderation / T&S community; jobs surfaced via newsletter/community | low | No machine-readable surface found in open-source code; memory only. |
| Amir Satvat Games Jobs / studio directory sheets | unknown | https://docs.google.com/spreadsheets/d/1nHKWmwElNhap2It0jY7QHaRIdWojhaKt6Mll4UBOTT4/export?format=csv | Directory of hundreds of game studio careers URLs (source of many custom-site entries above) | medium | Public Google Sheet; also 1eR2oAXOuflr8CZeGoz3JTrsgNj3KuefbdXJOmNtjEVM for animation/VFX/game job studios |
| ATD Job Bank | unknown | https://jobs.td.org/jobs/?display=rss&keywords=remote (unverified) | Learning & development / instructional design roles (US-heavy, some remote) | low | Believed YM Careers-hosted; pattern confirmed elsewhere, ATD itself unverified. |
| BESCI | unknown |  | Behavioral science jobs board/community | low | No evidence found; memory only. |
| Conversation Design Institute community job board | unknown |  | Niche conversation-designer postings shared with CDI community | low | Mostly inside their community/newsletter; low automation value but high relevance. |
| DailyRemote | unknown |  | Large remote aggregator with HR, writing, customer support, healthcare categories | low | No RSS/API evidence in public code; would need HTML scraping of category pages. |
| Digital.health Job Board | unknown |  | Digital health roles aggregated across companies | low | Surfaced in discovery; access mode not verified |
| EA Opportunity Board | unknown |  | EA/impact fellowships, internships, volunteer and early-career roles | low | Airtable-based from memory; URL unverified. |
| eLearning Industry jobs | unknown |  | Instructional design / eLearning roles, remote common | low | Memory only. |
| Fast Forward tech-nonprofit job board | unknown |  | Nonprofit tech roles (incl. Crisis Text Line, Thorn, CAIS listings appeared here) | low | Appears frequently as an apply host in the dataset; access method not verified. |
| Fitt Insider Jobs | unknown |  | Fitness/wellness/health startups (e.g., Hims & Hers listed) | medium |  |
| gamedevjobs.io | unknown |  | Game dev jobs incl. design/writing | low | No evidence found; memory only. |
| Habit Weekly Jobs | unknown |  | Weekly curated behavioral science jobs (newsletter + site) | medium | Newsletter-first; site jobs page may be SPA |
| Habit Weekly Jobs | unknown |  | Behavioral design / behavioral science jobs | low | Unverified. |
| HealthTech Nerds job board | unknown |  | Health-tech operator community jobs (US) | low | From memory Pallet-hosted; nothing confirmed. |
| HLTH jobs / MedCity News jobs / Healthcare IT Central / Digital Health Jobs / HealthTech Jobs | unknown |  | Digital-health and health-IT job boards (US-heavy) | low | No feeds or APIs found in open-source code for any of these; Healthcare IT Central is a classic job-board CMS that often exposes RSS, worth a manual check. The  |
| ICF Career Center (International Coaching Federation) | unknown |  | Coaching roles and internal coach positions (corporate well-being platforms) | low | No career-center URL surfaced in code; if it runs on YM Careers the /jobs/?display=rss&keywords= pattern applies. Coach networks are better reached via BetterUp |
| Insight Platforms Jobs | unknown |  | Research-tech / insights platform jobs | low | Not verified this session. |
| Integrity Institute job listings | unknown |  | Integrity / T&S roles | low | Not verified in this session |
| JustRemote | unknown |  | Curated remote board (design, marketing, HR, support); paid 'Power Search' tier | low | Listed in awesome lists only; no feed/API evidence. |
| Pangian / Remote Woman / Remote Leaf / Truly Remote / RemoteHub / Remote4Me / Europe Remotely / Remote Europe / Remote in Europe / Remote Weekly / Remote Circle | unknown |  | Small community boards/newsletters; several appear dormant | low | No feed or API strings for any of these domains appear in public code; treat as link-only or skip. Hubstaff Talent (talent.hubstaff.com) is a profile marketplac |
| Probably Good job board | unknown |  | Impact-career roles incl. global health & mental health | low | Believed to embed/filter 80k data; memory only. |
| Quirk's Job Board | unknown |  | Market research / insights (US) | low | Not verified this session. |
| Remote Europe | unknown |  | Remote jobs for Europe | low | Unverified. |
| Remotees | unknown |  | Defunct — now redirects to weworkremotely.com (already scraped) | high | awesome-remote-job lists it as a redirect to WWR with utm_source=Remotees. Skip. |
| Research Live / MRS Jobs | unknown |  | UK market research & insights | low | Not verified this session. |
| ResearchOps Community / Mixed Methods / Learners / People Nerds job boards | unknown |  | Community-run UX research job lists (often Airtable or Slack based) | low | No machine-readable surface found; Learners is https://www.learners.co, People Nerds is dscout's community (dscout's own ATS is Greenhouse 'dscout'). |
| Rock Health job board | unknown |  | Digital-health startup jobs (US-heavy) | low | Board URL/platform unverified; if it is Getro-hosted, the api.getro.com collection endpoint applies. |
| SportsTechJobs | unknown |  | Sports/fitness tech incl. Peloton | low |  |
| Teamed | unknown |  | Learning-design and instructional-design roles (US remote) | low | Memory only. |
| TSPA Trust & Safety Job Board | unknown |  | Trust & safety, policy, integrity roles across platforms and vendors | low | Not verified in this session (search budget exhausted); likely HTML, may be SSR |
| UX Content Collective / UX Writing Hub job listings | unknown |  | Content design, UX writing, conversation design roles | low | Check for WordPress feed; conversation-design roles often posted here. |
| UX Jobs Board | unknown |  | UX design/research jobs, remote filter | low | Memory only. |
| UXPA Job Bank | unknown |  | UX research and design | low | Not verified this session. |
| uxresearchjobs.com | unknown |  | UX research jobs (if live) | low | Domain appears in 2016 and 2018 expired-domain lists, so it may be dead or re-registered; verify before wiring. |
| Working Not Working | unknown |  | Creative/agency roles (design, copy, narrative); US-heavy | low | remote-working-list CSV records no RSS; no API evidence. |

## Research summaries per category

- **digital-mental-health**: Digital mental health is a rich category for public-ATS scraping: of ~85 companies checked, 55+ have a provable Greenhouse/Lever/Ashby/Workable/Personio/Teamtailor/Workday board, with Greenhouse dominating US therapy/psychiatry platforms (Spring Health, Modern Health, BetterHelp, Alma, Grow, SonderMind, Cerebral, Octave, Two Chairs, Charlie Health, Little Otter, Hazel, Daybreak, NOCD, Mantra, Eleanor, Pelago, Boulder Care, Ophelia, Workit, Valera, Amae, Meru, Calm, Headspace) and Ashby dominating the newer AI-native players (Slingshot AI/Ash, Limbic, Woebot, Rula, Headway, Brightline, Equip, Sailor, Legion). The heavy caveat for a Serbia-based applicant: almost all US platforms (Headspace, Calm, Talkspace, Lyra, Spring, Modern Health, BetterHelp, Alma, Headway, Grow, SonderMind, Rula, Cerebral, Talkiatry, Charlie Health, Brightside, Two Chairs, Octave, Brightline, Little Otter, Hazel, Daybreak, NOCD, Mantra, Equip, Eleanor, Pelago, Boulder, Ophelia, Workit, Valera, LifeStance, Thriveworks) are "Remote - US" only, with clinical roles requiring US state licensure; the scraper should keyword-filter for non-clinical roles (product, UX research, content, conversation design, clinical science, coaching) and flag US-only location strings. The best worldwide/EU-friendly targets are Oliva (workable oliva1: 100% remote freelance psychologists/CBT therapists across Europe), ifeel (Madrid, 25 languages, remote EU roles on Workable), OpenUp (Amsterdam, freelance psychologists across EU), Kooth (workable koothjobs, UK+US), Unmind (workable unmind, UK remote-first), Limbic and Slingshot AI (UK/US, Ashby; Slingshot posts Conversation Designer and Clinical Lead), Big Health (lever bighealth, remote-first US+UK), Koa Health and Eleos Health (EU-hosted Greenhouse boards), Mindler and Flow Neuroscience (Teamtailor, Nordics/UK), Intellect (workable intellecthq, APAC remote providers), HelloBetter/Selfapy/MindDoc (German-language DiGA companies on Personio/onlyfy), and Wysa (India/UK, custom careers page). Companies with no discoverable public ATS (Wysa, Brightside, Talkiatry, Youper, Kintsugi, Ellipsis, Sonia, Earkick, Thymia, ThoughtFull, 7 Cups, Uwill, Bend, Monument, Amwell/SilverCloud, Twill, Lyssn, Spill, Likeminded/nilo, OpenUp, Togetherall, Bicycle Health, Wellnite, Mindsera) are listed with ats "unknown" and their custom careers URLs so they can be added as HTML-scrape or manual-check targets. Note the renames: Path Mental Health is now Rula, Quit Genius is Pelago, Ginger merged into Headspace, Tempest into Monument, Happify became Twill (now Dario), and Real/Lantern/Mindstrong have shut down.
- **digital-health-dtx**: Digital health / DTx is a rich category: 60+ companies have public ATS boards the scraper can read without keys, dominated by Greenhouse (Omada, Noom, Maven, Carrot, Oura, WW, Headspace 'hs', Calibrate, Nourish, Ada, K Health, Doctolib, Flo, Modern Health, Cityblock, Oscar, Hazel, Pomelo, Peloton, Strava, Calm, Wellhub 'gympass', Midi, Oula, Eucalyptus, Spring Health, LetsGetChecked on the EU host), then Ashby (Hinge, Virta, Lark, Alan, ZOE, Sidekick, Equip, Unmind, Limbic, Hims 'hims-and-hers', 9amHealth, Lyra), Lever (Sword, Included Health, Vida, Big Health, Mahana, Lyra, Numan on the EU host), Workable (Second Nature, Levels, Kooth, Unmind), SmartRecruiters (Kaia, Doctolib), Teamtailor (Natural Cycles, Kry, Livi UK) and Workday (Teladoc, Progyny, WW, Cityblock). Most US chronic-care/telehealth players (Omada, Virta, Included, Vida, Lark, Calibrate, Nourish, Hinge, Modern Health, Lyra, Talkspace, Cityblock, Oscar, Hazel, Equip, Pomelo, Midi, Oula, K Health, Hims, Ro, Found) are effectively US-only for remote hiring because of clinical/payroll constraints, so for a Serbia-based applicant the highest-yield boards are the European ones: Ada Health (Berlin, 45 nationalities), Doctolib, Alan, Kaia, Flo (London/Vilnius), ZOE, Numan, Second Nature, Unmind, Limbic, Kooth, Natural Cycles, Kry/Livi, Sidekick, Oviva, Eucalyptus (UK/DE), LetsGetChecked, Wellhub (11 countries) plus remote-first outliers like Infermedica (Poland) and Big Health (US/UK). Several DTx names from the brief have no scrapeable ATS (Ro, Woebot, Pelago, Huma, Twin Health, Wysa, NOCD, HelloBetter, Thriva, Peppy, Clue, Elvie, Welldoc, Ovia) and several are defunct or acquired (Better Therapeutics shut down; Akili acquired by Virtual Therapeutics; Twill by DarioHealth). Confidence is 'high' only where a search-result URL literally exposed the board slug; Eight Sleep, Talkspace and Sidekick are flagged medium/low because the ATS was implied but the slug was not fully shown. Niche boards worth wiring are digital-health-jobs.com (5.5k roles, strong EU and remote filters), behavioraleconomics.com/jobs and Habit Weekly for behavioral-science roles, jobs.inwomenshealth.com and jobs.fitt.co for women's health / wellness, and the Getro-powered VC portfolio boards (General Catalyst, Redpoint, Thrive, NEA, Owl, GV) that aggregate many of these same companies.
- **coaching-wellbeing**: IMPORTANT CAVEAT: this subagent could not verify anything — the session's WebSearch budget was already exhausted (200/200) before my first query, and curl to every ATS host is blocked by the egress proxy (CONNECT 403), so no search-result URL evidence exists and every entry below is a memory-based guess marked "low"; the parent should treat slugs as candidates and validate them with the scraper's own probe (Greenhouse/Lever/Ashby/Workable return 404 for a wrong token, so a batch probe of ~80 tokens is cheap) and drop the ones that fail. Richest sub-category by ATS coverage is US employer-facing digital mental health and coaching (Modern Health, Spring Health, Lyra, Headspace, Calm, Talkspace, Noom, Peloton, BetterUp, Thrive, Omada, Vida, Lark, Virta, Headway, Alma, Charlie Health — almost all on Greenhouse, Lyra on Lever), but nearly all of these hire remote US-only (occasionally UK), so they mainly yield content/research/coaching roles that a Serbia-based applicant can rarely take; EAP giants (Cigna/Evernorth, Optum, Carelon, Magellan, ComPsych) are Workday/custom and US-only. The EU-friendly cluster is smaller and lives on Personio/Recruitee/Teamtailor/Workable rather than Greenhouse: OpenUp (NL, hires psychologists across European languages remotely), Auntie (FI, remote European coaches), Oliva, Plumm, Spill, Unmind, Koa Health, CoachHub, Nilo Health, Likeminded, Sharpist, HelloBetter, Selfapy, 7Mind, Leapsome, Urban Sports Club, Oviva, Sword Health, Flo Health, Kilo Health, Mindler, Lifesum, Meditopia, Fabulous, Elevate Labs (Balance), Wellhub (PT/ES/DE), Reward Gateway (Bulgaria hub) and Workplace Options (global EAP that contracts counsellors in many countries) — these are the highest-value targets for a Serbia-applicable filter. Worldwide-remote employers (Deel, Remote.com, Oyster) are included only because they hire people-ops/well-being program roles from anywhere. Many small US wellness vendors (Nivati, Journey, Aduro, Grokker, Burnalong, Wellable, Headversity, Youper, Finch, Breethe, Simple Habit) have custom/JazzHR/BambooHR-style pages with unknown slugs and low volume; keep them as "unknown" targets or drop them. Board suggestions are likewise unverified; the ones most likely to be machine-readable without keys are WordPress-based EU remote boards (RSS), CharityJob/Guardian Jobs/jobs.ac.uk (RSS search feeds), Landing.jobs (public JSON), and Reed/Careerjet/Jooble (free API keys).
- **human-data-tns**: Research method note: the session's WebSearch budget was already exhausted (200/200) and direct fetches are egress-blocked, so evidence came from GitHub code search of literal ATS URLs (job-board links in public job-tracker repos and the per-ATS slug CSVs in kalil0321/ats-scrapers); "high" means a result literally showed the slug in a URL, though CSV-sourced rows may be stale and should be probed live once. The human-data / RLHF vendor category is rich in machine-readable boards: Scale AI, Labelbox, Turing, Snorkel, Anthropic, Invisible (Greenhouse); Mercor, Surge AI, Cohere, OpenAI, Pareto.AI, Handshake, TELUS Digital, Cinder (Ashby); Appen, Innodata, RWS TrainAI, Modulate, Encord, SuperAnnotate, Cogito (Lever); Toloka/Mindrift, Prolific, CloudFactory, Unitary, Hugging Face (Workable); Sama (SmartRecruiters); TaskUs (Recruitee/Workday); Centific (Workday). Trust & safety platform teams are also well covered via Greenhouse (Discord, Reddit, Roblox, Bumble, Hinge, Nextdoor, Duolingo, Automattic), Ashby (Whatnot, Patreon, Grindr, Character.AI, Quora, Yubo) and Lever (Match Group). Best bets for a Serbia-based applicant are the worldwide-contractor and remote-first boards: Mindrift/Toloka, Mercor, Invisible, Turing, Appen/CrowdGen, RWS TrainAI, Hugging Face, Automattic, Quora, Cohere (Europe remote), Unitary and Prolific (UK/EU); by contrast Surge AI, Reddit, Discord, Cinder, Snorkel, Handshake, Pareto and most US social platforms post "Remote - United States" only, and OpenAI/Anthropic/Roblox/Character.AI are largely onsite. Several crowd-work brands that actually take Serbian contractors (Outlier, DataAnnotation, Alignerr, Remotasks, Clickworker, Lionbridge, Welocalize, iMerit, OneForma) run custom portals with no supported ATS, and pure T&S vendors (ActiveFence/Alice, Checkstep, Besedo, Tremau, WebPurify, Sightengine) could not be tied to any public ATS.
- **ai-safety-labs**: Research constraint note: the WebSearch budget for this session was already exhausted (200/200) and all direct HTTP to job/ATS hosts is blocked by the egress proxy, so evidence came from ~45 GitHub code searches (literal ATS URLs in public repos), raw.githubusercontent.com downloads of live scraper tenant lists (kalil0321/ats-scrapers CSVs, CareerView validated watchlist, career-ops portals), and an AI-safety/policy job dataset (jiahui2284/MULTIVERSE, 558 orgs with apply URLs). 'high' = literal job-posting URL or 2+ independent sources; 'medium' = single registry row; 'low' = memory. The category is rich on the ATS side: ~60 organizations have scrapable boards, dominated by Greenhouse (Anthropic, DeepMind, xAI, Goodfire, Haize, Arize, HiddenLayer, Scale, Invisible, Prolific, Thorn, Data & Society, AIAF, UK AISI on the EU Greenhouse host) and Ashby (OpenAI, Cohere, Mistral 'mistral.ai', Perplexity, Character, ElevenLabs, Synthesia, Elicit, FAR.AI, BlueDot, 80,000 Hours, Coefficient Giving/ex-Open Phil, CEA, MIRI, CBAI, Lakera, Credo, Surge, Mercor, Inworld, Cinder), with a strong Lever cluster of safety nonprofits (METR 'metr', Apollo 'apolloresearch', CAIS 'aisafety', Epoch 'epoch-ai', FLI 'futureof-life', Humane Tech 'humanetech', ControlAI on api.eu.lever.co). Realistically remote-from-Serbia employers are the minority: Epoch AI, FLI, Rethink Priorities/IAPS, OpenMined, Wikimedia, Hugging Face, ElevenLabs, Giskard, Lakera and the human-data/AI-training vendors (Mercor, Surge, Invisible, Appen, TELUS Digital, Toloka/Mindrift, Alignerr, Scale/Outlier, Prolific) hire worldwide or EU-wide; the frontier labs (Anthropic, OpenAI, DeepMind, xAI, Perplexity, Character.AI, Goodfire, Haize, Transluce, METR, Redwood, MIRI, CBAI) are overwhelmingly on-site/hybrid in SF/NYC/London, and UK AISI, Ada Lovelace, Turing Institute, RAND, CSET and Elicit are effectively UK-only or US-only. Still-unresolved custom sites (no public ATS): Redwood Research, Partnership on AI, GovAI, MATS, Palisade, SaferAI, CLTR, Encode, AI Now, DAIR, Midjourney, AI21, Holistic AI, Arthur AI; Transluce (Gem), Patronus (Rippling), Ada Lovelace (Applied) and Turing (Cezanne) use ATSs without public APIs. Defunct/acquired: Humanloop (Anthropic), Robust Intelligence (Cisco), Truera (Snowflake), Adept (Amazon), Ought (now Elicit), W&B Lever board dead (roles under CoreWeave Greenhouse).
- **conversational-ai-companion**: Evidence caveat: this session's WebSearch budget was already exhausted (200/200) and ATS APIs are egress-blocked, so slugs come from literal ATS URLs found in GitHub-hosted ATS directory files (kalil0321/ats-scrapers, kalebconfer-sys/job-board-directory with 2026 observed job counts, CareerView watchlist, a Sept-2026 live-verified validated_ats_sources.csv) downloaded via raw.githubusercontent.com plus ~20 GitHub code searches; "high" = literal board URL plus a 2026 observation/job count, "medium" = literal URL in a static list only, "low" = memory. The richest, most scrapeable sub-categories are voice-AI infrastructure (ElevenLabs, Deepgram, Cartesia, Vapi, Retell, Bland, LiveKit, Synthflow, all on Ashby) and enterprise conversational-AI/CX agents (Sierra, Decagon on Ashby; PolyAI, Parloa, Cresta, Observe.AI, LivePerson, Intercom, NICE, Dialpad, Five9 on Greenhouse; Freshworks on SmartRecruiters; Uniphore, Sprinklr, Zendesk, Cerence, Interactions on Workday); consumer AI-companion apps (Replika, Kindroid, Nomi, Paradot, Chai, Talkie/MiniMax, Soul Machines, Convai, Charisma, Ready Player Me, NovelAI, Sudowrite, Wysa, Youper, Earkick) mostly run custom careers pages with no public ATS. Companies that look predominantly US/on-site: Character.AI, Sesame, Vapi, Retell, Bland, Cartesia, Tavus, Wispr Flow, Woebot Health, Slingshot AI, Hume AI, Inflection, Tolan, Delphi, Genies, Inworld, Kasisto, Replicant, Yoodli. Most Serbia/EU-applicable targets: ElevenLabs (UK/Poland/Europe, 186 remote roles observed), Perplexity (Belgrade office), Parloa and Synthflow (Berlin), PolyAI and Limbic and Speechmatics (UK), Rasa ("Remote - Germany"), Omilia (Greece/Cyprus/Ukraine, 79 roles), Talkie.ai (Poland), Sierra/Decagon/Synthesia (London/Munich), Preply and Voicemod and Luzia (Spain/EU remote), Krisp (Armenia/remote), Cognigy/NICE (Düsseldorf), Intercom and LivePerson (EMEA remote); India-centric boards (Yellow.ai, Haptik, Gupshup, Kore.ai) are unlikely to hire from Serbia. For the digging session, the two GitHub CSV directories listed under boards are the fastest way to expand to hundreds more verified board tokens by keyword-grepping company names.
- **people-science-research-consultancies**: WebSearch budget was already exhausted (200/200) and egress was blocked, so all evidence comes from GitHub code search: literal ATS URLs in indexed files plus two crawled ATS directories (kalebconfer-sys/job-board-directory with 'observed' job counts as of 2026-09, and kalil0321/ats-scrapers). Richest, scrapable sub-categories: UX-research tooling (Ashby dominates: dscout, Maze, Sprig, Dovetail, Great Question, Outset, Listen Labs, SurveyMonkey; Greenhouse for User Interviews and Attest; Workday for UserTesting), large insights firms (Workday for Kantar/YouGov/Dynata/Forrester, SmartRecruiters for NielsenIQ/Cint/Ipsos/HireVue, Greenhouse for Mintel/Remesh/Ogilvy/Qualtrics) and HR-tech/coaching (Ashby for Leapsome, TestGorilla, Beamery, ChartHop, BetterUp, CoachHub, Unmind, Deel; Greenhouse for Culture Amp, Remote, Oyster; Lever for Lattice and 15Five). Behavioral-science consultancies (BEworks, Irrational Labs, ideas42, BIT, The Decision Lab, Cowry) and most assessment vendors (SHL, Hogan, Arctic Shores, Sapia, Cangrade, Vervoe, Predictive Index, Gallup, Korn Ferry, Talogy) do not appear on any public-API ATS and must be treated as custom-site targets. US-only or US-centric remote: Remesh (explicitly 'must be in the United States'), Lattice, dscout, User Interviews, Respondent, Great Question, Sprig, Suzy, Morning Consult, Blink UX, BetterUp, Textio, Outset, Listen Labs, HireVue, Criteria, Personify Health. Best bets for a Serbia-based applicant: Deel (lists Serbia among hiring countries), Remote, Oyster, TestGorilla, Leapsome, CoachHub, Quantilope, 15Five (EU remote roles seen), Maze, Prolific, Attest, Unmind, plus the global insights firms that have Belgrade offices (Kantar, Ipsos, NielsenIQ).
- **games-narrative**: Research method note: this session's WebSearch budget was already exhausted (200/200) and direct HTTP is proxy-blocked, so evidence comes from GitHub code search over public job-scraper configs, 2026 job-tracker datasets and the IGDA Game Writing SIG posting dataset (gwsig-tech/game-writing.com); "high" means a search hit literally contained the ATS URL with the slug (most from 2026 files), "medium" means a curated/verified slug list without the full URL, "low" is memory. The richest, key-free API coverage is among large/mid studios: Greenhouse (Riot, Bungie, Insomniac, Scopely, Wooga, Zynga=zyngacareers, Epic incl. 3Lateral Novi Sad, Wargaming=wargamingen with Belgrade roles, Hasbro/Wizards, 2K, Guerrilla, Fantastic Pixel Castle, That's No Moon, Midsummer), SmartRecruiters (Ubisoft2, CDPROJEKTRED, Gameloft, Dontnod, PeopleCanFly, TechlandSA), Lever (larian, netflix, bhvr, voodoo, jamcity), Ashby (character, inworld-ai, supercell, tapblaze, hyperhug, voodoo), Workday tenant xboxgaming (Blizzard_External_Careers, King_External_Careers, External for Activision) and Workable (keywords-intl1, velanstudios, devoted-studios-1, hutch). Genuinely worldwide-remote hiring for writers is rare and concentrated in services/outsourcing (Keywords Studios incl. Sperasoft Belgrade, Devoted Studios, HyperHug, Magic Media, PTW, Lionbridge Games) plus Serbia-based studios (Ubisoft Belgrade, Wargaming Belgrade, 3Lateral/Epic, Nordeus, Mad Head, Crater, Playrix); most US AAA "remote" postings (Bungie, Insomniac, Activision/Infinity Ward, thatgamecompany, Wildlight, Gardens, Mountaintop, teamLFG) are explicitly US- or US/Canada-only, Rebellion is UK-only and People Can Fly is Poland/Canada-only. Nearly all interactive-fiction and AI-narrative targets (Inkle, Failbetter, Choice of Games, Pixelberry, Crazy Maple, Dorian, Hidden Door, Latitude, NovelAI, Charisma, Sweet Baby, Obsidian, Remedy, Embark, Rovio, Playrix, Nordeus) run custom careers pages with no public ATS API, so they need HTML/JSON-LD adapters or manual watching. For boards, GameJobs.co (Atom feed), Games-Career.com (RSS), Hitmarker (sitemap-jobs.xml + JSON-LD), 80 Level (__NEXT_DATA__) and Remote Game Jobs (SSR) are scrapeable without a browser, while Work With Indies is an SPA with no public API; the IGDA Game Writing SIG publishes a narrative-jobs CSV in its GitHub repo that is the most targeted single source for game-writing roles.
- **niche-boards**: Environment caveat: this subagent's WebSearch budget was already exhausted (200/200) and all direct HTTP is egress-blocked, so nothing was live-verified; evidence comes from (a) a local cache of public ATS registries (kalil0321/ats-scrapers and similar, ~2026-09 snapshots) and (b) GitHub code search of open-source scrapers, and confidence is graded accordingly (high = URL/endpoint literally shown in 3+ independent sources, medium = 1-2 sources or an inferred platform pattern, low = memory only). The richest machine-readable niche surfaces are the 80,000 Hours board (public Algolia index, ~900 roles heavy on AI safety/T&S/policy and largely remote-worldwide), hiring.cafe's JSON search API and Workable's global search endpoint (both excellent for odd titles like "behavioral scientist" or "conversation designer"), Welcome to the Jungle's Algolia index (EU/France startups incl. mental-health players), ReliefWeb's jobs API (MHPSS/psychosocial and behaviour-change roles, worldwide), the Getro/Consider VC-board APIs, and academic psychology via Madgex/YM Careers RSS patterns (THE unijobs, Inside Higher Ed, Chronicle, HERC, jobs.ac.uk search RSS, likely BPS Jobs and PsycCareers). The behavioral-science community boards (Habit Weekly, Behavioral Scientist, BESCI, Action Design), the UX-research boards, the digital-health boards (Rock Health, HLTH, MedCity, Healthcare IT Central) and the coaching/conversation-design/instructional-design boards showed no machine-readable surface anywhere in open-source code, so they are listed as unknown/low and are best treated as HTML-scrape experiments; the game boards are mixed (GameJobs.co has a confirmed Atom feed, Hitmarker/Work With Indies/InGameJob do not). On the company side, essentially every US digital-mental-health and telehealth employer (Lyra, Spring Health, Modern Health, Headspace, Calm, Talkspace, BetterHelp, Headway, Alma, Rula, SonderMind, Two Chairs, Grow, Charlie Health, Cerebral, Brightline, Equip, Omada, Virta, Vida, Lark, Hinge, Included, Oscar, Maven, Hims, Carrot, Tia, Amwell, Teladoc) hires remote US-only, while Big Health, Limbic, ieso, Mindler, Sidekick, Sword, ZOE, Flo, Elvie, Doctolib, Docplanner, Ada, CoachHub, Prolific, Maze and the AI-data vendors (Mercor, Turing, Invisible, Appen, TELUS Digital, Welocalize) are the realistic EU/worldwide targets from Serbia.
- **general-remote-aggregators**: Research method note: this session's WebSearch quota was already exhausted (200/200) and all direct HTTP is proxy-blocked, so verification was done via GitHub public code search (literal endpoint strings embedded in real open-source scrapers such as career-ops-hq/career-ops, ever-jobs/ever-jobs, strelov1/freehire, rorar/EURES-API-Documentation); 'high' below means the exact URL appeared in several independent scrapers, 'medium' one scraper or a docs table, 'low' memory only. Richest keyless JSON/RSS sources for non-tech remote roles applicable from Serbia: Arbeitnow, The Muse (location=Flexible / Remote, categories like Healthcare, Human Resources, Design and UX, Writing), Workable's global search API (every Workable employer, workplace=remote), Jobspresso/EU Remote Jobs (WP Job Manager ?feed=job_feed), NoDesk, JobsCollider, Real Work From Anywhere, EURES (new public API), Welcome to the Jungle Algolia index (EU-heavy, ex-Otta), Braintrust and HN Who is Hiring via Algolia; key-but-free APIs worth wiring are Adzuna, Jooble (has a Serbian site), Careerjet and Reed. US-centric or paywalled/SPA boards with no usable feed found (Power to Fly, FlexJobs, Virtual Vocations, JustRemote, DailyRemote, Startup.jobs, Crossover, Contra, Working Not Working, Pangian, Remote Woman, Remote Leaf, Hubstaff Talent, Remote4Me/RemoteYeah/Europe Remotely) should be treated as low-priority or link-only; Remotees is dead (redirects to WWR) and Otta's API is login-gated. Talent networks (Toptal, Turing, Andela, Crossover, RemoteBase) hire worldwide contractors but expose no scrapable board and are mostly dev-only; the one directly useful employer surfaced was Remote.com on Greenhouse token 'remotecom' (fully global hiring, people/HR roles). The remoteintech/remote-jobs raw README and awesome-remote-job lists are good seeds for company discovery (Region column marks worldwide vs US-only).
