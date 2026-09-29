import { Link } from 'react-router-dom';
import { formatDate, relativeDay, type SituationView, type View } from '@nexus/core';
import { STATUS, TYPE } from './ui';

export const VIEW_LABEL: Record<View, string> = {
  needs_attention: 'Needs attention',
  conflicts: 'Conflicts',
  changes: 'Changes',
  commitments: 'Commitments',
  waiting: 'Waiting',
  resolved: 'Resolved',
  missing: 'Requests',
};

export const NAV_VIEWS: View[] = ['needs_attention', 'conflicts', 'changes', 'commitments', 'waiting', 'resolved'];

function when(s: SituationView, now: string): string | undefined {
  if (s.lifecycle === 'snoozed' && s.decision?.snoozeUntil) return `Snoozed until ${formatDate(s.decision.snoozeUntil)}`;
  if (s.details.type === 'commitment' && s.details.state === 'overdue') return `Overdue, was due ${relativeDay(s.relevantAt!, now)}`;
  if (!s.relevantAt) return undefined;
  return `${formatDate(s.relevantAt)}, ${relativeDay(s.relevantAt, now)}`;
}

export function SituationList({
  items,
  view,
  selectedId,
  now,
}: {
  items: SituationView[];
  view: View;
  selectedId?: string;
  now: string;
}) {
  return (
    <ul className="flex flex-col" aria-label={VIEW_LABEL[view]}>
      {items.map((s) => {
        const t = TYPE[s.bucket];
        const st = STATUS[s.displayStatus];
        const Icon = t.icon;
        const selected = s.id === selectedId;
        const w = when(s, now);
        return (
          <li key={s.id}>
            <Link
              to={`/inbox/${view}/${encodeURIComponent(s.id)}`}
              aria-current={selected ? 'true' : undefined}
              data-situation-id={s.id}
              className={`group relative flex gap-3 border-b border-rule py-3 pl-4 pr-4 outline-offset-[-2px] transition-colors ${
                selected ? 'bg-surface' : 'hover:bg-surface/70'
              } ${s.lifecycle === 'snoozed' ? 'opacity-70' : ''}`}
            >
              <span aria-hidden className={`absolute bottom-2 left-0 top-2 w-[3px] rounded-r ${t.stripe} ${selected ? 'opacity-100' : 'opacity-70'}`} />
              <Icon aria-hidden size={16} strokeWidth={2.25} className={`mt-0.5 shrink-0 ${t.text}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-snug">{s.title}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted">
                  <span className="sr-only">{t.label}.</span>
                  <span className={s.displayStatus === 'conflicting' ? 'font-medium text-conflict' : ''}>{st.label}</span>
                  {w && (
                    <>
                      <span aria-hidden className="text-faint">/</span>
                      <span>{w}</span>
                    </>
                  )}
                  {s.reopenedByNewEvidence && <span className="font-medium text-conflict">New evidence</span>}
                </span>
                <span className="mt-1 line-clamp-2 block text-[13.5px] text-muted">{s.what}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
