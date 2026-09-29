# Nexus — Personal Decision & Context Engine

*A portfolio case study by Gaurav Kumar Singh. Code: [github.com/gaurav-product/nexus](https://github.com/gaurav-product/nexus). Research, product decisions, design and build. Every result below is either measured in this repo or labelled **not yet validated**.*

---

## 1. Problem

The information that runs a busy person's week — when an interview is, what time a flight leaves, what they promised a client, whether they sent the signed form — is spread across email, calendar and documents. Each source is accurate when it's written. The failures happen **between** sources and **over time**: the recruiter's email says Monday but the calendar says Tuesday; the airline moved the flight but the calendar didn't; a promise made on Tuesday has no reminder on Thursday.

Search, chat-with-your-inbox and memory apps answer *"what does my data say about X?"* — only if you already know to ask. The expensive failures are the ones you didn't know to ask about.

## 2. Market landscape

I reviewed 20 products across nine clusters ([analysis](../research/competitive-analysis.md), [matrix](../research/competitive-matrix.md)):

- **Platform assistants** that brief you proactively — Google CC (Gmail + Calendar + Drive daily briefing), ChatGPT Pulse, Gemini Personal Intelligence, Copilot in Outlook (agentic), Poke.
- **AI email clients** — Superhuman, Shortwave, Fyxer.
- **Memory infrastructure** — Zep/Graphiti, Mem0, Supermemory.
- **Second brains, calendars, meeting memory, agent builders, personal CRMs**, and TripIt as a vertical reference.

## 3. Competitive analysis — what I learned

Two findings nearly killed the idea:

1. **Proactive Gmail + Calendar briefings already exist.** Google CC reads *exactly* the three sources I planned for the MVP.
2. **Change tracking with provenance is solved infrastructure.** Zep's temporal knowledge graph closes an old fact's validity window when new information contradicts it, and traces every fact to its source.

What I didn't find in any of the 20: an end-user surface whose unit is a **persistent, resolvable situation** — a contradiction, change, open promise or unconfirmed request — shown with its evidence and an explicit confidence level, that stays quiet when unsure. The market **summarises** (briefings), **acts** (agents) or **stores** (memory). Very few **reconcile**.

## 4. Why I rejected "AI second brain"

A second brain optimises capture and retrieval. The problem here isn't that information is lost — it's that two pieces of information *disagree* or go *stale*, and nobody compares them. A better memory makes that worse: more stored facts, more room for silent contradiction. The unit of value isn't a memory, it's a **situation that needs a decision**.

## 5. Opportunity

I tried to kill the thesis before building ([whitespace map §2](../research/whitespace-map.md)). The strongest attack — "Google will ship this" — is true *for a standalone consumer business*. It doesn't kill the product-design claim. So I **narrowed the thesis** (decision D-002) to something falsifiable that doesn't depend on beating Google at distribution:

> For personal information spread across sources, a small set of persistent, evidence-backed situations is more useful and more trusted than a daily narrative briefing or an autonomous agent.

The biggest unknown — whether real conflicts happen often enough — led to a second decision (D-003): weight commitments and changes equally with conflicts, so the product doesn't stand on its least-certain leg.

## 6. User research

**No interviews have been run.** I wrote a [research plan](../research/research-plan.md), an [interview guide](../research/user-interview-guide.md) built on critical-incident technique, a 10-day diary study to measure frequency (which interviews can't), and an **assumption map** with explicit kill criteria. Personas are labelled hypotheses. This is the most important unfinished work in the project.

## 7. Product thesis

Five sub-hypotheses, each with a falsification condition ([thesis](../product/product-thesis.md)). Kill if situations are rare for every segment; pivot to a recruiting-coordinator (B2B) wedge if they're rare for consumers but frequent for coordinators; pivot to "feature not product" if persistence doesn't beat an ephemeral briefing.

## 8. MVP

Smallest credible surface: email, calendar, uploaded documents. Four situation types. Six scenarios on a fictional dataset, plus a control case (sources agree in different formats → silence) and an adversarial prompt-injection email.

![Situation Inbox](../assets/screenshots/01-inbox.png)

## 9. UX decisions

- **Home is an inbox, not a chat box.** The headline states what Nexus did: *"Nexus compared 20 items… 6 things need your attention."*
- **Two voices.** Everything Nexus says is sans-serif; everything a source said is serif, inside an evidence slip, with the exact words it relied on highlighted. The difference between evidence and inference is visible without a legend.
- **Conflicts show versions side by side** and never pick a winner. Resolving means *you* choose — or say "neither", or "these are different events".
- **"Not found in your connected sources," never "missing."** Nexus shows where it looked.
- **Ordering: what you don't know before what you forgot** (D-013). The first build sorted by time; an overdue item someone else owed outranked an interview date conflict. Fixed after review.

![Resolving a conflict](../assets/screenshots/02-resolve-conflict.png)

## 10. System architecture

A pure TypeScript engine (`packages/core`) and a React UI (`apps/web`). The engine is one function: sources → extraction → validation → linking → detection → policy. User decisions are stored separately and applied afterwards, so the engine never overwrites intent and derived data is always recomputable. A Postgres schema with row-level security is written and applied to a test database, but connected mode is **not deployed**. [Architecture](../architecture/architecture.md).

## 11. AI architecture

**Deterministic first.** Dates, times, comparisons, linking, status and lifecycle are rules — the demo makes zero model calls. AI sits behind a provider-neutral interface (Anthropic, OpenAI, Mock) for two narrow jobs: extracting commitments from ambiguous language, and rephrasing explanations. Guardrails:
- strict output schemas where no "action" can even be expressed;
- AI-extracted commitments must quote the source verbatim or they're dropped, and dates are re-parsed by the rules;
- a grounding check rejects any AI sentence that introduces a date, time, number or name not in the evidence;
- retries, timeouts and logs that carry metadata only.

## 12. Trust / provenance model

Five statuses from fixed rules, no percentages (D-004): **Confirmed**, **Strong evidence**, **Sources disagree**, **Possible**, **Needs your confirmation**. The key rule (D-007): items linked only by a first name can *never* be above "Possible". Uncertainty is structural, not a model's self-report.

## 13. Privacy / security

Read-only by design — there is no send/forward/delete code path to exploit. A seven-layer [prompt-injection model](../security/prompt-injection-model.md) and [threat model](../security/threat-model.md). Per-item source permissions, export, delete-all, content-free analytics with a test proving no email text reaches the logs, and a secrets scanner over the build.

![Injection email flagged](../assets/screenshots/06-sources-injection-flag.png)

## 14. Metrics

North Star: **Resolved Important Situations per weekly active user** — surfaced, resolved, and never marked wrong. Guardrails: detection precision, user-reported false-positive rate, evidence attribution accuracy. Vanity metrics (emails processed, situations generated) explicitly excluded. [Metrics](../product/metrics.md).

## 15. Experiments

**E1 — Conservative vs. Sensitive inbox**, pre-registered with decision rules ([framework](../experiments/experiment-framework.md)). It's built into the demo as a toggle: Sensitive mode adds a mailing-list deadline the Conservative default hides. **Not run.**

## 16. Results

**Measured (engineering):**
- 95 engine tests, 14 UI tests, 6 end-to-end tests including the full demo journey — all passing.
- Zero serious or critical axe accessibility violations on every screen, light and dark, desktop and mobile.
- Pipeline: median 2.0 ms, p95 4.5 ms on the demo set.
- Schema applied to Postgres 16: 9 tables, RLS on all.

**Not yet validated (product):** usefulness, trust, frequency, precision on real mail, retention, the E1 outcome. There are no users.

## 17. Failures

- **My first thesis framing was wrong.** "New category" didn't survive research; the narrower thesis did.
- **My first "change" rule was wrong.** "Same sender, newer message = change" silently resolved exactly the case the user needs to see (a recruiter contradicting her own invite). Amended to require explicit change language (D-008).
- **A data-integrity bug a user would never have reported.** Situation ids were derived from member sources, so one new email in a thread orphaned the user's earlier decision. A test caught it (D-014).
- **Accessibility.** My "faint" grey failed WCAG contrast at 2.9:1. The automated audit caught it.

## 18. Iterations

Research → thesis reframed → engine built → run on demo data (3 defects) → tests (1 architectural bug) → visual review (ordering, focus, grouping) → axe (contrast) → re-verified. Each change is in the [decision log](../product/decision-log.md) and [changelog](../../CHANGELOG.md).

## 19. What I would build next

1. **Run the research plan.** Eight to twelve interviews, a 10-day diary study, and the card-vs-briefing concept test. Nothing else until that's done.
2. If frequency holds: a **labelled eval set** from consented real data, and measure precision/recall of each rule.
3. A **read-only Gmail/Calendar connector** for one test account, behind the existing interface.
4. Only then: AI extraction for free-form commitments, gated on the eval set.

## 20. Product lessons

- **Try to kill the idea first.** The research changed the thesis more than any feature did.
- **Make uncertainty a structure, not a number.** "Name-only matches can't exceed Possible" is more trustworthy than any confidence score I could have invented.
- **The AI shouldn't be the database.** Keeping decisions separate from derived data made the id bug findable and fixable.
- **Tests are product work.** The most important bug here was a trust bug, found by a test about reopening.
- **Say what hasn't happened.** A case study with no users is honest only if it says so on every page that matters.
