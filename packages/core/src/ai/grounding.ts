/**
 * Grounding check for AI-written text (layer 5 of the prompt-injection model).
 *
 * Rejects any text that introduces a date, time, number, month/weekday, or
 * capitalised name that doesn't appear in the evidence. It is deliberately strict:
 * a false rejection only costs us the nicer phrasing (we fall back to the template);
 * a false acceptance could put an invented fact in front of the user.
 */

const TIME_RE = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b\d{1,2}:\d{2}\b/gi;
const NUMBER_RE = /\b\d+(?:[.,]\d+)?\b/g;
const MONTH_WD_RE = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/gi;
const NAME_RE = /(?<![.!?]\s|^)\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;

const ALLOWED_CAPITALISED = new Set(['Nexus', 'You', 'Your', 'I', 'The', 'This', 'It', 'If', 'Check', 'Confirm']);

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ');
}

function normTime(t: string) {
  return t.toLowerCase().replace(/\s+/g, '').replace(/^0/, '');
}

export interface GroundingResult {
  ok: boolean;
  ungrounded: string[];
}

export function validateGrounded(candidate: string, evidenceTexts: string[]): GroundingResult {
  const evidence = norm(evidenceTexts.join('\n'));
  const evidenceTimes = new Set((evidence.match(TIME_RE) ?? []).map(normTime));
  const ungrounded: string[] = [];

  for (const t of candidate.match(TIME_RE) ?? []) if (!evidenceTimes.has(normTime(t))) ungrounded.push(t);

  const withoutTimes = candidate.replace(TIME_RE, ' ');
  for (const n of withoutTimes.match(NUMBER_RE) ?? []) if (!evidence.includes(n.toLowerCase())) ungrounded.push(n);

  for (const m of candidate.match(MONTH_WD_RE) ?? []) if (!evidence.includes(m.toLowerCase().slice(0, 3))) ungrounded.push(m);

  for (const name of candidate.match(NAME_RE) ?? []) {
    if (ALLOWED_CAPITALISED.has(name)) continue;
    if (MONTH_WD_RE.test(name)) {
      MONTH_WD_RE.lastIndex = 0;
      continue;
    }
    MONTH_WD_RE.lastIndex = 0;
    if (!evidence.includes(name.toLowerCase())) ungrounded.push(name);
  }

  return { ok: ungrounded.length === 0, ungrounded };
}
