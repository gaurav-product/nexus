import { describe, expect, it } from 'vitest';
import { runPipeline } from '../src/engine/pipeline';
import { auditFor, buildViews } from '../src/engine/policy';
import { DEMO_NOW, DEMO_SOURCES } from '../src/demo/dataset';
import type { UserDecision } from '../src/domain/types';
import { ist } from './factories';

const base = runPipeline(DEMO_SOURCES, { now: DEMO_NOW, sensitivity: 'conservative' });
const conflict = base.situations.find((s) => s.id.startsWith('conflict') && s.status === 'conflicting')!;
const later = ist('2026-10-01T09:05:00');

function decide(d: Partial<UserDecision> & { action: UserDecision['action'] }, s = conflict): UserDecision {
  return { situationId: s.id, at: later, evidenceFingerprint: s.evidenceFingerprint, ...d };
}

describe('situation lifecycle', () => {
  it('resolve with a choice → Confirmed + note naming the chosen version', () => {
    const choice = conflict.details.type === 'conflict' ? conflict.details.versions[0]!.key : '';
    const v = buildViews(base.situations, [decide({ action: 'resolve', choice })], 'conservative', DEMO_NOW).find((x) => x.id === conflict.id)!;
    expect(v.lifecycle).toBe('resolved');
    expect(v.displayStatus).toBe('confirmed');
    expect(v.resolutionNote).toBe('You confirmed Mon 5 Oct, 11:00 is correct.');
  });

  it('resolve with "neither" does not claim confirmation', () => {
    const v = buildViews(base.situations, [decide({ action: 'resolve', choice: 'neither' })], 'conservative', DEMO_NOW).find((x) => x.id === conflict.id)!;
    expect(v.displayStatus).toBe('conflicting');
  });

  it('dismiss removes it from Needs attention and records the reason', () => {
    const v = buildViews(base.situations, [decide({ action: 'dismiss', reason: 'wrong' })], 'conservative', DEMO_NOW).find((x) => x.id === conflict.id)!;
    expect(v.lifecycle).toBe('dismissed');
    expect(v.needsAttention).toBe(false);
    expect(v.resolutionNote).toMatch(/wrong/);
  });

  it('snooze hides until the time passes', () => {
    const until = ist('2026-10-03T09:00:00');
    const d = decide({ action: 'snooze', snoozeUntil: until });
    expect(buildViews(base.situations, [d], 'conservative', DEMO_NOW).find((x) => x.id === conflict.id)!.lifecycle).toBe('snoozed');
    expect(buildViews(base.situations, [d], 'conservative', ist('2026-10-04T09:00:00')).find((x) => x.id === conflict.id)!.lifecycle).toBe('open');
  });

  it('a dismissed situation reopens when new evidence arrives (FR-24)', () => {
    const d = decide({ action: 'dismiss', reason: 'not_relevant' });
    const extra = {
      id: 'em-new', kind: 'email' as const, provider: 'demo' as const, threadId: 'th-acme',
      from: { name: 'Neha Kapoor', email: 'neha.kapoor@acme-careers.example' }, to: [], sentAt: ist('2026-09-30T10:00:00'),
      subject: 'Re', body: 'Reminder: your interview is on Monday, 5 October at 11:00 AM.', direction: 'inbound' as const, attachments: [],
    };
    const r2 = runPipeline([...DEMO_SOURCES, extra], { now: DEMO_NOW, sensitivity: 'conservative' });
    const v = buildViews(r2.situations, [d], 'conservative', DEMO_NOW).find((x) => x.id === conflict.id)!;
    expect(v.lifecycle).toBe('open');
    expect(v.reopenedByNewEvidence).toBe(true);
  });

  it('the latest decision wins; reopen overrides a system resolution', () => {
    const auto = base.situations.find((s) => s.systemLifecycle === 'resolved')!;
    const v = buildViews(base.situations, [decide({ action: 'reopen' }, auto)], 'conservative', DEMO_NOW).find((x) => x.id === auto.id)!;
    expect(v.lifecycle).toBe('open');
  });

  it('decisions produce audit entries attributed to the user', () => {
    const a = auditFor(decide({ action: 'dismiss', reason: 'wrong' }), conflict);
    expect(a).toMatchObject({ actor: 'user', action: 'Dismissed', situationId: conflict.id });
  });

  it('views never mutate the detected situations', () => {
    const snapshot = JSON.stringify(base.situations);
    buildViews(base.situations, [decide({ action: 'resolve', choice: 'neither' })], 'conservative', DEMO_NOW);
    expect(JSON.stringify(base.situations)).toBe(snapshot);
  });
});

describe('id stability (regression for a bug found in testing)', () => {
  it('a new email joining a subject does not change the situation id', () => {
    const extra = {
      id: 'em-late', kind: 'email' as const, provider: 'demo' as const, threadId: 'th-acme',
      from: { name: 'Neha Kapoor', email: 'neha.kapoor@acme-careers.example' }, to: [], sentAt: ist('2026-09-30T11:00:00'),
      subject: 'Re', body: 'Thanks!', direction: 'inbound' as const, attachments: [],
    };
    const r2 = runPipeline([...DEMO_SOURCES, extra], { now: DEMO_NOW, sensitivity: 'conservative' });
    expect(r2.situations.map((s) => s.id).sort()).toEqual(base.situations.map((s) => s.id).sort());
  });
});
