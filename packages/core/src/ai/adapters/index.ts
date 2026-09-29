import type { AITransport } from '../provider';

/**
 * Vendor adapters. Fetch-based, server-side only: they read keys from the
 * environment of the process that constructs them and must never be bundled into
 * the browser build (scripts/check-secrets.mjs guards the dist output).
 *
 * The model name is required configuration (NEXUS_AI_MODEL) — no vendor default is
 * baked in, so swapping providers or models is a config change.
 */

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<any>;
}>;

export interface AdapterConfig {
  apiKey: string;
  model: string;
  fetch?: FetchLike;
  baseUrl?: string;
}

export class AnthropicTransport implements AITransport {
  readonly name = 'anthropic';
  constructor(private cfg: AdapterConfig) {}
  async send(system: string, user: string, maxOutputTokens: number) {
    const f = this.cfg.fetch ?? (globalThis.fetch as unknown as FetchLike);
    const res = await f(`${this.cfg.baseUrl ?? 'https://api.anthropic.com'}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.cfg.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.cfg.model,
        max_tokens: maxOutputTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) throw new Error(`anthropic_http_${res.status}`);
    const body = await res.json();
    const text = (body.content ?? []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('');
    return { text, inputTokens: body.usage?.input_tokens, outputTokens: body.usage?.output_tokens };
  }
}

export class OpenAITransport implements AITransport {
  readonly name = 'openai';
  constructor(private cfg: AdapterConfig) {}
  async send(system: string, user: string, maxOutputTokens: number) {
    const f = this.cfg.fetch ?? (globalThis.fetch as unknown as FetchLike);
    const res = await f(`${this.cfg.baseUrl ?? 'https://api.openai.com'}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.cfg.apiKey}` },
      body: JSON.stringify({
        model: this.cfg.model,
        max_tokens: maxOutputTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`openai_http_${res.status}`);
    const body = await res.json();
    return {
      text: body.choices?.[0]?.message?.content ?? '',
      inputTokens: body.usage?.prompt_tokens,
      outputTokens: body.usage?.completion_tokens,
    };
  }
}

/** Scripted transport for tests and the demo. Returns canned text per call. */
export class MockTransport implements AITransport {
  readonly name = 'mock';
  calls: { system: string; user: string }[] = [];
  constructor(private responses: (string | Error)[] | ((system: string, user: string) => string)) {}
  async send(system: string, user: string) {
    this.calls.push({ system, user });
    if (typeof this.responses === 'function') return { text: this.responses(system, user), inputTokens: 0, outputTokens: 0 };
    const next = this.responses.shift();
    if (next === undefined) throw new Error('mock_exhausted');
    if (next instanceof Error) throw next;
    return { text: next, inputTokens: 0, outputTokens: 0 };
  }
}

export interface EnvLike {
  NEXUS_AI_PROVIDER?: string;
  NEXUS_AI_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
}

/** Build a transport from environment. Returns undefined when AI isn't configured — which is fine. */
export function transportFromEnv(env: EnvLike): AITransport | undefined {
  const model = env.NEXUS_AI_MODEL;
  if (!model) return undefined;
  if (env.NEXUS_AI_PROVIDER === 'anthropic' && env.ANTHROPIC_API_KEY) return new AnthropicTransport({ apiKey: env.ANTHROPIC_API_KEY, model });
  if (env.NEXUS_AI_PROVIDER === 'openai' && env.OPENAI_API_KEY) return new OpenAITransport({ apiKey: env.OPENAI_API_KEY, model });
  return undefined;
}
