import { formatDateTime } from '@nexus/core';
import { useStore } from '../state/store';

export function ActivityPage() {
  const { audit, events, views, result } = useStore();
  const system = views
    .filter((v) => v.systemLifecycle === 'resolved')
    .map((v) => ({ id: `sys:${v.id}`, at: v.evidence.find((e) => e.role === 'fulfilment')?.sourceTime ?? '', actor: 'nexus' as const, action: 'Moved to Resolved', detail: `${v.title}. ${v.systemResolutionReason ?? ''}` }));
  const titleOf = (id?: string) => views.find((v) => v.id === id)?.title;
  const entries = [...audit.map((a) => ({ ...a, detail: [titleOf(a.situationId), a.detail].filter(Boolean).join('. ') })), ...system].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="text-[22px] font-semibold">Activity</h1>
      <p className="mt-1 text-[14px] text-muted">Everything that changed state in Nexus, and who changed it.</p>

      <section aria-labelledby="audit-h" className="mt-6">
        <h2 id="audit-h" className="mb-2 text-[15px] font-semibold">Decision log</h2>
        {entries.length === 0 ? (
          <p className="rounded-xl border border-rule bg-surface p-4 text-[14px] text-muted">No decisions yet.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-rule rounded-xl border border-rule bg-surface">
            {entries.map((e) => (
              <li key={e.id} className="flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:gap-4">
                <span className="w-32 shrink-0 text-[12.5px] tabular-nums text-muted">{e.at ? formatDateTime(e.at) : ''}</span>
                <span className="text-[14px]">
                  <span className={`mr-2 rounded px-1.5 py-px text-[11.5px] font-semibold ${e.actor === 'user' ? 'bg-action-tint text-action' : 'bg-sunk text-muted'}`}>
                    {e.actor === 'user' ? 'You' : 'Nexus'}
                  </span>
                  <span className="font-medium">{e.action}</span>
                  {e.detail && <span className="text-muted">: {e.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="ev-h" className="mt-10">
        <h2 id="ev-h" className="text-[15px] font-semibold">What Nexus records about your usage</h2>
        <p className="mt-1 text-[13.5px] text-muted">
          Product analytics carry ids, types and counts only, never email text, names or addresses. In this demo they stay in this tab.
        </p>
        {result && (
          <p className="mt-3 text-[13.5px]">
            Last run: {result.stats.sources} sources, {result.stats.observations} observations, {result.stats.invalidObservations} rejected by validation, {result.stats.failedSources.length} failed,{' '}
            {result.stats.durationMs} ms.
          </p>
        )}
        <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-rule bg-surface">
          <table className="w-full text-left text-[12.5px]">
            <caption className="sr-only">Recent analytics events</caption>
            <thead className="sticky top-0 bg-surface text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Event</th>
                <th scope="col" className="px-3 py-2 font-medium">Fields</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-3 py-3 font-sans text-muted">
                    No events yet. Open an item to see one.
                  </td>
                </tr>
              ) : (
                events.map((e, i) => (
                  <tr key={i} className="border-t border-rule">
                    <td className="px-3 py-1.5 align-top">{e.event}</td>
                    <td className="break-all px-3 py-1.5 text-muted">
                      {Object.entries(e.fields)
                        .filter(([, v]) => v !== undefined)
                        .map(([k, v]) => `${k}=${v}`)
                        .join('  ')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
