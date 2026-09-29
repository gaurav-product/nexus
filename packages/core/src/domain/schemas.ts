import { z } from 'zod';

/**
 * Validation boundary (FR-6). Every observation — rule-based or AI-produced —
 * must pass these schemas before it can influence state. Invalid ones are
 * dropped and counted, never "repaired".
 */

const iso = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'must be an ISO instant');

const person = z.object({ name: z.string().min(1), email: z.string().includes('@') });

const span = z.object({
  text: z.string().min(1).max(2000),
  highlight: z.tuple([z.number().int().min(0), z.number().int().min(0)]),
}).refine((s) => s.highlight[0] <= s.highlight[1] && s.highlight[1] <= s.text.length, 'highlight out of range');

const base = {
  id: z.string().min(1),
  sourceId: z.string().min(1),
  observedAt: iso,
  authority: z.string().min(1),
  span,
  basis: z.enum(['explicit', 'inferred']),
  extractor: z.object({ name: z.string(), version: z.string() }),
};

export const EventTimeSchema = z.object({
  ...base,
  kind: z.literal('event_time'),
  attribute: z.enum(['start', 'departure', 'arrival']),
  value: iso,
  changeCue: z.boolean(),
  label: z.string().optional(),
});

export const CommitmentSchema = z.object({
  ...base,
  kind: z.enum(['commitment', 'deadline']),
  owner: z.enum(['me', 'other']),
  ownerName: z.string().min(1),
  counterparty: person.optional(),
  action: z.string().min(1).max(40),
  object: z.string().min(1).max(200),
  dueAt: iso.optional(),
  dueText: z.string().max(80).optional(),
});

export const DocumentRequestSchema = z.object({
  ...base,
  kind: z.literal('document_request'),
  requester: person,
  documentNoun: z.string().min(1).max(40),
  qualifier: z.literal('signed').optional(),
});

export const DocumentPresentSchema = z.object({
  ...base,
  kind: z.literal('document_present'),
  documentNoun: z.string().min(1).max(40),
  signed: z.boolean(),
  where: z.enum(['attachment', 'upload']),
  filename: z.string().min(1),
});

export const ObservationSchema = z.union([
  EventTimeSchema,
  CommitmentSchema,
  DocumentRequestSchema,
  DocumentPresentSchema,
]);
