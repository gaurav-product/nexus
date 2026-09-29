# Final self-review

Scored 1–5 against the brief's criteria. 3 = competent, 5 = would survive a hard review. Scores are mine, not users'.

| Area | Score | Evidence | Weakness → action |
|---|---|---|---|
| **Product clarity** | 4 | Home screen headline says what Nexus did and how many items need attention; every card follows What / Why / Evidence / Next step | "Request" (missing info) lives under *Commitments* — a reasonable fit but a naming compromise (D-015). |
| **User value** | 2 | Demo scenarios are plausible | **Not validated.** No user has seen it. Frequency of these situations (A1) is the thesis's biggest unknown. → Research plan written; can't be fixed in code. |
| **Differentiation** | 3 | Clear interaction-model difference vs. briefings/agents (whitespace map) | Platforms (Google CC, Copilot) could add reconciliation cheaply. Differentiation is a design position, not a moat. Documented. |
| **UX** | 4 | Source-vs-Nexus typography, side-by-side versions, before/after table, keyboard nav, dark mode, 360 px mobile, zero serious axe issues | No manual screen-reader pass; no usability test. "Snooze" and "Dismiss" menus open upward on mobile which could be unexpected. |
| **Technical quality** | 4 | Pure, framework-free engine; 95 core + 14 UI + 6 e2e tests; strict TypeScript; schema applied to real Postgres | Rule-based extraction is brittle outside the demo's phrasing. Thread linking can merge unrelated subjects. IST-only time handling. |
| **AI reliability** | 3 | Deterministic core; AI optional, schema-strict, grounded, retried, logged; tested with mock and adversarial outputs | Never run against a live model; no eval set; prompt versions exist but no prompt regression suite. |
| **Security** | 3 | Injection model with 7 layers and tests; no action paths; secrets scanner; RLS schema; append-only audit | No auth or server in demo; rate limiting designed not built; OAuth token handling is design-only. |
| **Privacy** | 4 | Read-only by design; per-item permission; export + delete; content-free analytics with a redaction test; minimal-retention schema | Demo uses localStorage; retention and deletion in connected mode are unimplemented. |
| **Performance** | 5 | Pipeline median 2 ms / p95 4.5 ms on the demo set | Scale untested beyond 20 sources — a real mailbox is 10,000×. |
| **Testing** | 4 | Scenario, edge-case, lifecycle, adversarial, UI, e2e, accessibility; tests found 3 real bugs | No labelled eval set → no precision/recall numbers. |
| **Documentation** | 4 | Research with sources, thesis challenge, PRD, metrics, experiments, 15 decisions, threat models, testing | Some docs are long for a recruiter; the case study is the entry point. |
| **Portfolio value** | 4 | Shows research that challenged its own premise, falsifiable thesis, trade-offs, and a working, tested build | The absence of real users is the gap a hiring manager will press on. Stated plainly everywhere. |

## Weaknesses fixed during review
- Subject-id instability (D-014), contrast failure, focus ring, ordering (D-013), NDA highlight, pronoun re-voicing, scroll restoration, dialog wording.

## Weaknesses documented, not fixed
1. **No validation with users** — the single most important next step, and not something code can do.
2. **Extraction recall on real mail** — rules match the demo's phrasing. The AI extraction path exists for this and is guarded, but unmeasured.
3. **Thread over-linking** — a thread discussing two meetings becomes one subject. Mitigation idea: link by thread only when no other strong key disagrees.
4. **Single time zone.**
5. **Connected mode is architecture on paper** (plus an applied schema), not a running system.

## Would I ship this to users?
To 5–10 research participants as a clickable concept with fictional data: yes, that's what it's for. With their real inboxes: no — not before an eval set on consented real data shows precision ≥ 90% in Conservative mode.
