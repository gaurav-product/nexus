# Evidence rubric

How much weight a piece of evidence gets. Used when coding interviews, diary entries and concept sessions, and when scoring the [hypothesis scorecard](hypothesis-scorecard.md).

## Evidence levels

| Level | Name | Example | Counts toward |
|---|---|---|---|
| **E0** | Opinion / hypothetical | "I'd definitely use that." "That would be helpful." | Nothing. Recorded, never counted as support. |
| **E1** | General claim about the past | "This happens to me all the time." (no example) | Context only |
| **E2** | Specific recalled incident | "Last Tuesday the recruiter's email said 3 pm, my calendar said 4 pm; I noticed an hour before." Has when, which sources, what happened | Frequency (H1), cost (H2), discovery (H3) |
| **E3** | Incident with artefact or workaround shown | Shows the spreadsheet they keep of promises; shows a flagged-email folder they built for this | Frequency, cost, and **caring** (they already spend effort) |
| **E4** | Logged at the time or costly action | Diary entry made the same day; agrees to a real pilot with their own account; spends their own time or money on a workaround | Everything, including H6/H7 behavioural claims |

**Rules**
1. Positive reactions to the demo are E0 unless tied to behaviour ("I'd have caught the Acme thing last month" with specifics = E2).
2. A participant counts once per hypothesis, however enthusiastic.
3. Evidence *against* is coded with the same levels and weighed equally. An E2 story of "my calendar was wrong once in a year and it didn't matter" is strong evidence against frequency.
4. The facilitator codes; a second person (friend/peer PM) blind-codes 3 transcripts to check agreement. If levels disagree on > 1 in 4 incidents, re-code with the disagreements discussed.

## What makes a situation "qualifying"

A logged or recalled event counts toward H1 only if **all** hold:
- It's one of the four types (conflict, change, commitment, missing information).
- Importance ≥ 3 on the participant's 1–5 scale, or a non-trivial consequence occurred.
- It could in principle be detected from sources a user could connect (not purely in someone's head).

Also record whether it's **in MVP scope** (email, calendar, uploaded documents only). A problem that's real but lives in WhatsApp is evidence for the problem and *against* the current MVP scope.

## Concept-session answers

| Answer type | Level |
|---|---|
| Correct next action stated unprompted after viewing an option | E4-equivalent for comprehension (observed behaviour in session) |
| Chose an option as "clearest" | E1 |
| 1–5 ratings | E0–E1 — directional only |
| "I'd connect my email" | E0 |
| Agrees to a follow-up pilot using their own account (even if we can't run it yet) and gives a real contact | E3 |
| Unprompted story linking a scenario to their own past incident | E2 |
