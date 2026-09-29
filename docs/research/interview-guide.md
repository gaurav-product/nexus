# Interview guide (v2, Phase 16)

Revises the original [user-interview-guide.md](user-interview-guide.md), which is kept for history. Changes: tighter (40 min), every question anchored to a *specific past incident*, the four situation types asked separately, and **no Nexus concept shown** in this session (that happens later, in the concept session, so it can't contaminate what people recall).

## Rules for the interviewer

- Ask about **the last time**, not "usually". Follow "the last time" with *when was that?*
- Never ask "would you use…", "would it help if…", or "how much would you pay…". Those produce opinions (rubric level E0).
- Don't name conflicts/changes/commitments as categories until the participant has described one in their own words.
- Silence is fine. Count to five before rescuing.
- When they say "this happens all the time", ask for the most recent example. No example → code as E1, not E2.
- Record verbatim phrases in the notes; don't paraphrase into product language.

## 0. Open (3 min)
- Consent confirmed, recording confirmed or declined.
- "I'm trying to understand how people keep track of plans and promises across email, calendar and documents. There are no right answers, and I'm not selling anything today."

## 1. Context (5 min)
1. Walk me through yesterday: where did information about your plans arrive? *(email accounts, calendar, WhatsApp, Slack, documents, recruiter portals)*
2. Who else puts things on your calendar or changes them?
3. Roughly how many emails a week need a real reply from you? *(anchor: last week)*

## 2. Disagreement between sources (8 min)
4. Tell me about the last time information in two places didn't match — a date, time, place, amount, anything.
   - When was that? What were the two places?
   - How did you notice? *(by accident / checked on purpose / someone told you / found out too late)*
   - What did you do? How long did it take to sort out?
   - What happened because of it? *(nothing / wasted time / late / missed / embarrassed / cost money)*
5. What do you do when an email and your calendar disagree? *(ask for their actual last example)*

## 3. Changes (6 min)
6. Tell me about the last important change you almost missed or did miss — a flight, meeting, deadline, venue.
   - How did you find out? Was anything else affected by the change?
   - Did you have to update something else yourself? Did you?

## 4. Commitments — both directions (8 min)
7. Think of the last thing **you promised** someone over email or chat. Did it happen on time? How did you remember?
8. When was the last time **someone promised you** something and it didn't arrive? How long before you noticed? What did you do?
9. Where, if anywhere, do you keep track of these promises today? *(ask to see it if they're comfortable — screen share of a to-do list, not their inbox)*

## 5. Missing or unresolved information (5 min)
10. The last time someone asked you for a document or detail — how did you know whether you'd already sent it?
11. The last time you were waiting on something you couldn't find — what did you do?

## 6. Current tools and alerts (4 min)
12. What tools help you catch these things today? *(flags, reminders, to-do apps, TripIt, an assistant, an AI briefing)*
13. If they use an AI briefing (Gemini, Google CC, ChatGPT Pulse, Copilot): what did it last catch? What did it last miss or get wrong?
14. Think of an alert or notification you found genuinely useful recently — what made it useful? And one you found annoying?
15. If a tool told you "your interview may be on the 5th, not the 6th", what would you need to see before believing it?

## 7. Permissions (2 min)
16. Have you ever connected your email to an app? Which one, and what made you decide yes or no?
17. Have you ever disconnected one? Why?

## 8. Close (2 min)
- "Is there anything about keeping track of plans and promises we didn't cover?"
- Ask if they'd do the 7-day diary (explain it takes ~1 minute per entry). Record yes/no — **a yes here is itself weak behavioural evidence** of caring about the problem.

## What to code afterwards (see [evidence-rubric.md](evidence-rubric.md))
For each incident: type (conflict / change / commitment-mine / commitment-theirs / missing), recency, sources involved, discovery method, time to resolve, consequence severity, current workaround, evidence level (E0–E4). Enter rows in `schema/incidents.csv`.
