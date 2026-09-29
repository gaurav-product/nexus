# Product thesis

## Thesis (falsifiable)

> **For personal information spread across email, calendar and documents, a small set of persistent, evidence-backed *situations* — conflicts, changes, commitments and unconfirmed requests — is more useful and more trusted than a daily narrative briefing or an autonomous agent.**

## Central hypothesis (from the brief)

> Users have fragmented digital information, but the larger problem is not retrieval; it is recognising meaningful changes, conflicts and unresolved situations across sources.

## What changed after research
The original framing positioned Nexus as a new category. Research ([whitespace map](../research/whitespace-map.md)) showed:
- proactive Gmail/Calendar briefings exist (Google CC, Pulse, Copilot, Poke);
- temporal change tracking with provenance exists as infrastructure (Zep).

So the thesis is now about the **interaction model** (state vs. narrative; human-decides vs. AI-acts; visible uncertainty), not about being first. See decision D-002.

## Sub-hypotheses and how each could fail

| # | Sub-hypothesis | Falsified if… | Test |
|---|---|---|---|
| H1 | Situations are frequent enough to matter | Diary median < 1 meaningful situation / person / 2 weeks | Diary study (A1) |
| H2 | Persistence matters: unresolved items need to stay visible | Users resolve everything same-day; ephemeral briefing performs equally | Concept test vs. briefing mock |
| H3 | Evidence + uncertainty raises trust | No difference in stated/observed trust vs. clean summary | Concept test (A5) |
| H4 | Conservative beats sensitive | Variant A (sensitive) has equal/higher resolution rate *and* no higher dismissal | Experiment E1 |
| H5 | Users prefer deciding to auto-fix for info conflicts | Majority choose "just fix it" when shown both | Concept test (A4) |

## Kill / pivot conditions
- **Kill:** H1 fails for all segments.
- **Pivot to coordinator (B2B) wedge:** H1 fails for consumers but holds for recruiting coordinators (persona P3).
- **Pivot to feature, not product:** H2 fails — the value is real but belongs inside a briefing or email client.

## Validation status
**Not yet validated.** No users, interviews or experiments have been run. The MVP is a demonstration of the interaction model with fictional data.
