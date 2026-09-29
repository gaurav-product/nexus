import { describe, expect, it } from 'vitest';
import { extractEventTimes } from '../src/extract/events';
import { extractCommitments, extractDocumentRequests, extractDocumentsPresent } from '../src/extract/commitments';
import { keysForSource } from '../src/extract/keys';
import { ObservationSchema } from '../src/domain/schemas';
import { cal, doc, email, ist, ME } from './factories';

describe('event-time extraction', () => {
  it('extracts an interview time with the highlighted span', () => {
    const e = email({ body: 'Just confirming your interview is on Monday, 5 October at 11:00 AM IST.' });
    const [o] = extractEventTimes(e);
    expect(o).toMatchObject({ kind: 'event_time', attribute: 'start', value: ist('2026-10-05T11:00:00'), basis: 'explicit' });
    expect(o!.span.text.slice(...o!.span.highlight)).toBe('Monday, 5 October at 11:00 AM');
  });

  it('ignores times in sentences without an event cue', () => {
    expect(extractEventTimes(email({ body: 'The office opens at 9:00 AM on 5 October.' }))).toHaveLength(0);
  });

  it('skips historical sentences', () => {
    const e = email({ body: 'Your previous departure time was 08:15 on 8 October.' });
    expect(extractEventTimes(e)).toHaveLength(0);
  });

  it('assigns departure and arrival in one sentence', () => {
    const e = email({ subject: 'Schedule change', body: 'Flight KS 2134 on 8 October 2026 now departs at 10:30 and arrives at 13:10.' });
    const obs = extractEventTimes(e);
    expect(obs.map((o) => [o.attribute, o.value])).toEqual([
      ['departure', ist('2026-10-08T10:30:00')],
      ['arrival', ist('2026-10-08T13:10:00')],
    ]);
    expect(obs.every((o) => o.changeCue)).toBe(true);
  });

  it('borrows the single date in the message for a time-only line', () => {
    const e = email({ body: 'Flight KS 2134\nDeparts: Thursday, 8 October 2026 at 08:15\nArrives: 10:55' });
    const arr = extractEventTimes(e).find((o) => o.attribute === 'arrival');
    expect(arr!.value).toBe(ist('2026-10-08T10:55:00'));
  });

  it('extracts nothing from bulk senders', () => {
    expect(extractEventTimes(email({ bulk: true, body: 'Webinar starts Monday, 5 October at 11:00 AM.' }))).toHaveLength(0);
  });

  it('calendar events of flights yield departure and arrival', () => {
    const c = cal({ title: 'Flight KS 2134 DEL → BLR', start: ist('2026-10-08T08:15:00'), end: ist('2026-10-08T10:55:00') });
    expect(extractEventTimes(c).map((o) => o.attribute)).toEqual(['departure', 'arrival']);
  });
});

describe('commitment extraction', () => {
  it('extracts my promise with due date from sent time', () => {
    const e = email({
      direction: 'outbound',
      from: ME,
      to: [{ name: 'Arjun Rao', email: 'arjun@northwind.example' }],
      sentAt: ist('2026-09-29T17:30:00'),
      body: "I'll send the revised proposal by Thursday so your team can review it.",
    });
    const [c] = extractCommitments(e);
    expect(c).toMatchObject({ owner: 'me', action: 'send', object: 'the revised proposal', dueText: 'by Thursday', dueAt: ist('2026-10-01T23:59:00') });
  });

  it('re-voices first-person possessives', () => {
    const e = email({ direction: 'outbound', from: ME, body: "I'll share my portfolio deck by Friday." });
    expect(extractCommitments(e)[0]!.object).toBe('your portfolio deck');
  });

  it('marks inbound promises as owned by the sender (Waiting)', () => {
    const e = email({ from: { name: 'Neha Kapoor', email: 'neha@acme.example' }, body: "We'll confirm the panel names by Wednesday." });
    expect(extractCommitments(e)[0]).toMatchObject({ owner: 'other', ownerName: 'Neha Kapoor', object: 'the panel names' });
  });

  it('keeps undated promises without a due date', () => {
    const [c] = extractCommitments(email({ direction: 'outbound', from: ME, body: "I'll send the notes." }));
    expect(c!.dueAt).toBeUndefined();
  });

  it('does not treat requests or statements as commitments', () => {
    expect(extractCommitments(email({ body: 'Could you send the report?' }))).toHaveLength(0);
    expect(extractCommitments(email({ direction: 'outbound', from: ME, body: "I'll be in the office tomorrow." }))).toHaveLength(0);
  });

  it('extracts reader-facing deadlines as inferred', () => {
    const [d] = extractCommitments(email({ body: 'Early-bird pricing ends Saturday, 3 October — register now.' }));
    expect(d).toMatchObject({ kind: 'deadline', basis: 'inferred' });
  });
});

describe('document requests & presence', () => {
  it('extracts a signed-document request', () => {
    const [r] = extractDocumentRequests(email({ body: 'Could you please send the signed NDA before then?' }));
    expect(r).toMatchObject({ documentNoun: 'NDA', qualifier: 'signed' });
  });

  it('treats blank signature lines as unsigned', () => {
    const [p] = extractDocumentsPresent(doc({ filename: 'nda.pdf', text: 'NON-DISCLOSURE AGREEMENT\nSigned for A: ________\nSigned for B: ________' }));
    expect(p).toMatchObject({ documentNoun: 'NDA', signed: false });
  });

  it('treats filled signature lines as signed', () => {
    const [p] = extractDocumentsPresent(doc({ filename: 'nda.pdf', text: 'NDA\nSigned for A: Arjun Rao\nSigned for B: Riya Mehta' }));
    expect(p!.signed).toBe(true);
  });

  it('a generic filename does not satisfy a specific request', () => {
    expect(extractDocumentsPresent(email({ body: 'attached', attachments: [{ filename: 'scan.pdf', mime: 'application/pdf' }] }))).toHaveLength(0);
  });
});

describe('subject keys', () => {
  it('extracts references, flights (with date), threads and UIDs as strong', () => {
    const keys = keysForSource(email({ threadId: 't1', icsUid: 'ABC@x', body: 'PNR: X7KQ2M\nFlight KS 2134 on 8 October 2026' }));
    expect(keys).toEqual(
      expect.arrayContaining([
        { type: 'thread', value: 't1', strength: 'strong' },
        { type: 'ics_uid', value: 'abc@x', strength: 'strong' },
        { type: 'reference', value: 'X7KQ2M', strength: 'strong' },
        { type: 'flight', value: 'KS2134@2026-10-08', strength: 'strong' },
      ]),
    );
  });

  it('first names only ever create weak keys', () => {
    const k = keysForSource(cal({ title: 'Call with Priya', start: ist('2026-10-02T17:00:00'), end: ist('2026-10-02T17:30:00') }));
    expect(k.find((x) => x.type === 'name')).toEqual({ type: 'name', value: 'priya', strength: 'weak' });
  });

  it('words after "confirmation" without digits are not references', () => {
    expect(keysForSource(email({ body: 'Booking confirmed' })).some((k) => k.type === 'reference')).toBe(false);
  });
});

describe('validation boundary', () => {
  it('every rule-based observation passes the schema', () => {
    const e = email({ body: "Your interview is on Monday, 5 October at 11:00 AM. We'll confirm the panel by Wednesday." });
    for (const o of [...extractEventTimes(e), ...extractCommitments(e)]) expect(ObservationSchema.safeParse(o).success).toBe(true);
  });

  it('rejects malformed observations', () => {
    const bad = { kind: 'event_time', id: 'x', sourceId: 's', value: 'not a date', attribute: 'start' };
    expect(ObservationSchema.safeParse(bad).success).toBe(false);
  });
});
