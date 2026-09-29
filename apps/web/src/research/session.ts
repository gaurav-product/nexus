import type { Condition, ScenarioKey } from './scenarios';

/**
 * Concept-session data model and CSV export.
 * Column set matches docs/research/schema/concept_session.csv exactly — a test enforces it.
 */

export type Rating = 1 | 2 | 3 | 4 | 5 | null;
export type Frequency = '' | 'never' | 'few_per_year' | 'monthly' | 'weekly' | 'several_per_week';

export interface ScenarioResponse {
  scenario: ScenarioKey;
  firstCondition: Condition;
  displayOrder: string; // e.g. "B,C,A"
  nextAction: string;
  actionCoding: '' | 'correct' | 'partial' | 'missed';
  clearest: '' | Condition | 'none';
  mostTrusted: '' | Condition | 'none';
  ratings: {
    usefulness: Rating;
    clarity: Rating;
    trust: Rating;
    evidence_quality: Rating;
    actionability: Rating;
    annoyance: Rating;
  };
  perceivedFrequency: Frequency;
  ownIncident: string; // unprompted story linking to their own past (E2 if specific)
}

export interface SessionFinal {
  connectData: '' | 'none' | 'calendar_only' | 'email_readonly' | 'all_three' | 'unsure';
  connectConditions: string;
  pilotAgreed: '' | 'yes' | 'no';
  overallPreference: '' | Condition | 'none';
  notes: string;
}

export interface ResearchSession {
  sessionId: string;
  participantId: string;
  segment: string;
  facilitator: string;
  startedAt: string;
  completedAt?: string;
  responses: ScenarioResponse[];
  final: SessionFinal;
}

export const CSV_COLUMNS = [
  'session_id',
  'participant_id',
  'segment',
  'facilitator',
  'started_at',
  'completed_at',
  'scenario',
  'first_condition',
  'display_order',
  'next_action_text',
  'action_coding',
  'clearest_condition',
  'most_trusted_condition',
  'nexus_usefulness',
  'nexus_clarity',
  'nexus_trust',
  'nexus_evidence_quality',
  'nexus_actionability',
  'nexus_annoyance',
  'perceived_frequency',
  'own_incident_text',
  'connect_data',
  'connect_conditions',
  'pilot_agreed',
  'overall_preference',
  'session_notes',
] as const;

function cell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  // Neutralise spreadsheet formula injection, then quote per RFC 4180.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(sessions: ResearchSession[]): string {
  const rows: string[] = [CSV_COLUMNS.join(',')];
  for (const s of sessions) {
    for (const r of s.responses) {
      const values: Record<(typeof CSV_COLUMNS)[number], unknown> = {
        session_id: s.sessionId,
        participant_id: s.participantId,
        segment: s.segment,
        facilitator: s.facilitator,
        started_at: s.startedAt,
        completed_at: s.completedAt ?? '',
        scenario: r.scenario,
        first_condition: r.firstCondition,
        display_order: r.displayOrder,
        next_action_text: r.nextAction,
        action_coding: r.actionCoding,
        clearest_condition: r.clearest,
        most_trusted_condition: r.mostTrusted,
        nexus_usefulness: r.ratings.usefulness,
        nexus_clarity: r.ratings.clarity,
        nexus_trust: r.ratings.trust,
        nexus_evidence_quality: r.ratings.evidence_quality,
        nexus_actionability: r.ratings.actionability,
        nexus_annoyance: r.ratings.annoyance,
        perceived_frequency: r.perceivedFrequency,
        own_incident_text: r.ownIncident,
        connect_data: s.final.connectData,
        connect_conditions: s.final.connectConditions,
        pilot_agreed: s.final.pilotAgreed,
        overall_preference: s.final.overallPreference,
        session_notes: s.final.notes,
      };
      rows.push(CSV_COLUMNS.map((c) => cell(values[c])).join(','));
    }
  }
  return rows.join('\n');
}

const KEY = 'nexus.research.v1';

export function loadSessions(): ResearchSession[] {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: ResearchSession[]) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(sessions));
  } catch {
    /* storage unavailable — sessions live in memory until the tab closes */
  }
}

export function clearSessions() {
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
