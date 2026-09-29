import type { AIProvider, AIRequest, AIResult, AITransport } from './provider';
import { buildMessages } from './prompt';
import { SCHEMA_DESCRIPTIONS } from './schemas';
import { nullLogger, type Logger } from '../obs/log';

export interface ReliabilityOptions {
  timeoutMs?: number;
  retries?: number;
  log?: Logger;
  now?: () => number;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function parseJson(text: string): unknown {
  // Models sometimes wrap JSON in a code fence; strip it, nothing more clever.
  const clean = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(clean);
}

/**
 * Turns a raw transport into an AIProvider that is observable, retryable,
 * versioned and validated. Content never reaches the log — only metadata.
 */
export class ReliableProvider implements AIProvider {
  readonly name: string;
  constructor(private transport: AITransport, private opts: ReliabilityOptions = {}) {
    this.name = transport.name;
  }

  async complete<T>(req: AIRequest<T>): Promise<AIResult<T>> {
    const log = this.opts.log ?? nullLogger;
    const now = this.opts.now ?? (() => Date.now());
    const retries = this.opts.retries ?? 2;
    const timeoutMs = this.opts.timeoutMs ?? 20_000;
    const { system, user } = buildMessages(req.instructions, req.data, SCHEMA_DESCRIPTIONS[req.task]);
    const start = now();
    let attempts = 0;
    let lastError: 'timeout' | 'transport' = 'transport';

    while (attempts <= retries) {
      attempts++;
      try {
        const res = await withTimeout(this.transport.send(system, user, req.maxOutputTokens ?? 800), timeoutMs);
        const meta = {
          provider: this.name,
          task: req.task,
          promptVersion: req.promptVersion,
          latencyMs: now() - start,
          inputTokens: res.inputTokens,
          outputTokens: res.outputTokens,
          attempts,
        };
        let json: unknown;
        try {
          json = parseJson(res.text);
        } catch {
          log.log('ai.failed', { ...meta, error: 'invalid_json' });
          return { ok: false, error: 'invalid_json', meta };
        }
        const parsed = req.schema.safeParse(json);
        if (!parsed.success) {
          log.log('ai.failed', { ...meta, error: 'schema_violation' });
          return { ok: false, error: 'schema_violation', meta };
        }
        log.log('ai.call', { ...meta, ok: true });
        return { ok: true, value: parsed.data, meta };
      } catch (err) {
        lastError = err instanceof Error && err.message === 'timeout' ? 'timeout' : 'transport';
        // Retry transport problems; they are the only transient class here.
      }
    }
    const meta = { provider: this.name, task: req.task, promptVersion: req.promptVersion, latencyMs: now() - start, attempts };
    log.log('ai.failed', { ...meta, error: lastError });
    return { ok: false, error: lastError, meta };
  }
}
