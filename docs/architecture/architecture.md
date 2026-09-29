# Architecture

## 1. Shape of the system

```text
┌───────────────────────────── apps/web (React SPA) ─────────────────────────────┐
│  Situation Inbox · Detail · Evidence · Sources · Activity                      │
│  UserState (decisions, snoozes, audit log, sensitivity) — local in demo        │
└───────────────▲────────────────────────────────────────────────┬──────────────┘
                │ Situation[] (pure data)                          │ decisions
┌───────────────┴──────────────── packages/core (pure TypeScript, no framework) ─┐
│                                                                                 │
│  SourceConnector ─► Extraction ─► Validation ─► Linking ─► State ─► Detection  │
│  (Demo | Gmail*   (rules first;   (Zod)         (strong/    (attribute  (conflict│
│   | Calendar*      AI optional)                  weak keys)   timelines)  change  │
│   | Upload*)                                                              commit │
│                                                                           missing)│
│                                        Evidence assembly ─► Explanation (template│
│                                                              ; AI phrasing opt.) │
│  AIProvider: Mock | Anthropic | OpenAI   ·   Policy: Conservative | Sensitive    │
└─────────────────────────────────────────────────────────────────────────────────┘
      * = interface + design only in this build; demo connector is the only live one
```

The core is a **pure function**:

```ts
runPipeline(sources, { now, sensitivity, disabledSourceIds }) → { observations, subjects, situations, flags, stats }
```

User decisions are applied **after** detection (`applyUserState`) so that the engine never mutates user intent and user intent never corrupts extraction. This is the "AI is not the database" rule from the brief: observations are derived, decisions are stored, situations are recomputed.

## 2. Pipeline stages

| Stage | Module | Deterministic? | Output |
|---|---|---|---|
| Connect | `connectors/` | ✓ | `RawSource[]` (email, calendar, document) |
| Safety scan | `safety/injection.ts` | ✓ | `SourceFlag[]` (instruction-like text) |
| Extract | `extract/` | ✓ (AI optional, off in demo) | `Observation[]` with span + basis |
| Validate | `domain/schemas.ts` | ✓ | invalid observations dropped + counted |
| Link | `engine/link.ts` | ✓ | `Subject[]` via union-find on strong keys; weak candidate pairs |
| State | `engine/state.ts` | ✓ | per-subject attribute timelines |
| Detect | `engine/detect/*.ts` | ✓ | `Situation[]` |
| Evidence | `engine/evidence.ts` | ✓ | excerpts with highlight ranges |
| Explain | `engine/explain.ts` | ✓ template; AI phrasing optional + validated | what / why / next step |
| Policy | `engine/policy.ts` | ✓ | sensitivity filter, urgency, views |
| Lifecycle | `engine/lifecycle.ts` | ✓ | applies decisions, snoozes, reopen-on-new-evidence |

## 3. Domain model

```text
User ─1:n─ Source ─1:n─ Observation ─n:1─ Subject ─1:n─ Situation ─1:n─ Evidence ─n:1─ Observation
                                             │                   │
                                  Relationship (strong|weak)     └─1:n─ Resolution / UserDecision ─► AuditEntry
```

| Entity | Key fields | Notes |
|---|---|---|
| **Source** | id, kind (email/calendar/document), provider (demo), receivedAt, authority | Raw content is not persisted in connected mode beyond extraction (spans only) |
| **Person / Organization** | derived from email addresses/domains | Used for counterparty and authority; not a contact database |
| **Document** | source of kind `document`; filename, text, signature evidence | |
| **Event** | a Subject with `start`/`departure`/`arrival` attributes | calendar events, interviews, flights |
| **Observation** | sourceId, kind, attribute, value, span, basis (explicit/inferred), extractor + version, observedAt | The atomic "a source said X" |
| **Subject** | id, label, keys[] | A real-world thing observations are about |
| **Relationship** | from, to, kind (same_as / affects / fulfils / requests), strength (strong/weak) | Graph-like, stored relationally (D-005) |
| **Commitment / Deadline** | owner (me/other), counterparty, action, object, dueAt, status | A situation subtype + observation |
| **Situation** | id (fingerprint), type, status, lifecycle, urgency, evidence[], details | The product's core object |
| **Evidence** | observationId, sourceId, role, excerpt, highlight, basis | "Why am I seeing this" |
| **Action** | suggested next step (text only) | Nexus never executes |
| **Resolution / UserDecision** | situationId, action, choice, reason, at, evidenceFingerprint | Outranks sources |
| **AuditEntry** | at, actor (user/nexus), action, situationId | Append-only |

Every entity carries `id`, source/provenance, timestamps and status where it applies. Postgres schema: [`supabase/migrations/0001_init.sql`](../../supabase/migrations/0001_init.sql) (written, not deployed).

## 4. Linking rules (D-007)

| Key | Example | Strength |
|---|---|---|
| Calendar UID in invite email | `acme-int-2291@acme-hr.example` | strong |
| Email thread | `thread-acme-1` | strong (within thread) |
| Booking / reference code | `PNR X7KQ2M`, `Ref ACME-INT-2291` | strong |
| Flight number + date | `6E2134@2026-10-08` | strong |
| First name + meeting cue | "Call with Priya" ↔ email from Priya Nair about "our call" | **weak** → situation can't exceed *Possible* |

## 5. Detection rules

- **Conflict:** within a subject, ≥2 distinct normalised values for the same attribute, excluding values superseded by an explicit change. No winner is chosen.
- **Change:** a later observation carries an explicit change cue (*rescheduled, moved, changed, now departs, revised…*) and comes from the same authority as an earlier observation with a different value (D-008, amended: same authority *without* a cue is a conflict, not a change). Other sources still holding the old value are listed as *stale copies* on the change card instead of generating a second conflict.
- **Downstream impact:** a changed arrival/start leaves < 90 minutes before another dated item in the destination city → *possibly affected*.
- **Commitment:** first-person promise patterns in outbound mail (mine) or inbound mail (theirs → Waiting); relative dates resolved against the message's sent time.
- **Fulfilment:** later message in the right direction to/from the same counterparty sharing a significant keyword with the promised object (+ attachment for "send/share") → *appears fulfilled* (Possible, reversible).
- **Missing info:** a document request with no matching attachment or uploaded document meeting the qualifier (e.g. *signed*) → *Not found in connected sources*.

### Ordering and views
- **Needs attention** = open items that are urgent: strong conflicts/changes within 14 days, my commitments due within 2 days or overdue, any request, overdue Waiting items. Sensitive mode also includes undated commitments and bulk deadlines.
- **Order** (D-013): tier 0 strong conflicts & changes → tier 1 possible conflicts, my commitments, requests → tier 2 others' commitments; time order within a tier.
- **Views:** Conflicts, Changes, Commitments (incl. requests, D-015), Waiting, Resolved (resolved + dismissed). Snoozed items stay in their type view, dimmed.

## 6. AI architecture

```ts
interface AIProvider {
  readonly name: string;
  complete<T>(req: AIRequest<T>): Promise<AIResult<T>>;
}
```

- `AIRequest` carries `task`, `promptVersion`, trusted `instructions`, **untrusted** `data[]`, and a Zod `schema`.
- `buildMessages()` puts instructions in the system role and every source inside `<untrusted_source>` blocks with closing-tag escaping. The instructions tell the model the data may contain instructions and must be ignored.
- Output is JSON → Zod-validated → rejected on any extra field (strict schemas). Actions are not representable in any schema.
- `withReliability()` wraps any provider: timeout, bounded retries on transient errors, structured log (`task`, `promptVersion`, `provider`, `latencyMs`, token counts, `ok`) — never content.
- Adapters: `MockProvider` (tests/demo), `AnthropicProvider`, `OpenAIProvider` (fetch-based, model from env, server-side only).
- **Where AI is allowed:** ambiguous commitment extraction; rephrasing explanations. **Where it isn't:** dates, times, comparisons, status, lifecycle, linking by identifiers — all deterministic.
- Explanation guard: `validateGrounded(text, evidence)` rejects AI text containing any date, time, number or capitalised name not present in the evidence.

## 7. Connected mode (designed, not built)

```text
Browser ──► API (Supabase Edge Function) ──► Gmail / Calendar (read-only scopes)
                 │  tokens encrypted at rest (pgsodium/Vault), never sent to browser
                 ├─► core pipeline (same package) ──► Postgres (RLS by user_id)
                 └─► AIProvider (server-side key, rate-limited)
```

Nothing in this build calls Google APIs, and the UI never implies it does.

## 8. Observability

`packages/core/src/obs/log.ts` emits structured events: `ingest.failed`, `extract.invalid`, `ai.call`, `ai.failed`, `situation.generated`, `feedback.false_positive`, `situation.resolved`. Payloads: ids, enums, counts, durations. A test asserts no source text reaches the log.

## 9. Repository layout

```text
apps/web/            React + Vite + Tailwind UI
packages/core/       Domain, pipeline, AI adapters, demo data (framework-free)
supabase/            Postgres schema for connected mode (not deployed)
tests/e2e/           Playwright demo-journey + accessibility + screenshots
docs/                Research, product, design, architecture, security, testing, experiments, portfolio
scripts/             Build helpers
```
