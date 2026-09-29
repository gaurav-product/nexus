# Validation plan (Phase 16)

**Status: designed, not started. No participant data has been collected.**

This supersedes nothing. It turns the original [research plan](research-plan.md) (assumptions A1–A9) and the [product thesis](../product/product-thesis.md) (H1–H5) into something that can be run, scored and acted on. IDs are kept so evidence traces back to the original reasoning.

## The question

> Does Nexus solve a meaningful job better than the alternatives people already have?

The alternatives are not "nothing". They are:

1. **Current workflow** — email, calendar, memory and manual checking.
2. **A generic AI briefing** — a daily narrative summary (Google CC, ChatGPT Pulse, Copilot style).
3. **Nexus** — a small inbox of persistent, evidence-backed situations.

Nexus only earns more investment if it beats both (1) and (2) on a job that happens often enough to matter.

## Hypothesis under test

> A small number of evidence-backed, persistent situations — conflicts, changes, commitments and unresolved requests — can be more useful than a generic daily AI briefing because they represent concrete situations that require human attention or resolution.

Broken into testable parts in the [hypothesis scorecard](hypothesis-scorecard.md).

## Study design — three instruments, in this order

| # | Instrument | What it answers | Who | Size (proposed) | Doc |
|---|---|---|---|---|---|
| 1 | **Problem interviews** (45 min) | Does this happen? What did it cost? How is it caught today? | Target segments | 10–12 people | [interview-guide.md](interview-guide.md) |
| 2 | **7-day diary study** | How often, really? (Interviews over-remember dramatic incidents and under-count small ones.) | Subset of interviewees | 6–8 people | [diary-study.md](diary-study.md) |
| 3 | **Comparative concept session** (25 min) | Given the same facts, which presentation do people act on correctly, trust, and prefer? | Diary participants + 2–4 new | 8–10 people | [session-template.md](session-template.md), in-app `/research` |

Order matters: the concept session comes **last** so showing Nexus doesn't contaminate the problem interviews and diary.

### Why these sizes
They're proposals, not statistical power calculations. 10–12 problem interviews is typically enough to see whether a pattern repeats within a segment; 7 days × 6–8 people gives roughly 40–55 participant-days, enough to tell "several times a week" from "once a month" but not to estimate a precise rate. Everything from this phase is **directional**.

## Segments and priority

From the brief's list, prioritised by where the hypothesised problem should be most frequent:

| Priority | Segment | Why | Target n (interviews) |
|---|---|---|---|
| 1 | Job seekers mid-process | Many reschedules across recruiter email, invites, PDFs | 3 |
| 1 | Consultants / freelancers / founders | External promises, travel, client documents | 3 |
| 2 | Recruiters / interview coordinators | Professional exposure at volume — possible B2B wedge (persona P3) | 2 |
| 2 | Product managers / knowledge workers | Many meetings and cross-team promises | 2 |
| 3 | Researchers | Collaboration and document requests | 1–2 |

If one segment shows much higher frequency, that's the wedge signal (scorecard H8).

## Comparison design (concept session)

Same four scenarios, same facts, three presentations shown **blind** as Option 1/2/3 in a counterbalanced order (six orders, rotated by participant number):

| Condition | What the participant sees | Design note |
|---|---|---|
| **A — Current workflow** | The relevant raw emails, calendar entries and files mixed with unrelated ones, as they'd appear in their own tools | Tests whether people spot the issue themselves |
| **B — AI briefing** | A daily-digest paragraph that **contains the same facts** Nexus found | Deliberately *not* a strawman. The briefing is given perfect detection so any difference is about presentation, evidence and persistence — not about Nexus detecting more |
| **C — Nexus** | The situation card: what, why, evidence slips, status, next step | The thing under test |

Primary measure: **did they state the right next action** (e.g. "check the date with the recruiter") — a behavioural comprehension measure, not an opinion. Ratings (usefulness, clarity, trust, evidence quality, actionability, annoyance) are secondary. See [evidence-rubric.md](evidence-rubric.md) for how much weight each kind of answer gets.

**Known bias:** the facilitator built Nexus. Mitigations: blind labels, counterbalanced order, a script read verbatim, and asking for the next action *before* asking for opinions.

## Decision rules — classifying the outcome

After all three instruments, score each hypothesis in the [scorecard](hypothesis-scorecard.md) as Supported / Mixed / Not supported / Insufficient evidence, then:

| Outcome | Rule (proposed) | What happens |
|---|---|---|
| **A — Strong validation** | H1, H2, H3 and H6 Supported; H7 not Not-supported | Build V2 (see [case study](../portfolio/case-study.md#validation-status) for what V2 would be) |
| **B — Partial validation** | Problem real (H1+H2) for **one segment or one situation type** only | Narrow the ICP or use case, e.g. "interview coordination" or "commitments only"; re-run a smaller round |
| **C — Weak validation** | Problem real but H3 or H6 Not supported (people catch it fine, or a briefing is preferred) | Pivot: Nexus as a feature inside a briefing/email client, or a different job |
| **D — No meaningful problem** | H1 Not supported across all segments | Kill Nexus. Write it up as a validated negative. |

**Rule against forcing a positive:** if the evidence sits on a boundary, the more conservative outcome applies. "Participants liked it" is never sufficient for A (rubric: stated preference is E0–E1).

## What this phase will NOT do

No new integrations, agents, mobile app, AI memory, or monetisation. The only code change is a research session mode that runs the concept session on the existing demo data — it adds no product capability.

## Schedule (proposed)

| Week | Activity |
|---|---|
| 1 | Recruit (see [participant-recruitment.md](participant-recruitment.md)); pilot the interview once with a friendly participant and fix the guide |
| 2 | Interviews 1–12; diary starts for 6–8 volunteers |
| 3 | Diary ends; concept sessions |
| 4 | Score, classify A–D, update [validation-log.md](validation-log.md), case study and decision log |

## Data handling

Consent before anything ([consent-template.md](consent-template.md)). Participants describe incidents; they never share inbox access or forward real emails. Pseudonymous IDs (P01…). Raw notes stay local; only coded rows in the [CSV schema](schema/) are kept. Nothing about participants is committed to the public repository except aggregated, anonymised findings.
