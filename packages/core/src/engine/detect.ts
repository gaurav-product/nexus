import type {
  CalendarSource,
  CommitmentObservation,
  DocumentPresentObservation,
  DocumentRequestObservation,
  EmailSource,
  EventTimeObservation,
  Evidence,
  EvidenceRole,
  Observation,
  RawSource,
  Situation,
  Subject,
  TimeAttribute,
} from '../domain/types';
import { dayDiff, localParts, minutesBetween } from '../time/datetime';
import { domainOf, hash, keywords } from '../extract/text';
import { sourceLabel, sourceTime, type LinkResult } from './link';
import * as explain from './explain';

export interface DetectContext {
  now: string;
  sources: Map<string, RawSource>;
  observations: Observation[];
  link: LinkResult;
  flagged: Set<string>;
}

// ─── Evidence ────────────────────────────────────────────────────────────────

export function evidenceFrom(
  ctx: DetectContext,
  situationId: string,
  sourceId: string,
  role: EvidenceRole,
  span: { text: string; highlight: [number, number] },
  basis: 'explicit' | 'inferred',
  extra: { observationId?: string; group?: string } = {},
): Evidence {
  const src = ctx.sources.get(sourceId)!;
  return {
    id: `${situationId}:${sourceId}:${role}${extra.group ? `:${extra.group}` : ''}`,
    sourceId,
    observationId: extra.observationId,
    role,
    group: extra.group,
    sourceKind: src.kind,
    sourceLabel: sourceLabel(src),
    sourceTime: sourceTime(src),
    excerpt: span.text,
    highlight: span.highlight,
    basis,
    flagged: ctx.flagged.has(sourceId) || undefined,
  };
}

function fingerprint(parts: string[]): string {
  return hash([...parts].sort().join('|'));
}

// ─── Time situations: CHANGE and CONFLICT ───────────────────────────────────

interface ChangePair {
  attribute: TimeAttribute;
  before: EventTimeObservation;
  after: EventTimeObservation;
}

const CITY_ALIASES: Record<string, string[]> = {
  BLR: ['bengaluru', 'bangalore', 'blr'],
  DEL: ['delhi', 'new delhi', 'del'],
  BOM: ['mumbai', 'bom'],
  MAA: ['chennai', 'maa'],
  HYD: ['hyderabad', 'hyd'],
};

function destinationAliases(ctx: DetectContext, subject: Subject): string[] {
  for (const id of subject.sourceIds) {
    const s = ctx.sources.get(id)!;
    const text = s.kind === 'email' ? s.body : s.kind === 'calendar' ? s.title : s.text;
    const arrow = /(?:→|->|\bto\b)\s*(?:[A-Za-z]+\s*\()?([A-Z]{3})\)?/.exec(text);
    if (arrow && CITY_ALIASES[arrow[1]!]) return CITY_ALIASES[arrow[1]!]!;
  }
  return [];
}

function detectTime(ctx: DetectContext, subject: Subject, obs: EventTimeObservation[]): Situation[] {
  const out: Situation[] = [];
  const byAttr = new Map<TimeAttribute, EventTimeObservation[]>();
  for (const o of obs) byAttr.set(o.attribute, [...(byAttr.get(o.attribute) ?? []), o]);

  const changes: ChangePair[] = [];
  const superseded = new Set<string>();
  const stale = new Set<string>();

  for (const [attribute, list] of byAttr) {
    const sorted = [...list].sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
    let latest: ChangePair | undefined;
    for (const b of sorted) {
      if (!b.changeCue) continue;
      const a = [...sorted]
        .reverse()
        .find((x) => Date.parse(x.observedAt) < Date.parse(b.observedAt) && x.authority === b.authority && Date.parse(x.value) !== Date.parse(b.value));
      if (a) latest = { attribute, before: a, after: b };
    }
    if (!latest) continue;
    changes.push(latest);
    for (const x of sorted) {
      if (Date.parse(x.observedAt) < Date.parse(latest.after.observedAt) && Date.parse(x.value) === Date.parse(latest.before.value)) {
        superseded.add(x.id);
        if (x.authority !== latest.after.authority) stale.add(x.sourceId);
      }
    }
  }

  // CHANGE — one situation per subject, covering every changed attribute.
  if (changes.length > 0) {
    const id = `change:${subject.id}`;
    const primary = changes.find((c) => c.attribute !== 'arrival') ?? changes[0]!;
    const evidence: Evidence[] = [];
    for (const c of changes) {
      evidence.push(evidenceFrom(ctx, id, c.before.sourceId, 'before', c.before.span, 'explicit', { observationId: c.before.id, group: c.attribute }));
      evidence.push(evidenceFrom(ctx, id, c.after.sourceId, 'after', c.after.span, 'explicit', { observationId: c.after.id, group: c.attribute }));
    }
    const dedup = new Map<string, Evidence>();
    for (const e of evidence) {
      const k = `${e.sourceId}:${e.role}:${e.excerpt}`;
      const prev = dedup.get(k);
      // Same sentence carries several attributes ("departs 10:30 and arrives 13:10"): keep one slip, widen the mark.
      if (prev) dedup.set(k, { ...prev, group: undefined, highlight: [Math.min(prev.highlight[0], e.highlight[0]), Math.max(prev.highlight[1], e.highlight[1])] });
      else dedup.set(k, e);
    }
    const ev = [...dedup.values()];
    for (const sid of stale) {
      const o = obs.find((x) => x.sourceId === sid)!;
      ev.push(evidenceFrom(ctx, id, sid, 'stale_copy', o.span, 'explicit', { observationId: o.id }));
    }

    // Downstream impact: the new arrival/start leaves too little time before another dated item.
    const endChange = changes.find((c) => c.attribute === 'arrival') ?? changes.find((c) => c.attribute === 'start');
    const affected: { sourceId: string; title: string; start: string; gapMinutes: number }[] = [];
    if (endChange) {
      const aliases = destinationAliases(ctx, subject);
      for (const s of ctx.sources.values()) {
        if (s.kind !== 'calendar' || subject.sourceIds.includes(s.id)) continue;
        const gapNew = minutesBetween(endChange.after.value, s.start);
        const gapOld = minutesBetween(endChange.before.value, s.start);
        if (gapNew < 0 || gapNew >= 90 || gapNew >= gapOld) continue;
        if (localParts(s.start).day !== localParts(endChange.after.value).day) continue;
        const loc = (s.location ?? '').toLowerCase();
        if (aliases.length > 0 && !aliases.some((a) => loc.includes(a))) continue;
        affected.push({ sourceId: s.id, title: s.title, start: s.start, gapMinutes: gapNew });
        const when = explain.whenLine(s);
        ev.push(evidenceFrom(ctx, id, s.id, 'affected', { text: `${s.title}\n${when}${s.location ? `\n${s.location}` : ''}`, highlight: [s.title.length + 1, s.title.length + 1 + when.length] }, 'explicit'));
      }
    }

    const afterSrc = ctx.sources.get(primary.after.sourceId)!;
    const text = explain.change(ctx, subject, changes, [...stale], affected, afterSrc);
    out.push({
      id,
      type: 'change',
      ...text,
      status: 'strong',
      systemLifecycle: 'open',
      relevantAt: primary.after.value,
      evidence: ev,
      details: {
        type: 'change',
        attribute: primary.attribute,
        subjectLabel: subject.label,
        changes: changes.map((c) => ({ attribute: c.attribute, before: c.before.value, after: c.after.value })),
        changedAt: primary.after.observedAt,
        staleSourceIds: [...stale],
        affected,
      },
      evidenceFingerprint: fingerprint(ev.map((e) => `${e.sourceId}:${e.role}:${e.excerpt}`)),
    });
  }

  // CONFLICT — distinct current values for one attribute. Never pick a winner.
  for (const [attribute, list] of byAttr) {
    const current = list.filter((o) => !superseded.has(o.id));
    const groups = new Map<number, EventTimeObservation[]>();
    for (const o of current) {
      const k = Date.parse(o.value);
      groups.set(k, [...(groups.get(k) ?? []), o]);
    }
    if (groups.size < 2) continue;
    // Only report conflicts about things that haven't happened yet (or today).
    const earliest = Math.min(...groups.keys());
    if (dayDiff(new Date(earliest).toISOString(), ctx.now) < 0) continue;
    out.push(buildConflict(ctx, `conflict:${subject.id}:${attribute}`, subject.label, attribute, groups, 'strong'));
  }
  return out;
}

function buildConflict(
  ctx: DetectContext,
  id: string,
  label: string,
  attribute: TimeAttribute,
  groups: Map<number, EventTimeObservation[]>,
  linkStrength: 'strong' | 'weak',
): Situation {
  const versions = [...groups.entries()]
    .map(([ms, list]) => ({
      key: `v${hash(String(ms))}`,
      value: new Date(ms).toISOString(),
      sourceIds: [...new Set(list.map((o) => o.sourceId))],
      obs: list,
    }))
    .sort((a, b) => b.sourceIds.length - a.sourceIds.length || Date.parse(a.value) - Date.parse(b.value));

  const evidence: Evidence[] = [];
  for (const v of versions)
    for (const o of v.obs)
      evidence.push(evidenceFrom(ctx, id, o.sourceId, 'version', o.span, 'explicit', { observationId: o.id, group: v.key }));

  const text = explain.conflict(ctx, label, attribute, versions, linkStrength);
  return {
    id,
    type: 'conflict',
    ...text,
    status: linkStrength === 'strong' ? 'conflicting' : 'possible',
    systemLifecycle: 'open',
    relevantAt: versions.map((v) => v.value).sort()[0],
    evidence,
    details: {
      type: 'conflict',
      attribute,
      subjectLabel: label,
      versions: versions.map(({ key, value, sourceIds }) => ({ key, value, sourceIds })),
      linkStrength,
    },
    evidenceFingerprint: fingerprint(evidence.map((e) => `${e.sourceId}:${e.group}:${e.excerpt}`)),
  };
}

/** Weak links (name only): report as Possible, only if the two dates are close. */
function detectWeak(ctx: DetectContext, startsBySubject: Map<string, EventTimeObservation[]>): Situation[] {
  const out: Situation[] = [];
  for (const pair of ctx.link.weakPairs) {
    const a = startsBySubject.get(pair.a) ?? [];
    const b = startsBySubject.get(pair.b) ?? [];
    if (!a.length || !b.length) continue;
    const va = a[a.length - 1]!;
    const vb = b[b.length - 1]!;
    if (Date.parse(va.value) === Date.parse(vb.value)) continue;
    if (Math.abs(minutesBetween(va.value, vb.value)) > 3 * 24 * 60) continue;
    if (dayDiff([va.value, vb.value].sort()[0]!, ctx.now) < 0) continue;
    const groups = new Map<number, EventTimeObservation[]>([
      [Date.parse(va.value), [va]],
      [Date.parse(vb.value), [vb]],
    ]);
    const labelSrc = [va, vb].map((o) => ctx.sources.get(o.sourceId)!).find((s) => s.kind === 'calendar') as CalendarSource | undefined;
    const label = labelSrc?.title ?? 'Meeting';
    out.push(buildConflict(ctx, `conflict:${hash(pair.a + pair.b)}:start`, label, 'start', groups, 'weak'));
  }
  return out;
}

// ─── Commitments ─────────────────────────────────────────────────────────────

const DELIVERY_ACTIONS = new Set(['send', 'share', 'forward', 'submit', 'deliver', 'circulate', 'email']);

function findFulfilment(ctx: DetectContext, c: CommitmentObservation): { source: EmailSource; line: string; highlight: [number, number] } | undefined {
  if (c.kind === 'deadline' || !c.counterparty) return undefined;
  const words = keywords(c.object);
  if (words.length === 0) return undefined;
  const cp = c.counterparty.email.toLowerCase();
  const candidates = [...ctx.sources.values()]
    .filter((s): s is EmailSource => s.kind === 'email' && Date.parse(s.sentAt) > Date.parse(c.observedAt))
    .filter((s) =>
      c.owner === 'me'
        ? s.direction === 'outbound' && s.to.some((p) => p.email.toLowerCase() === cp)
        : s.direction === 'inbound' && domainOf(s.from.email) === domainOf(cp),
    )
    .sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt));

  for (const s of candidates) {
    const hay = `${s.subject}\n${s.body}\n${s.attachments.map((a) => a.filename.replace(/[_.-]/g, ' ')).join('\n')}`.toLowerCase();
    const hit = words.find((w) => hay.includes(w));
    if (!hit) continue;
    if (c.owner === 'me' && DELIVERY_ACTIONS.has(c.action)) {
      const delivered = s.attachments.length > 0 || /\b(attached|here'?s|here is|link)\b/i.test(s.body);
      if (!delivered) continue;
    }
    const att = s.attachments.find((a) => a.filename.toLowerCase().replace(/[_.-]/g, ' ').includes(hit));
    if (att) {
      const line = `Attachment: ${att.filename}`;
      return { source: s, line, highlight: [12, line.length] };
    }
    const line = s.body.split('\n').find((l) => l.toLowerCase().includes(hit)) ?? s.subject;
    const i = line.toLowerCase().indexOf(hit);
    return { source: s, line, highlight: [Math.max(0, i), Math.max(0, i) + hit.length] };
  }
  return undefined;
}

function detectCommitment(ctx: DetectContext, c: CommitmentObservation): Situation {
  const id = `commitment:${c.sourceId}:${hash(c.span.text)}`;
  const src = ctx.sources.get(c.sourceId) as EmailSource;
  const fulfilment = findFulfilment(ctx, c);
  let state: 'open' | 'due_soon' | 'overdue' | 'appears_fulfilled' = 'open';
  if (fulfilment) state = 'appears_fulfilled';
  else if (c.dueAt && Date.parse(c.dueAt) < Date.parse(ctx.now)) state = 'overdue';
  else if (c.dueAt && Date.parse(c.dueAt) - Date.parse(ctx.now) <= 48 * 3_600_000) state = 'due_soon';

  const evidence: Evidence[] = [evidenceFrom(ctx, id, c.sourceId, 'commitment', c.span, c.basis, { observationId: c.id })];
  if (fulfilment)
    evidence.push(evidenceFrom(ctx, id, fulfilment.source.id, 'fulfilment', { text: fulfilment.line, highlight: fulfilment.highlight }, 'inferred'));

  const subjectId = ctx.link.subjectOf.get(c.sourceId);
  const subject = ctx.link.subjects.find((s) => s.id === subjectId);
  const relatedEvent = subject?.sourceIds.map((i) => ctx.sources.get(i)!).find((s) => s.kind === 'calendar') as CalendarSource | undefined;

  const text = explain.commitment(ctx, c, state, fulfilment?.source, relatedEvent);
  const isDeadline = c.kind === 'deadline';
  return {
    id,
    type: 'commitment',
    ...text,
    status: state === 'appears_fulfilled' || isDeadline ? 'possible' : 'strong',
    systemLifecycle: state === 'appears_fulfilled' ? 'resolved' : 'open',
    systemResolutionReason: fulfilment
      ? `Appears fulfilled: Nexus found ${fulfilment.source.direction === 'outbound' ? 'your later email' : 'a later email'} that matches.`
      : undefined,
    relevantAt: c.dueAt,
    evidence,
    details: {
      type: 'commitment',
      owner: c.owner,
      ownerName: c.ownerName,
      counterparty: c.counterparty,
      action: c.action,
      object: c.object,
      dueAt: c.dueAt,
      dueText: c.dueText,
      state,
      isDeadline,
      fromBulkSender: !!src.bulk,
    },
    evidenceFingerprint: fingerprint(evidence.map((e) => `${e.sourceId}:${e.role}:${e.excerpt}`)),
  };
}

// ─── Missing / incomplete information ───────────────────────────────────────

function detectMissing(ctx: DetectContext, r: DocumentRequestObservation, present: DocumentPresentObservation[]): Situation | undefined {
  const requester = r.requester.email.toLowerCase();
  const matchesNoun = present.filter((p) => p.documentNoun === r.documentNoun);
  const satisfies = (p: DocumentPresentObservation) => {
    if (r.qualifier === 'signed' && !p.signed) return false;
    if (p.where === 'upload') return true;
    const s = ctx.sources.get(p.sourceId) as EmailSource;
    return s.direction === 'outbound' && s.to.some((t) => t.email.toLowerCase() === requester) && Date.parse(s.sentAt) > Date.parse(r.observedAt);
  };
  if (matchesNoun.some(satisfies)) return undefined;

  const id = `missing:${r.sourceId}:${r.documentNoun}`;
  const partial = matchesNoun.filter((p) => !satisfies(p));
  const evidence: Evidence[] = [evidenceFrom(ctx, id, r.sourceId, 'request', r.span, 'explicit', { observationId: r.id })];
  for (const p of partial) evidence.push(evidenceFrom(ctx, id, p.sourceId, 'partial_match', p.span, p.basis, { observationId: p.id }));

  const emails = [...ctx.sources.values()].filter((s): s is EmailSource => s.kind === 'email');
  const laterToRequester = emails.filter(
    (s) => s.direction === 'outbound' && s.to.some((t) => t.email.toLowerCase() === requester) && Date.parse(s.sentAt) > Date.parse(r.observedAt),
  );
  const searched = {
    emails: emails.length,
    attachments: emails.reduce((n, e) => n + e.attachments.length, 0),
    documents: [...ctx.sources.values()].filter((s) => s.kind === 'document').length,
  };
  const text = explain.missing(ctx, r, partial, laterToRequester.length);
  return {
    id,
    type: 'missing_info',
    ...text,
    status: 'needs_confirmation',
    systemLifecycle: 'open',
    evidence,
    details: {
      type: 'missing_info',
      requester: r.requester,
      documentNoun: r.documentNoun,
      qualifier: r.qualifier,
      searched,
      partialMatches: partial.map((p) => p.filename),
    },
    evidenceFingerprint: fingerprint([...evidence.map((e) => `${e.sourceId}:${e.role}`), `later:${laterToRequester.length}`]),
  };
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export function detectSituations(ctx: DetectContext): Situation[] {
  const situations: Situation[] = [];
  const events = ctx.observations.filter((o): o is EventTimeObservation => o.kind === 'event_time');

  const bySubject = new Map<string, EventTimeObservation[]>();
  for (const o of events) {
    const sid = ctx.link.subjectOf.get(o.sourceId)!;
    bySubject.set(sid, [...(bySubject.get(sid) ?? []), o]);
  }
  for (const subject of ctx.link.subjects) {
    const obs = bySubject.get(subject.id);
    if (obs?.length) situations.push(...detectTime(ctx, subject, obs));
  }

  const startsBySubject = new Map<string, EventTimeObservation[]>();
  for (const [sid, list] of bySubject)
    startsBySubject.set(sid, list.filter((o) => o.attribute === 'start').sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt)));
  situations.push(...detectWeak(ctx, startsBySubject));

  for (const c of ctx.observations)
    if (c.kind === 'commitment' || c.kind === 'deadline') situations.push(detectCommitment(ctx, c));

  const present = ctx.observations.filter((o): o is DocumentPresentObservation => o.kind === 'document_present');
  for (const r of ctx.observations)
    if (r.kind === 'document_request') {
      const s = detectMissing(ctx, r, present);
      if (s) situations.push(s);
    }

  return situations;
}
