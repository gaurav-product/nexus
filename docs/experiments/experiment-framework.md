# Experiment framework

**No experiment has been run. No results exist.** This file defines how experiments will be run and read.

## Principles
- One primary metric per experiment, decided before launch.
- Guardrails can stop an experiment regardless of the primary metric.
- Small samples are expected early; report effect sizes with intervals, and treat early reads as directional.
- Pre-register: hypothesis, metric, minimum detectable effect, stop rule — in this file, before launch.

## E1 — Conservative vs. Sensitive inbox

**Hypothesis:** A conservative, evidence-backed inbox will be more useful and trusted than a high-sensitivity alert system.

| | Variant A — Sensitive | Variant B — Conservative (control/default) |
|---|---|---|
| Bulk/newsletter senders | Included | Excluded |
| Weak-link *Possible* items | All surfaced | Surfaced only when linked to a dated event in the next 14 days |
| Undated commitments | Surfaced | Shown only in Commitments list, not Needs attention |

Implemented as the `sensitivity` setting in the engine (`packages/core/src/engine/policy.ts`); the demo lets you toggle it to see the difference on the same data.

**Primary metric:** RIS / WAU / week.
**Guardrails:** user-reported false-positive rate; dismissal rate; 2-week retention.
**Secondary:** "Was this useful?" yes-rate; trust rating; evidence-open rate.

**Design:** user-level randomisation, 50/50, 4 weeks (situations are low-frequency, so shorter tests won't have enough events).

**Sample size:** unknown until we have a baseline RIS and variance from the diary study. With a small consumer beta (say 60–100 users) this will be directional only — it's reported as such.

**Decision rule (pre-registered):**
- Ship Conservative if RIS is within noise of Sensitive **and** false-positive/dismissal rates are lower.
- Ship Sensitive only if RIS is clearly higher **and** FP rate stays ≤ 5% **and** retention isn't lower.
- If Sensitive wins on RIS but loses on retention → keep Conservative; investigate which extra items were valuable.

**Expected confound:** novelty — users explore everything in week 1. Read week 3–4 separately.

## E2 — Evidence visible by default vs. on demand (backlog)
Hypothesis: showing the first evidence excerpt inline raises trust without slowing resolution. Primary: trust rating. Guardrail: time to resolution.

## E3 — Concept test: situation card vs. briefing paragraph (qualitative, pre-beta)
Same facts, two presentations. Which do participants act on correctly, and which do they trust? Tests H2/H3 cheaply before any live beta. Run during research round 1.

## Results log
| Experiment | Status | Result |
|---|---|---|
| E1 | Designed; not run | Not yet validated |
| E2 | Backlog | — |
| E3 | Designed; not run | Not yet validated |
