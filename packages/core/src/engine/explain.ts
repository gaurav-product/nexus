/**
 * Deterministic explanations (FR-21). Every sentence is built from extracted facts,
 * so it can't say anything the evidence doesn't. Optional AI rephrasing must pass
 * `validateGrounded` (ai/grounding.ts) or the template text is kept.
 *
 * Copy rules (docs/design/ux-design.md): attribute every fact to its source; never
 * "you must"; "may"/"check" when the evidence is weak.
 */
import type {
  CalendarSource,
  CommitmentObservation,
  DocumentPresentObservation,
  DocumentRequestObservation,
  EmailSource,
  EventTimeObservation,
  RawSource,
  Subject,
  TimeAttribute,
} from '../domain/types';
import { dayDiff, formatDate, formatDateTime, formatTime, localParts, relativeDay } from '../time/datetime';
import { firstName, shortSubject, sourcePhrase } from './link';
import type { DetectContext } from './detect';

export interface SituationText {
  title: string;
  what: string;
  why: string;
  nextStep: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const numberWord = (n: number) => ['zero', 'one', 'two', 'three', 'four', 'five'][n] ?? String(n);

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function whenLine(s: CalendarSource): string {
  return `${formatDateTime(s.start)} – ${formatTime(s.end)}`;
}

const ATTR_NOUN: Record<TimeAttribute, string> = { start: 'time', departure: 'departure', arrival: 'arrival' };

// ─── Conflict ───────────────────────────────────────────────────────────────

export function conflict(
  ctx: DetectContext,
  label: string,
  attribute: TimeAttribute,
  versions: { value: string; sourceIds: string[] }[],
  linkStrength: 'strong' | 'weak',
): SituationText {
  const parts = versions.map((v) => localParts(v.value));
  const sameDay = parts.every((p) => p.year === parts[0]!.year && p.month === parts[0]!.month && p.day === parts[0]!.day);
  const sameClock = parts.every((p) => p.hour === parts[0]!.hour && p.minute === parts[0]!.minute);
  const dimension = sameDay ? 'time' : sameClock ? 'date' : 'date and time';
  const short = shortSubject(label);
  const earliest = versions.map((v) => v.value).sort()[0]!;
  const rel = relativeDay(earliest, ctx.now);

  if (linkStrength === 'weak') {
    const [a, b] = versions;
    const srcA = ctx.sources.get(a!.sourceIds[0]!)!;
    const srcB = ctx.sources.get(b!.sourceIds[0]!)!;
    const cal = [srcA, srcB].find((s) => s.kind === 'calendar') as CalendarSource | undefined;
    const mail = [srcA, srcB].find((s) => s.kind === 'email') as EmailSource | undefined;
    const calV = versions.find((v) => v.sourceIds.includes(cal?.id ?? ''));
    const mailV = versions.find((v) => v.sourceIds.includes(mail?.id ?? ''));
    const who = mail?.from.name ?? 'someone';
    return {
      title: `${short}: possibly a different day`,
      what:
        cal && mail && calV && mailV
          ? `Your calendar has “${cal.title}” on ${formatDateTime(calV.value)}. ${who} emailed about “our call” on ${formatDateTime(mailV.value)}.`
          : `Two sources mention what may be the same meeting at different times.`,
      why: `Nexus matched these by first name only, so they may be two different calls. If they're the same, one of you has the wrong ${dimension}.`,
      nextStep: `Check whether these are the same call. If they are, confirm the ${dimension} with ${firstName(who)}.`,
    };
  }

  const sentences = versions.map((v) => {
    const phrases = v.sourceIds.map((id) => sourcePhrase(ctx.sources.get(id)!));
    const onlyCalendar = v.sourceIds.length === 1 && ctx.sources.get(v.sourceIds[0]!)!.kind === 'calendar';
    const verb = onlyCalendar ? 'shows' : v.sourceIds.length > 1 ? 'say' : 'says';
    return `${cap(joinList(phrases))} ${verb} ${formatDateTime(v.value)}.`;
  });

  const organizer = findOrganizer(ctx, versions.flatMap((v) => v.sourceIds));
  const kind = /interview/i.test(label) ? 'interview' : /flight/i.test(label) ? 'flight' : 'event';
  const miss =
    dimension === 'date' ? 'on the wrong day' : dimension === 'time' ? 'at the wrong time' : 'at the wrong time and day';
  const tally = versions.length === 2 && versions[0]!.sourceIds.length !== versions[1]!.sourceIds.length
    ? ` ${cap(numberWord(versions[0]!.sourceIds.length))} sources agree and one doesn't, but the majority can still be wrong.`
    : '';

  return {
    title: `${short}: ${dimension} conflict`,
    what: sentences.join(' '),
    why: `The ${kind} is ${rel}. If you go by the wrong source, you could turn up ${miss}.${tally}`,
    nextStep: organizer
      ? `Confirm the ${dimension} with ${organizer}, then fix whichever source is wrong.`
      : `Confirm the correct ${dimension}, then fix whichever source is wrong.`,
  };
}

function findOrganizer(ctx: DetectContext, sourceIds: string[]): string | undefined {
  for (const id of sourceIds) {
    const s = ctx.sources.get(id)!;
    if (s.kind === 'calendar' && s.organizer) return s.organizer.name;
  }
  for (const id of sourceIds) {
    const s = ctx.sources.get(id)!;
    if (s.kind === 'email' && s.direction === 'inbound') return s.from.name;
  }
  return undefined;
}

// ─── Change ─────────────────────────────────────────────────────────────────

export function change(
  ctx: DetectContext,
  subject: Subject,
  changes: { attribute: TimeAttribute; before: EventTimeObservation; after: EventTimeObservation }[],
  staleSourceIds: string[],
  affected: { sourceId: string; title: string; start: string; gapMinutes: number }[],
  announcer: RawSource,
): SituationText {
  const isFlight = /\bflight\b/i.test(subject.label);
  const primary = changes.find((c) => c.attribute !== 'arrival') ?? changes[0]!;
  const sameDay = (a: string, b: string) => formatDate(a) === formatDate(b);
  const fmt = (c: (typeof changes)[number], v: string) =>
    sameDay(c.before.value, c.after.value) ? formatTime(v) : formatDateTime(v);

  const who = announcer.kind === 'email' ? announcer.from.name : 'A source';
  const clauses = [...changes]
    .sort((a, b) => (a.attribute === 'arrival' ? 1 : 0) - (b.attribute === 'arrival' ? 1 : 0))
    .map((c) => `${ATTR_NOUN[c.attribute]} from ${fmt(c, c.before.value)} to ${fmt(c, c.after.value)}`);
  const onDay = sameDay(primary.before.value, primary.after.value) ? ` on ${formatDate(primary.after.value)}` : '';

  const flightNo = /\b([A-Z]{2})\s?(\d{3,4})\b/.exec(subject.label);
  const title = isFlight && flightNo
    ? `Flight ${flightNo[1]} ${flightNo[2]} now ${primary.attribute === 'departure' ? 'departs' : 'starts'} ${formatTime(primary.after.value)}`
    : `${shortSubject(subject.label)} was rescheduled`;

  const why: string[] = [];
  if (staleSourceIds.length > 0) {
    const phrases = staleSourceIds.map((id) => sourcePhrase(ctx.sources.get(id)!));
    why.push(`${cap(joinList(phrases))} still ${staleSourceIds.length > 1 ? 'show' : 'shows'} the old time.`);
  }
  for (const a of affected) {
    why.push(`“${a.title}” starts at ${formatTime(a.start)}, only ${a.gapMinutes} minutes after you ${isFlight ? 'land' : 'finish'}, so it may be affected.`);
  }
  if (why.length === 0) why.push(`Anything you planned around the old time may need updating.`);

  let nextStep = 'Update your calendar to the new time.';
  if (affected.length > 0) {
    const org = ctx.sources.get(affected[0]!.sourceId) as CalendarSource;
    nextStep = `Decide whether to ask ${org.organizer?.name ?? 'the organiser'} to move “${affected[0]!.title}”, or look for an earlier flight. Then update your calendar.`;
  }

  return {
    title,
    what: `${who} changed the ${joinList(clauses)}${onDay}.`,
    why: why.join(' '),
    nextStep,
  };
}

// ─── Commitment ─────────────────────────────────────────────────────────────

function stripArticle(s: string) {
  return s.replace(/^(the|a|an|my|our|your)\s+/i, '');
}

export function commitment(
  ctx: DetectContext,
  c: CommitmentObservation,
  state: 'open' | 'due_soon' | 'overdue' | 'appears_fulfilled',
  fulfilledBy: EmailSource | undefined,
  relatedEvent: CalendarSource | undefined,
): SituationText {
  const thing = stripArticle(c.object);
  const due = c.dueAt ? `${c.dueText ? `${c.dueText} (${formatDate(c.dueAt)})` : `by ${formatDate(c.dueAt)}`}` : '';
  const dueRel = c.dueAt ? relativeDay(c.dueAt, ctx.now) : '';

  if (c.kind === 'deadline') {
    return {
      title: `${cap(thing)} ends ${c.dueAt ? formatDate(c.dueAt) : 'soon'}`,
      what: `A mailing-list email from ${c.counterparty?.name ?? 'a sender'} says ${c.dueText ?? 'there is a deadline'}.`,
      why: `This came from a bulk sender. Nexus shows it only in Sensitive mode, because most promotional deadlines don't need you.`,
      nextStep: `Ignore it unless you already planned to act on it.`,
    };
  }

  if (c.owner === 'me') {
    const to = c.counterparty?.name ?? 'them';
    const what = `You told ${to} you'd ${c.action} ${c.object}${due ? ` ${due}` : ''}.`;
    if (state === 'appears_fulfilled') {
      const att = fulfilledBy?.attachments[0]?.filename;
      return {
        title: `${cap(thing)} appears sent`,
        what,
        why: `Nexus found a later email from you to ${to}${att ? ` with ${att} attached` : ' that mentions it'}, so it moved this to Resolved.`,
        nextStep: `Nothing to do. Reopen this if that email wasn't what you promised.`,
      };
    }
    const title =
      state === 'overdue' ? `${cap(thing)} is overdue` : c.dueAt ? `${cap(thing)} due ${dueRel === 'today' || dueRel === 'tomorrow' ? dueRel : formatDate(c.dueAt)}` : `${cap(thing)} promised`;
    const why =
      state === 'overdue'
        ? `It was due ${dueRel}, and Nexus hasn't found a later email to ${to} that includes it.`
        : state === 'due_soon'
          ? `It's due ${dueRel}, and Nexus hasn't found a later email to ${to} that includes it yet.`
          : c.dueAt
            ? `It's due ${dueRel}. Nexus will keep this open until it sees you send it.`
            : `No date was given, so Nexus won't nag, but it will keep this open until it sees you send it.`;
    return { title, what, why, nextStep: `Send it to ${to}, or let them know when to expect it.` };
  }

  // Someone else's promise to me → Waiting
  const who = c.ownerName;
  const first = firstName(who);
  const what = `${who} said they'd ${c.action} ${c.object}${due ? ` ${due}` : ''}.`;
  if (state === 'appears_fulfilled') {
    return {
      title: `${cap(thing)} from ${first} arrived`,
      what,
      why: `Nexus found a later email from ${first}'s organisation that mentions it, so it moved this to Resolved.`,
      nextStep: `Nothing to do. Reopen this if that email didn't actually include it.`,
    };
  }
  const context = relatedEvent ? ` It relates to “${shortSubject(relatedEvent.title)}”.` : '';
  const why =
    state === 'overdue'
      ? `That was ${dueRel}, and Nexus hasn't found a later email from ${first} about it.${context}`
      : c.dueAt
        ? `It's expected ${dueRel}.${context}`
        : `No date was given.${context}`;
  return {
    title: `Waiting on ${thing} from ${first}`,
    what,
    why,
    nextStep: state === 'overdue' ? `Send ${first} a short follow-up asking for the ${thing}.` : `Nothing yet. Nexus will flag it if it's late.`,
  };
}

// ─── Missing information ────────────────────────────────────────────────────

export function missing(
  ctx: DetectContext,
  r: DocumentRequestObservation,
  partial: DocumentPresentObservation[],
  laterEmailsToRequester: number,
): SituationText {
  const q = r.qualifier === 'signed' ? 'signed ' : '';
  const who = r.requester.name;
  const found =
    partial.length > 0
      ? ` Nexus found ${partial.length === 1 ? `an ${r.qualifier === 'signed' ? 'unsigned ' : ''}copy` : `${partial.length} ${r.qualifier === 'signed' ? 'unsigned ' : ''}copies`} (${partial.map((p) => p.filename).join(', ')}), but no ${q}version in your connected sources.`
      : ` Nexus didn't find it in your connected sources.`;
  const later =
    laterEmailsToRequester > 0
      ? `Your ${laterEmailsToRequester === 1 ? 'later email' : `${laterEmailsToRequester} later emails`} to ${firstName(who)} ${laterEmailsToRequester === 1 ? "doesn't" : "don't"} include it.`
      : `There's no later email from you to ${firstName(who)} with it attached.`;
  return {
    title: `${cap(q)}${r.documentNoun} not found`.replace(/^./, (c) => c.toUpperCase()),
    what: `${who} asked you to send the ${q}${r.documentNoun}.${found}`,
    why: `${later} Nexus can only see what's connected, so it may have been sent another way.`,
    nextStep: `If you've already sent it, mark this resolved. If not, ${r.qualifier === 'signed' ? 'sign it and ' : ''}send it to ${who}.`,
  };
}

export { dayDiff };
