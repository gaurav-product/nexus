/**
 * Deterministic date/time handling.
 *
 * All comparisons are on instants (epoch ms). Parsing of human text is done in the
 * user's time zone. The demo user is in India (IST, UTC+05:30, no DST), which lets
 * us use a fixed offset. A multi-zone user needs an IANA-aware parser — documented
 * as a limitation.
 */

export const USER_TIME_ZONE = 'Asia/Kolkata';
export const USER_OFFSET_MINUTES = 330;

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface LocalParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = Sunday
}

/** Wall-clock parts of an instant in the user's zone. */
export function localParts(iso: string, offsetMinutes = USER_OFFSET_MINUTES): LocalParts {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new Error(`Invalid instant: ${iso}`);
  const d = new Date(ms + offsetMinutes * 60_000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    weekday: d.getUTCDay(),
  };
}

/** Build an instant from wall-clock parts in the user's zone. */
export function makeInstant(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  offsetMinutes = USER_OFFSET_MINUTES,
): string {
  const ms = Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60_000;
  return new Date(ms).toISOString();
}

export function endOfLocalDay(year: number, month: number, day: number): string {
  return makeInstant(year, month, day, 23, 59);
}

export function addDays(year: number, month: number, day: number, n: number) {
  const d = new Date(Date.UTC(year, month - 1, day + n));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function sameInstant(a: string, b: string): boolean {
  return Date.parse(a) === Date.parse(b);
}

export function minutesBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 60_000);
}

// ─── Formatting (stable, locale-independent) ───────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

export function formatTime(iso: string): string {
  const p = localParts(iso);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatDate(iso: string): string {
  const p = localParts(iso);
  return `${WEEKDAY_SHORT[p.weekday]} ${p.day} ${MONTH_SHORT[p.month - 1]}`;
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

/** "today", "tomorrow", "in 4 days", "yesterday", "3 days ago" — by calendar day in user zone. */
export function relativeDay(iso: string, nowIso: string): string {
  const a = localParts(iso);
  const n = localParts(nowIso);
  const diff = Math.round(
    (Date.UTC(a.year, a.month - 1, a.day) - Date.UTC(n.year, n.month - 1, n.day)) / 86_400_000,
  );
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}

export function dayDiff(iso: string, nowIso: string): number {
  const a = localParts(iso);
  const n = localParts(nowIso);
  return Math.round(
    (Date.UTC(a.year, a.month - 1, a.day) - Date.UTC(n.year, n.month - 1, n.day)) / 86_400_000,
  );
}

// ─── Parsing human text ─────────────────────────────────────────────────────

export interface DateMatch {
  index: number;
  length: number;
  year: number;
  month: number;
  day: number;
  relative: boolean;
}

export interface TimeMatch {
  index: number;
  length: number;
  hour: number;
  minute: number;
}

const MONTH_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const WD_RE = '(?:(mon|tue|wed|thu|fri|sat|sun)[a-z]*\\.?,?\\s+)?';

const DAY_MONTH = new RegExp(`\\b${WD_RE}(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH_RE}\\.?(?:,?\\s+(\\d{4}))?\\b`, 'gi');
const MONTH_DAY = new RegExp(`\\b${WD_RE}${MONTH_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`, 'gi');
const WEEKDAY_ALONE = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
const RELATIVE = /\b(today|tonight|tomorrow)\b/gi;

function monthIndex(token: string): number {
  return MONTHS.indexOf(token.slice(0, 3).toLowerCase()) + 1;
}

/** Resolve a year-less date to the occurrence nearest the reference (no more than ~2 months in the past). */
function inferYear(month: number, day: number, ref: LocalParts): number {
  const candidate = Date.UTC(ref.year, month - 1, day);
  const refMs = Date.UTC(ref.year, ref.month - 1, ref.day);
  return candidate < refMs - 60 * 86_400_000 ? ref.year + 1 : ref.year;
}

/**
 * Find all dates in `text`, resolving relative expressions against `refIso`
 * (the time the message was sent — NOT "now").
 */
export function findDates(text: string, refIso: string): DateMatch[] {
  const ref = localParts(refIso);
  const found: DateMatch[] = [];

  for (const m of text.matchAll(DAY_MONTH)) {
    const month = monthIndex(m[3]!);
    const day = Number(m[2]);
    const year = m[4] ? Number(m[4]) : inferYear(month, day, ref);
    found.push({ index: m.index!, length: m[0].length, year, month, day, relative: false });
  }
  for (const m of text.matchAll(MONTH_DAY)) {
    const month = monthIndex(m[2]!);
    const day = Number(m[3]);
    const year = m[4] ? Number(m[4]) : inferYear(month, day, ref);
    found.push({ index: m.index!, length: m[0].length, year, month, day, relative: false });
  }
  for (const m of text.matchAll(RELATIVE)) {
    const word = m[1]!.toLowerCase();
    const d = addDays(ref.year, ref.month, ref.day, word === 'tomorrow' ? 1 : 0);
    found.push({ index: m.index!, length: m[0].length, ...d, relative: true });
  }
  for (const m of text.matchAll(WEEKDAY_ALONE)) {
    const target = WEEKDAYS.indexOf(m[1]!.toLowerCase());
    let delta = (target - ref.weekday + 7) % 7;
    if (delta === 0) delta = 7; // "on Thursday" said on a Thursday means next week
    const d = addDays(ref.year, ref.month, ref.day, delta);
    found.push({ index: m.index!, length: m[0].length, ...d, relative: true });
  }

  // Drop matches contained in a longer match (e.g. "Monday" inside "Monday, 5 October").
  found.sort((a, b) => a.index - b.index || b.length - a.length);
  const result: DateMatch[] = [];
  for (const f of found) {
    const covered = result.some((r) => f.index >= r.index && f.index + f.length <= r.index + r.length);
    if (!covered) result.push(f);
  }
  return result;
}

const TIME_12 = /\b(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?\s?m\.?(?![a-z])/gi;
const TIME_24 = /\b([01]?\d|2[0-3]):([0-5]\d)\b(?!\s*[ap]\.?\s?m)/gi;

export function findTimes(text: string): TimeMatch[] {
  const out: TimeMatch[] = [];
  for (const m of text.matchAll(TIME_12)) {
    let hour = Number(m[1]);
    const minute = m[2] ? Number(m[2]) : 0;
    if (hour < 1 || hour > 12 || minute > 59) continue;
    const pm = m[3]!.toLowerCase() === 'p';
    if (pm && hour !== 12) hour += 12;
    if (!pm && hour === 12) hour = 0;
    out.push({ index: m.index!, length: m[0].length, hour, minute });
  }
  for (const m of text.matchAll(TIME_24)) {
    const overlaps = out.some((o) => m.index! >= o.index && m.index! < o.index + o.length);
    if (!overlaps) out.push({ index: m.index!, length: m[0].length, hour: Number(m[1]), minute: Number(m[2]) });
  }
  return out.sort((a, b) => a.index - b.index);
}
