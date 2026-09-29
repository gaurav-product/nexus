# Competitive analysis

**Research date:** 29 Sept 2026 · **Method:** desk research from vendor pages, vendor help centres, launch posts and independent reviews. Every claim below links to where it came from. Where a source did not state something (often pricing or privacy detail), the field says *not found* rather than guessing.

**What this is not:** this is not user research. Nothing here tells us what users want; it tells us what already exists.

---

## How I grouped the market

| Cluster | What they optimise for | Products reviewed |
|---|---|---|
| A. Platform assistants with proactive briefings | A daily narrative digest built from the platform's own data | Google CC, ChatGPT Pulse, Gemini Personal Intelligence, Microsoft Copilot in Outlook, Poke |
| B. AI email clients | Faster triage, drafting, search inside one inbox | Superhuman Mail, Shortwave, Fyxer |
| C. Memory / context infrastructure (B2B, developer) | Giving *agents* persistent memory | Zep / Graphiti, Mem0, Supermemory |
| D. Second brain / knowledge graph | Capturing and organising notes | Mem, Tana |
| E. Calendar intelligence | Auto-scheduling time | Motion, Reclaim |
| F. Meeting memory & lifelogging | Capturing conversations | Granola, Limitless (acquired) |
| G. Agent builders | Delegating multi-step work | Lindy |
| H. Relationship managers | Keeping in touch | Dex, Mesh (formerly Clay) |
| I. Vertical change detection | Watching one kind of object for changes | TripIt Pro |

20 products total.

---

## Cluster A — Platform assistants (the most important cluster for Nexus)

### 1. Google CC (Google Labs)
- **Target user:** US/Canada Google consumer account holders; initially paid Google AI subscribers ([Google blog, Dec 2025](https://blog.google/technology/google-labs/cc-ai-agent/)).
- **Core problem:** morning overwhelm across inbox, schedule and tasks.
- **Features:** a daily "Your Day Ahead" email summarising schedule, tasks and updates; prepares email drafts and calendar links ([Google blog](https://blog.google/technology/google-labs/cc-ai-agent/)). A hands-on review describes three sections — top-of-mind topics, calendar recap, and an FYI section — and training it by replying in natural language ([TidBITS, May 2026](https://tidbits.com/2026/05/29/taming-email-overload-googles-cc-daily-briefing-agent/)).
- **Integrations:** Gmail, Calendar, Drive, web.
- **AI capabilities:** synthesis and summarisation; draft preparation.
- **Pricing:** free experimental access at time of review, per TidBITS; not formally priced.
- **Privacy approach:** disconnect via Google's linked-apps page to clear data (TidBITS). No detailed statement in the launch post.
- **Strengths:** owns the data, zero-setup, distribution to the entire Gmail base.
- **Weaknesses:** output is a narrative briefing, not a set of tracked objects; per TidBITS it links to messages but can't act on them directly. No evidence in sources of explicit cross-source contradiction handling or uncertainty labelling.
- **Positioning:** "your morning chief of staff".
- **Overlap with Nexus:** **very high** on data sources (Gmail + Calendar + Drive are exactly Nexus's MVP sources).
- **Differentiation opportunity:** persistent situations with a lifecycle, cross-source contradiction as a first-class object, visible uncertainty, "why am I seeing this" evidence.

### 2. ChatGPT Pulse (OpenAI)
- **Target user:** launched in preview to Pro users on mobile, Sept 2025, with Plus and wider rollout planned ([OpenAI](https://openai.com/index/introducing-chatgpt-pulse/)).
- **Core problem:** proactive, personalised updates without asking.
- **Features:** once-daily visual cards researched overnight from memory, chat history and feedback; cards expire unless saved ([OpenAI](https://openai.com/index/introducing-chatgpt-pulse/); [TechCrunch](https://techcrunch.com/2025/09/25/openai-launches-chatgpt-pulse-to-proactively-write-you-morning-briefs/)).
- **Integrations:** optional Gmail and Google Calendar, off by default.
- **AI capabilities:** proactive research, personalisation, curation from feedback.
- **Pricing:** Pro at launch.
- **Privacy approach:** integrations opt-in and toggleable; feedback history can be viewed and deleted (OpenAI).
- **Strengths:** huge installed base, strong model, feedback loop.
- **Weaknesses:** ephemeral by design (cards expire) — the opposite of tracking an unresolved situation until it's resolved. Oriented to interests/research more than to personal state.
- **Overlap:** medium.
- **Differentiation:** persistence and resolution; evidence per claim.

### 3. Gemini Personal Intelligence (Google)
- **Target user:** Gemini users globally except EEA, Switzerland, UK; paid tiers first, then free ([9to5Google, Apr 2026](https://9to5google.com/2026/04/14/gemini-personal-intelligence-global/)).
- **Core problem:** answers that already know your context.
- **Features:** personalises responses using Gmail, Calendar, Drive, Photos, YouTube, Search, Maps.
- **AI capabilities:** retrieval over personal data inside chat.
- **Pricing:** bundled in Google AI tiers.
- **Privacy approach:** explicit opt-in per app; toggle in the Tools menu (9to5Google).
- **Strengths:** broadest first-party data access of anyone.
- **Weaknesses:** reactive — you have to ask. The source did not describe source attribution.
- **Overlap:** high on data, low on interaction model.
- **Differentiation:** Nexus does not wait for a question.

### 4. Microsoft Copilot in Outlook (agentic)
- **Target user:** Microsoft 365 enterprise users; initially Frontier early-access program ([Microsoft Tech Community, Apr 2026](https://techcommunity.microsoft.com/blog/outlook/copilot-in-outlook-new-agentic-experiences-for-email-and-calendar/4514601); [WindowsForum summary](https://windowsforum.com/news/copilot-in-outlook-becomes-an-agent-inbox-triage-and-calendar-rescheduling.415495/)).
- **Core problem:** running an inbox and calendar is ongoing work.
- **Features:** inbox triage, follow-up identification and drafting, **rescheduling calendar conflicts**, focus-time protection, natural-language inbox rules (WindowsForum).
- **Pricing:** part of Copilot premium licensing; exact cost not stated in source.
- **Privacy approach:** enterprise tenant controls (general M365); source notes enterprises will want granular admin controls.
- **Strengths:** acts, not just reports; enterprise distribution.
- **Weaknesses:** acting on calendars affects other people; the source itself flags that mistakes propagate. Within-calendar conflicts (double booking), not cross-source factual contradictions.
- **Overlap:** high for follow-ups; medium for conflicts.
- **Differentiation:** Nexus's stance is the opposite — surface, explain, let the human decide. Different conflict type (information disagreement vs. time overlap).

### 5. Poke (The Interaction Company → acquired by Cognition, July 2026)
- **Target user:** consumers who live in messaging apps ([AI Agent Index](https://theaiagentindex.com/agents/poke)).
- **Core problem:** an assistant you just text.
- **Features:** morning briefings, flags urgent email, scheduled automations, flight check-ins; lives in iMessage/SMS/WhatsApp/Telegram.
- **Integrations:** Gmail, Outlook, calendars, Notion, GitHub, smart home and more.
- **Pricing:** free tier; Pro ~$16/mo annual; Ultra ~$160/mo annual (AI Agent Index).
- **Privacy approach:** data may train models unless users choose a maximum-privacy setting (AI Agent Index).
- **Strengths:** frictionless channel, personality, proactive.
- **Weaknesses:** personality-first; source notes thin independent verification and no enterprise controls.
- **Overlap:** medium (proactive + email).
- **Differentiation:** Nexus explicitly rejects AI personality and chat as the primary surface; evidence-first.

---

## Cluster B — AI email clients

### 6. Superhuman Mail (Superhuman, formerly Grammarly)
- **Target user:** high-volume professionals, sales.
- **Features:** Auto Drafts, AI replies, thread summaries with decisions and action items, Ask AI search, auto labels ([Fast.io review](https://fast.io/resources/superhuman-ai-review-2026/)).
- **Pricing:** Starter $30/mo; Business $40/mo; Enterprise custom (Fast.io).
- **Ownership:** Grammarly acquired Superhuman in July 2025 and later rebranded as Superhuman (Fast.io).
- **Weaknesses:** no free tier, Gmail/M365 only, drafts sometimes misread context (Fast.io).
- **Overlap:** low–medium (action items inside threads).
- **Differentiation:** Superhuman works within one thread; Nexus works across sources.

### 7. Shortwave
- **Target user:** Gmail power users and teams.
- **Features:** AI search across mailbox, summaries, AI filters, attachment analysis, memory settings ([Shortwave pricing](https://www.shortwave.com/pricing/)).
- **Pricing:** Business $30, Premier $45, Max $120 per seat/mo.
- **Privacy approach:** CASA Tier 2 compliance, tracker removal (Shortwave).
- **Overlap:** low–medium.
- **Note for Nexus:** CASA compliance is the kind of cost any third-party Gmail product must pay (see risks).

### 8. Fyxer
- **Target user:** small business owners in Gmail/Outlook ([Efficient App review](https://efficient.app/apps/fyxer)).
- **Features:** auto-labels (to respond / FYI), draft replies, meeting notes, follow-up drafts when snoozed mail returns.
- **Pricing:** ~$22.50–$50/mo by tier; enterprise custom.
- **Weaknesses:** reviewer called drafts generic and meeting recording unreliable.
- **Overlap:** low.

---

## Cluster C — Memory / context infrastructure

### 9. Zep / Graphiti
- **Target user:** developers building agents ([Zep](https://www.getzep.com/ai-agents/temporal-knowledge-graph/)).
- **Features:** temporal knowledge graph; bi-temporal model (when a fact was true vs. when the system learned it); contradictory information **closes the old fact's validity window instead of deleting it**; every fact traces to its source episode ([Zep](https://www.getzep.com/ai-agents/temporal-knowledge-graph/); [paper](https://arxiv.org/pdf/2501.13956)).
- **Pricing:** not found on page reviewed; Graphiti is open source.
- **Overlap:** **high at the technique level.** Change tracking with provenance is solved infrastructure.
- **Why this matters:** Nexus cannot claim "we invented change detection." The differentiation must be the *end-user product*: what to surface, when to stay quiet, how to show uncertainty, and how resolution works.

### 10. Mem0
- **Target user:** developers adding memory to AI apps; raised a $24M Series A in Oct 2025 ([TechCrunch](https://techcrunch.com/2025/10/28/mem0-raises-24m-from-yc-peak-xv-and-basis-set-to-build-the-memory-layer-for-ai-apps)).
- **Privacy:** HIPAA, SOC 2 Type I, Type II in progress per [SolidAITech](https://www.solidaitech.com/2026/07/mem-ai-note-taking-app-vs-mem0-api.html).
- **Overlap:** low (infrastructure, not a user product). Could be a build-vs-buy input later.

### 11. Supermemory
- **Target user:** enterprises and agent developers; the site claims 100k+ organisations ([Supermemory](https://supermemory.ai/)).
- **Features:** memory API/MCP; update, merge, infer and forget operations; time awareness.
- **Overlap:** low (infrastructure).

---

## Cluster D — Second brain / knowledge graph

### 12. Mem (mem.ai)
- **Target user:** knowledge workers who don't want to file notes ([SolidAITech](https://www.solidaitech.com/2026/07/mem-ai-note-taking-app-vs-mem0-api.html)).
- **Features:** auto-organisation, chat with source-attributed answers, meeting transcription, PDF/email ingestion (Pro).
- **Pricing:** Free (limited); Pro ~$12–15/mo.
- **Weaknesses:** auto-grouping sometimes wrong; small ecosystem.
- **Overlap:** low. Retrieval and capture, not state.

### 13. Tana
- **Target user:** power users, meeting-heavy teams ([AI:PRODUCTIVITY](https://aiproductivity.ai/tools/tana/)).
- **Features:** typed objects ("supertags"), live meeting agents that extract decisions and draft docs.
- **Pricing:** Free (5 meetings/mo), Pro $20–30, Max $80–120, Business custom.
- **Weaknesses:** 2–3 week learning curve, weak mobile, no offline.
- **Overlap:** low–medium (structured objects, but user-authored).
- **Lesson for Nexus:** structure is powerful; asking users to build the structure is a tax. Nexus should infer structure and ask only for confirmation.

---

## Cluster E — Calendar intelligence

### 14. Motion
- **Features:** best-in-class auto-scheduling; "AI Employees" tiers ([Temporal blog](https://temporal.day/blog/motion-pricing-2026-why-users-leaving)).
- **Pricing:** ~$29/mo individual; AI Employees $49–299/mo; credit-based.
- **Weaknesses (as reported by a competitor's blog — treat with caution):** opaque credit pricing, AI Employees seen as gimmicky.
- **Overlap:** low.

### 15. Reclaim (Dropbox, acquired Aug 2024)
- **Features:** habits, smart meetings, buffer time; 320k+ users at acquisition ([Reclaim](https://reclaim.ai/blog/dropbox-acquires-reclaim)).
- **Overlap:** low. Optimises time, doesn't reconcile information.

---

## Cluster F — Meeting memory & lifelogging

### 16. Granola
- **Features:** bot-free meeting notes merged with transcripts; follow-up email drafts; chat across meetings ([Meetergo review](https://meetergo.com/en/magazine/granola-ai)).
- **Pricing:** Basic free (30-day history); Business $14; Enterprise $35 per user/mo.
- **Privacy:** SOC 2 Type II; review reports model training on by default below Enterprise and a class action filed July 2026 (Meetergo — secondary source, not independently verified).
- **Overlap:** low (meetings are out of Nexus MVP scope), but commitments *spoken* in meetings are a future source.
- **Lesson:** privacy defaults are now a live legal and trust risk in this category.

### 17. Limitless (acquired by Meta, Dec 2025)
- Pendant sales stopped; the Rewind Mac app's capture was disabled 19 Dec 2025; EU/UK users had to export before deletion ([Hedy AI post](https://www.hedy.ai/post/meta-acquires-limitless-ai-privacy/); [TechCrunch](https://www.techcrunch.com/2025/12/05/meta-acquires-ai-device-startup-limitless/)).
- **Lesson:** "capture everything" memory products carry acquisition risk for users' data. Nexus's principle of minimal retention and export is a response to this.

---

## Cluster G — Agent builders

### 18. Lindy
- **Features:** configurable agents for email drafting, calendar coordination around travel including **flagging scheduling conflicts**, meeting notes, phone ([Catch review](https://www.catchagent.ai/blog/reviews/lindy-ai-review)).
- **Pricing:** $29.99 / $99.99 / $199.99 per month credit tiers; no free tier.
- **Human control:** requires approval for actions with outside impact (Catch).
- **Overlap:** medium on travel-conflict flagging; but you have to build the agent.

---

## Cluster H — Relationship managers

### 19. Dex and 20. Mesh (formerly Clay)
- **Features:** Dex surfaces context from email/calendar and reminds you to reach out; Clay/Mesh enriches contacts ([Dex vs Clay](https://getdex.com/blog/dex-vs-clay/) — note this is Dex's own blog).
- **Pricing:** Dex ~$12/mo; Clay ~$10/mo (per the same source).
- **Overlap:** low. The object is a person, not a situation.

---

## Cluster I — Vertical change detection

### 21. TripIt Pro *(reviewed as a reference, not counted in the 20)*
- **Features:** alerts for cancellations, delays, gate changes, pull-ins, connections at risk ([TripIt help](https://help.tripit.com/en/support/solutions/articles/103000063329-glossary-of-tripit-pro-flight-alerts)).
- **Lesson:** deterministic change detection on well-structured objects (flights) already works and users pay for it. It is also narrow. Nexus's flight scenario must not pretend to beat TripIt at flights; it demonstrates the *general* pattern.

---

## Related evidence: what happens when proactive AI is wrong

In January 2025 Apple paused AI notification summaries for news apps in the iOS 18.3 beta after the summaries generated false alerts, following complaints including from the BBC ([TechCrunch](https://techcrunch.com/2025/01/16/apple-pauses-ai-notification-summaries-for-news-after-generating-false-alerts); [CNBC](https://www.cnbc.com/2025/01/16/apple-disables-ai-notifications-for-news-in-its-beta-iphone-software.html)). This is the clearest public example that a confident, wrong, proactive summary damages trust fast enough to force a rollback. It supports Nexus Principle 6 (conservative notifications) — though it is one incident in a different domain, not proof.

---

## Summary of what the research says

1. **Proactive briefings from Gmail + Calendar are no longer novel.** Google (CC), OpenAI (Pulse), Microsoft (Copilot) and Poke all ship some version.
2. **Temporal fact-change tracking with provenance is solved infrastructure** (Zep/Graphiti).
3. **What I did not find in any reviewed product:** an end-user surface whose unit is a *persistent, resolvable situation* — a cross-source contradiction, a change, an open commitment, or an unconfirmed gap — shown with its evidence and an explicit uncertainty level, where the product defaults to silence when unsure. Absence in my sources is not proof of absence in the market; see [whitespace-map.md](whitespace-map.md) for how confident I am in this.
