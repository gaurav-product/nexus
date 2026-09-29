# PRD — Nexus MVP

| | |
|---|---|
| **Owner** | Gaurav Kumar Singh (PM) |
| **Status** | MVP built in demo mode · not yet validated with users |
| **Last updated** | 29 Sept 2026 |
| **Related** | [Thesis](product-thesis.md) · [Metrics](metrics.md) · [Experiments](../experiments/experiment-framework.md) · [Architecture](../architecture/architecture.md) · [Decision log](decision-log.md) |

---

## 1. Problem
Personal plans and promises live across email, calendar and documents. Failures happen *between* sources (they disagree) and *over time* (something changed, something is still open). Search and briefings don't catch what you didn't know to ask about. Full statement: [problem-statement.md](problem-statement.md).

## 2. Target users
Primary: people with high volumes of external, time-bound coordination — job seekers (P1), consultants/founders (P2). Secondary/pivot: recruiting coordinators (P3). See [personas](personas.md). **All hypotheses.**

## 3. Use cases
| ID | Use case |
|---|---|
| UC1 | Interview time in the calendar invite disagrees with the recruiter's later email |
| UC2 | Airline moves a flight; a meeting at the destination may now be impossible |
| UC3 | I promised a client a revised proposal by Thursday |
| UC4 | A recruiter promised to confirm the panel by Wednesday (Waiting) |
| UC5 | HR asked for a signed document; Nexus can't find one in connected sources |
| UC6 | A name-only match suggests two items might be the same meeting at different times |
| UC7 | A commitment was fulfilled (reply with attachment) — Nexus shows it resolved and why |
| UC8 | An email tries to instruct the AI; Nexus treats it as data and flags it |

## 4. User stories
- As Riya, when my interview time differs between sources, I want both versions side by side with where each came from, so I can check with the recruiter before the day.
- As Arjun, when my flight changes, I want to see before → after and which of my plans it affects.
- As a user, I want every card to answer "why am I seeing this?" with the actual source text.
- As a user, I want Nexus to say when it isn't sure, instead of guessing.
- As a user, I want to resolve a conflict by choosing the correct version, and have Nexus remember my decision.
- As a user, I want dismissed items to stay dismissed unless new evidence arrives.
- As a user, I want to see and revoke which sources Nexus can read.
- As a user, I never want Nexus to send, change or delete anything on its own.

## 5. Functional requirements

### Ingestion & sources
- **FR-1** Ingest three source types: email, calendar event, uploaded document, through a common `SourceConnector` interface.
- **FR-2** Demo mode ships a fictional dataset through a `DemoConnector`; the UI shows a persistent "Demo mode · fictional data" label. Connected mode is not available in this build and must not be implied.
- **FR-3** Each source can be disabled; disabled sources' observations are excluded and dependent situations are recomputed.

### Extraction & validation
- **FR-4** Extract observations: event times, booking/flight times, commitments (owner, action, object, due), document requests, document presence, attachments.
- **FR-5** Deterministic extractors run first (dates, times, flight numbers, booking refs, ICS UIDs, attachments). AI extraction is optional and only for ambiguous language.
- **FR-6** Every extraction is schema-validated (Zod). Invalid output is dropped and logged; it never reaches state.
- **FR-7** Every observation stores its source span (the exact text it came from) and whether it was *explicit* (stated) or *inferred*.

### Linking & state
- **FR-8** Link observations to a subject using strong identifiers first (calendar UID, booking reference, flight number + date, thread). Name/title similarity creates only a *weak* link.
- **FR-9** Maintain per-subject attribute timelines ordered by source time.

### Situation detection
- **FR-10 Conflict:** strongly- or weakly-linked current values for the same attribute disagree across *different authorities*. Never auto-pick a winner.
- **FR-11 Change:** a later observation from the *same authority* (same sender domain / system + same identifier) differs from an earlier one. Show before/after/when/what changed.
- **FR-12 Downstream impact:** when a changed time overlaps or makes infeasible another dated item, list it as *possibly affected* (deterministic time arithmetic only).
- **FR-13 Commitment:** track owner = me (Commitments) or other (Waiting); status open / due soon / overdue / appears fulfilled.
- **FR-14 Fulfilment:** a later outgoing message to the same counterparty that matches the commitment's object (keyword + attachment) marks it *appears fulfilled* with evidence; reversible by the user.
- **FR-15 Missing info:** a request with no matching document/attachment in connected sources → "Not found in connected sources" (never "missing"). Status: Needs confirmation.
- **FR-16** Situations are idempotent: re-running the pipeline on the same data yields the same situation IDs (fingerprint).

### Presentation
- **FR-17** Home is the Situation Inbox with views: Needs attention, Conflicts, Changes, Commitments, Waiting, Resolved.
- **FR-18** Each situation shows What · Why · Evidence · Status · Next step · Controls.
- **FR-19** Evidence opens source excerpts with the relevant span highlighted, source type, sender/system, timestamp, and an Explicit/Inferred label.
- **FR-20** Status is one of: Confirmed · Strong evidence · Conflicting evidence · Possible · Needs confirmation (definitions in §8).
- **FR-21** Explanations are template-generated from evidence by default. An optional AI rephrasing is accepted only if it introduces no dates, times, names or numbers absent from the evidence.

### User control
- **FR-22** Controls: Resolve (for conflicts: choose which version is correct, or "neither"), Dismiss (with optional reason: not relevant / wrong), Snooze (until date), Reopen.
- **FR-23** A user decision is stored as a *User decided* fact and outranks sources for that subject/attribute.
- **FR-24** Dismissed/resolved situations reopen only if their evidence fingerprint changes (new evidence).
- **FR-25** Suggested next steps are text; Nexus performs no external actions.
- **FR-26** Every user decision is written to an append-only audit log visible to the user.

### Safety
- **FR-27** All source content is untrusted data. Text resembling instructions to an AI is flagged on the source and has no effect on behaviour.
- **FR-28** Sensitivity setting: Conservative (default) / Sensitive — used for experiment E1.

## 6. Non-functional requirements
- **NFR-1 Determinism:** core detection works with zero AI calls. The demo makes none.
- **NFR-2 Provider independence:** AI behind an `AIProvider` interface; Anthropic, OpenAI and Mock adapters.
- **NFR-3 Performance:** pipeline on the demo set < 50 ms in-browser; UI interactive < 1.5 s on mid-range mobile.
- **NFR-4 Accessibility:** WCAG 2.1 AA contrast, full keyboard use, visible focus, semantic landmarks, screen-reader labels on status.
- **NFR-5 Responsive:** usable at 360 px width.
- **NFR-6 Privacy:** no source content in logs; only IDs, counts, durations.

## 7. MVP scope
In: FR-1 → FR-28 in demo mode. Out: see [non-goals](non-goals.md).

## 8. Status definitions (the trust contract)

| Status | Rule (deterministic) | UI language |
|---|---|---|
| **Confirmed** | ≥2 independent sources agree, or the user decided | "Confirmed" |
| **Strong evidence** | One explicit statement, strongly linked, nothing contradicts it | "Strong evidence" |
| **Conflicting evidence** | Strongly linked sources disagree on the same attribute | "Sources disagree" |
| **Possible** | Relies on a weak link or an inference (e.g. fulfilment detected by keyword) | "Possible — check" |
| **Needs confirmation** | Nexus can't verify from connected sources (e.g. absence) | "Needs your confirmation" |

No percentages. Rationale: D-004.

## 9. Edge cases
| Case | Behaviour |
|---|---|
| Same value, different formats ("3 PM" vs "15:00") | Normalised before compare; no conflict |
| Time zones differ (IST vs UTC invite) | Compare as instants; show both in user TZ |
| Newer email says "rescheduled to…" from same authority | Change, not conflict |
| Newer email from a *different* sender contradicts | Conflict — Nexus doesn't assume newer wins |
| Only a first name matches | Weak link → Possible, asks "Are these the same?" |
| Relative dates ("tomorrow", "by Thursday") | Resolved against the email's sent date, not today |
| Commitment with no date | Tracked without due date; never "overdue" |
| Attachment named generically ("scan.pdf") | Does not satisfy a specific request; stays Needs confirmation |
| Bulk / newsletter sender | Excluded in Conservative mode |
| Source disabled mid-session | Situations recomputed; ones lacking evidence disappear |
| Injection text in a source | Flagged; no effect |
| Empty data | Friendly empty state explaining what Nexus looks for |

## 10. Privacy requirements
Least privilege (read-only scopes); per-source enable/disable; delete all local data; export (JSON); no content in logs or analytics; retention: raw source bodies not stored beyond extraction in production (spans only); provider calls send the minimum span, never whole mailboxes. Detail: [threat model](../security/threat-model.md).

## 11. Security requirements
Auth + row-level authorization per user (Supabase RLS in schema); OAuth tokens server-side only, encrypted at rest; secrets via env vars, `.env.example` only in git; input validation on all boundaries; output validation on all AI results; rate limiting on AI endpoints; audit log for all user decisions; safe error messages. Prompt-injection model: [prompt-injection-model.md](../security/prompt-injection-model.md).

## 12. Analytics requirements
Events (IDs and enums only, no content): `situation_generated {type, status, sensitivity}`, `situation_viewed`, `evidence_opened`, `situation_resolved {type, resolution}`, `situation_dismissed {reason}`, `situation_snoozed`, `situation_reopened {cause}`, `feedback {useful: bool}`, `source_toggled`. Definitions: [metrics.md](metrics.md).

## 13. Success metrics
North Star: **Resolved Important Situations / weekly active user**. Guardrails: false-positive rate, evidence attribution accuracy. Full definitions and targets: [metrics.md](metrics.md). **No results exist yet.**

## 14. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Situations too rare (A1) | Unknown | Fatal | Diary study before any further build |
| Platforms ship equivalent | High | High for business | Position on interaction model; provider-neutral wedge |
| Weak-link false positives | Medium | High (trust) | Weak links only yield *Possible*; conservative default |
| Gmail restricted-scope assessment cost | High | Medium | Demo adapter now; budget assessment before launch |
| Prompt injection via email | High | High | Data/instruction separation; no tool access for model; output validation |
| Over-trust in "Resolved (appears fulfilled)" | Medium | Medium | Labelled Possible; one-click reopen |

## 15. Dependencies
Google OAuth verification (restricted Gmail scope); Calendar API; PDF text extraction; an LLM provider (optional); Postgres (Supabase) for connected mode.

## 16. Future roadmap (evidence-gated)
| Next | Gate |
|---|---|
| Run interviews + diary study | none — do first |
| Real Gmail/Calendar read-only connector (single test account) | A1 passes |
| AI extraction for ambiguous commitments + eval set | A3 passes; eval ≥ target precision |
| Draft-a-follow-up (user sends) | A4 shows appetite |
| Outlook + Microsoft Calendar | Provider-neutral wedge validated |
| Coordinator (team) mode | P3 pivot triggered |
