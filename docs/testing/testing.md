# Testing

## How to run

```bash
npm test                      # core (95) + UI (14) unit/integration tests
npm run build && npm run test:e2e   # Playwright demo journey + axe accessibility (desktop, dark, mobile)
npm run typecheck
npm run check:secrets         # fails if anything key-shaped is in source or build output
```

In sandboxes without Playwright's own browser, set `PW_CHROMIUM_PATH` to an existing Chromium.

## What's covered (results as of 29 Sept 2026)

| Layer | File | Tests | What it proves |
|---|---|---|---|
| Dates & times | `packages/core/test/datetime.test.ts` | 14 | Relative dates resolve against the *sent* time; 12h/24h; flight numbers aren't times; UTC-stored events compare correctly with IST text |
| Extraction | `extract.test.ts` | 22 | Event times with spans, historical sentences skipped, departure/arrival in one sentence, commitments (mine vs theirs, undated, re-voiced "my"), deadlines inferred, requests, signed vs blank signature lines, strong vs weak keys, schema boundary |
| Detection | `detect.test.ts` | 30 | All six demo scenarios; control case stays silent; conflict vs change rules (D-008); past events ignored; unlinked sources never conflict; fulfilment needs delivery to the right person; "not found" wording; source permissions; failure isolation; extractor can't attach to another source; ordering (D-013); evidence highlight integrity; idempotency |
| Lifecycle | `lifecycle.test.ts` | 9 | Resolve with choice → Confirmed; "neither" isn't confirmation; dismiss/snooze/reopen; reopen on new evidence; latest decision wins; audit entries; views don't mutate engine output; **id stability regression** (D-014) |
| Security & AI | `security.test.ts` | 20 | Injection flagged in email/calendar/filename; injected text can't change statuses; prompt data isolation and tag-escape; compromised model output rejected; invalid JSON; retries, bounded retries, timeout; logs contain metadata but no content; provider selection needs explicit config; AI quotes must be verbatim; grounding rejects new times/dates/numbers/names; full-pipeline log has no source text |
| UI | `apps/web/test/app.test.tsx` | 14 | Loading → headline; demo label always shown; conflict detail; resolve flow + audit; dismiss-as-wrong logs a false-positive event; reopen; change table; Sensitive mode (E1); j/k keyboard; safe error + retry (no internal error text); empty state; source toggle recalculates; injection flag; delete-all with confirmation |
| Research mode | `apps/web/test/research.test.tsx` | 7 | Each scenario maps to one situation; **briefing states the same dates/times as Nexus** (fairness); counterbalancing covers every condition first on every scenario; CSV header locked to the schema file; quoting and formula-injection escaping; empty export fabricates nothing; full blind session run end to end |
| End-to-end | `tests/e2e/demo-journey.spec.ts` | 8 | The brief §32 journey in a real browser; missing-document evidence; uncertain match; axe on every page incl. dark mode; keyboard-only open; mobile list→detail→back with no horizontal scroll |
| Schema | `supabase/migrations/0001_init.sql` | manual | Applied to a throwaway Postgres 16 with `supabase/test-auth-stub.sql`: 9 tables, 13 policies, RLS enabled on all 9 |

**Performance (NFR-3):** pipeline on the 20-source demo set, 50 runs in Node: median 2.0 ms, p95 4.5 ms (target < 50 ms). First run in a cold browser tab measured ~38 ms.

## Bugs the tests found (and fixes)

| Found by | Bug | Fix |
|---|---|---|
| `lifecycle.test.ts` reopen test | Situation ids hashed from member sources; a new email in a thread changed the id and orphaned the user's decision | D-014: id from most stable strong key; regression test added |
| Scenario run | Case-sensitive "Call with" regex → weak link never formed | Case-insensitive keyword, capitalised name |
| Scenario run | "You'd share **my** portfolio deck" | Re-voice possessives |
| Scenario run | NDA evidence highlighted the wrong line | Prefer signature-line matches |
| axe (e2e) | `--ink-faint` at 2.9:1 contrast | Darkened to 4.8:1 (light) / 6.2:1 (dark) |
| Visual review | Time-only ordering put a "waiting" item above an interview conflict | D-013 tiered ordering |
| Visual review | Programmatic heading focus drew a heavy ring on load | No focus on first load; no ring for `tabindex=-1` |

## What is NOT tested (honest gaps)

- **Real email.** Every test uses fictional, hand-written data. Rule-based extraction on real, messy mail is **not yet validated** — recall on free-form commitments is expected to be much lower.
- **Detection precision/recall as metrics.** No labelled eval set exists; the tests prove specified behaviour, not accuracy in the wild.
- **Live AI providers.** Adapters are tested with a mock transport only; no live model call has been made.
- **Connected mode.** No OAuth, no server, no RLS behaviour under real users (only the schema was applied).
- **Time zones other than IST**, multi-day events, recurring events, all-day events.
- **Screen readers.** axe covers structure and contrast; no manual NVDA/VoiceOver pass yet.
