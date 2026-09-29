import type { z } from 'zod';

/**
 * Provider-neutral AI interface (NFR-2). The app never imports a vendor SDK directly.
 * Models have NO tools and NO action paths — see docs/security/prompt-injection-model.md.
 */

export type AITask = 'extract_commitments' | 'phrase_explanation';

export interface UntrustedContent {
  /** Opaque id so output can be tied back to a source. */
  id: string;
  kind: 'email' | 'calendar' | 'document' | 'evidence';
  text: string;
}

export interface AIRequest<T> {
  task: AITask;
  promptVersion: string;
  /** Trusted instructions written by Nexus. */
  instructions: string;
  /** Untrusted content. Always delimited; never concatenated into instructions. */
  data: UntrustedContent[];
  schema: z.ZodType<T>;
  maxOutputTokens?: number;
}

export type AIResult<T> =
  | { ok: true; value: T; meta: AIMeta }
  | { ok: false; error: 'timeout' | 'transport' | 'invalid_json' | 'schema_violation' | 'not_configured'; meta: AIMeta };

export interface AIMeta {
  provider: string;
  task: AITask;
  promptVersion: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  attempts: number;
}

/** What an adapter must do: send messages, return raw text + token counts. */
export interface AITransport {
  readonly name: string;
  send(system: string, user: string, maxOutputTokens: number): Promise<{ text: string; inputTokens?: number; outputTokens?: number }>;
}

export interface AIProvider {
  readonly name: string;
  complete<T>(req: AIRequest<T>): Promise<AIResult<T>>;
}
