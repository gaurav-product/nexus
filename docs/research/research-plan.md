# Research plan

**Status: no interviews have been run.** Everything in `docs/product/` about users is a **hypothesis** until this plan is executed. This file is the plan and the assumption map.

## Goal

Find out whether the Nexus problem is real, frequent and painful enough — before investing beyond the MVP demo.

## Research questions

1. **Frequency** — How often do people act on information that turned out to be outdated or contradicted by another source? (Per week? Per month?)
2. **Cost** — When it happens, what does it cost? (Missed meeting, wrong time, awkward follow-up, lost money.)
3. **Current workaround** — How do people catch these today? (Memory, re-reading, a daily scan, an assistant, TripIt, nothing.)
4. **Commitments** — How do people track things they promised in email? What falls through?
5. **Trust** — What would make someone trust a system that reads their email to *point things out*? What would make them turn it off?
6. **Briefing vs. state** — Do people who use a daily briefing (CC, Pulse, Copilot) still miss these things?

## Participants

Target: **8–12 interviews** in round 1, then a **diary study of 5 people for 10 days**.

| Segment | Why | n |
|---|---|---|
| Job seekers mid-process | High volume of recruiter email + interviews + reschedules | 3 |
| Founders / consultants | Many external commitments, travel | 3 |
| PMs / knowledge workers | Many meetings, cross-team promises | 3 |
| Recruiters / coordinators | Professional exposure to schedule conflicts | 2 |
| Heavy travellers | Frequent changes | 1–2 |

Screener must-haves: uses Gmail or Outlook daily; ≥10 external emails/week; manages own calendar.

## Methods

1. **Semi-structured interviews (45 min)** — guide: [user-interview-guide.md](user-interview-guide.md).
2. **Critical incident technique** — ask about the *last specific time* something slipped, not general opinions.
3. **Diary study** — each time they notice a conflict, change, open promise or missing document, they log it (WhatsApp/form, 30 seconds). This produces the frequency number that no interview can.
4. **Concept test of the demo** — after the diary, show Nexus demo vs. a briefing-style mock of the same data. Ask which they'd trust and why. (Informs experiment E1.)

## Assumption map

Plotted on *importance to the thesis* × *current evidence*. Top-left = test first.

| ID | Assumption | Importance | Evidence today | Test |
|---|---|---|---|---|
| **A1** | Cross-source conflicts/changes happen often enough (≥1 meaningful one per week for target users) | Critical | **None** | Diary study |
| **A2** | Missing a conflict/change has a real cost people remember | Critical | Anecdotal only | Critical-incident interviews |
| **A3** | Open commitments in email are a frequent, felt pain | High | Adjacent products (Copilot follow-ups, Superhuman) invest in it — weak market signal | Interviews + diary |
| **A4** | People prefer to decide themselves over auto-fix for *information* conflicts | High | Opinion only; Copilot bets the other way for scheduling | Concept test / E1 |
| **A5** | Evidence + uncertainty labels increase trust (vs. a clean confident summary) | High | Indirect: Apple news-summary rollback | Concept test |
| **A6** | A conservative inbox (few items) beats a sensitive one on usefulness and retention | High | None | Experiment E1 |
| **A7** | People will grant read access to email for this value | Critical for business | Platforms get it; third parties face friction | Interviews (willingness) |
| **A8** | Strong-identifier linking covers most real conflicts | Medium | Reasoned, not measured | Offline eval on real (consented) data |
| **A9** | Users want a separate surface rather than inside Gmail | Medium | None | Concept test |

**Kill criteria** (from [product-thesis.md](../product/product-thesis.md)): if A1 fails *and* A3 fails, stop. If A7 fails, the product can only exist inside a platform.

## Ethics & data

- Consent form; no recording without consent; transcripts pseudonymised.
- Participants never share real inbox content with me — they describe incidents. Any real-data evaluation (A8) would need separate, explicit consent and local processing.

## Output

`docs/research/findings-round-1.md` — **does not exist yet**, and should not until interviews happen.
