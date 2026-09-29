# Diary study — 7 days

**Status: designed. Not yet run. No entries collected.**

Interviews tell us what people *remember*. The diary tells us what actually *happens*, which is the thesis's biggest unknown (A1 / H1).

## Participants
6–8 people from the interview pool who agreed to take part. Mix of priority-1 segments at minimum.

## What participants log

Any time one of these happens during the 7 days, log it within the day:

| Type | Plain-language prompt given to participants |
|---|---|
| **Conflict** | Two places said different things about the same thing (a time, date, place, amount…) |
| **Change** | Something you'd planned around changed — rescheduled, moved, cancelled, updated |
| **Commitment** | You promised someone something, or someone promised you something |
| **Missing information** | Something you expected — a document, a reply, a detail — couldn't be found or is still unresolved |

Participants log even small ones. We filter by importance later, not them.

## Entry fields (one per event)

| Field | Format | Why |
|---|---|---|
| Date | YYYY-MM-DD | Frequency |
| Situation | Short description in their words | Coding |
| Type | conflict / change / commitment_mine / commitment_theirs / missing | Frequency by type |
| Sources involved | e.g. "work email + Google Calendar", "WhatsApp + PDF" | Tests the cross-source claim; and whether MVP sources (email, calendar, docs) even cover it |
| How discovered | by chance / checked on purpose / someone told me / reminder or tool / found out too late | H3 — would proactive detection have come earlier? |
| Time spent resolving | minutes (estimate) | H2 — cost |
| Consequence | none / small inconvenience / wasted time / late or missed / embarrassment / money | H2 — severity |
| Existing workaround | What they used, if anything | Alternatives |
| Importance | 1 (trivial) – 5 (would have been bad to miss) | Filter |
| Would proactive detection have helped? | no / maybe / yes, and why (free text) | **Weakest field** — it's hypothetical; used only as a tie-breaker |

CSV header: [`schema/diary_entries.csv`](schema/diary_entries.csv).

## Collection method (low friction)
A short form (Google Form or similar) with the fields above, or a WhatsApp message to the researcher in a fixed format, transcribed daily. A 20-second daily nudge at a time the participant chooses. **Participants never forward the actual email or screenshot it** — they describe it.

## Day 0 briefing script (5 min, call or message)
> "For the next 7 days, whenever two places disagree, something you planned changes, someone promises something, or something you expected is missing — log it. Small things count. It takes about a minute. There's no right number; zero is a useful answer."

"Zero is a useful answer" matters: it reduces pressure to invent entries.

## Day 7 debrief (10 min)
- Walk through their entries. Anything they didn't log but remember now? (Record separately as "recalled, not logged".)
- Was the week typical? Busier or quieter than usual?
- Did logging change their behaviour?

## Analysis
Per participant and overall:
- Count of entries by type; count with importance ≥ 3 ("qualifying").
- Share involving ≥ 2 sources.
- Share covered by MVP sources (email, calendar, uploaded files).
- Median time to resolve (qualifying entries).
- Share discovered late or by chance.
- Consequences distribution.

Feed into the [scorecard](hypothesis-scorecard.md) and [validation log](validation-log.md). Report medians and ranges, never percentages of a population — n is too small.

## Known limitations
- Seven days may be atypical (holidays, quiet week) — the debrief checks this.
- Logging raises awareness and may inflate counts early in the week. Compare days 1–3 with days 4–7.
- Self-selected participants (those who agreed to a diary) probably care more about the problem than average.
