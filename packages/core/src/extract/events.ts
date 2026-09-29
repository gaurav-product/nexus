import type {
  CalendarSource,
  DocumentSource,
  EmailSource,
  EventTimeObservation,
  RawSource,
  TimeAttribute,
} from '../domain/types';
import { findDates, findTimes, makeInstant, formatDateTime, formatTime, type DateMatch } from '../time/datetime';
import { domainOf, hash, sentences } from './text';

export const EVENT_EXTRACTOR = { name: 'rules.event_time', version: '1.0.0' };

const EVENT_CUE = /\b(interview|meeting|call|workshop|flight|departs?|departure|arrives?|arrival|session|appointment|scheduled|confirmed for)\b/i;
const HISTORICAL_CUE = /\b(previous(?:ly)?|originally|was scheduled|instead of|old time)\b/i;
const CHANGE_CUE = /\b(reschedul\w*|moved to|has changed|have changed|changed to|schedule change|new time|now (?:departs|starts|begins|at)|updated time|revised time)\b/i;
const FLIGHT_NO = /\b[A-Z]{2}\s?\d{3,4}\b/;

function attributeFor(sentence: string, timeIndex: number, isFlight: boolean): TimeAttribute {
  const before = sentence.slice(0, timeIndex).toLowerCase();
  const dep = Math.max(before.lastIndexOf('depart'), before.lastIndexOf('takes off'));
  const arr = before.lastIndexOf('arriv');
  if (dep === -1 && arr === -1) return isFlight ? 'departure' : 'start';
  return arr > dep ? 'arrival' : 'departure';
}

function nearest(dates: DateMatch[], index: number): DateMatch | undefined {
  let best: DateMatch | undefined;
  let bestDist = Infinity;
  for (const d of dates) {
    const dist = Math.abs(d.index - index);
    if (dist < bestDist) {
      best = d;
      bestDist = dist;
    }
  }
  return best;
}

/**
 * Extract event times from free text (email bodies, document text).
 * A time is only an event time when the sentence has an event cue; historical
 * sentences ("your previous departure was 08:15") are skipped.
 */
function fromText(
  source: EmailSource | DocumentSource,
  text: string,
  observedAt: string,
  authority: string,
  changeContext: boolean,
): EventTimeObservation[] {
  const out: EventTimeObservation[] = [];
  const parts = sentences(text);

  // Fallback date: if the whole text mentions exactly one calendar day, times without
  // a date in their own sentence belong to it ("Arrives: 10:55").
  const allDates = parts.flatMap((s) => findDates(s.text, observedAt));
  const distinctDays = new Map(allDates.map((d) => [`${d.year}-${d.month}-${d.day}`, d]));
  const fallback = distinctDays.size === 1 ? [...distinctDays.values()][0] : undefined;

  const flightContext = FLIGHT_NO.test(text) && /\bflight\b/i.test(text);

  for (const s of parts) {
    if (HISTORICAL_CUE.test(s.text)) continue;
    const times = findTimes(s.text);
    if (times.length === 0) continue;
    const cue = EVENT_CUE.test(s.text) || (flightContext && /^(departs|arrives)/i.test(s.text));
    if (!cue) continue;

    const dates = findDates(s.text, observedAt);
    const changeCue = changeContext || CHANGE_CUE.test(s.text);

    for (const t of times) {
      const d = nearest(dates, t.index) ?? fallback;
      if (!d) continue;
      const attribute = attributeFor(s.text, t.index, flightContext);
      const value = makeInstant(d.year, d.month, d.day, t.hour, t.minute);
      const inSentence = dates.includes(d);
      const start = inSentence ? Math.min(d.index, t.index) : t.index;
      const end = inSentence ? Math.max(d.index + d.length, t.index + t.length) : t.index + t.length;
      out.push({
        id: `obs:${source.id}:${attribute}:${hash(s.text + t.index)}`,
        sourceId: source.id,
        kind: 'event_time',
        attribute,
        value,
        changeCue,
        observedAt,
        authority,
        span: { text: s.text, highlight: [start, end] },
        basis: 'explicit',
        extractor: EVENT_EXTRACTOR,
      });
    }
  }
  return out;
}

function fromCalendar(source: CalendarSource): EventTimeObservation[] {
  const isFlight = /\bflight\b/i.test(source.title) && FLIGHT_NO.test(source.title);
  const when = `${formatDateTime(source.start)} – ${formatTime(source.end)}`;
  const text = `${source.title}\n${when}${source.location ? `\n${source.location}` : ''}`;
  const hl: [number, number] = [source.title.length + 1, source.title.length + 1 + when.length];
  const base = {
    sourceId: source.id,
    kind: 'event_time' as const,
    changeCue: false,
    observedAt: source.updatedAt,
    authority: 'calendar',
    span: { text, highlight: hl },
    basis: 'explicit' as const,
    extractor: EVENT_EXTRACTOR,
    label: source.title,
  };
  if (isFlight) {
    return [
      { ...base, id: `obs:${source.id}:departure`, attribute: 'departure', value: source.start },
      { ...base, id: `obs:${source.id}:arrival`, attribute: 'arrival', value: source.end },
    ];
  }
  return [{ ...base, id: `obs:${source.id}:start`, attribute: 'start', value: source.start }];
}

export function extractEventTimes(source: RawSource): EventTimeObservation[] {
  switch (source.kind) {
    case 'calendar':
      return fromCalendar(source);
    case 'email': {
      if (source.bulk) return [];
      const changeContext = CHANGE_CUE.test(source.subject);
      return fromText(source, source.body, source.sentAt, domainOf(source.from.email), changeContext);
    }
    case 'document':
      return fromText(source, source.text, source.uploadedAt, 'document', false);
  }
}
