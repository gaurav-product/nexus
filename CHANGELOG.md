# Changelog

## 0.2.0 — 29 Sept 2026 · Phase 16: validation readiness (no product features)

- Validation package: plan, interview guide v2 (past behaviour only), 7-day diary study, evidence rubric (E0–E4), hypothesis scorecard with pre-registered thresholds and kill conditions, validation log. **No participant data collected.**
- Research ops: recruitment screener and outreach, consent template, session script, observation sheet, CSV schema (headers only).
- Research session mode (`/research`): four scenarios, first-exposure comprehension measure, blind counterbalanced comparison of current workflow vs. AI briefing vs. Nexus, CSV export. Data stays in the browser.
- Tests: briefing-fairness check, counterbalancing coverage, CSV/schema lock, formula-injection escaping, full blind session flow, accessibility on research screens.
- Case study gains a Validation Status section (Proven / Observed / Hypothesized / Unknown). Decisions D-016, D-017.

## 0.1.0 — 29 Sept 2026

### Research & strategy
- Competitive analysis of 20 products with sources; capability and commercial matrices.
- Thesis challenge: reframed from "new category" to a falsifiable interaction-model thesis (D-002); weighted commitments and changes equally with conflicts (D-003).
- Research plan, interview guide, assumption map with kill criteria. **No interviews run.**
- Problem statement, personas (hypotheses), JTBD, opportunity-solution tree, value proposition, non-goals, PRD, metrics, experiment framework (E1 designed, not run).

### Engine (`packages/core`)
- Deterministic extraction: event times, commitments, deadlines, document requests and presence, subject keys.
- Zod validation boundary; strong/weak linking via union-find; conflict, change (with stale copies and downstream impact), commitment (with reversible fulfilment) and missing-information detection.
- Rule-based statuses, sensitivity policy (E1), lifecycle with reopen-on-new-evidence.
- AI provider interface with Anthropic/OpenAI/Mock transports, prompt isolation, strict schemas, grounding check, retries/timeouts, content-free logging.
- Prompt-injection flagging.

### App (`apps/web`)
- Situation Inbox with six views, evidence slips, side-by-side conflict versions, before/after change table, resolve dialog, snooze/dismiss/reopen, useful/not-useful feedback.
- Sources page with per-item permissions, full source view, injection flag, export and delete-all. Activity page with decision log and analytics events. How-it-works page. Dark mode. Mobile layout.

### Fixed during build
- D-008 amended: same sender without change language is a conflict, not a change.
- D-013: tiered ordering, found in visual review.
- D-014: stable subject ids, found by a lifecycle test.
- Weak "Call with …" link regex, pronoun re-voicing, NDA highlight line, WCAG contrast on faint text, focus ring, scroll restoration.

### Infrastructure
- Postgres schema with RLS (applied to a test database, not deployed), secrets scanner, single-file build, Playwright e2e with axe.
