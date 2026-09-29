# UX design

## Design goal
A first-time visitor understands in 10 seconds: *"Nexus found a few things across my email, calendar and documents that disagree, changed, or are still open — and it shows me the proof."*

## The one idea the visual design is built on
**Nexus's voice and the sources' voice look different.**
- Everything Nexus says (titles, explanations, next steps) is set in a sans-serif (Instrument Sans).
- Everything a *source* said (email lines, calendar fields, document text) is set in a serif (Source Serif 4), inside an evidence slip, with the decisive words marked like a highlighter.

This makes Principle 1 (source vs. inference) visible without a legend. It's also the one bold element; the rest of the UI stays quiet.

## Tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | #F4F6F9 | #12151B | App background |
| `--surface` | #FFFFFF | #1A1E26 | Panels, slips |
| `--ink` | #1A1F2B | #E7EAF0 | Primary text |
| `--ink-muted` | #5B6475 | #9AA3B2 | Secondary text |
| `--rule` | #DDE1E8 | #2C323D | Borders |
| `--action` | #3346A8 | #93A4F0 | Buttons, focus, links |
| `--mark` | #FFE58A | #6B5A12 | Highlighted source span |
| Type colours | conflict #9A5800 · change #1F5FA8 · commitment #2F6B4F · missing #6B4FA0 (each with a pale tint) | lighter variants | Left stripe + icon only |

Type scale (1.2): 12.5 / 14 / 15 (body) / 18 / 22 / 26. Line length ≤ 72ch in the detail pane.

## Layout

```text
Desktop (≥1024px)
┌ Nexus   [Demo mode — fictional data]                  Inbox  Sources  Activity  How it works ┐
├──────────────┬──────────────────────────────┬──────────────────────────────────────────────────┤
│ Needs        │ ▌Interview date conflict      │ Interview date conflict                           │
│ attention  5 │  Sources disagree · in 4 days │ [Sources disagree]                                │
│ Conflicts  2 │ ▌Flight 6E 2134 moved         │ WHAT   plain statement                            │
│ Changes    1 │  Strong evidence · 8 Oct      │ WHY    why it matters now                         │
│ Commitments 1│ ▌Revised proposal due today   │ EVIDENCE  ┌slip┐ ┌slip┐ ┌slip┐  (serif, marked)   │
│ Waiting    1 │  …                            │ NEXT STEP                                         │
│ Resolved   1 │                               │ [Choose correct version] [Snooze] [Dismiss]       │
│ ───────────  │                               │                                                   │
│ Sensitivity  │                               │                                                   │
└──────────────┴──────────────────────────────┴──────────────────────────────────────────────────┘

Mobile (<768px): view chips (horizontal scroll) → list → tap → full-screen detail with Back.
```

## Card anatomy (PRD FR-18)
| Block | Content rule |
|---|---|
| Title | ≤ 6 words, names the subject ("Interview date conflict") |
| Status badge | One of five statuses (PRD §8) in words, never % |
| What | Facts only, each attributed ("Your calendar shows…", "The recruiter's email says…") |
| Why | One or two sentences on consequence + timing |
| Evidence | One slip per source: source type, sender/system, time received, excerpt with marked span, *Explicit* / *Inferred* tag |
| Next step | One suggested action the user performs; Nexus never does it |
| Controls | Resolve (with choice for conflicts) · Snooze · Dismiss (reason) · Reopen (in Resolved) |

## Copy rules
- Say what Nexus did: "Found in", "Not found in your connected sources", "Nexus matched these by name only".
- Never "You must". Prefer "may", "check", "confirm" when status < Strong evidence.
- Buttons name their result: "Mark as resolved" → toast "Marked as resolved".
- Empty states direct: "Nothing needs your attention. Nexus checked 17 items across 3 sources."

## Interaction
- Keyboard: `j`/`k` move through the list, `Enter` opens, `Esc` closes dialogs, all controls reachable by Tab with a visible focus ring.
- Motion: none on load. Only responsive motion (dialog open, resolved item leaving the list), and it's disabled under `prefers-reduced-motion`.

## States covered
Loading (demo dataset import), empty per view, all-sources-disabled, pipeline error (safe message + retry), flagged source, resolved-by-Nexus (with reason + reopen).

## What I cut (and why)
- Dashboard charts/counts hero — not the job; the inbox *is* the summary.
- Chat box — non-goal.
- Avatars / AI persona — trust comes from evidence.
- Per-card shadows and a card grid — list rows with a type stripe scan faster.
