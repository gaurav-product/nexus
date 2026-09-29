import type { CalendarSource, DocumentSource, EmailSource, Person } from '../src/domain/types';

export const NOW = '2026-10-01T03:30:00.000Z'; // Thu 1 Oct 2026, 09:00 IST
export const ME: Person = { name: 'Riya Mehta', email: 'riya@riyamehta.example' };
export const ist = (s: string) => new Date(`${s}+05:30`).toISOString();

let n = 0;
export function email(p: Partial<EmailSource> & { body: string }): EmailSource {
  n++;
  return {
    id: p.id ?? `em-${n}`,
    kind: 'email',
    provider: 'demo',
    threadId: p.threadId ?? `th-${n}`,
    from: p.from ?? { name: 'Sam Lee', email: 'sam@other.example' },
    to: p.to ?? [ME],
    sentAt: p.sentAt ?? ist('2026-09-29T10:00:00'),
    subject: p.subject ?? 'Hello',
    direction: p.direction ?? 'inbound',
    attachments: p.attachments ?? [],
    ...p,
  } as EmailSource;
}

export function cal(p: Partial<CalendarSource> & { start: string; end: string; title: string }): CalendarSource {
  n++;
  return {
    id: p.id ?? `cal-${n}`,
    kind: 'calendar',
    provider: 'demo',
    uid: p.uid ?? `uid-${n}`,
    updatedAt: p.updatedAt ?? ist('2026-09-20T10:00:00'),
    ...p,
  } as CalendarSource;
}

export function doc(p: Partial<DocumentSource> & { text: string; filename: string }): DocumentSource {
  n++;
  return {
    id: p.id ?? `doc-${n}`,
    kind: 'document',
    provider: 'demo',
    uploadedAt: p.uploadedAt ?? ist('2026-09-28T10:00:00'),
    ...p,
  } as DocumentSource;
}
