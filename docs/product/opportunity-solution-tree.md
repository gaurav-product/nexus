# Opportunity solution tree

**Desired outcome:** Increase *Resolved Important Situations* per active user per week (North Star — see [metrics](metrics.md)) while keeping false positives low.

```text
OUTCOME: Users resolve the situations that matter before they cause harm
│
├── O1. I don't notice when my sources disagree
│     ├── S1.1 Deterministic cross-source conflict detection on strongly-linked items   ← MVP
│     ├── S1.2 Weak-link "possible conflict" with ask-to-confirm                          ← MVP
│     └── S1.3 Inline badge inside Gmail/Calendar                                         (later; needs extension)
│
├── O2. I act on outdated information after something changed
│     ├── S2.1 Same-source change detection with before/after                            ← MVP
│     ├── S2.2 Downstream impact ("1 calendar event may be affected")                    ← MVP (deterministic only)
│     └── S2.3 Auto-update calendar                                                       (rejected: acts without consent)
│
├── O3. Promises in email fall through
│     ├── S3.1 Extract my commitments with due dates                                      ← MVP
│     ├── S3.2 Track others' commitments to me ("Waiting")                               ← MVP
│     ├── S3.3 Detect likely fulfilment from later evidence, reversible                   ← MVP
│     └── S3.4 Draft the follow-up email                                                  (later; user sends)
│
├── O4. I can't tell if a requested document was ever provided
│     ├── S4.1 Request extraction + search connected sources                              ← MVP
│     └── S4.2 "Not found" ≠ "missing" language                                          ← MVP
│
└── O5. I don't trust AI that reads my stuff
      ├── S5.1 Evidence with source excerpts on every card                                ← MVP
      ├── S5.2 Visible uncertainty level                                                  ← MVP
      ├── S5.3 Conservative default sensitivity                                           ← MVP (tested in E1)
      ├── S5.4 Source-level permissions & disconnect                                      ← MVP (demo)
      └── S5.5 Prompt-injection flagging on sources                                       ← MVP
```

**Assumption tests attached:** O1–O4 depend on A1–A3 (frequency); O5 on A4–A6 (trust). See [assumption map](../research/research-plan.md#assumption-map).
