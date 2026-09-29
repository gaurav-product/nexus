import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import {
  DEMO_NOW,
  DemoConnector,
  auditFor,
  buildViews,
  inView,
  runPipeline,
  sanitize,
  type AuditEntry,
  type LogEvent,
  type LogRecord,
  type PipelineResult,
  type RawSource,
  type Sensitivity,
  type SituationView,
  type SourceConnector,
  type UserDecision,
  type View,
} from '@nexus/core';

/**
 * App state. The engine output is DERIVED (useMemo over sources + settings);
 * only the user's own decisions, settings and audit log are stored.
 * Storage is browser-local and optional — the app works without it.
 */

const STORAGE_KEY = 'nexus.demo.v1';

interface Persisted {
  disabled: string[];
  sensitivity: Sensitivity;
  decisions: UserDecision[];
  audit: AuditEntry[];
}

interface State extends Persisted {
  status: 'loading' | 'ready' | 'error';
  sources: RawSource[];
  error?: string;
  events: LogRecord[];
  toast?: { id: number; text: string };
  attempt: number;
}

type Action =
  | { type: 'loaded'; sources: RawSource[] }
  | { type: 'failed'; error: string }
  | { type: 'retry' }
  | { type: 'toggleSource'; id: string }
  | { type: 'setSensitivity'; value: Sensitivity }
  | { type: 'decide'; decision: UserDecision; audit: AuditEntry; toast: string }
  | { type: 'event'; record: LogRecord }
  | { type: 'toast'; text?: string }
  | { type: 'reset' };

const EMPTY: Persisted = { disabled: [], sensitivity: 'conservative', decisions: [], audit: [] };

function load(): Persisted {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<Persisted>;
    return {
      disabled: Array.isArray(p.disabled) ? p.disabled : [],
      sensitivity: p.sensitivity === 'sensitive' ? 'sensitive' : 'conservative',
      decisions: Array.isArray(p.decisions) ? p.decisions : [],
      audit: Array.isArray(p.audit) ? p.audit : [],
    };
  } catch {
    return EMPTY;
  }
}

function save(p: Persisted) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable (private window, blocked) — keep working in memory */
  }
}

let toastSeq = 0;

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case 'loaded':
      return { ...state, status: 'ready', sources: a.sources, error: undefined };
    case 'failed':
      return { ...state, status: 'error', error: a.error };
    case 'retry':
      return { ...state, status: 'loading', error: undefined, attempt: state.attempt + 1 };
    case 'toggleSource': {
      const on = state.disabled.includes(a.id);
      return { ...state, disabled: on ? state.disabled.filter((x) => x !== a.id) : [...state.disabled, a.id] };
    }
    case 'setSensitivity':
      return { ...state, sensitivity: a.value };
    case 'decide':
      return {
        ...state,
        decisions: [...state.decisions, a.decision],
        audit: [a.audit, ...state.audit],
        toast: { id: ++toastSeq, text: a.toast },
      };
    case 'event':
      return { ...state, events: [a.record, ...state.events].slice(0, 200) };
    case 'toast':
      return { ...state, toast: a.text ? { id: ++toastSeq, text: a.text } : undefined };
    case 'reset':
      return { ...state, ...EMPTY, events: [], toast: { id: ++toastSeq, text: 'All Nexus data in this browser was deleted.' } };
  }
}

export interface Store {
  status: State['status'];
  error?: string;
  sources: RawSource[];
  disabled: string[];
  sensitivity: Sensitivity;
  decisions: UserDecision[];
  audit: AuditEntry[];
  events: LogRecord[];
  toast?: State['toast'];
  now: string;
  result?: PipelineResult;
  views: SituationView[];
  counts: Record<View, number>;
  decide: (d: Omit<UserDecision, 'at' | 'evidenceFingerprint'>, toast: string) => void;
  toggleSource: (id: string) => void;
  setSensitivity: (s: Sensitivity) => void;
  track: (event: LogEvent, fields?: Record<string, unknown>) => void;
  dismissToast: () => void;
  retry: () => void;
  reset: () => void;
  exportData: () => string;
}

const Ctx = createContext<Store | null>(null);

const VIEWS: View[] = ['needs_attention', 'conflicts', 'changes', 'commitments', 'waiting', 'resolved'];

export function StoreProvider({ children, connector, now = DEMO_NOW }: { children: ReactNode; connector?: SourceConnector; now?: string }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ ...load(), status: 'loading', sources: [], events: [], attempt: 0 }) as State);
  const conn = useRef(connector ?? new DemoConnector());
  const loadedAt = useRef(Date.now());

  // A demo clock that starts at the pinned demo time and ticks with real time,
  // so decisions made in the demo get sensible timestamps.
  const clock = useCallback(() => new Date(Date.parse(now) + (Date.now() - loadedAt.current)).toISOString(), [now]);

  useEffect(() => {
    let alive = true;
    conn.current
      .fetch()
      .then((sources) => alive && dispatch({ type: 'loaded', sources }))
      .catch(() => alive && dispatch({ type: 'failed', error: 'Nexus could not read the demo sources.' }));
    return () => {
      alive = false;
    };
  }, [state.attempt]);

  useEffect(() => {
    save({ disabled: state.disabled, sensitivity: state.sensitivity, decisions: state.decisions, audit: state.audit });
  }, [state.disabled, state.sensitivity, state.decisions, state.audit]);

  const result = useMemo(
    () =>
      state.status === 'ready'
        ? runPipeline(state.sources, { now, sensitivity: state.sensitivity, disabledSourceIds: state.disabled })
        : undefined,
    [state.status, state.sources, state.sensitivity, state.disabled, now],
  );

  const views = useMemo(
    () => (result ? buildViews(result.situations, state.decisions, state.sensitivity, now) : []),
    [result, state.decisions, state.sensitivity, now],
  );

  const counts = useMemo(() => {
    const c = {} as Record<View, number>;
    for (const v of VIEWS) c[v] = views.filter((s) => inView(s, v)).length;
    return c;
  }, [views]);

  const track = useCallback(
    (event: LogEvent, fields: Record<string, unknown> = {}) =>
      dispatch({ type: 'event', record: { event, at: clock(), fields: sanitize(fields) } }),
    [clock],
  );

  const decide = useCallback<Store['decide']>(
    (d, toast) => {
      const s = result?.situations.find((x) => x.id === d.situationId);
      if (!s) return;
      const decision: UserDecision = { ...d, at: clock(), evidenceFingerprint: s.evidenceFingerprint };
      dispatch({ type: 'decide', decision, audit: auditFor(decision, s), toast });
      const ev = d.action === 'resolve' ? 'situation.resolved' : d.action === 'dismiss' ? 'situation.dismissed' : d.action === 'snooze' ? 'situation.snoozed' : 'situation.reopened';
      track(ev, { type: s.type, status: s.status, reason: d.reason, sensitivity: state.sensitivity });
      if (d.action === 'dismiss' && d.reason === 'wrong') track('feedback.false_positive', { type: s.type, status: s.status });
    },
    [result, clock, track, state.sensitivity],
  );

  const store: Store = {
    status: state.status,
    error: state.error,
    sources: state.sources,
    disabled: state.disabled,
    sensitivity: state.sensitivity,
    decisions: state.decisions,
    audit: state.audit,
    events: state.events,
    toast: state.toast,
    now,
    result,
    views,
    counts,
    decide,
    toggleSource: (id) => {
      dispatch({ type: 'toggleSource', id });
      track('source.toggled', { enabled: state.disabled.includes(id) });
    },
    setSensitivity: (value) => {
      dispatch({ type: 'setSensitivity', value });
      track('sensitivity.changed', { sensitivity: value });
    },
    track,
    dismissToast: () => dispatch({ type: 'toast' }),
    retry: () => dispatch({ type: 'retry' }),
    reset: () => {
      try {
        globalThis.localStorage?.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      dispatch({ type: 'reset' });
    },
    exportData: () =>
      JSON.stringify(
        { exportedAt: clock(), mode: 'demo', settings: { sensitivity: state.sensitivity, disabledSources: state.disabled }, decisions: state.decisions, audit: state.audit },
        null,
        2,
      ),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
