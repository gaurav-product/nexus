import { useEffect, useMemo } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { CircleCheck, Inbox as InboxIcon, Loader2, TriangleAlert } from 'lucide-react';
import { inView, type View } from '@nexus/core';
import { useStore } from '../state/store';
import { NAV_VIEWS, SituationList, VIEW_LABEL } from '../components/SituationList';
import { SituationDetail } from '../components/SituationDetail';
import { Button, EmptyState } from '../components/ui';

const EMPTY: Record<string, { title: string; body: string }> = {
  needs_attention: { title: 'Nothing needs your attention', body: 'Nexus will surface conflicts, changes, commitments and requests here when it finds them.' },
  conflicts: { title: 'No conflicts', body: 'Your linked sources agree with each other.' },
  changes: { title: 'No changes', body: 'Nothing you planned has changed.' },
  commitments: { title: 'No open commitments or requests', body: 'Promises you make in email and documents people ask you for appear here.' },
  waiting: { title: 'You’re not waiting on anyone', body: 'Things other people promised you appear here.' },
  resolved: { title: 'Nothing resolved yet', body: 'Items you resolve or dismiss, and ones Nexus finds evidence for, move here.' },
};

function SensitivityControl() {
  const { sensitivity, setSensitivity } = useStore();
  return (
    <fieldset className="mt-6 border-t border-rule px-3 pt-4">
      <legend className="px-0 text-[13px] font-semibold text-muted">How much to show</legend>
      {(
        [
          ['conservative', 'Conservative', 'Only well-supported items. Default.'],
          ['sensitive', 'Sensitive', 'Also mailing-list deadlines and loose matches.'],
        ] as const
      ).map(([value, label, hint]) => (
        <label key={value} className="mt-2 flex cursor-pointer items-start gap-2 text-[14px]">
          <input type="radio" name="sensitivity" value={value} checked={sensitivity === value} onChange={() => setSensitivity(value)} className="mt-1 accent-[var(--action)]" />
          <span>
            <span className="block font-medium">{label}</span>
            <span className="block text-[12.5px] text-muted">{hint}</span>
          </span>
        </label>
      ))}
      <p className="mt-2 text-[12px] text-faint">This is experiment E1 in the docs.</p>
    </fieldset>
  );
}

export function InboxPage() {
  const params = useParams();
  const view = (NAV_VIEWS.includes(params.view as View) ? params.view : 'needs_attention') as View;
  const selectedId = params.id ? decodeURIComponent(params.id) : undefined;
  const { status, error, retry, views, counts, now, result, disabled, sources } = useStore();
  const navigate = useNavigate();

  const items = useMemo(() => views.filter((v) => inView(v, view)), [views, view]);
  const selected = views.find((v) => v.id === selectedId);

  // On wide screens, open the most urgent item so the first thing a visitor sees is evidence.
  useEffect(() => {
    if (selectedId || items.length === 0) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1024px)').matches) {
      navigate(`/inbox/${view}/${encodeURIComponent(items[0]!.id)}`, { replace: true });
    }
  }, [selectedId, items, view, navigate]);

  // Keyboard: j / k move through the list (skipped while typing or in a dialog).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, dialog, [contenteditable]')) return;
      if (e.key !== 'j' && e.key !== 'k') return;
      if (items.length === 0) return;
      const i = items.findIndex((x) => x.id === selectedId);
      const next = e.key === 'j' ? Math.min(items.length - 1, i + 1) : Math.max(0, i === -1 ? 0 : i - 1);
      const id = items[next]!.id;
      navigate(`/inbox/${view}/${encodeURIComponent(id)}`);
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-situation-id="${CSS.escape(id)}"]`)?.focus());
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [items, selectedId, view, navigate]);

  if (status === 'loading') {
    return (
      <div role="status" className="flex flex-1 items-center justify-center gap-2 p-10 text-muted">
        <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" size={18} /> Reading your sources…
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div role="alert" className="flex flex-1 flex-col items-center justify-center p-10 text-center">
        <TriangleAlert aria-hidden className="mb-2 text-warn" />
        <p className="font-semibold">{error}</p>
        <p className="mt-1 text-[14px] text-muted">Nothing was changed. Try again.</p>
        <Button className="mt-4" variant="primary" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }

  const allOff = sources.length > 0 && disabled.length >= sources.length;
  const kinds = Object.keys(result?.stats.sourcesByKind ?? {}).length;

  const list = (
    <>
      {view === 'needs_attention' && (
        <div className="border-b border-rule px-4 pb-4 pt-5">
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]">
            {counts.needs_attention === 0
              ? 'Nothing needs your attention'
              : `${counts.needs_attention} ${counts.needs_attention === 1 ? 'thing needs' : 'things need'} your attention`}
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            Nexus compared {result?.stats.sources ?? 0} items across your email, calendar and files, and looked for places they disagree, change, or leave something open.
          </p>
        </div>
      )}
      {view !== 'needs_attention' && <h1 className="border-b border-rule px-4 pb-3 pt-5 text-[20px] font-semibold">{VIEW_LABEL[view]}</h1>}
      {allOff ? (
        <EmptyState title="All sources are turned off" icon={<InboxIcon size={28} />}>
          Nexus can only look at sources you allow. <Link className="font-medium text-action underline" to="/sources">Turn sources on</Link>
        </EmptyState>
      ) : items.length === 0 ? (
        <EmptyState title={EMPTY[view]!.title} icon={<CircleCheck size={28} />}>
          {EMPTY[view]!.body}
          {view === 'needs_attention' && ` Nexus checked ${result?.stats.sources ?? 0} items across ${kinds} kinds of source.`}
        </EmptyState>
      ) : (
        <SituationList items={items} view={view} selectedId={selectedId} now={now} />
      )}
    </>
  );

  return (
    <div className="flex min-h-0 flex-1">
      {/* Views: vertical on desktop */}
      <aside aria-label="Inbox views" className="hidden w-56 shrink-0 border-r border-rule py-4 lg:block">
        <nav aria-label="Inbox views">
          <ul className="px-2">
            {NAV_VIEWS.map((v) => (
              <li key={v}>
                <NavLink
                  to={`/inbox/${v}`}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-md px-3 py-1.5 text-[14px] ${isActive || v === view ? 'bg-surface font-semibold text-ink shadow-[inset_0_0_0_1px_var(--rule)]' : 'text-muted hover:text-ink'}`
                  }
                >
                  {VIEW_LABEL[v]}
                  <span className="text-[12.5px] tabular-nums text-muted">{counts[v]}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <SensitivityControl />
        <p className="mt-6 px-3 text-[12px] text-faint">
          Tip: press <kbd className="rounded border border-rule px-1">j</kbd> / <kbd className="rounded border border-rule px-1">k</kbd> to move through the list.
        </p>
      </aside>

      {/* List (hidden on small screens while a detail is open) */}
      <section aria-label="Situations" className={`w-full shrink-0 border-r border-rule lg:w-[400px] ${selected ? 'hidden lg:block' : 'block'} overflow-y-auto`}>
        <nav aria-label="Inbox views" className="flex gap-1.5 overflow-x-auto border-b border-rule px-3 py-2 lg:hidden">
          {NAV_VIEWS.map((v) => (
            <NavLink
              key={v}
              to={`/inbox/${v}`}
              className={`shrink-0 rounded-full border px-3 py-1 text-[13px] ${v === view ? 'border-ink bg-ink font-semibold text-paper' : 'border-rule-strong text-muted'}`}
            >
              {VIEW_LABEL[v]} <span className="tabular-nums">{counts[v]}</span>
            </NavLink>
          ))}
        </nav>
        {list}
      </section>

      {/* Detail */}
      <section aria-label="Situation detail" className={`min-w-0 flex-1 overflow-y-auto bg-surface/40 ${selected ? 'block' : 'hidden lg:block'}`}>
        {selected ? (
          <SituationDetail s={selected} backTo={`/inbox/${view}`} />
        ) : (
          <EmptyState title="Select an item to see the evidence" icon={<InboxIcon size={28} />}>
            Every item shows what each source said, how sure Nexus is, and a suggested next step.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
