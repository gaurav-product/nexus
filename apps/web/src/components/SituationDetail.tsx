import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BellOff, Check, RotateCcw, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { addDays, formatDate, formatDateTime, formatTime, localParts, makeInstant, relativeDay, type Evidence, type SituationView } from '@nexus/core';
import { useStore } from '../state/store';
import { EvidenceSlip } from './EvidenceSlip';
import { ResolveDialog } from './ResolveDialog';
import { Button, Menu, STATUS, StatusBadge, TypeTag } from './ui';

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="mt-6">
      <h3 id={id ? `${id}-h` : undefined} className="mb-2 text-[13px] font-semibold text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Slips({ list }: { list: Evidence[] }) {
  return (
    <div className="flex flex-col gap-2">
      {list.map((e) => (
        <EvidenceSlip key={e.id} e={e} />
      ))}
    </div>
  );
}

const ATTR = { start: 'Time', departure: 'Departure', arrival: 'Arrival' } as const;

function EvidenceBlock({ s }: { s: SituationView }) {
  const d = s.details;
  if (d.type === 'conflict') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {d.versions.map((v, i) => {
          const ev = s.evidence.filter((e) => e.group === v.key);
          return (
            <div key={v.key} className="flex flex-col gap-2">
              <p className="flex items-baseline gap-2">
                <span className="text-[13px] font-semibold text-muted">Version {String.fromCharCode(65 + i)}</span>{' '}
                <span className="text-[16px] font-semibold">{formatDateTime(v.value)}</span>{' '}
                <span className="text-[12.5px] text-muted">
                  {v.sourceIds.length} {v.sourceIds.length === 1 ? 'source' : 'sources'}
                </span>
              </p>
              <Slips list={ev} />
            </div>
          );
        })}
      </div>
    );
  }
  if (d.type === 'change') {
    const before = s.evidence.filter((e) => e.role === 'before');
    const after = s.evidence.filter((e) => e.role === 'after');
    const stale = s.evidence.filter((e) => e.role === 'stale_copy');
    const affected = s.evidence.filter((e) => e.role === 'affected');
    const sameDay = d.changes.every((c) => formatDate(c.before) === formatDate(c.after));
    const fmt = (v: string) => (sameDay ? formatTime(v) : formatDateTime(v));
    return (
      <>
        <table className="mb-4 w-full max-w-md border-collapse text-[14px]">
          <caption className="sr-only">Before and after</caption>
          <thead>
            <tr className="text-left text-[12.5px] text-muted">
              <th scope="col" className="py-1 pr-4 font-medium" />
              <th scope="col" className="py-1 pr-4 font-medium">Before</th>
              <th scope="col" className="py-1 font-medium">Now</th>
            </tr>
          </thead>
          <tbody>
            {d.changes.map((c) => (
              <tr key={c.attribute} className="border-t border-rule">
                <th scope="row" className="py-1.5 pr-4 text-left font-medium">{ATTR[c.attribute]}</th>
                <td className="py-1.5 pr-4 text-muted line-through decoration-1">{fmt(c.before)}</td>
                <td className="py-1.5 font-semibold">{fmt(c.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mb-2 text-[13px] font-semibold text-muted">Before</p>
        <Slips list={before} />
        <p className="mb-2 mt-4 text-[13px] font-semibold text-muted">Now</p>
        <Slips list={after} />
        {stale.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[13px] font-semibold text-muted">Still showing the old time</p>
            <Slips list={stale} />
          </div>
        )}
        {affected.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[13px] font-semibold text-muted">May be affected</p>
            <Slips list={affected} />
          </div>
        )}
      </>
    );
  }
  if (d.type === 'commitment') {
    const promise = s.evidence.filter((e) => e.role === 'commitment');
    const done = s.evidence.filter((e) => e.role === 'fulfilment');
    return (
      <>
        <Slips list={promise} />
        {done.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[13px] font-semibold text-muted">Why Nexus thinks it was done</p>
            <Slips list={done} />
          </div>
        )}
      </>
    );
  }
  const req = s.evidence.filter((e) => e.role === 'request');
  const partial = s.evidence.filter((e) => e.role === 'partial_match');
  return (
    <>
      <Slips list={req} />
      {partial.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[13px] font-semibold text-muted">Closest match Nexus found</p>
          <Slips list={partial} />
        </div>
      )}
      <p className="mt-4 rounded-lg bg-sunk px-3 py-2 text-[13.5px] text-muted">
        Where Nexus looked: {d.searched.emails} emails ({d.searched.attachments} attachments) and {d.searched.documents} uploaded files. It can’t see anything
        outside your connected sources.
      </p>
    </>
  );
}

function snoozeOptions(now: string) {
  const p = localParts(now);
  const at = (days: number) => {
    const d = addDays(p.year, p.month, p.day, days);
    return makeInstant(d.year, d.month, d.day, 9, 0);
  };
  return [
    { label: 'Tomorrow morning', until: at(1) },
    { label: 'In 3 days', until: at(3) },
    { label: 'Next week', until: at(7) },
  ];
}

export function SituationDetail({ s, backTo }: { s: SituationView; backTo: string }) {
  const { decide, track, now } = useStore();
  const [resolving, setResolving] = useState(false);
  const [feedback, setFeedback] = useState<'yes' | 'no' | undefined>();
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    // Move focus to the new item when the user changes selection (screen readers
    // announce it), but not on first load, so the page doesn't open mid-content.
    if (!firstRender.current) heading.current?.focus({ preventScroll: false });
    firstRender.current = false;
    setFeedback(undefined);
    track('situation.viewed', { type: s.type, status: s.status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.id]);

  const closed = s.lifecycle === 'resolved' || s.lifecycle === 'dismissed';

  return (
    <article aria-labelledby="situation-title" className="mx-auto max-w-[72ch] px-4 pb-24 pt-4 sm:px-6 lg:pt-6">
      <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-[14px] font-medium text-action lg:hidden">
        <ArrowLeft aria-hidden size={16} /> Back to list
      </Link>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <TypeTag bucket={s.bucket} />
        {s.relevantAt && (
          <span className="text-[13px] text-muted">
            {formatDate(s.relevantAt)}, {relativeDay(s.relevantAt, now)}
          </span>
        )}
      </div>
      <h2 id="situation-title" ref={heading} tabIndex={-1} className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.01em] outline-none sm:text-[26px]">
        {s.title}
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <StatusBadge status={s.displayStatus} />
        <a href="#evidence" onClick={(e) => { e.preventDefault(); document.getElementById('evidence')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); track('evidence.opened', { type: s.type }); }} className="text-[13px] font-medium text-action underline-offset-2 hover:underline">
          Why am I seeing this?
        </a>
      </div>
      <p className="mt-1 text-[12.5px] text-muted">{STATUS[s.displayStatus].help}</p>

      {s.reopenedByNewEvidence && (
        <p role="note" className="mt-4 rounded-lg border border-conflict/40 bg-conflict-tint px-3 py-2 text-[14px]">
          This is back because new evidence arrived after you {s.decision?.action === 'dismiss' ? 'dismissed' : 'resolved'} it.
        </p>
      )}
      {closed && s.resolutionNote && (
        <p role="note" className="mt-4 flex items-start gap-2 rounded-lg bg-sunk px-3 py-2 text-[14px]">
          <Check aria-hidden size={16} className="mt-0.5 shrink-0 text-ok" />
          <span>{s.resolutionNote}</span>
        </p>
      )}

      <Section title="What Nexus found">
        <p className="text-[16px] leading-relaxed">{s.what}</p>
      </Section>
      <Section title="Why it matters">
        <p className="text-[15px] leading-relaxed text-ink">{s.why}</p>
      </Section>

      <Section title="Evidence" id="evidence">
        <p className="mb-3 text-[13px] text-muted">Exact text from your sources. Highlighted words are what Nexus relied on.</p>
        <EvidenceBlock s={s} />
      </Section>

      <Section title="Suggested next step">
        <p className="rounded-lg border-l-4 border-action bg-action-tint px-3 py-2.5 text-[15px]">{s.nextStep}</p>
        <p className="mt-1.5 text-[12.5px] text-muted">Nexus only suggests. It never sends, changes or deletes anything for you.</p>
      </Section>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
        {closed ? (
          <Button onClick={() => decide({ situationId: s.id, action: 'reopen' }, 'Reopened')}>
            <RotateCcw aria-hidden size={15} /> Reopen
          </Button>
        ) : (
          <>
            {s.details.type === 'conflict' ? (
              <Button variant="primary" onClick={() => setResolving(true)}>
                <Check aria-hidden size={15} /> Choose the correct version
              </Button>
            ) : (
              <Button variant="primary" onClick={() => decide({ situationId: s.id, action: 'resolve' }, 'Marked as resolved')}>
                <Check aria-hidden size={15} /> Mark as resolved
              </Button>
            )}
            <Menu
              label="Snooze"
              icon={<BellOff aria-hidden size={15} />}
              items={snoozeOptions(now).map((o) => ({
                label: o.label,
                hint: formatDateTime(o.until),
                onSelect: () => decide({ situationId: s.id, action: 'snooze', snoozeUntil: o.until }, `Snoozed until ${formatDateTime(o.until)}`),
              }))}
            />
            <Menu
              label="Dismiss"
              icon={<X aria-hidden size={15} />}
              items={[
                { label: 'Not relevant to me', onSelect: () => decide({ situationId: s.id, action: 'dismiss', reason: 'not_relevant' }, 'Dismissed') },
                { label: 'This is wrong', hint: 'Helps Nexus measure false alarms', onSelect: () => decide({ situationId: s.id, action: 'dismiss', reason: 'wrong' }, 'Dismissed as wrong') },
                { label: 'Already handled elsewhere', onSelect: () => decide({ situationId: s.id, action: 'dismiss', reason: 'handled_elsewhere' }, 'Dismissed') },
              ]}
            />
          </>
        )}
        <div className="ml-auto flex items-center gap-1 text-[13px] text-muted" role="group" aria-label="Was this useful?">
          {feedback ? (
            <span role="status">Thanks for the feedback.</span>
          ) : (
            <>
              <span className="mr-1">Useful?</span>
              <Button variant="quiet" aria-label="Yes, useful" onClick={() => { setFeedback('yes'); track('feedback.useful', { useful: true, type: s.type }); }}>
                <ThumbsUp aria-hidden size={15} />
              </Button>
              <Button variant="quiet" aria-label="No, not useful" onClick={() => { setFeedback('no'); track('feedback.useful', { useful: false, type: s.type }); }}>
                <ThumbsDown aria-hidden size={15} />
              </Button>
            </>
          )}
        </div>
      </div>

      <ResolveDialog
        situation={s}
        open={resolving}
        onClose={() => setResolving(false)}
        onConfirm={(choice) => {
          setResolving(false);
          decide({ situationId: s.id, action: 'resolve', choice }, 'Answer saved');
        }}
      />
    </article>
  );
}
