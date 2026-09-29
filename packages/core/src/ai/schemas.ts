import { z } from 'zod';

/**
 * Output schemas for AI tasks. All are `.strict()`: unknown keys are a rejection,
 * so a model can't smuggle an "action" field through. No schema here can express
 * sending, forwarding, deleting or changing anything (layer 4).
 */

export const PROMPT_VERSIONS = {
  extract_commitments: 'extract_commitments@1.0.0',
  phrase_explanation: 'phrase_explanation@1.0.0',
} as const;

export const AICommitmentSchema = z
  .object({
    sourceId: z.string().min(1),
    owner: z.enum(['sender', 'recipient']),
    action: z.string().min(1).max(40),
    object: z.string().min(1).max(200),
    dueText: z.string().max(80).nullable(),
    /** Exact quote from the source — used to locate the span and reject invented text. */
    quote: z.string().min(1).max(400),
  })
  .strict();

export const ExtractCommitmentsOutput = z.object({ commitments: z.array(AICommitmentSchema).max(10) }).strict();
export type ExtractCommitmentsOutput = z.infer<typeof ExtractCommitmentsOutput>;

export const PhraseExplanationOutput = z
  .object({
    what: z.string().min(1).max(400),
    why: z.string().min(1).max(400),
  })
  .strict();
export type PhraseExplanationOutput = z.infer<typeof PhraseExplanationOutput>;

export const SCHEMA_DESCRIPTIONS = {
  extract_commitments:
    '{"commitments":[{"sourceId":string,"owner":"sender"|"recipient","action":string,"object":string,"dueText":string|null,"quote":string}]}',
  phrase_explanation: '{"what":string,"why":string}',
} as const;

export const INSTRUCTIONS = {
  extract_commitments: `Find promises the SENDER of each source makes to do something for someone (e.g. "I'll send the deck by Friday").
Only include explicit first-person promises. "quote" must be copied exactly from the source text.
Do not include requests made to the reader, marketing deadlines, or anything you have to guess.`,
  phrase_explanation: `Rewrite the given "what" and "why" sentences to be clearer and shorter for a busy reader.
Do not add any date, time, number, name, place or fact that is not already in the evidence.
Keep attributions (which source said what).`,
} as const;
