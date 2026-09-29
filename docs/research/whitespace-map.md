# Whitespace map & thesis challenge

## 1. Whitespace map

Two axes separate the market better than feature lists do:

- **Horizontal — what the product produces:** *Narrative* (a briefing or an answer you read once) ↔ *State* (tracked objects that persist until resolved).
- **Vertical — who decides:** *AI acts* ↔ *Human decides with evidence*.

```text
                         AI ACTS
                            ▲
       Poke • Lindy          │         Motion • Reclaim
       Copilot (agentic)     │         (scheduling state)
                            │
 NARRATIVE ◄────────────────┼────────────────► STATE
                            │
  Google CC • Pulse          │         TripIt (flights only)
  Gemini PI • Superhuman     │         Zep/Graphiti (infra, no UI)
  Mem • Granola              │
                            │         ★ Nexus: general-purpose,
                            ▼           evidence-first, resolvable
                     HUMAN DECIDES        situations
```

The bottom-right quadrant — **tracked state, human decides, general-purpose across sources** — is where I found the least occupancy. TripIt is there for one object type. Zep has the machinery but no end-user product.

### Specific whitespace claims (with confidence)

| # | Claim | Confidence | Why not higher |
|---|---|---|---|
| W1 | No reviewed consumer product treats a **cross-source factual contradiction** (email says 5th, calendar says 6th) as a first-class, persistent object. | Medium | Platform launch posts are vague; Google/Microsoft could do this internally without describing it. |
| W2 | No reviewed product shows **explicit uncertainty levels** on proactive insights. | Medium–high | Searched specifically; none of 20 sources mention it. |
| W3 | No reviewed product distinguishes **"not found in your connected sources"** from **"missing"**. | Medium | This is a subtle UX detail reviews wouldn't mention even if present. |
| W4 | Briefing products are **ephemeral** (Pulse cards expire; CC is a daily email). A commitment you made on Monday has no home on Thursday. | Medium–high | Stated by OpenAI for Pulse; inferred for CC from its format. |
| W5 | "Why am I seeing this?" with inspectable source excerpts is rare in proactive products. | Medium | Mem cites sources in chat answers — but that's reactive. |

## 2. Thesis challenge — trying to kill Nexus before building it

The brief says: if research disproves the thesis, stop. So I argued the case against as hard as I could.

### Attack 1 — "Google will ship this. Game over."
**Strongest attack.** Nexus's MVP sources (Gmail, Calendar, Drive) are Google's. CC already reads all three. Adding "these two disagree" to a briefing is a feature, not a company.
**Verdict:** *True for a standalone consumer business in the Google ecosystem.* It does not kill the thesis as a **product design argument** — the claim that a *state-based, evidence-first, conservative* surface beats a *narrative briefing* for this job. That claim is testable regardless of who ships it, and a platform could adopt it. For a portfolio case study, being right about the interaction model is the point. For a real company, the wedge would need to be something platforms are structurally bad at: provider-neutral (Google + Microsoft + uploaded docs together), or a vertical where cross-source contradiction is expensive (recruiting coordination, legal/ops, travel-heavy consultants).

### Attack 2 — "Change detection with provenance is already solved (Zep)."
**Verdict:** Correct, and fine. Nexus shouldn't claim technical novelty. The hard product problems Zep doesn't solve are: *which* changes deserve a human's attention, how confident to be when entities are loosely linked, and what "resolved" means. That's product work, not infrastructure.

### Attack 3 — "These situations are rare. It's a vitamin."
**Verdict: unresolved, and it's the biggest unknown.** I have no data on how often a normal person hits a real cross-source conflict per week. If it's once a month, a dedicated inbox is overkill and the right product is a single alert. **This is the #1 assumption to test** (see [research-plan.md](research-plan.md), assumption A1). Commitments and follow-ups are likely more frequent than conflicts — which suggests the demo should not rely on conflicts alone.

### Attack 4 — "Entity linking across sources is too unreliable to be trustworthy."
If Nexus can't tell that the recruiter's email and the calendar event are the same interview, it either misses real conflicts or invents fake ones.
**Verdict:** Real risk; mitigated by design, not eliminated. Nexus links on **strong identifiers first** (calendar invite UID, booking reference, flight number + date, thread ID) and treats weak links (similar title, same person) as *Possible* and asks. This makes uncertainty a product feature instead of hiding it. Precision on weak links is **not yet validated**.

### Attack 5 — "Gmail's restricted scopes make a third-party product expensive to launch."
Reading Gmail content requires restricted OAuth scopes, and Google requires a security assessment for restricted-scope apps (Shortwave's CASA Tier 2 mention is an example of this cost). **Verdict:** a real go-to-market cost; irrelevant for an MVP demo. Documented as a dependency in the PRD. The demo uses a clearly labelled demo adapter and never claims live Gmail access.

### Attack 6 — "Users want the AI to just fix it (Copilot reschedules for you)."
**Verdict:** Plausible for low-stakes, reversible actions. For information conflicts, auto-choosing is exactly the failure mode — Nexus can't know which source is right (the recruiter may have made the typo). Human-in-the-loop is a deliberate trade: slower, but correct. Whether users *prefer* it is testable (experiment E1).

## 3. Decision

**The thesis survives, with two modifications.**

1. **Reframe the claim.** Not "Nexus is a new category" but: *"For personal information that lives across sources, a small set of persistent, evidence-backed situations is more useful and more trusted than a daily narrative briefing."* That's falsifiable and doesn't depend on beating Google at distribution.
2. **Broaden the proof beyond conflicts.** Because conflict frequency is unknown (Attack 3), the MVP gives equal weight to commitments and changes, which are likely more frequent. If research shows conflicts are rare, the product still stands on the other three.

**What would make me stop:** if interviews (not yet run) show that (a) people rarely experience these situations, or (b) a daily briefing already solves it for them. Both are logged as falsification conditions in [../product/product-thesis.md](../product/product-thesis.md).

Recorded as decision D-002 in the [decision log](../product/decision-log.md).
