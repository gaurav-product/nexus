import type { Observation, RawSource, Sensitivity, Situation, SourceFlag, Subject, SubjectKey } from '../domain/types';
import { ObservationSchema } from '../domain/schemas';
import { extractEventTimes } from '../extract/events';
import { extractCommitments, extractDocumentRequests, extractDocumentsPresent } from '../extract/commitments';
import { keysForSource } from '../extract/keys';
import { scanForInjection } from '../safety/injection';
import { nullLogger, type Logger } from '../obs/log';
import { linkSources } from './link';
import { detectSituations } from './detect';
import { applySensitivity } from './policy';

export interface PipelineOptions {
  now: string;
  sensitivity: Sensitivity;
  disabledSourceIds?: string[];
  log?: Logger;
  /** Extra extractors (e.g. an AI-backed one). Their output goes through the same validation. */
  extraExtractors?: ((s: RawSource) => Observation[])[];
}

export interface PipelineResult {
  situations: Situation[];
  /** Everything detected before the sensitivity filter (for the E1 comparison). */
  allDetected: Situation[];
  observations: Observation[];
  subjects: Subject[];
  flags: SourceFlag[];
  stats: {
    sources: number;
    sourcesByKind: Record<string, number>;
    observations: number;
    invalidObservations: number;
    failedSources: string[];
    durationMs: number;
  };
}

const EXTRACTORS: ((s: RawSource) => Observation[])[] = [
  extractEventTimes,
  extractCommitments,
  extractDocumentRequests,
  extractDocumentsPresent,
];

/**
 * The whole engine as a pure function (architecture §1).
 * Raw source → extraction → validation → linking → detection → sensitivity policy.
 */
export function runPipeline(allSources: RawSource[], opts: PipelineOptions): PipelineResult {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const log = opts.log ?? nullLogger;
  const disabled = new Set(opts.disabledSourceIds ?? []);
  const sources = allSources.filter((s) => !disabled.has(s.id));
  const byId = new Map(sources.map((s) => [s.id, s]));

  const flags: SourceFlag[] = [];
  const observations: Observation[] = [];
  const keys = new Map<string, SubjectKey[]>();
  const failedSources: string[] = [];
  let invalid = 0;

  for (const source of sources) {
    try {
      const flag = scanForInjection(source);
      if (flag) flags.push(flag);
      keys.set(source.id, keysForSource(source));
      for (const extract of [...EXTRACTORS, ...(opts.extraExtractors ?? [])]) {
        for (const o of extract(source)) {
          const parsed = ObservationSchema.safeParse(o);
          if (parsed.success && o.sourceId === source.id) observations.push(o);
          else {
            invalid++;
            log.log('extract.invalid', { sourceKind: source.kind, extractor: o.extractor?.name ?? 'unknown' });
          }
        }
      }
    } catch (err) {
      failedSources.push(source.id);
      keys.set(source.id, []);
      log.log('ingest.failed', { sourceId: source.id, sourceKind: source.kind, error: err instanceof Error ? err.name : 'unknown' });
    }
  }

  const link = linkSources(sources, keys);
  const allDetected = detectSituations({
    now: opts.now,
    sources: byId,
    observations,
    link,
    flagged: new Set(flags.map((f) => f.sourceId)),
  });
  const situations = applySensitivity(allDetected, opts.sensitivity, opts.now);

  for (const s of situations) log.log('situation.generated', { type: s.type, status: s.status, sensitivity: opts.sensitivity });

  const sourcesByKind: Record<string, number> = {};
  for (const s of sources) sourcesByKind[s.kind] = (sourcesByKind[s.kind] ?? 0) + 1;
  const durationMs = Math.round(((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0) * 100) / 100;
  log.log('pipeline.run', { sources: sources.length, observations: observations.length, situations: situations.length, durationMs });

  return {
    situations,
    allDetected,
    observations,
    subjects: link.subjects,
    flags,
    stats: { sources: sources.length, sourcesByKind, observations: observations.length, invalidObservations: invalid, failedSources, durationMs },
  };
}
