import type { RawSource } from '../domain/types';
import { DEMO_SOURCES } from '../demo/dataset';

/**
 * Every source of data goes through a connector. Production connectors (Gmail,
 * Google Calendar, uploads) implement the same interface server-side; none is
 * implemented in this build, and the UI never implies otherwise (FR-2).
 */
export interface SourceConnector {
  readonly id: string;
  readonly mode: 'demo' | 'connected';
  readonly label: string;
  /** Read-only. Connectors never write, send or delete. */
  fetch(): Promise<RawSource[]>;
}

export class DemoConnector implements SourceConnector {
  readonly id = 'demo';
  readonly mode = 'demo' as const;
  readonly label = 'Demo dataset (fictional)';
  constructor(private sources: RawSource[] = DEMO_SOURCES) {}
  async fetch(): Promise<RawSource[]> {
    // Return copies so callers can't mutate the dataset.
    return structuredClone(this.sources);
  }
}

/**
 * Placeholder for the production Gmail connector — intentionally not implemented.
 * Requires server-side OAuth with `gmail.readonly` and Google's restricted-scope
 * verification. See docs/architecture/architecture.md §7.
 */
export class GmailConnector implements SourceConnector {
  readonly id = 'gmail';
  readonly mode = 'connected' as const;
  readonly label = 'Gmail (not available in this build)';
  async fetch(): Promise<RawSource[]> {
    throw new Error('GmailConnector is not implemented in the demo build.');
  }
}
