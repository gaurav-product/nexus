import type { CommitmentObservation, EmailSource, Situation } from '../domain/types';
import { findDates, endOfLocalDay } from '../time/datetime';
import { domainOf, hash } from '../extract/text';
import type { AIProvider } from './provider';
import { ExtractCommitmentsOutput, INSTRUCTIONS, PhraseExplanationOutput, PROMPT_VERSIONS } from './schemas';
import { validateGrounded } from './grounding';

/**
 * AI-assisted commitment extraction for ambiguous language (optional; off in demo).
 * The model proposes; deterministic code disposes:
 *   - the quote must appear verbatim in the source, or the item is dropped;
 *   - dates are parsed by our parser from the quote, never taken from the model;
 *   - the result still passes ObservationSchema in the pipeline.
 */
export async function aiExtractCommitments(provider: AIProvider, email: EmailSource): Promise<CommitmentObservation[]> {
  const res = await provider.complete({
    task: 'extract_commitments',
    promptVersion: PROMPT_VERSIONS.extract_commitments,
    instructions: INSTRUCTIONS.extract_commitments,
    data: [{ id: email.id, kind: 'email', text: `Subject: ${email.subject}\n\n${email.body}` }],
    schema: ExtractCommitmentsOutput,
  });
  if (!res.ok) return [];

  const out: CommitmentObservation[] = [];
  for (const c of res.value.commitments) {
    if (c.sourceId !== email.id) continue;
    const at = email.body.indexOf(c.quote);
    if (at < 0) continue; // invented or paraphrased quote → reject
    if (c.owner !== 'sender') continue; // requests to the reader are not commitments
    const mine = email.direction === 'outbound';
    const due = findDates(c.quote, email.sentAt)[0];
    out.push({
      id: `obs:${email.id}:ai-commitment:${hash(c.quote)}`,
      sourceId: email.id,
      kind: 'commitment',
      owner: mine ? 'me' : 'other',
      ownerName: mine ? 'You' : email.from.name,
      counterparty: mine ? email.to[0] : email.from,
      action: c.action.toLowerCase(),
      object: c.object,
      dueAt: due ? endOfLocalDay(due.year, due.month, due.day) : undefined,
      dueText: c.dueText ?? undefined,
      observedAt: email.sentAt,
      authority: domainOf(email.from.email),
      span: { text: c.quote, highlight: [0, c.quote.length] },
      basis: 'inferred',
      extractor: { name: `ai.${provider.name}`, version: PROMPT_VERSIONS.extract_commitments },
    });
  }
  return out;
}

/**
 * Optional nicer phrasing. Returns the template text unless the AI text is
 * fully grounded in the evidence.
 */
export async function aiPhraseExplanation(
  provider: AIProvider,
  s: Situation,
): Promise<{ what: string; why: string; source: 'ai' | 'template' }> {
  const template = { what: s.what, why: s.why, source: 'template' as const };
  const evidenceTexts = [s.what, s.why, ...s.evidence.map((e) => `${e.sourceLabel}: ${e.excerpt}`)];
  const res = await provider.complete({
    task: 'phrase_explanation',
    promptVersion: PROMPT_VERSIONS.phrase_explanation,
    instructions: INSTRUCTIONS.phrase_explanation,
    data: [
      { id: `${s.id}:what`, kind: 'evidence', text: `what: ${s.what}\nwhy: ${s.why}` },
      ...s.evidence.map((e) => ({ id: e.id, kind: 'evidence' as const, text: `${e.sourceLabel}: ${e.excerpt}` })),
    ],
    schema: PhraseExplanationOutput,
  });
  if (!res.ok) return template;
  const g1 = validateGrounded(res.value.what, evidenceTexts);
  const g2 = validateGrounded(res.value.why, evidenceTexts);
  if (!g1.ok || !g2.ok) return template;
  return { what: res.value.what, why: res.value.why, source: 'ai' };
}
