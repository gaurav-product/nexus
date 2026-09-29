# Decision log

Every material product/technical decision. Format per the brief. Dates are the day decided.

---

### D-001 · Build greenfield in a cloud workspace
- **Date:** 2026-09-29
- **Context:** Phase 0 audit found an empty workspace and no prior Nexus artefacts in past work.
- **Options:** (a) wait for an existing repo, (b) start fresh.
- **Chosen:** (b).
- **Why:** nothing to preserve; the brief asks for 0→1.
- **Trade-offs:** no prior decisions to inherit.
- **Evidence:** workspace listing; no Nexus files found.
- **Revisit condition:** an earlier Nexus codebase surfaces.

### D-002 · Reframe thesis from "new category" to "interaction model"
- **Date:** 2026-09-29
- **Context:** Research found proactive Gmail/Calendar briefings (Google CC, Pulse, Copilot, Poke) and solved temporal-change infra (Zep).
- **Options:** (a) stop, (b) continue with original "category" framing, (c) continue with a narrower falsifiable thesis.
- **Chosen:** (c) — "persistent, evidence-backed situations beat narrative briefings and autonomous agents for this job."
- **Why:** the reviewed products summarise, act or store; none found reconciles sources into resolvable, uncertainty-labelled objects. The narrower claim is testable without out-distributing Google.
- **Trade-offs:** weaker business story; honest about platform risk.
- **Evidence:** [competitive-analysis.md](../research/competitive-analysis.md), [whitespace-map.md](../research/whitespace-map.md).
- **Revisit condition:** a platform ships situation-style reconciliation, or research kills H1.

### D-003 · Weight commitments and changes equally with conflicts
- **Date:** 2026-09-29
- **Context:** Conflict frequency is the biggest unknown (A1).
- **Chosen:** MVP demo and inbox treat all four types as first-class; Needs attention ranks by urgency, not type.
- **Why:** if conflicts prove rare, the product still stands on the others.
- **Revisit condition:** diary data on frequency by type.

### D-004 · Discrete evidence statuses, no percentages
- **Date:** 2026-09-29
- **Options:** (a) model-reported confidence %, (b) calibrated probability, (c) discrete rule-based statuses.
- **Chosen:** (c) Confirmed / Strong evidence / Conflicting / Possible / Needs confirmation.
- **Why:** no calibration data exists; a % would manufacture precision (Principle 3). Rule-based statuses are explainable and testable.
- **Trade-offs:** coarser; can't rank within a status.
- **Revisit condition:** labelled eval set large enough to calibrate.

### D-005 · Relational model with a relationships table, not a graph DB
- **Date:** 2026-09-29
- **Context:** Brief asks for graph-like relationships; warns against unnecessary graph DB.
- **Chosen:** Postgres tables + `relationship(from_type, from_id, to_type, to_id, kind, strength)`; in demo, same shape in memory.
- **Why:** MVP queries are 1–2 hops (subject → observations → sources). No traversal workload justifies Neo4j.
- **Revisit condition:** queries need ≥3-hop traversal at scale.

### D-006 · Deterministic-first detection; AI optional and off in demo
- **Date:** 2026-09-29
- **Chosen:** rule-based extractors (dates, times, flight numbers, booking refs, UIDs, commitment phrases) and rule-based situation detection. AI adapters exist behind `AIProvider` for ambiguous extraction and explanation phrasing, but the demo uses none.
- **Why:** Principle 5; makes the demo reproducible and testable; removes key handling from a public demo.
- **Trade-offs:** rule-based commitment extraction has lower recall on free-form language. Documented as a limitation.
- **Revisit condition:** eval shows rule recall too low on real (consented) text.

### D-007 · Strong vs. weak links drive status
- **Date:** 2026-09-29
- **Chosen:** shared identifiers (calendar UID, booking ref, flight no. + date, thread) = strong; name/title similarity = weak. Weak-linked situations can never be above *Possible*.
- **Why:** entity resolution is the main false-positive source (whitespace Attack 4). Makes uncertainty structural.
- **Revisit condition:** eval data on weak-link precision.

### D-008 · Same authority + explicit change language ⇒ Change; otherwise ⇒ Conflict
- **Date:** 2026-09-29 (amended same day during build)
- **Context:** A newer email doesn't always override a calendar entry.
- **Chosen:** a later value from the same authority (sender domain) is a Change **only if** it uses explicit change language ("rescheduled", "now departs", "schedule change"). Any other disagreement — including the same sender saying two different things without a cue — is a Conflict, and Nexus never picks a winner.
- **Amendment:** the first version treated "same authority, newer" as a change. Writing the Acme scenario showed why that's wrong: the recruiter's "just confirming Monday 5th" contradicts her own invite for Tuesday 6th. That's exactly the ambiguity the user must see, not one Nexus should silently resolve.
- **Why:** the recruiter may have typo'd; the calendar may be stale. Only the user knows.
- **Revisit condition:** user research shows people want "newest wins" defaults.

### D-009 · "Not found in connected sources", never "missing"
- **Date:** 2026-09-29
- **Why:** Nexus only sees what's connected; absence of evidence ≠ evidence of absence. Principle 1.

### D-010 · Stack: Vite + React + TypeScript + Tailwind; npm workspaces; hand-built accessible components
- **Date:** 2026-09-29
- **Options:** Next.js + Supabase live; Vite static SPA + core package; shadcn/ui.
- **Chosen:** Vite SPA (`apps/web`) + pure TS engine (`packages/core`); Supabase schema written but not deployed; a small set of hand-built components instead of shadcn.
- **Why:** demo mode needs no server; static build can be hosted anywhere; engine is framework-free and fully unit-testable. The UI needs ~8 components — adding shadcn's generator + Radix tree wasn't justified. Components still follow ARIA patterns and are keyboard-tested.
- **Trade-offs:** no live backend demonstrated; connected mode is a design, not a running system.
- **Revisit condition:** first real connector.

### D-011 · Fixed "now" in demo mode
- **Date:** 2026-09-29
- **Chosen:** demo clock pinned to 1 Oct 2026, 09:00 IST.
- **Why:** relative dates ("tomorrow", "overdue") must render identically for every visitor and in tests.

### D-012 · Nexus resolves commitments from evidence, but labels them *Possible* and reversible
- **Date:** 2026-09-29
- **Context:** Principle 4 (no silent consequential action) vs. keeping the inbox clean.
- **Chosen:** when a later outgoing message matches a commitment, the situation moves to Resolved with reason "Appears fulfilled", status *Possible*, one-click Reopen, and an audit entry attributed to Nexus.
- **Why:** moving an item between lists is not a consequential external action; hiding the reason would be.
- **Revisit condition:** reopen rate on auto-resolved items > 10%.

### D-013 · Order by "what you don't know" before "what you forgot"
- **Date:** 2026-09-29
- **Context:** First build sorted Needs attention purely by time. An overdue item someone *else* owes the user outranked an interview date conflict four days out.
- **Options:** (a) pure time order, (b) type order, (c) tiers by who is likely unaware, then time.
- **Chosen:** (c). Tier 0: strong conflicts and changes (the user probably doesn't know). Tier 1: possible conflicts, the user's own commitments, requests (the user wrote or read them). Tier 2: things others owe the user. Time order within a tier.
- **Why:** the costliest failures are the ones nobody has noticed yet; the user already knows about their own promises.
- **Trade-offs:** an item due today can sit below one due in a week. Mitigated by showing the date on every row.
- **Evidence:** reasoning only. **Not yet validated.**
- **Revisit condition:** usability test shows people act on tier-1 items first regardless.

### D-014 · Subject ids from the most stable identifier, not from membership
- **Date:** 2026-09-29
- **Context:** Found by a failing test: ids were hashed from the list of member sources, so a new email arriving in a thread changed the situation id and silently orphaned the user's earlier decision.
- **Chosen:** subject id = hash of the highest-priority strong key (calendar UID → reference → flight → thread).
- **Why:** FR-16 (idempotent ids) and FR-24 (reopen on new evidence) both depend on ids surviving new evidence.
- **Revisit condition:** two unrelated subjects sharing a thread (a known limitation of thread linking).
