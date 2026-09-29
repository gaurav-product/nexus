import { describe, expect, it } from 'vitest';
import { runPipeline } from '../src/engine/pipeline';
import { buildViews, inView } from '../src/engine/policy';
import { DEMO_NOW, DEMO_SOURCES } from '../src/demo/dataset';
import type { RawSource, Situation } from '../src/domain/types';
import { cal, doc, email, ist, ME, NOW } from './factories';

const run = (sources: RawSource[], sensitivity: 'conservative' | 'sensitive' = 'conservative', disabled: string[] = []) =>
  runPipeline(sources, { now: NOW, sensitivity, disabledSourceIds: disabled });

const byType = (s: Situation[], t: Situation['type']) => s.filter((x) => x.type === t);

describe('demo dataset (the six required scenarios)', () => {
  const r = runPipeline(DEMO_SOURCES, { now: DEMO_NOW, sensitivity: 'conservative' });
  const find = (idPart: string, type: Situation['type']) => r.situations.find((s) => s.type === type && s.evidence.some((e) => e.sourceId === idPart))!;

  it('S1 conflict: calendar vs email + PDF, no winner chosen', () => {
    const s = find('cal-acme', 'conflict');
    expect(s.status).toBe('conflicting');
    expect(s.details.type === 'conflict' && s.details.versions.map((v) => v.sourceIds.length)).toEqual([2, 1]);
    expect(s.title).toBe('Acme interview: date conflict');
  });

  it('S2 change: before/after, stale calendar copy, affected workshop', () => {
    const s = find('em-flight-change', 'change');
    expect(s.details.type).toBe('change');
    if (s.details.type !== 'change') return;
    expect(s.details.changes).toEqual([
      { attribute: 'departure', before: ist('2026-10-08T08:15:00'), after: ist('2026-10-08T10:30:00') },
      { attribute: 'arrival', before: ist('2026-10-08T10:55:00'), after: ist('2026-10-08T13:10:00') },
    ]);
    expect(s.details.staleSourceIds).toEqual(['cal-flight']);
    expect(s.details.affected).toEqual([expect.objectContaining({ sourceId: 'cal-northwind', gapMinutes: 20 })]);
    // The stale calendar copy must NOT also raise a conflict (dedupe).
    expect(r.situations.filter((x) => x.type === 'conflict' && x.evidence.some((e) => e.sourceId === 'cal-flight'))).toHaveLength(0);
  });

  it('S3 open commitment due today', () => {
    const s = find('em-nw-reply', 'commitment');
    expect(s.details.type === 'commitment' && s.details.state).toBe('due_soon');
    expect(s.status).toBe('strong');
  });

  it('S4 missing document: "not found", never "missing"', () => {
    const s = byType(r.situations, 'missing_info')[0]!;
    expect(s.status).toBe('needs_confirmation');
    expect(s.title).toBe('Signed NDA not found');
    expect(`${s.what} ${s.why}`).not.toMatch(/\bmissing\b/i);
    expect(s.details.type === 'missing_info' && s.details.partialMatches).toEqual(['Northwind_Mutual_NDA.pdf']);
  });

  it('S5 fulfilled commitment is resolved by evidence, labelled Possible', () => {
    const s = find('em-portfolio-sent', 'commitment');
    expect(s.systemLifecycle).toBe('resolved');
    expect(s.status).toBe('possible');
    expect(s.systemResolutionReason).toMatch(/Appears fulfilled/);
  });

  it('S6 uncertain match: weak link can never exceed Possible', () => {
    const s = find('cal-priya', 'conflict');
    expect(s.status).toBe('possible');
    expect(s.details.type === 'conflict' && s.details.linkStrength).toBe('weak');
    expect(s.why).toMatch(/first name only/);
  });

  it('control: Zenith sources agree (UTC vs IST formats) → no situation', () => {
    expect(r.situations.some((s) => s.evidence.some((e) => e.sourceId.includes('zenith')))).toBe(false);
  });

  it('adversarial: injection email is flagged and produces no situation', () => {
    expect(r.flags.map((f) => f.sourceId)).toEqual(['em-injection']);
    expect(r.situations.some((s) => s.evidence.some((e) => e.sourceId === 'em-injection'))).toBe(false);
  });

  it('conservative shows 7, sensitive adds the bulk deadline (E1)', () => {
    expect(r.situations).toHaveLength(7);
    const sens = runPipeline(DEMO_SOURCES, { now: DEMO_NOW, sensitivity: 'sensitive' });
    expect(sens.situations).toHaveLength(8);
    const extra = sens.situations.find((s) => !r.situations.some((c) => c.id === s.id))!;
    expect(extra.details.type === 'commitment' && extra.details.fromBulkSender).toBe(true);
  });

  it('every evidence highlight is inside its excerpt and non-empty (attribution integrity)', () => {
    for (const s of r.situations)
      for (const e of s.evidence) {
        expect(e.highlight[0]).toBeGreaterThanOrEqual(0);
        expect(e.highlight[1]).toBeLessThanOrEqual(e.excerpt.length);
        expect(e.highlight[1]).toBeGreaterThan(e.highlight[0]);
      }
  });

  it('is idempotent: same input → same ids and fingerprints (FR-16)', () => {
    const again = runPipeline(DEMO_SOURCES, { now: DEMO_NOW, sensitivity: 'conservative' });
    expect(again.situations.map((s) => [s.id, s.evidenceFingerprint])).toEqual(r.situations.map((s) => [s.id, s.evidenceFingerprint]));
  });
});

describe('conflict vs change rules (D-008)', () => {
  const calendar = cal({ id: 'c', uid: 'u1', title: 'Design review', start: ist('2026-10-05T15:00:00'), end: ist('2026-10-05T16:00:00') });
  const invite = email({ id: 'e0', threadId: 't', icsUid: 'u1', body: 'You are invited.' });

  it('same time in different formats is not a conflict', () => {
    const e = email({ threadId: 't', body: 'The meeting is on 5 October at 3:00 PM.' });
    expect(run([calendar, invite, e]).situations).toHaveLength(0);
  });

  it('a different sender disagreeing is a conflict, not a change — even if newer', () => {
    const e = email({ threadId: 't', body: 'Our meeting is scheduled for 5 October at 4:00 PM.' });
    expect(byType(run([calendar, invite, e]).situations, 'conflict')).toHaveLength(1);
  });

  it('same authority with "rescheduled" is a change', () => {
    const a = email({ id: 'a', threadId: 'x', from: { name: 'Ops', email: 'ops@co.example' }, body: 'Ref: OPS-12345. Your appointment is on 5 October at 10:00 AM.', sentAt: ist('2026-09-20T10:00:00') });
    const b = email({ id: 'b', threadId: 'y', from: { name: 'Ops', email: 'ops2@co.example' }, subject: 'Rescheduled', body: 'Ref: OPS-12345. Your appointment is rescheduled to 5 October at 12:00 PM.', sentAt: ist('2026-09-25T10:00:00') });
    const r = run([a, b]).situations;
    expect(byType(r, 'change')).toHaveLength(1);
    expect(byType(r, 'conflict')).toHaveLength(0);
  });

  it('same authority WITHOUT a change cue is still a conflict', () => {
    const a = email({ id: 'a', threadId: 'x', body: 'Ref: OPS-12345. Your appointment is on 5 October at 10:00 AM.', sentAt: ist('2026-09-20T10:00:00') });
    const b = email({ id: 'b', threadId: 'y', body: 'Ref: OPS-12345. Just confirming your appointment is on 5 October at 12:00 PM.', sentAt: ist('2026-09-25T10:00:00') });
    expect(byType(run([a, b]).situations, 'conflict')).toHaveLength(1);
  });

  it('conflicts about past events are not raised', () => {
    const past = cal({ id: 'p', uid: 'u2', title: 'Old sync', start: ist('2026-09-20T15:00:00'), end: ist('2026-09-20T16:00:00') });
    const inv = email({ threadId: 't2', icsUid: 'u2', body: 'invite' });
    const e = email({ threadId: 't2', body: 'Our meeting is on 20 September at 4:00 PM.' });
    expect(run([past, inv, e]).situations).toHaveLength(0);
  });

  it('unlinked sources never conflict (no identifiers, no weak key)', () => {
    const e = email({ body: 'Our meeting is on 5 October at 4:00 PM.' });
    expect(run([calendar, e]).situations).toHaveLength(0);
  });
});

describe('commitments and fulfilment', () => {
  const arjun = { name: 'Arjun Rao', email: 'arjun@nw.example' };
  const promise = email({ id: 'p', direction: 'outbound', from: ME, to: [arjun], sentAt: ist('2026-09-25T10:00:00'), body: "I'll send the budget sheet by Monday." });

  it('is overdue when the due date passed with no evidence', () => {
    const [s] = run([promise]).situations;
    expect(s!.details.type === 'commitment' && s!.details.state).toBe('overdue');
  });

  it('a later reply with a matching attachment resolves it (reversible, Possible)', () => {
    const sent = email({ direction: 'outbound', from: ME, to: [arjun], sentAt: ist('2026-09-27T10:00:00'), body: 'Here it is.', attachments: [{ filename: 'Budget_v2.xlsx', mime: 'x' }] });
    const [s] = run([promise, sent]).situations;
    expect(s!.systemLifecycle).toBe('resolved');
    expect(s!.status).toBe('possible');
  });

  it('a later reply that only mentions it, without delivering, does not resolve it', () => {
    const talk = email({ direction: 'outbound', from: ME, to: [arjun], sentAt: ist('2026-09-27T10:00:00'), body: 'Still working on the budget, sorry.' });
    const [s] = run([promise, talk]).situations;
    expect(s!.systemLifecycle).toBe('open');
  });

  it('an email to someone else does not resolve it', () => {
    const other = email({ direction: 'outbound', from: ME, to: [{ name: 'X', email: 'x@y.example' }], sentAt: ist('2026-09-27T10:00:00'), body: 'budget attached', attachments: [{ filename: 'budget.xlsx', mime: 'x' }] });
    expect(run([promise, other]).situations[0]!.systemLifecycle).toBe('open');
  });
});

describe('missing information', () => {
  const req = email({ id: 'r', from: { name: 'HR', email: 'hr@co.example' }, sentAt: ist('2026-09-26T10:00:00'), body: 'Could you please send the signed offer letter?' });

  it('is raised when nothing matches', () => {
    expect(byType(run([req]).situations, 'missing_info')).toHaveLength(1);
  });

  it('is satisfied by a signed attachment sent to the requester afterwards', () => {
    const sent = email({ direction: 'outbound', from: ME, to: [{ name: 'HR', email: 'hr@co.example' }], sentAt: ist('2026-09-27T10:00:00'), body: 'attached', attachments: [{ filename: 'Offer_Letter_signed.pdf', mime: 'x' }] });
    expect(byType(run([req, sent]).situations, 'missing_info')).toHaveLength(0);
  });

  it('an unsigned upload is reported as a partial match, not a fulfilment', () => {
    const d = doc({ filename: 'offer.pdf', text: 'OFFER LETTER\nSignature: ________' });
    const [s] = byType(run([req, d]).situations, 'missing_info');
    expect(s!.details.type === 'missing_info' && s!.details.partialMatches).toEqual(['offer.pdf']);
  });
});

describe('source permissions (FR-3)', () => {
  it('disabling a source removes situations that depended on it', () => {
    const r = runPipeline(DEMO_SOURCES, { now: DEMO_NOW, sensitivity: 'conservative', disabledSourceIds: ['cal-acme'] });
    expect(r.situations.some((s) => s.id.startsWith('conflict') && s.evidence.some((e) => e.sourceId === 'doc-acme-letter'))).toBe(false);
  });

  it('disabling everything yields nothing and does not throw', () => {
    const r = runPipeline(DEMO_SOURCES, { now: DEMO_NOW, sensitivity: 'conservative', disabledSourceIds: DEMO_SOURCES.map((s) => s.id) });
    expect(r.situations).toEqual([]);
  });
});

describe('failure handling', () => {
  it('a malformed source is isolated and reported, others still process', () => {
    const broken = { ...email({ body: 'x' }), sentAt: 'not-a-date', body: 'Meeting on 5 October at 3 PM' } as RawSource;
    const r = run([broken, ...DEMO_SOURCES]);
    expect(r.stats.failedSources).toEqual([broken.id]);
    expect(r.situations.length).toBeGreaterThan(0);
  });

  it('invalid observations from an extra extractor are dropped and counted', () => {
    const r = runPipeline(DEMO_SOURCES.slice(0, 1), {
      now: NOW,
      sensitivity: 'conservative',
      extraExtractors: [(s) => [{ id: 'bad', sourceId: s.id, kind: 'event_time', value: 'nope' } as never]],
    });
    expect(r.stats.invalidObservations).toBe(1);
  });

  it('an extractor cannot attach an observation to a different source', () => {
    const r = runPipeline(DEMO_SOURCES.slice(0, 2), {
      now: NOW,
      sensitivity: 'conservative',
      extraExtractors: [
        (s) => [{ id: `x-${s.id}`, sourceId: 'someone-else', kind: 'document_present', documentNoun: 'NDA', signed: true, where: 'upload', filename: 'f', observedAt: NOW, authority: 'a', span: { text: 't', highlight: [0, 1] }, basis: 'explicit', extractor: { name: 'x', version: '1' } }],
      ],
    });
    expect(r.stats.invalidObservations).toBe(2);
  });
});

describe('views', () => {
  it('needs attention contains all open, urgent items and not the resolved one', () => {
    const r = runPipeline(DEMO_SOURCES, { now: DEMO_NOW, sensitivity: 'conservative' });
    const views = buildViews(r.situations, [], 'conservative', DEMO_NOW);
    const na = views.filter((v) => inView(v, 'needs_attention'));
    expect(na).toHaveLength(6);
    expect(views.filter((v) => inView(v, 'resolved'))).toHaveLength(1);
    // Overdue first
    expect(na[0]!.details.type === 'commitment' && na[0]!.details.state).toBe('overdue');
  });
});
