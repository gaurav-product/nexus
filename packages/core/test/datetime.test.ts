import { describe, expect, it } from 'vitest';
import { findDates, findTimes, formatDateTime, localParts, makeInstant, relativeDay } from '../src/time/datetime';
import { ist, NOW } from './factories';

const ref = ist('2026-09-29T10:00:00'); // Tuesday

describe('date extraction', () => {
  it('parses "Monday, 5 October" and infers the year', () => {
    const [d] = findDates('your interview is on Monday, 5 October at 11:00 AM', ref);
    expect(d).toMatchObject({ year: 2026, month: 10, day: 5, relative: false });
  });

  it('parses month-first dates with a year', () => {
    const [d] = findDates('Due October 12, 2026.', ref);
    expect(d).toMatchObject({ year: 2026, month: 10, day: 12 });
  });

  it('resolves weekday names against the SENT date, not today', () => {
    const [d] = findDates("I'll send it by Thursday", ref);
    expect(d).toMatchObject({ month: 10, day: 1, relative: true });
  });

  it('a weekday said on that same weekday means next week', () => {
    const [d] = findDates('see you Tuesday', ref);
    expect(d).toMatchObject({ month: 10, day: 6 });
  });

  it('resolves tomorrow and today', () => {
    expect(findDates('tomorrow', ref)[0]).toMatchObject({ month: 9, day: 30 });
    expect(findDates('today', ref)[0]).toMatchObject({ month: 9, day: 29 });
  });

  it('does not double count a weekday inside a full date', () => {
    expect(findDates('Monday, 5 October', ref)).toHaveLength(1);
  });

  it('rolls a year-less date into next year when it is long past', () => {
    const [d] = findDates('on 5 January', ref);
    expect(d!.year).toBe(2027);
  });

  it('ignores words that look like months in other contexts poorly (known limitation documented)', () => {
    // "may" is ambiguous; we only match it next to a day number.
    expect(findDates('we may be late', ref)).toHaveLength(0);
  });
});

describe('time extraction', () => {
  it('parses 12-hour and 24-hour times', () => {
    expect(findTimes('at 11:00 AM')[0]).toMatchObject({ hour: 11, minute: 0 });
    expect(findTimes('at 5 PM')[0]).toMatchObject({ hour: 17, minute: 0 });
    expect(findTimes('at 12 pm')[0]).toMatchObject({ hour: 12 });
    expect(findTimes('at 12:30 a.m.')[0]).toMatchObject({ hour: 0, minute: 30 });
    expect(findTimes('departs 10:30')[0]).toMatchObject({ hour: 10, minute: 30 });
  });

  it('does not treat flight numbers or years as times', () => {
    expect(findTimes('Flight KS 2134 in 2026')).toHaveLength(0);
  });

  it('does not double count "11:00 AM" as 24h too', () => {
    expect(findTimes('11:00 AM')).toHaveLength(1);
  });
});

describe('instants and formatting', () => {
  it('builds IST instants and formats them back', () => {
    const i = makeInstant(2026, 10, 5, 11, 0);
    expect(i).toBe('2026-10-05T05:30:00.000Z');
    expect(formatDateTime(i)).toBe('Mon 5 Oct, 11:00');
  });

  it('compares UTC-stored calendar times correctly', () => {
    expect(localParts('2026-10-07T09:30:00.000Z')).toMatchObject({ hour: 15, minute: 0, day: 7 });
  });

  it('relative day labels', () => {
    expect(relativeDay(ist('2026-10-01T23:00:00'), NOW)).toBe('today');
    expect(relativeDay(ist('2026-10-05T11:00:00'), NOW)).toBe('in 4 days');
    expect(relativeDay(ist('2026-09-30T23:59:00'), NOW)).toBe('yesterday');
  });
});
