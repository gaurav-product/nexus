# Threat model (STRIDE-lite)

Scope: connected-mode design + the demo build. The demo holds only fictional data locally in the browser; most threats below apply to connected mode.

## Assets
1. OAuth refresh tokens for Gmail/Calendar (highest value)
2. Raw email/calendar/document content
3. Derived observations & situations (reveal plans, contacts, commitments)
4. User decisions & audit log
5. AI provider API keys

## Threats & mitigations

| STRIDE | Threat | Mitigation | Status |
|---|---|---|---|
| **S**poofing | Attacker email impersonates an airline to fake a "schedule change" | Changes require same authority (sender domain) as the original booking; different domain ⇒ conflict with both shown, never silent replacement | Built |
| **S** | Session hijack | Supabase Auth, httpOnly cookies, short-lived JWTs | Designed |
| **T**ampering | Injected text alters engine decisions | Deterministic core; AI output schema-validated | Built |
| **T** | User state edited to hide situations | RLS; audit log append-only (no UPDATE/DELETE grants) | Schema written |
| **R**epudiation | "I didn't dismiss that" | Audit entries: actor, action, time, situation | Built (local) |
| **I**nfo disclosure | Tokens leak to browser | Tokens only in server functions; encrypted at rest (Vault) | Designed |
| **I** | Content in logs/analytics | Logger accepts ids/enums/numbers only; test asserts no content | Built |
| **I** | Over-sharing with AI provider | Send minimal span, not whole mailbox; provider opt-in; zero-retention provider settings where offered | Designed |
| **I** | Prompt-injection exfiltration | No tools, no outbound actions (see [prompt-injection-model](prompt-injection-model.md)) | Built |
| **D**oS | Mailbox with 100k messages; AI cost blow-up | Incremental sync windows; per-user AI rate limit and daily budget | Designed |
| **E**levation | Reading another user's data | RLS on every table by `auth.uid()` | Schema written |

## Privacy by design

| Principle | Implementation |
|---|---|
| Least privilege | Read-only scopes (`gmail.readonly`, `calendar.readonly`); no send/modify scopes requested ever in MVP |
| Explicit permission | Per-source enable/disable in UI; disabling recomputes situations |
| Minimal retention | Connected mode stores spans + observations, not full bodies (design) |
| Deletion | "Delete all Nexus data" clears local state (demo); `ON DELETE CASCADE` from user (schema) |
| Export | JSON export of decisions + audit log (demo) |
| Auditability | Append-only audit log visible to user |
| Provider independence | `AIProvider` interface; no provider required |

## Secrets
- `.env.example` only; `.env*` git-ignored.
- AI keys read server-side (`NEXUS_AI_PROVIDER`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `NEXUS_AI_MODEL`). The web build contains no keys; a test fails the build if an `sk-`/`sk-ant-` pattern appears in `dist/`.

## Known gaps (honest)
- No auth in the demo build (no server).
- Rate limiting is designed, not implemented.
- Google OAuth verification / restricted-scope security assessment not started.
