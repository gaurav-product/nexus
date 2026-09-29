/**
 * Nexus domain model.
 *
 * The flow is: RawSource → Observation → Subject → Situation → Evidence.
 * Observations are derived (recomputable). User decisions are stored separately
 * and applied after detection, so the engine never mutates user intent.
 */

export type SourceKind = 'email' | 'calendar' | 'document';

export interface Person {
  name: string;
  email: string;
}

export interface Attachment {
  filename: string;
  mime: string;
}

interface SourceBase {
  id: string;
  kind: SourceKind;
  /** Where the data came from. Only 'demo' exists in this build. */
  provider: 'demo' | 'gmail' | 'google_calendar' | 'upload';
}

export interface EmailSource extends SourceBase {
  kind: 'email';
  threadId: string;
  from: Person;
  to: Person[];
  sentAt: string; // ISO instant
  subject: string;
  body: string;
  direction: 'inbound' | 'outbound';
  attachments: Attachment[];
  /** Calendar UID when the message carries an invitation (text/calendar part). */
  icsUid?: string;
  /** True when List-Unsubscribe / bulk headers are present. */
  bulk?: boolean;
}

export interface CalendarSource extends SourceBase {
  kind: 'calendar';
  uid: string;
  title: string;
  start: string; // ISO instant
  end: string;
  location?: string;
  organizer?: Person;
  description?: string;
  updatedAt: string;
}

export interface DocumentSource extends SourceBase {
  kind: 'document';
  filename: string;
  uploadedAt: string;
  text: string;
}

export type RawSource = EmailSource | CalendarSource | DocumentSource;

// ─── Observations ────────────────────────────────────────────────────────────

export type ObservationKind =
  | 'event_time'
  | 'commitment'
  | 'deadline'
  | 'document_request'
  | 'document_present';

/** Which time-like property of a subject an observation describes. */
export type TimeAttribute = 'start' | 'departure' | 'arrival';

/** explicit = the source states it; inferred = Nexus derived it. */
export type Basis = 'explicit' | 'inferred';

export interface Span {
  /** The full sentence/line the observation came from. */
  text: string;
  /** Character range within `text` to highlight. */
  highlight: [number, number];
}

export type KeyType = 'ics_uid' | 'thread' | 'reference' | 'flight' | 'name';

export interface SubjectKey {
  type: KeyType;
  value: string;
  strength: 'strong' | 'weak';
}

export interface ObservationBase {
  id: string;
  sourceId: string;
  kind: ObservationKind;
  /** When the source said this (email sent time, calendar last update, upload time). */
  observedAt: string;
  /** Who is speaking: sender domain, 'calendar', or 'document'. */
  authority: string;
  span: Span;
  basis: Basis;
  extractor: { name: string; version: string };
}

export interface EventTimeObservation extends ObservationBase {
  kind: 'event_time';
  attribute: TimeAttribute;
  value: string; // ISO instant
  /** Explicit change language ("rescheduled", "now departs") was present. */
  changeCue: boolean;
  label?: string;
}

export interface CommitmentObservation extends ObservationBase {
  kind: 'commitment' | 'deadline';
  owner: 'me' | 'other';
  ownerName: string;
  counterparty?: Person;
  action: string; // "send"
  object: string; // "the revised proposal"
  dueAt?: string; // ISO instant, end of the due day
  dueText?: string; // "by Thursday"
}

export interface DocumentRequestObservation extends ObservationBase {
  kind: 'document_request';
  requester: Person;
  documentNoun: string; // "NDA"
  qualifier?: 'signed';
}

export interface DocumentPresentObservation extends ObservationBase {
  kind: 'document_present';
  documentNoun: string;
  signed: boolean;
  where: 'attachment' | 'upload';
  filename: string;
}

export type Observation =
  | EventTimeObservation
  | CommitmentObservation
  | DocumentRequestObservation
  | DocumentPresentObservation;

// ─── Subjects & relationships ───────────────────────────────────────────────

export interface Subject {
  id: string;
  label: string;
  keys: SubjectKey[];
  sourceIds: string[];
}

export interface Relationship {
  from: string;
  to: string;
  kind: 'same_as' | 'possibly_same_as' | 'affects' | 'fulfils';
  strength: 'strong' | 'weak';
}

// ─── Situations ─────────────────────────────────────────────────────────────

export type SituationType = 'conflict' | 'change' | 'commitment' | 'missing_info';

/** The trust contract (PRD §8). Deliberately no percentages. */
export type EvidenceStatus =
  | 'confirmed'
  | 'strong'
  | 'conflicting'
  | 'possible'
  | 'needs_confirmation';

export type Lifecycle = 'open' | 'snoozed' | 'resolved' | 'dismissed';

export type EvidenceRole =
  | 'version'
  | 'before'
  | 'after'
  | 'stale_copy'
  | 'affected'
  | 'commitment'
  | 'fulfilment'
  | 'request'
  | 'partial_match';

export interface Evidence {
  id: string;
  sourceId: string;
  observationId?: string;
  role: EvidenceRole;
  /** Which version group this evidence belongs to (conflicts). */
  group?: string;
  sourceKind: SourceKind;
  sourceLabel: string; // "Email from Neha Kapoor (Acme)"
  sourceTime: string;
  excerpt: string;
  highlight: [number, number];
  basis: Basis;
  flagged?: boolean;
}

export interface ConflictVersion {
  key: string; // stable id of the version (normalised value)
  value: string; // ISO instant
  sourceIds: string[];
}

export interface ConflictDetails {
  type: 'conflict';
  attribute: TimeAttribute;
  subjectLabel: string;
  versions: ConflictVersion[];
  linkStrength: 'strong' | 'weak';
}

export interface ChangeDetails {
  type: 'change';
  attribute: TimeAttribute;
  subjectLabel: string;
  changes: { attribute: TimeAttribute; before: string; after: string }[];
  changedAt: string;
  staleSourceIds: string[];
  affected: { sourceId: string; title: string; start: string; gapMinutes: number }[];
}

export interface CommitmentDetails {
  type: 'commitment';
  owner: 'me' | 'other';
  ownerName: string;
  counterparty?: Person;
  action: string;
  object: string;
  dueAt?: string;
  dueText?: string;
  state: 'open' | 'due_soon' | 'overdue' | 'appears_fulfilled';
  isDeadline: boolean;
  fromBulkSender: boolean;
}

export interface MissingInfoDetails {
  type: 'missing_info';
  requester: Person;
  documentNoun: string;
  qualifier?: 'signed';
  searched: { emails: number; attachments: number; documents: number };
  partialMatches: string[]; // filenames that matched the noun but not the qualifier
}

export type SituationDetails = ConflictDetails | ChangeDetails | CommitmentDetails | MissingInfoDetails;

export interface Situation {
  /** Stable across runs on the same data (FR-16). */
  id: string;
  type: SituationType;
  title: string;
  what: string;
  why: string;
  nextStep: string;
  status: EvidenceStatus;
  /** Lifecycle before user decisions are applied. */
  systemLifecycle: 'open' | 'resolved';
  systemResolutionReason?: string;
  /** The date that makes this matter (event start / due date). */
  relevantAt?: string;
  evidence: Evidence[];
  details: SituationDetails;
  /** Changes when the supporting evidence changes; used to reopen (FR-24). */
  evidenceFingerprint: string;
}

// ─── User state ─────────────────────────────────────────────────────────────

export type DecisionAction = 'resolve' | 'dismiss' | 'snooze' | 'reopen';

export interface UserDecision {
  situationId: string;
  action: DecisionAction;
  at: string;
  /** For conflicts: which version key the user says is correct, or 'neither' / 'not_same'. */
  choice?: string;
  reason?: 'not_relevant' | 'wrong' | 'handled_elsewhere';
  snoozeUntil?: string;
  evidenceFingerprint: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: 'user' | 'nexus';
  action: string;
  situationId?: string;
  detail?: string;
}

export type Sensitivity = 'conservative' | 'sensitive';

export interface SourceFlag {
  sourceId: string;
  kind: 'instruction_like_text';
  excerpt: string;
}
