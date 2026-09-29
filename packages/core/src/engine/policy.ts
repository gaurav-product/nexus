import type { AuditEntry, EvidenceStatus, Lifecycle, Sensitivity, Situation, UserDecision } from '../domain/types';
import { formatDateTime } from '../time/datetime';

/**
 * Policy: which situations to show and which need attention (experiment E1),
 * then lifecycle: apply the user's decisions on top of what the engine detected.
 */

export type Bucket = 'conflicts' | 'changes' | 'commitments' | 'waiting' | 'missing';

export interface SituationView extends Situation {
  lifecycle: Lifecycle;
  bucket: Bucket;
  needsAttention: boolean;
  /** Lower = more urgent. */
  urgency: number;
  decision?: UserDecision;
  reopenedByNewEvidence?: boolean;
  resolutionNote?: string;
  displayStatus: EvidenceStatus;
}

const DAY = 86_400_000;

export function bucketOf(s: Situation): Bucket {
  switch (s.details.type) {
    case 'conflict':
      return 'conflicts';
    case 'change':
      return 'changes';
    case 'commitment':
      return s.details.owner === 'other' ? 'waiting' : 'commitments';
    case 'missing_info':
      return 'missing';
  }
}

/** Sensitivity filter. Conservative (default) trades recall for precision. */
export function applySensitivity(situations: Situation[], sensitivity: Sensitivity, now: string): Situation[] {
  if (sensitivity === 'sensitive') return situations;
  return situations.filter((s) => {
    if (s.details.type === 'commitment' && s.details.fromBulkSender) return false;
    if (s.details.type === 'conflict' && s.details.linkStrength === 'weak') {
      if (!s.relevantAt) return false;
      const d = Date.parse(s.relevantAt) - Date.parse(now);
      return d >= -DAY && d <= 14 * DAY;
    }
    return true;
  });
}

function needsAttention(s: Situation, sensitivity: Sensitivity, now: string): boolean {
  const t = s.relevantAt ? Date.parse(s.relevantAt) - Date.parse(now) : undefined;
  switch (s.details.type) {
    case 'conflict':
    case 'change':
      return t !== undefined && t >= -DAY && t <= 14 * DAY;
    case 'missing_info':
      return true;
    case 'commitment': {
      const d = s.details;
      if (d.state === 'overdue') return true;
      if (d.owner === 'other') return false;
      if (t === undefined) return sensitivity === 'sensitive';
      return t <= (d.isDeadline ? 7 : 2) * DAY;
    }
  }
}

/**
 * Ordering (D-013): surface what you DON'T know before what you forgot.
 *   Tier 0 — strong conflicts and changes: the user likely doesn't know yet.
 *   Tier 1 — possible conflicts, my commitments, requests: the user made or saw these.
 *   Tier 2 — things other people owe me.
 * Within a tier, sooner first; overdue counts as "now".
 */
function tier(s: Situation): number {
  const d = s.details;
  if ((d.type === 'conflict' && d.linkStrength === 'strong') || d.type === 'change') return 0;
  if (d.type === 'commitment' && d.owner === 'other') return 2;
  return 1;
}

function urgency(s: Situation, now: string): number {
  const hours =
    s.details.type === 'commitment' && s.details.state === 'overdue'
      ? 0
      : s.relevantAt
        ? Math.max(0, (Date.parse(s.relevantAt) - Date.parse(now)) / 3_600_000)
        : 72;
  return tier(s) * 100_000 + hours;
}

export function latestDecisions(decisions: UserDecision[]): Map<string, UserDecision> {
  const m = new Map<string, UserDecision>();
  for (const d of [...decisions].sort((a, b) => Date.parse(a.at) - Date.parse(b.at))) m.set(d.situationId, d);
  return m;
}

/** Apply user decisions (FR-22 → FR-24). Pure: returns new view objects. */
export function buildViews(
  situations: Situation[],
  decisions: UserDecision[],
  sensitivity: Sensitivity,
  now: string,
): SituationView[] {
  const latest = latestDecisions(decisions);
  return situations
    .map((s): SituationView => {
      const d = latest.get(s.id);
      let lifecycle: Lifecycle = s.systemLifecycle;
      let reopenedByNewEvidence = false;
      let resolutionNote = s.systemLifecycle === 'resolved' ? s.systemResolutionReason : undefined;
      let displayStatus: EvidenceStatus = s.status;

      if (d) {
        if (d.action === 'reopen') {
          lifecycle = 'open';
          resolutionNote = undefined;
        } else if (d.action === 'snooze') {
          lifecycle = d.snoozeUntil && Date.parse(d.snoozeUntil) > Date.parse(now) ? 'snoozed' : 'open';
        } else if (d.evidenceFingerprint !== s.evidenceFingerprint) {
          // New evidence arrived since the user decided → bring it back (FR-24).
          lifecycle = 'open';
          reopenedByNewEvidence = true;
          resolutionNote = undefined;
        } else if (d.action === 'resolve') {
          lifecycle = 'resolved';
          resolutionNote = resolutionText(s, d);
          if (s.details.type === 'conflict' && d.choice && d.choice !== 'neither' && d.choice !== 'not_same') displayStatus = 'confirmed';
        } else if (d.action === 'dismiss') {
          lifecycle = 'dismissed';
          resolutionNote =
            d.reason === 'wrong' ? 'You marked this as wrong.' : d.reason === 'handled_elsewhere' ? 'You handled this elsewhere.' : 'You dismissed this as not relevant.';
        }
      }

      return {
        ...s,
        lifecycle,
        bucket: bucketOf(s),
        needsAttention: lifecycle === 'open' && needsAttention(s, sensitivity, now),
        urgency: urgency(s, now),
        decision: d,
        reopenedByNewEvidence: reopenedByNewEvidence || undefined,
        resolutionNote,
        displayStatus,
      };
    })
    .sort((a, b) => a.urgency - b.urgency || a.id.localeCompare(b.id));
}

function resolutionText(s: Situation, d: UserDecision): string {
  if (s.details.type === 'conflict') {
    if (d.choice === 'not_same') return 'You said these are different events.';
    if (d.choice === 'neither') return 'You said neither version is correct.';
    const v = s.details.versions.find((x) => x.key === d.choice);
    if (v) return `You confirmed ${formatDateTime(v.value)} is correct.`;
  }
  return 'You marked this as resolved.';
}

export type View = 'needs_attention' | Bucket | 'resolved';

export function inView(v: SituationView, view: View): boolean {
  if (view === 'resolved') return v.lifecycle === 'resolved' || v.lifecycle === 'dismissed';
  if (v.lifecycle === 'resolved' || v.lifecycle === 'dismissed') return false;
  if (view === 'needs_attention') return v.needsAttention;
  if (view === 'conflicts') return v.bucket === 'conflicts';
  if (view === 'changes') return v.bucket === 'changes';
  if (view === 'commitments') return v.bucket === 'commitments' || v.bucket === 'missing';
  return v.bucket === view;
}

export function auditFor(d: UserDecision, s: Situation): AuditEntry {
  const action =
    d.action === 'resolve' ? 'Marked as resolved' : d.action === 'dismiss' ? 'Dismissed' : d.action === 'snooze' ? 'Snoozed' : 'Reopened';
  return {
    id: `audit:${d.situationId}:${d.at}`,
    at: d.at,
    actor: 'user',
    action,
    situationId: d.situationId,
    detail: d.action === 'resolve' ? resolutionText(s, d) : d.reason ?? (d.snoozeUntil ? `until ${formatDateTime(d.snoozeUntil)}` : undefined),
  };
}
