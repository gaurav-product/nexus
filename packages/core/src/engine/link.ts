import type { RawSource, Subject, SubjectKey } from '../domain/types';
import { firstName, hash } from '../extract/text';

// ─── Human labels for sources (used in evidence and explanations) ───────────

export function sourceLabel(source: RawSource): string {
  switch (source.kind) {
    case 'email':
      return source.direction === 'outbound'
        ? `Your email to ${source.to[0]?.name ?? 'recipient'}`
        : `Email from ${source.from.name}`;
    case 'calendar':
      return 'Your calendar';
    case 'document':
      return `Uploaded file ${source.filename}`;
  }
}

/** Lower-case phrase for use inside a sentence ("the email from Neha Kapoor"). */
export function sourcePhrase(source: RawSource): string {
  switch (source.kind) {
    case 'email':
      return source.direction === 'outbound'
        ? `your email to ${source.to[0]?.name ?? 'the recipient'}`
        : `the email from ${source.from.name}`;
    case 'calendar':
      return 'your calendar';
    case 'document':
      return source.filename;
  }
}

export function sourceTime(source: RawSource): string {
  switch (source.kind) {
    case 'email':
      return source.sentAt;
    case 'calendar':
      return source.updatedAt;
    case 'document':
      return source.uploadedAt;
  }
}

export function shortSubject(label: string): string {
  const clean = label.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  if (clean.includes('—') && /interview/i.test(clean)) return `${clean.split('—')[0]!.trim()} interview`;
  return clean;
}

export { firstName };

// ─── Linking (D-007) ─────────────────────────────────────────────────────────

export interface LinkResult {
  subjects: Subject[];
  subjectOf: Map<string, string>;
  /** Pairs of subjects that share only a weak key. */
  weakPairs: { a: string; b: string; key: SubjectKey }[];
}

const KEY_PRIORITY: Record<SubjectKey['type'], number> = { ics_uid: 0, reference: 1, flight: 2, thread: 3, name: 9 };

/**
 * The subject's id must survive new sources joining it — otherwise a new email in
 * a thread would change the situation id and orphan the user's decisions (FR-16/24).
 * So the id comes from the most stable strong identifier, not from membership.
 */
function canonicalKey(members: RawSource[], keys: Map<string, SubjectKey[]>): string | undefined {
  const all = members
    .flatMap((m) => keys.get(m.id) ?? [])
    .filter((k) => k.strength === 'strong')
    .map((k) => ({ p: KEY_PRIORITY[k.type], v: `${k.type}:${k.value}` }))
    .sort((a, b) => a.p - b.p || a.v.localeCompare(b.v));
  return all[0]?.v;
}

/**
 * Union-find over sources that share a STRONG key. Weak keys never merge subjects;
 * they only produce candidate pairs that detection may report as "Possible".
 */
export function linkSources(sources: RawSource[], keys: Map<string, SubjectKey[]>): LinkResult {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let p = parent.get(x) ?? x;
    if (p !== x) {
      p = find(p);
      parent.set(x, p);
    }
    return p;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra < rb ? rb : ra, ra < rb ? ra : rb);
  };

  const firstByKey = new Map<string, string>();
  for (const s of sources) {
    parent.set(s.id, s.id);
  }
  for (const s of sources) {
    for (const k of keys.get(s.id) ?? []) {
      if (k.strength !== 'strong') continue;
      const id = `${k.type}:${k.value}`;
      const prev = firstByKey.get(id);
      if (prev) union(prev, s.id);
      else firstByKey.set(id, s.id);
    }
  }

  const groups = new Map<string, RawSource[]>();
  for (const s of sources) {
    const root = find(s.id);
    groups.set(root, [...(groups.get(root) ?? []), s]);
  }

  const subjects: Subject[] = [];
  const subjectOf = new Map<string, string>();
  for (const members of groups.values()) {
    const ids = members.map((m) => m.id).sort();
    const id = `subj:${hash(canonicalKey(members, keys) ?? ids[0]!)}`;
    const cal = members.find((m) => m.kind === 'calendar');
    const email = members.find((m) => m.kind === 'email');
    const label =
      cal?.kind === 'calendar'
        ? cal.title
        : email?.kind === 'email'
          ? email.subject.replace(/^((re|fwd?|invitation):\s*)+/i, '')
          : members[0]!.kind === 'document'
            ? (members[0] as { filename: string }).filename
            : id;
    const allKeys = members.flatMap((m) => keys.get(m.id) ?? []);
    subjects.push({ id, label, keys: allKeys, sourceIds: ids });
    for (const m of members) subjectOf.set(m.id, id);
  }

  const weakPairs: LinkResult['weakPairs'] = [];
  const byWeak = new Map<string, Set<string>>();
  for (const subj of subjects) {
    for (const k of subj.keys) {
      if (k.strength !== 'weak') continue;
      const id = `${k.type}:${k.value}`;
      byWeak.set(id, (byWeak.get(id) ?? new Set()).add(subj.id));
    }
  }
  for (const [id, set] of byWeak) {
    const list = [...set].sort();
    const [type, value] = [id.split(':')[0] as SubjectKey['type'], id.slice(id.indexOf(':') + 1)];
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++)
        weakPairs.push({ a: list[i]!, b: list[j]!, key: { type, value, strength: 'weak' } });
  }

  subjects.sort((a, b) => a.id.localeCompare(b.id));
  return { subjects, subjectOf, weakPairs };
}
