import type { RawSource, SubjectKey } from '../domain/types';
import { findDates, localParts } from '../time/datetime';

const REFERENCE_RE =
  /\b(?:ref(?:erence)?(?:\s*(?:no\.?|number))?|pnr|booking(?:\s*ref(?:erence)?)?|confirmation(?:\s*code)?)\s*[:#]?\s*([A-Z0-9][A-Z0-9-]{4,})\b/gi;
const FLIGHT_RE = /\b([A-Z]{2})\s?(\d{3,4})\b/g;
const WITH_NAME_RE = /\b(?:[Cc]all|[Mm]eeting|[Cc]atch[- ]?up|[Ss]ync|[Cc]hat)\s+with\s+([A-Z][a-z]+)\b/;
const MEETING_WORD_RE = /\b(call|meeting|catch[- ]?up|sync|chat)\b/i;

function referenceKeys(text: string): SubjectKey[] {
  const keys: SubjectKey[] = [];
  for (const m of text.matchAll(REFERENCE_RE)) {
    const value = m[1]!.toUpperCase();
    // A reference must contain a digit — avoids matching ordinary words after "confirmation".
    if (/\d/.test(value)) keys.push({ type: 'reference', value, strength: 'strong' });
  }
  return keys;
}

/** Flight keys need a date; a flight number alone repeats every day. */
function flightKeys(text: string, refIso: string, fallbackIso?: string): SubjectKey[] {
  if (!/\bflight\b/i.test(text)) return [];
  const dates = findDates(text, refIso).filter((d) => !d.relative);
  const days = [...new Set(dates.map((d) => `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`))];
  let day: string | undefined = days.length === 1 ? days[0] : undefined;
  if (!day && fallbackIso) {
    const p = localParts(fallbackIso);
    day = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
  }
  if (!day) return [];
  const keys: SubjectKey[] = [];
  for (const m of text.matchAll(FLIGHT_RE)) {
    keys.push({ type: 'flight', value: `${m[1]}${m[2]}@${day}`, strength: 'strong' });
  }
  return keys;
}

/** Identifiers that tie a source to a real-world subject (D-007). */
export function keysForSource(source: RawSource): SubjectKey[] {
  const keys: SubjectKey[] = [];
  switch (source.kind) {
    case 'email': {
      keys.push({ type: 'thread', value: source.threadId, strength: 'strong' });
      if (source.icsUid) keys.push({ type: 'ics_uid', value: source.icsUid.toLowerCase(), strength: 'strong' });
      const text = `${source.subject}\n${source.body}`;
      keys.push(...referenceKeys(text));
      keys.push(...flightKeys(text, source.sentAt));
      if (source.direction === 'inbound' && !source.bulk && MEETING_WORD_RE.test(source.body)) {
        const first = source.from.name.trim().split(/\s+/)[0];
        if (first) keys.push({ type: 'name', value: first.toLowerCase(), strength: 'weak' });
      }
      break;
    }
    case 'calendar': {
      keys.push({ type: 'ics_uid', value: source.uid.toLowerCase(), strength: 'strong' });
      keys.push(...flightKeys(source.title, source.start, source.start));
      const m = WITH_NAME_RE.exec(source.title);
      if (m) keys.push({ type: 'name', value: m[1]!.toLowerCase(), strength: 'weak' });
      break;
    }
    case 'document': {
      keys.push(...referenceKeys(source.text));
      keys.push(...flightKeys(source.text, source.uploadedAt));
      break;
    }
  }
  // De-duplicate
  const seen = new Set<string>();
  return keys.filter((k) => {
    const id = `${k.type}:${k.value}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
