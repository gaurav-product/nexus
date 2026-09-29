# Hypothesis scorecard

**Current status of every row: Unknown — not yet collected.** Thresholds are **proposed validation criteria**, written before any data so they can't be bent to fit results. They are judgement calls, not derived from benchmarks; revise them only before data collection starts, and log any change in the [decision log](../product/decision-log.md).

Evidence levels (E0–E4) are defined in [evidence-rubric.md](evidence-rubric.md). "Qualifying" situation = rubric definition.

| ID | Hypothesis | Traces to | Evidence required | Proposed support threshold | Kill / not-supported condition | Instrument | Status |
|---|---|---|---|---|---|---|---|
| **H1a** | People regularly hit **cross-source conflicts** | A1, thesis H1 | Qualifying diary entries (E4) + interview incidents (E2+) | Diary: median ≥ 1 qualifying conflict per participant per week in at least one segment | ≥ ⅔ of diary participants log **zero** qualifying conflicts in 7 days | Diary, interviews | Unknown — not yet collected |
| **H1b** | People regularly hit **changes** that matter | A1 | Same | Median ≥ 1 qualifying change / participant / week | ≥ ⅔ log zero | Diary | Unknown — not yet collected |
| **H1c** | **Commitments** (mine and theirs) slip often enough to matter | A3 | Same, plus E3 workarounds | Median ≥ 2 commitments logged / participant / week **and** ≥ 1 slipped or nearly slipped | Commitments rarely slip, or every participant already tracks them reliably | Diary, interviews | Unknown — not yet collected |
| **H1d** | **Missing / unresolved** information is a recurring problem | — | Same | ≥ half of diary participants log ≥ 1 qualifying entry | ≥ ⅔ log zero | Diary | Unknown — not yet collected |
| **H2** | These situations **cost** real time or cause consequences | A2 | Resolution minutes; consequence field; E2 incidents | Median resolution ≥ 10 min on qualifying entries, **or** ≥ half of interviewees give an E2 story with a real consequence (late, missed, embarrassed, money) in the last 3 months | Median < 5 min and consequences overwhelmingly "none / small inconvenience" | Diary, interviews | Unknown — not yet collected |
| **H3** | Current workflow catches them **too late** (proactive detection would matter) | A2, A6 | Discovery field | ≥ 40% of qualifying entries discovered by chance, by someone else, or too late | ≥ 75% caught on purpose and in time by existing habits/tools | Diary | Unknown — not yet collected |
| **H4** | The problem sits in **MVP sources** (email, calendar, documents) | scope | Sources field | ≥ 60% of qualifying entries involve only email/calendar/documents | Majority involve WhatsApp, Slack, portals etc. → problem may be real but MVP scope is wrong | Diary | Unknown — not yet collected |
| **H5** | **Evidence / provenance increases trust** | A5, thesis H3 | Concept session: trust rating Nexus vs. briefing + stated reason | Nexus rated more trustworthy than briefing by ≥ 6 of 8–10 participants **and** ≥ half cite seeing the source text as the reason | No consistent difference, or evidence called noise/clutter by most | Concept session | Unknown — not yet collected |
| **H6** | **Persistent situations beat a briefing** for acting correctly | thesis H2 | Concept session: correct next action stated per condition | Correct-action rate for Nexus higher than briefing in ≥ 3 of 4 scenarios, and chosen as clearest by a majority | Briefing matches or beats Nexus on correct action → the value is detection, not the inbox (pivot C) | Concept session | Unknown — not yet collected |
| **H7** | People **tolerate connected-data permissions** for this value | A7 | Behavioural signal, not stated intent | ≥ half agree to a follow-up pilot with their own account and give a real contact (E3) | ≥ half refuse any email access in any form | Concept session, interview Q16–17 | Unknown — not yet collected |
| **H8** | One **segment** has markedly more of the problem (wedge) | persona P3 | Diary frequency by segment | One segment's median qualifying entries ≥ 2× the others' | Flat across segments (no wedge — or no problem) | Diary | Unknown — not yet collected |
| **H9** | Human-decides beats auto-fix for **information** conflicts | A4, thesis H5 | Interview Q15 + concept-session reaction to "Nexus won't pick for you" | Majority, with reasons, prefer choosing | Majority want it fixed automatically | Interviews, concept | Unknown — not yet collected |
| **H10** | Conservative beats sensitive (experiment E1) | A6, thesis H4 | Live usage data | Per [experiment framework](../experiments/experiment-framework.md) | Per framework | **Not testable in Phase 16** (needs a live beta) | Unknown — out of scope for this phase |

## How the scorecard maps to outcomes

See [validation-plan.md § Decision rules](validation-plan.md#decision-rules--classifying-the-outcome). Short version: H1 (any sub-row) + H2 + H3 + H6 decide whether Nexus lives; H4, H7 and H8 decide its shape.

## Status vocabulary

| Status | Meaning |
|---|---|
| Unknown — not yet collected | No data |
| Insufficient evidence | Some data, below the minimum to judge |
| Supported | Meets the support threshold at E2+ |
| Mixed | Between thresholds, or segments disagree |
| Not supported | Meets the kill condition |
