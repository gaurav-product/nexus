# Non-goals

Things Nexus will not do in the MVP, and why. A non-goal can be revisited only with evidence.

| Non-goal | Why not |
|---|---|
| Chat interface as the home screen | Thesis is "show me what matters," not "ask me anything." Chat competes head-on with Gemini/ChatGPT on their strength. |
| Autonomous actions (send, reschedule, archive, reply) | Principle 4. Info conflicts can't be auto-resolved safely — Nexus doesn't know which source is right. |
| Sources beyond Gmail, Google Calendar, uploaded docs | Smallest surface that proves the loop. WhatsApp/Slack/banking/health add risk without new proof. |
| "Remember everything" / general search | That's a memory product; crowded (Mem, Supermemory, Gemini). |
| Task manager | Commitments are *detected*, not *authored*. No manual task entry. |
| AI personality, avatar, name-calling, emoji chatter | Trust comes from evidence, not warmth. |
| Confidence percentages | Not calibrated; would manufacture precision. Using discrete, defined statuses instead. |
| Mobile app, browser extension | Responsive web is enough to test the model. |
| Team/shared inboxes | Recruiter-coordinator wedge is a pivot option, not MVP. |
| Real Gmail OAuth in this build | Restricted scopes need a security assessment; the demo uses a labelled demo adapter behind the same interface. |
| Graph database | Relational tables + a relationships table meet MVP needs (D-005). |
| Fine-tuned models | No data; not needed to prove the loop. |
