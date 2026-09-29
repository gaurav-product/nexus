import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Download, FileText, Mail, Plug, ShieldAlert, Trash2 } from 'lucide-react';
import { formatDateTime, sourceLabel, type RawSource } from '@nexus/core';
import { useStore } from '../state/store';
import { Button } from '../components/ui';

const ICON = { email: Mail, calendar: CalendarDays, document: FileText };
const GROUP = { email: 'Email', calendar: 'Calendar', document: 'Uploaded files' };

function body(s: RawSource): string {
  switch (s.kind) {
    case 'email':
      return `From: ${s.from.name} <${s.from.email}>\nTo: ${s.to.map((p) => p.name).join(', ')}\nSubject: ${s.subject}${s.attachments.length ? `\nAttachments: ${s.attachments.map((a) => a.filename).join(', ')}` : ''}${s.bulk ? '\n(Mailing list)' : ''}\n\n${s.body}`;
    case 'calendar':
      return `${s.title}\n${formatDateTime(s.start)} – ${formatDateTime(s.end)}${s.location ? `\n${s.location}` : ''}${s.organizer ? `\nOrganiser: ${s.organizer.name}` : ''}`;
    case 'document':
      return `${s.filename}\n\n${s.text}`;
  }
}

function time(s: RawSource) {
  return s.kind === 'email' ? s.sentAt : s.kind === 'calendar' ? s.updatedAt : s.uploadedAt;
}

export function SourcesPage() {
  const { sources, disabled, toggleSource, result, reset, exportData, sensitivity, setSensitivity } = useStore();
  const [params] = useSearchParams();
  const openId = params.get('open') ?? undefined;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const flags = new Map((result?.flags ?? []).map((f) => [f.sourceId, f]));

  useEffect(() => {
    if (openId) document.getElementById(`src-${openId}`)?.scrollIntoView?.({ block: 'start' });
  }, [openId, sources.length]);

  const grouped = useMemo(() => {
    const g: Record<string, RawSource[]> = { email: [], calendar: [], document: [] };
    for (const s of sources) g[s.kind]!.push(s);
    for (const k of Object.keys(g)) g[k]!.sort((a, b) => Date.parse(time(b)) - Date.parse(time(a)));
    return g;
  }, [sources]);

  const [exported, setExported] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exported ?? '');
      setCopied(true);
    } catch {
      document.getElementById('export-json')?.focus();
      (document.getElementById('export-json') as HTMLTextAreaElement | null)?.select();
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="text-[22px] font-semibold">Sources</h1>
      <p className="mt-1 text-[14px] text-muted">
        What Nexus is allowed to read. Turn any item off and Nexus recalculates without it. Nexus only reads; it never sends, edits or deletes.
      </p>

      <section aria-labelledby="conn-h" className="mt-6 rounded-xl border border-rule bg-surface p-4">
        <h2 id="conn-h" className="flex items-center gap-2 text-[15px] font-semibold">
          <Plug aria-hidden size={16} /> Connections
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-[14px]">
          <li className="flex items-center justify-between gap-3">
            <span>
              <span className="font-medium">Demo dataset</span>
              <span className="block text-[12.5px] text-muted">Fictional people, companies and bookings. Nothing real is read.</span>
            </span>
            <span className="rounded-full bg-sunk px-2 py-0.5 text-[12px] font-medium">Active</span>
          </li>
          {['Gmail', 'Google Calendar', 'File upload'].map((n) => (
            <li key={n} className="flex items-center justify-between gap-3 text-muted">
              <span>
                <span className="font-medium">{n}</span>
                <span className="block text-[12.5px]">Designed, not available in this demo build. It would use read-only access.</span>
              </span>
              <span className="rounded-full border border-dashed border-rule-strong px-2 py-0.5 text-[12px]">Not connected</span>
            </li>
          ))}
        </ul>
      </section>

      <fieldset className="mt-6 rounded-xl border border-rule bg-surface p-4 lg:hidden">
        <legend className="px-1 text-[15px] font-semibold">How much to show</legend>
        {(
          [
            ['conservative', 'Conservative', 'Only well-supported items. Default.'],
            ['sensitive', 'Sensitive', 'Also mailing-list deadlines and loose matches.'],
          ] as const
        ).map(([value, label, hint]) => (
          <label key={value} className="mt-2 flex items-start gap-2 text-[14px]">
            <input type="radio" name="sensitivity-m" checked={sensitivity === value} onChange={() => setSensitivity(value)} className="mt-1 accent-[var(--action)]" />
            <span>
              <span className="block font-medium">{label}</span>
              <span className="block text-[12.5px] text-muted">{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {(['email', 'calendar', 'document'] as const).map((kind) => {
        const Icon = ICON[kind];
        return (
          <section key={kind} aria-labelledby={`g-${kind}`} className="mt-8">
            <h2 id={`g-${kind}`} className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
              <Icon aria-hidden size={16} /> {GROUP[kind]} <span className="text-[13px] font-normal text-muted">{grouped[kind]!.length}</span>
            </h2>
            <ul className="flex flex-col divide-y divide-rule rounded-xl border border-rule bg-surface">
              {grouped[kind]!.map((s) => {
                const on = !disabled.includes(s.id);
                const flag = flags.get(s.id);
                const title = s.kind === 'email' ? s.subject : s.kind === 'calendar' ? s.title : s.filename;
                return (
                  <li key={s.id} id={`src-${s.id}`} className="px-3 py-2.5">
                    <div className="flex items-start gap-3">
                      <details open={openId === s.id} className="min-w-0 flex-1">
                        <summary className="cursor-pointer list-none">
                          <span className={`block truncate text-[14px] font-medium ${on ? '' : 'text-faint line-through'}`}>{title}</span>
                          <span className="block text-[12.5px] text-muted">
                            {sourceLabel(s)}, {formatDateTime(time(s))}
                          </span>
                          {flag && (
                            <span className="mt-1 flex items-center gap-1 text-[12.5px] font-medium text-warn">
                              <ShieldAlert aria-hidden size={13} /> Contains text addressed to AI assistants. Treated as data only.
                            </span>
                          )}
                        </summary>
                        <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-sunk p-3 font-serif text-[14.5px] leading-relaxed">{body(s)}</pre>
                      </details>
                      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[13px] text-muted">
                        <input
                          type="checkbox"
                          role="switch"
                          aria-checked={on}
                          aria-label={`Allow Nexus to read: ${title}`}
                          checked={on}
                          onChange={() => toggleSource(s.id)}
                          className="h-4 w-4 accent-[var(--action)]"
                        />
                        {on ? 'On' : 'Off'}
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <section aria-labelledby="data-h" className="mt-10 rounded-xl border border-rule bg-surface p-4">
        <h2 id="data-h" className="text-[15px] font-semibold">Your Nexus data</h2>
        <p className="mt-1 text-[13.5px] text-muted">
          In this demo, your decisions and settings stay in this browser only. Export them, or delete everything.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => { setExported(exportData()); setCopied(false); }}>
            <Download aria-hidden size={15} /> Export as JSON
          </Button>
          {confirmDelete ? (
            <>
              <Button
                className="border-warn text-warn"
                onClick={() => {
                  reset();
                  setConfirmDelete(false);
                }}
              >
                <Trash2 aria-hidden size={15} /> Yes, delete all Nexus data
              </Button>
              <Button variant="quiet" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setConfirmDelete(true)}>
              <Trash2 aria-hidden size={15} /> Delete all Nexus data
            </Button>
          )}
        </div>
        {exported && (
          <div className="mt-3">
            <label htmlFor="export-json" className="text-[13px] font-medium">Your export</label>
            <textarea id="export-json" readOnly value={exported} rows={8} className="mt-1 block w-full rounded-lg border border-rule bg-sunk p-2 font-mono text-[12px]" />
            <Button className="mt-2" onClick={copy}>{copied ? 'Copied' : 'Copy to clipboard'}</Button>
          </div>
        )}
      </section>
    </div>
  );
}
