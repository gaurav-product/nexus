# Research data schema

CSV files with **headers only**. They contain no data because none has been collected. Real participant data must **not** be committed to this public repository — copy these headers into a private spreadsheet and keep it there. Only aggregated, anonymised findings come back into `validation-log.md`.

Every file joins on `participant_id` (P01, P02…). Never names, emails or phone numbers.

## participants.csv — one row per participant
| Column | Values |
|---|---|
| participant_id | P01… |
| segment | job_seeker, consultant, founder, freelancer, recruiter, pm, knowledge_worker, researcher, other |
| role_description | Generic, e.g. "B2B SaaS PM, 4 yrs" — no employer names |
| recruited_via | channel from [participant-recruitment.md](../participant-recruitment.md) |
| consent_date, consent_recording | date; yes/no |
| interview_date, diary_enrolled, diary_start, diary_end, concept_session_date | dates / yes-no |
| withdrawn | yes/no — if yes, delete their other rows |

## incidents.csv — one row per incident recalled in an interview (or recalled at diary debrief)
| Column | Values |
|---|---|
| situation_type | conflict, change, commitment_mine, commitment_theirs, missing |
| recency_days | days since it happened |
| sources_involved | semicolon list: email; calendar; document; whatsapp; slack; portal; phone; memory; other |
| in_mvp_scope | yes if only email/calendar/documents |
| discovery_method | by_chance, checked_on_purpose, someone_told_me, tool_or_reminder, too_late |
| discovered_in_time | yes/no |
| resolution_minutes | integer estimate |
| consequence | none, small_inconvenience, wasted_time, late_or_missed, embarrassment, money |
| importance_1_5 | participant's rating |
| evidence_level | E0–E4 per [evidence-rubric.md](../evidence-rubric.md) |

## diary_entries.csv — one row per diary entry
Fields from [diary-study.md](../diary-study.md). `proactive_detection_helpful` is no / maybe / yes. `logged_same_day` yes/no (same-day = E4).

## concept_session.csv — one row per participant × scenario
Exported directly by the app's Research session (`/research`). A unit test fails the build if the app's columns drift from this header.

| Column | Meaning |
|---|---|
| first_condition | Which view (A current workflow, B AI briefing, C Nexus) they saw first, cold |
| display_order | Order of the side-by-side views, e.g. `B,C,A` (View 1, 2, 3) |
| next_action_text / action_coding | What they said they'd do on first exposure; coded correct / partial / missed |
| clearest_condition, most_trusted_condition | A / B / C / none |
| nexus_* | 1–5 ratings of the Nexus view only |
| perceived_frequency | never, few_per_year, monthly, weekly, several_per_week |
| own_incident_text | Volunteered real incident (E2 if specific) |
| connect_data | none, calendar_only, email_readonly, all_three, unsure |
| pilot_agreed | yes/no — behavioural signal (E3) |

## scorecard_updates.csv — audit trail for the scorecard
One row each time a hypothesis status changes, so the reasoning for every status is traceable.
