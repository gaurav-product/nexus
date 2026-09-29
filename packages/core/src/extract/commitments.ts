import type {
  CommitmentObservation,
  DocumentPresentObservation,
  DocumentRequestObservation,
  RawSource,
} from '../domain/types';
import { endOfLocalDay, findDates } from '../time/datetime';
import { domainOf, hash, sentences } from './text';

export const COMMITMENT_EXTRACTOR = { name: 'rules.commitment', version: '1.0.0' };
export const DOCUMENT_EXTRACTOR = { name: 'rules.document', version: '1.0.0' };

const PROMISE_RE =
  /\b(I'll|I will|I'm going to|I am going to|we'll|we will|we're going to)\s+(send|share|confirm|forward|submit|deliver|circulate|email)\b/i;
const DUE_PREP_RE = /\s+(by|before|on|until)\s+$/i;
const DEADLINE_RE = /\b(ends|closes|deadline|due|last date|expires)\b/i;

/**
 * Commitments: first-person promises. Outbound → mine; inbound → theirs (Waiting).
 * Relative dates ("by Thursday") resolve against the SENT time of the message.
 */
export function extractCommitments(source: RawSource): CommitmentObservation[] {
  if (source.kind !== 'email') return [];
  const out: CommitmentObservation[] = [];
  const mine = source.direction === 'outbound';

  for (const s of sentences(source.body)) {
    const m = PROMISE_RE.exec(s.text);
    if (m && !source.bulk) {
      const afterVerb = m.index + m[0].length;
      const dates = findDates(s.text, source.sentAt).filter((d) => d.index >= afterVerb);
      const due = dates[0];
      // Object: words after the verb up to the due phrase or a clause break.
      let objectEnd = due ? due.index : s.text.length;
      const clause = s.text.slice(afterVerb, objectEnd).search(/\s+(so|to|and|because|once|when)\s+|[,.;!?]/);
      if (clause >= 0) objectEnd = Math.min(objectEnd, afterVerb + clause);
      let object = s.text.slice(afterVerb, objectEnd).replace(DUE_PREP_RE, '').trim();
      if (!object) object = 'what was promised';
      // Re-voice first-person possessives so the UI can say "you'd share your deck".
      if (mine) object = object.replace(/\b(my|our)\b/gi, 'your');
      else object = object.replace(/\b(our)\b/gi, 'their');

      let dueText: string | undefined;
      let dueAt: string | undefined;
      if (due) {
        const prep = /(by|before|on|until)\s+$/i.exec(s.text.slice(0, due.index));
        const start = prep ? due.index - prep[0].length : due.index;
        dueText = s.text.slice(start, due.index + due.length);
        dueAt = endOfLocalDay(due.year, due.month, due.day);
      }
      const hlEnd = due ? due.index + due.length : afterVerb + object.length;

      out.push({
        id: `obs:${source.id}:commitment:${hash(s.text)}`,
        sourceId: source.id,
        kind: 'commitment',
        owner: mine ? 'me' : 'other',
        ownerName: mine ? 'You' : source.from.name,
        counterparty: mine ? source.to[0] : source.from,
        action: m[2]!.toLowerCase(),
        object,
        dueAt,
        dueText,
        observedAt: source.sentAt,
        authority: domainOf(source.from.email),
        span: { text: s.text, highlight: [m.index, hlEnd] },
        basis: 'explicit',
        extractor: COMMITMENT_EXTRACTOR,
      });
      continue;
    }

    // Deadlines addressed to the reader ("pricing ends Saturday, 3 October").
    const dl = DEADLINE_RE.exec(s.text);
    if (dl && source.direction === 'inbound') {
      const dates = findDates(s.text, source.sentAt);
      const due = dates[0];
      if (!due) continue;
      const object = s.text.slice(0, dl.index).replace(/[—–-]\s*$/, '').trim() || s.text;
      out.push({
        id: `obs:${source.id}:deadline:${hash(s.text)}`,
        sourceId: source.id,
        kind: 'deadline',
        owner: 'me',
        ownerName: 'You',
        counterparty: source.from,
        action: 'act on',
        object,
        dueAt: endOfLocalDay(due.year, due.month, due.day),
        dueText: s.text.slice(dl.index, due.index + due.length),
        observedAt: source.sentAt,
        authority: domainOf(source.from.email),
        span: { text: s.text, highlight: [dl.index, due.index + due.length] },
        basis: 'inferred',
        extractor: COMMITMENT_EXTRACTOR,
      });
    }
  }
  return out;
}

// ─── Documents ───────────────────────────────────────────────────────────────

/** Canonical document nouns and the phrases that mean them. */
const DOC_NOUNS: [string, RegExp][] = [
  ['NDA', /\b(nda|non[- ]disclosure agreement)\b/i],
  ['offer letter', /\boffer letter\b/i],
  ['contract', /\bcontract\b/i],
  ['invoice', /\binvoice\b/i],
  ['ID proof', /\b(id proof|passport|aadhaar)\b/i],
  ['certificate', /\bcertificate\b/i],
];

function nounIn(text: string): string | undefined {
  for (const [noun, re] of DOC_NOUNS) if (re.test(text)) return noun;
  return undefined;
}

const REQUEST_RE = /\b(could you|can you|would you|please|kindly)\b[^.?!]*\b(send|share|sign|return|upload|provide)\b/i;

export function extractDocumentRequests(source: RawSource): DocumentRequestObservation[] {
  if (source.kind !== 'email' || source.direction !== 'inbound' || source.bulk) return [];
  const out: DocumentRequestObservation[] = [];
  for (const s of sentences(source.body)) {
    const m = REQUEST_RE.exec(s.text);
    if (!m) continue;
    const noun = nounIn(s.text.slice(m.index));
    if (!noun) continue;
    const signed = /\b(signed|sign)\b/i.test(s.text);
    const re = DOC_NOUNS.find(([n]) => n === noun)![1];
    const nm = re.exec(s.text)!;
    out.push({
      id: `obs:${source.id}:request:${hash(s.text)}`,
      sourceId: source.id,
      kind: 'document_request',
      requester: source.from,
      documentNoun: noun,
      qualifier: signed ? 'signed' : undefined,
      observedAt: source.sentAt,
      authority: domainOf(source.from.email),
      span: { text: s.text, highlight: [m.index, nm.index + nm[0].length] },
      basis: 'explicit',
      extractor: DOCUMENT_EXTRACTOR,
    });
  }
  return out;
}

/** A signature line counts as signed only if something other than blanks follows it. */
const SIGNED_LINE_RE = /\b(signed(?: for [^:\n]+)?|signature)\s*:\s*(?!_{3,}|\s*$)[^\n_]{2,}/i;
const DIGITAL_SIG_RE = /\b(digitally signed by|e-?signed by|\/s\/)\b/i;

export function extractDocumentsPresent(source: RawSource): DocumentPresentObservation[] {
  const out: DocumentPresentObservation[] = [];
  if (source.kind === 'document') {
    const head = `${source.filename}\n${source.text.slice(0, 300)}`;
    const noun = nounIn(head);
    if (noun) {
      const signed = SIGNED_LINE_RE.test(source.text) || DIGITAL_SIG_RE.test(source.text);
      const lines = source.text.split('\n');
      const sigLine =
        lines.find((l) => /\b(signed(?: for [^:]+)?|signature)\s*:/i.test(l)) ??
        lines.find((l) => /digitally signed|e-?signed/i.test(l)) ??
        lines[0]!;
      out.push({
        id: `obs:${source.id}:doc`,
        sourceId: source.id,
        kind: 'document_present',
        documentNoun: noun,
        signed,
        where: 'upload',
        filename: source.filename,
        observedAt: source.uploadedAt,
        authority: 'document',
        span: { text: sigLine, highlight: [0, sigLine.length] },
        basis: signed ? 'explicit' : 'inferred',
        extractor: DOCUMENT_EXTRACTOR,
      });
    }
  }
  if (source.kind === 'email') {
    for (const a of source.attachments) {
      const noun = nounIn(a.filename.replace(/[_.-]/g, ' '));
      if (!noun) continue;
      out.push({
        id: `obs:${source.id}:att:${hash(a.filename)}`,
        sourceId: source.id,
        kind: 'document_present',
        documentNoun: noun,
        signed: /\b(signed|executed)\b/i.test(a.filename.replace(/[_.-]/g, ' ')),
        where: 'attachment',
        filename: a.filename,
        observedAt: source.sentAt,
        authority: domainOf(source.from.email),
        span: { text: `Attachment: ${a.filename}`, highlight: [12, 12 + a.filename.length] },
        basis: 'inferred',
        extractor: DOCUMENT_EXTRACTOR,
      });
    }
  }
  return out;
}
