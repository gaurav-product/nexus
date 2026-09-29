import { Link } from 'react-router-dom';
import { CalendarDays, FileText, Mail, ShieldAlert } from 'lucide-react';
import { formatDateTime, type Evidence } from '@nexus/core';

const KIND_ICON = { email: Mail, calendar: CalendarDays, document: FileText };

/**
 * One piece of evidence: the exact source text, in the serif "source voice",
 * with the words Nexus relied on marked. Principles 1 & 2.
 */
export function EvidenceSlip({ e, onOpen, hideLink = false }: { e: Evidence; onOpen?: () => void; hideLink?: boolean }) {
  const Icon = KIND_ICON[e.sourceKind];
  const [a, b] = e.highlight;
  const before = e.excerpt.slice(0, a);
  const marked = e.excerpt.slice(a, b);
  const after = e.excerpt.slice(b);
  const when = e.sourceKind === 'calendar' ? `updated ${formatDateTime(e.sourceTime)}` : e.sourceKind === 'document' ? `uploaded ${formatDateTime(e.sourceTime)}` : `sent ${formatDateTime(e.sourceTime)}`;

  return (
    <figure className="rounded-lg border border-rule bg-surface">
      <figcaption className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-rule px-3 py-2 text-[12.5px] text-muted">
        <Icon aria-hidden size={14} className="shrink-0" />
        <span className="font-semibold text-ink">{e.sourceLabel}</span>
        <span>{when}</span>
        <span
          className={`ml-auto rounded px-1.5 py-px text-[11.5px] font-medium ${e.basis === 'explicit' ? 'bg-sunk text-ink' : 'border border-dashed border-rule-strong text-muted'}`}
          title={e.basis === 'explicit' ? 'The source says this directly.' : 'Nexus inferred this from the source.'}
        >
          {e.basis === 'explicit' ? 'Stated in source' : 'Inferred by Nexus'}
        </span>
      </figcaption>
      <blockquote className="whitespace-pre-line px-3 py-2.5 font-serif text-[15.5px] leading-relaxed text-ink">
        {before}
        {marked && <mark className="evidence-mark">{marked}</mark>}
        {after}
      </blockquote>
      <div className="flex flex-wrap items-center gap-3 px-3 pb-2.5 text-[12.5px]">
        {!hideLink && (
          <Link to={`/sources?open=${encodeURIComponent(e.sourceId)}`} onClick={onOpen} className="font-medium text-action underline-offset-2 hover:underline">
            Open full {e.sourceKind === 'calendar' ? 'event' : e.sourceKind}
          </Link>
        )}
        {e.flagged && (
          <span className="inline-flex items-center gap-1 text-warn">
            <ShieldAlert aria-hidden size={13} /> This source contains text aimed at AI assistants. Nexus treats it as data only.
          </span>
        )}
      </div>
    </figure>
  );
}
