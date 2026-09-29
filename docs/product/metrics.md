# Metrics

**No metric below has a measured value.** Targets are initial proposals to be revised after the first cohort. Nothing in this repo reports results.

## North Star — Resolved Important Situations (RIS)

**Definition:** count of situations, per weekly active user per week, that
1. were surfaced by Nexus,
2. were **resolved** by the user (not dismissed, not auto-expired), and
3. were **not** marked "wrong" or "not relevant" at any point.

Situations marked *appears fulfilled* by Nexus count only if the user viewed them and did not reopen within 7 days.

**Why this and not "situations surfaced":** surfacing is free; resolution means the user found it worth acting on. It punishes noise.

**Initial target:** ≥ 2 RIS / WAU / week (unvalidated; depends on A1).

## Guardrail metrics

| Metric | Definition | Target | Why |
|---|---|---|---|
| **Detection precision** | Of situations surfaced, % that labelled reviewers judge correct (right type, right facts). Measured offline on a labelled eval set. | ≥ 90% (Conservative) | Trust |
| **False-positive rate (user-reported)** | Dismissals with reason "wrong" ÷ situations surfaced | ≤ 5% | Trust, direct user signal |
| **Evidence attribution accuracy** | % of evidence items whose highlighted span actually supports the card's claim (offline review) | ≥ 98% | Principle 2 |
| **Dismissal rate (all reasons)** | Dismissed ÷ surfaced | Monitor; ≤ 30% | Noise indicator |
| **Recall (offline)** | Of labelled real situations in eval set, % surfaced | Report, no target yet | Conservative mode trades recall for precision — make the trade visible |

## Supporting metrics

| Metric | Definition |
|---|---|
| **Resolution rate** | Resolved ÷ (surfaced − still open and not yet due) over 14 days |
| **Time to resolution** | Median hours from first surfaced → resolved |
| **Evidence open rate** | % of viewed situations where evidence was expanded. High early = healthy scrutiny; should fall as trust grows |
| **Trust / usefulness rating** | In-card "Was this useful?" (yes/no) + periodic 1–5 "I trust Nexus to show me the right things" |
| **Weekly retained users** | Users active in week N and N+1 ÷ users active in week N. *Active* = opened Nexus and viewed ≥1 situation |
| **Reopen rate** | % of resolved/dismissed situations reopened by user (signals premature resolution) |

## Explicitly not tracked (vanity)
Emails processed, total situations generated, time in app, AI calls made.

## Instrumentation
Events listed in [PRD §12](prd.md#12-analytics-requirements). Payloads carry situation type, status, sensitivity variant and reason enums — never source content, subjects, names or addresses. In the demo build events go to an in-memory log shown on the Activity page; no network analytics.
