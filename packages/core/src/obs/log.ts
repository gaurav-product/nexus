/**
 * Structured, content-free logging (NFR-6).
 *
 * Only ids, enums, counts and durations are allowed. Any string value that looks
 * like prose (spaces, @, long) is replaced with "[redacted]" before it reaches a sink,
 * so a careless call site can't leak email content into logs.
 */
export type LogEvent =
  | 'ingest.failed'
  | 'extract.invalid'
  | 'ai.call'
  | 'ai.failed'
  | 'pipeline.run'
  | 'situation.generated'
  | 'situation.viewed'
  | 'evidence.opened'
  | 'situation.resolved'
  | 'situation.dismissed'
  | 'situation.snoozed'
  | 'situation.reopened'
  | 'feedback.useful'
  | 'feedback.false_positive'
  | 'source.toggled'
  | 'sensitivity.changed';

export type LogValue = string | number | boolean | undefined;
export interface LogRecord {
  event: LogEvent;
  at: string;
  fields: Record<string, LogValue>;
}

export type LogSink = (r: LogRecord) => void;

const SAFE_STRING = /^[\w:.\-/@]{1,80}$/;
/** Version tags like "extract@1.0.0" are fine; anything shaped like an address is not. */
const EMAIL_LIKE = /[^@\s]+@[^@\s]+\.[a-z]{2,}/i;

export function sanitize(fields: Record<string, unknown>): Record<string, LogValue> {
  const out: Record<string, LogValue> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || typeof v === 'number' || typeof v === 'boolean') out[k] = v as LogValue;
    else if (typeof v === 'string') out[k] = SAFE_STRING.test(v) && !EMAIL_LIKE.test(v) ? v : '[redacted]';
    else out[k] = '[redacted]';
  }
  return out;
}

export class Logger {
  private sinks: LogSink[] = [];
  constructor(private clock: () => string = () => new Date().toISOString()) {}
  addSink(sink: LogSink) {
    this.sinks.push(sink);
    return () => {
      this.sinks = this.sinks.filter((s) => s !== sink);
    };
  }
  log(event: LogEvent, fields: Record<string, unknown> = {}) {
    const record: LogRecord = { event, at: this.clock(), fields: sanitize(fields) };
    for (const s of this.sinks) s(record);
  }
}

export const nullLogger = new Logger();
