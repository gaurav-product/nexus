# Nexus

**A situation inbox for your email, calendar and documents.** Nexus finds where your sources *disagree*, what *changed*, and what's still *open* — then shows you the exact source text, says how sure it is, and lets you decide. It never acts on your behalf.

> **Status:** working MVP in **demo mode** with fictional data. No real accounts are connected, no AI model is called, and nothing has been validated with real users yet.

![Nexus Situation Inbox](docs/assets/screenshots/01-inbox.png)

## What it is (and isn't)

Nexus is **not** a chatbot, a second brain, a task manager or an autonomous agent. Its unit is a **situation**:

| Type | Example from the demo |
|---|---|
| **Conflict** | Calendar says the Acme interview is Tue 6 Oct; the recruiter's email and the invitation PDF say Mon 5 Oct. Nexus shows both and doesn't pick. |
| **Change** | The airline moved flight KS 2134 from 08:15 to 10:30. The calendar still shows the old time, and a workshop now starts 20 minutes after landing. |
| **Commitment** | "I'll send the revised proposal by Thursday" — due today, no evidence it was sent. |
| **Waiting** | The recruiter promised panel names by Wednesday. Overdue. |
| **Request (missing info)** | "Please send the signed NDA." Nexus found only an unsigned copy — *not found* in connected sources, never "missing". |

Every item shows **What / Why / Evidence / Status / Next step**, with one of five rule-based statuses: *Confirmed, Strong evidence, Sources disagree, Possible, Needs your confirmation*. No confidence percentages.

## The product thesis

> For personal information spread across sources, a small set of persistent, evidence-backed situations is more useful and more trusted than a daily narrative briefing or an autonomous agent.

Research on 20 products showed proactive Gmail/Calendar briefings already exist (Google CC, ChatGPT Pulse, Copilot) and that change-tracking is solved infrastructure (Zep). So the thesis is about the **interaction model**, not about being first. It's falsifiable, and the falsification conditions are written down. → [Case study](docs/portfolio/case-study.md)

## Try it

```bash
npm install
npm run dev          # http://localhost:5173
```

**Two-minute demo path:** the inbox opens on the interview conflict → click **Why am I seeing this?** → **Choose the correct version** → open the **flight change** (before/after, stale calendar, affected workshop) → open **Revised proposal** → **Open full email** → back → **Mark as resolved**. Then flip **How much to show** to *Sensitive* to see experiment E1, and visit **Sources** to see the prompt-injection email flagged and treated as data.

## Validation (current phase)

Product work is frozen until there's evidence (D-016). The research kit is in [`docs/research/`](docs/research/validation-plan.md): interview guide, 7-day diary, pre-registered [hypothesis scorecard](docs/research/hypothesis-scorecard.md), and a blind **Research session** in the app (`/research`) that compares the current workflow, an AI briefing and Nexus on the same facts. **No participant data has been collected yet.**

## Architecture

```text
apps/web        React + TypeScript + Tailwind UI (HashRouter, static)
packages/core   Pure TS engine: extraction → validation (Zod) → linking → detection → policy
                AI provider interface (Anthropic | OpenAI | Mock) with strict schemas + grounding check
supabase/       Postgres schema with row-level security (applied to a test DB; not deployed)
tests/e2e       Playwright demo journey + axe accessibility audits
docs/           Research, product, design, architecture, security, testing, experiments, portfolio
```

Deterministic rules handle dates, comparisons, linking, status and lifecycle. AI is optional and fenced: it can't take actions, its output is schema-validated, and any sentence introducing a fact not in the evidence is rejected. → [Architecture](docs/architecture/architecture.md)

## Environment variables

None are needed for the demo. See [`.env.example`](.env.example) for the optional server-side AI settings (`NEXUS_AI_PROVIDER`, `NEXUS_AI_MODEL`, provider key) and the designed-but-unbuilt connected mode.

## Development & testing

```bash
npm test                     # 95 engine + 21 UI tests
npm run build && npm run test:e2e   # demo journey + accessibility (desktop, dark, mobile)
npm run typecheck
npm run check:secrets
npm run build:single         # one self-contained HTML file for hosting anywhere
```

Results and gaps: [docs/testing/testing.md](docs/testing/testing.md) · [self-review](docs/testing/self-review.md)

## Privacy

Read-only by design, with no send/forward/delete code path. Per-item source permissions; export and delete-all; product analytics carry ids and enums only (a test proves no email text reaches the logs). Demo data stays in your browser. → [Threat model](docs/security/threat-model.md) · [Prompt-injection model](docs/security/prompt-injection-model.md)

## Limitations

- Fictional data only; rule-based extraction is tuned to the demo's phrasing and **unmeasured on real mail**.
- No connected mode (Gmail/Calendar OAuth, server, auth) — designed and schema'd, not built.
- One time zone (IST). No recurring or all-day events.
- Thread-based linking can merge unrelated subjects in the same thread.
- **No user research has been conducted yet.**

## Roadmap (evidence-gated)

1. Interviews + 10-day diary study → does this happen often enough? ([plan](docs/research/research-plan.md))
2. Labelled eval set on consented data → precision/recall per rule
3. Read-only Gmail/Calendar connector for one test account
4. AI extraction for free-form commitments, gated on the eval set

## Documentation map

| | |
|---|---|
| Validation | [plan](docs/research/validation-plan.md) · [scorecard](docs/research/hypothesis-scorecard.md) · [evidence rubric](docs/research/evidence-rubric.md) · [interview guide v2](docs/research/interview-guide.md) · [diary study](docs/research/diary-study.md) · [log](docs/research/validation-log.md) · [recruitment](docs/research/participant-recruitment.md) · [consent](docs/research/consent-template.md) · [session](docs/research/session-template.md) · [observation](docs/research/observation-template.md) · [CSV schema](docs/research/schema/README.md) |
| Research | [competitive analysis](docs/research/competitive-analysis.md) · [matrix](docs/research/competitive-matrix.md) · [whitespace & thesis challenge](docs/research/whitespace-map.md) · [research plan](docs/research/research-plan.md) · [interview guide](docs/research/user-interview-guide.md) |
| Product | [problem](docs/product/problem-statement.md) · [personas](docs/product/personas.md) · [JTBD](docs/product/jobs-to-be-done.md) · [OST](docs/product/opportunity-solution-tree.md) · [value prop](docs/product/value-proposition.md) · [thesis](docs/product/product-thesis.md) · [non-goals](docs/product/non-goals.md) · [PRD](docs/product/prd.md) · [metrics](docs/product/metrics.md) · [decision log](docs/product/decision-log.md) |
| Design & build | [UX](docs/design/ux-design.md) · [architecture](docs/architecture/architecture.md) · [experiments](docs/experiments/experiment-framework.md) · [testing](docs/testing/testing.md) |
| Portfolio | [case study](docs/portfolio/case-study.md) · [changelog](CHANGELOG.md) |

---

Built by Gaurav Kumar Singh. All people, companies, bookings and domains in the demo are fictional (`.example` domains).
