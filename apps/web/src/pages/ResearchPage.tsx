import { useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, FileText, Mail } from 'lucide-react';
import { formatDateTime, runPipeline, sourceLabel, type RawSource, type Situation } from '@nexus/core';
import { useStore } from '../state/store';
import { Button, StatusBadge } from '../components/ui';
import { EvidenceSlip } from '../components/EvidenceSlip';
import { CONDITION_NAME, SCENARIOS, displayOrder, firstCondition, participantNumber, type Condition, type Scenario } from '../research/scenarios';
import { clearSessions, loadSessions, saveSessions, toCsv, type Frequency, type Rating, type ResearchSession, type ScenarioResponse, type SessionFinal } from '../research/session';

/**
 * Research session mode (Phase 16). A facilitator runs this with a participant.
 * It measures comprehension on first exposure, then compares the three
 * presentations side by side. Nothing leaves this browser.
 */

const SEGMENTS = ['Job seeker', 'Consultant / freelancer', 'Founder', 'Recruiter / coordinator', 'Product manager', 'Knowledge worker', 'Researcher', 'Other'];

const RATING_ITEMS: { key: keyof ScenarioResponse['ratings']; label: string; low: string; high: string }[] = [
  { key: 'usefulness', label: 'How useful is this?', low: 'Not useful', high: 'Very useful' },
  { key: 'clarity', label: 'How clear is it?', low: 'Confusing', high: 'Very clear' },
  { key: 'trust', label: 'How much do you trust it?', low: 'Not at all', high: 'Completely' },
  { key: 'evidence_quality', label: 'How well does it show where the information came from?', low: 'Poorly', high: 'Very well' },
  { key: 'actionability', label: 'How clear is what to do next?', low: 'Not clear', high: 'Very clear' },
  { key: 'annoyance', label: 'How annoying would it be to get this?', low: 'Not at all', high: 'Very annoying' },
];

const FREQ: { value: Frequency; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: 'few_per_year', label: 'A few times a year' },
  { value: 'monthly', label: 'About monthly' },
  { value: 'weekly', label: 'About weekly' },
  { value: 'several_per_week', label: 'Several times a week' },
];

const KIND_ICON = { email: Mail, calendar: CalendarDays, document: FileText };

function sourceBody(s: RawSource): { title: string; text: string; time: string } {
  if (s.kind === 'email')
    return { title: s.subject, time: s.sentAt, text: `${s.body}${s.attachments.length ? `\n\nAttachments: ${s.attachments.map((a) => a.filename).join(', ')}` : ''}` };
  if (s.kind === 'calendar') return { title: s.title, time: s.updatedAt, text: `${formatDateTime(s.start)} – ${formatDateTime(s.end)}${s.location ? `\n${s.location}` : ''}` };
  return { title: s.filename, time: s.uploadedAt, text: s.text };
}

// ─── The three presentations ────────────────────────────────────────────────

function RawView({ situation, scenario, sources }: { situation: Situation; scenario: Scenario; sources: RawSource[] }) {
  const ids = [...new Set([...situation.evidence.map((e) => e.sourceId), ...scenario.distractorIds])];
  const items = sources.filter((s) => ids.includes(s.id)).sort((a, b) => Date.parse(sourceBody(b).time) - Date.parse(sourceBody(a).time));
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] text-muted">Items from your email, calendar and files, newest first, as they'd appear in your own apps.</p>
      {items.map((s) => {
        const b = sourceBody(s);
        const Icon = KIND_ICON[s.kind];
        return (
          <div key={s.id} className="rounded-lg border border-rule bg-surface px-3 py-2.5">
            <p className="flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted">
              <Icon aria-hidden size={13} /> <span className="font-medium text-ink">{sourceLabel(s)}</span> <span>{formatDateTime(b.time)}</span>
            </p>
            <p className="mt-1 text-[14px] font-semibold">{b.title}</p>
            <p className="mt-1 whitespace-pre-line text-[14px] text-ink">{b.text}</p>
          </div>
        );
      })}
    </div>
  );
}

function BriefingView({ scenario }: { scenario: Scenario }) {
  return (
    <div className="rounded-lg border border-rule bg-surface px-4 py-3">
      <p className="text-[12.5px] text-muted">AI assistant</p>
      <p className="text-[15px] font-semibold">Your day ahead, Thursday 1 October</p>
      <p className="mt-2 text-[15px] leading-relaxed">{scenario.briefing}</p>
    </div>
  );
}

function NexusView({ situation }: { situation: Situation }) {
  return (
    <div className="rounded-lg border border-rule bg-surface px-4 py-3">
      <p className="text-[17px] font-semibold">{situation.title}</p>
      <div className="mt-1">
        <StatusBadge status={situation.status} withHelp />
      </div>
      <p className="mt-3 text-[15px]">{situation.what}</p>
      <p className="mt-2 text-[14.5px] text-muted">{situation.why}</p>
      <div className="mt-3 flex flex-col gap-2">
        {situation.evidence.filter((e) => e.role !== 'fulfilment').map((e) => (
          <EvidenceSlip key={e.id} e={e} hideLink />
        ))}
      </div>
      <p className="mt-3 rounded-lg border-l-4 border-action bg-action-tint px-3 py-2 text-[14.5px]">{situation.nextStep}</p>
    </div>
  );
}

function ConditionView({ c, situation, scenario, sources }: { c: Condition; situation: Situation; scenario: Scenario; sources: RawSource[] }) {
  if (c === 'A') return <RawView situation={situation} scenario={scenario} sources={sources} />;
  if (c === 'B') return <BriefingView scenario={scenario} />;
  return <NexusView situation={situation} />;
}

// ─── Small form helpers ─────────────────────────────────────────────────────

function Choice<T extends string>({ name, legend, value, options, onChange }: { name: string; legend: ReactNode; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="mt-4">
      <legend className="text-[14px] font-semibold">{legend}</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className={`cursor-pointer rounded-full border px-3 py-1 text-[13.5px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--action)] ${value === o.value ? 'border-action bg-action-tint font-medium' : 'border-rule-strong'}`}>
            <input type="radio" className="sr-only" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Scale({ name, item, value, onChange }: { name: string; item: (typeof RATING_ITEMS)[number]; value: Rating; onChange: (v: Rating) => void }) {
  return (
    <fieldset className="mt-3">
      <legend className="text-[14px]">{item.label}</legend>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="w-24 text-right text-[12px] text-muted">{item.low}</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border text-[14px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--action)] ${value === n ? 'border-action bg-action text-action-ink' : 'border-rule-strong'}`}>
            <input type="radio" className="sr-only" name={name} value={n} checked={value === n} onChange={() => onChange(n as Rating)} aria-label={`${item.label} ${n} of 5`} />
            {n}
          </label>
        ))}
        <span className="w-24 text-[12px] text-muted">{item.high}</span>
      </div>
    </fieldset>
  );
}

function TextArea({ id, label, value, onChange, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="mt-4">
      <label htmlFor={id} className="text-[14px] font-semibold">
        {label}
      </label>
      {hint && <p className="text-[12.5px] text-muted">{hint}</p>}
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="mt-1 block w-full rounded-lg border border-rule-strong bg-surface p-2 text-[14.5px]" />
    </div>
  );
}

const emptyResponse = (scenario: Scenario, first: Condition, order: Condition[]): ScenarioResponse => ({
  scenario: scenario.key,
  firstCondition: first,
  displayOrder: order.join(','),
  nextAction: '',
  actionCoding: '',
  clearest: '',
  mostTrusted: '',
  ratings: { usefulness: null, clarity: null, trust: null, evidence_quality: null, actionability: null, annoyance: null },
  perceivedFrequency: '',
  ownIncident: '',
});

const emptyFinal: SessionFinal = { connectData: '', connectConditions: '', pilotAgreed: '', overallPreference: '', notes: '' };

type Step = { kind: 'setup' } | { kind: 'first'; i: number } | { kind: 'compare'; i: number } | { kind: 'final' } | { kind: 'done' };

export function ResearchPage() {
  const { sources, now, status } = useStore();
  const [sessions, setSessions] = useState<ResearchSession[]>(loadSessions);
  const [step, setStep] = useState<Step>({ kind: 'setup' });
  const [draft, setDraft] = useState<ResearchSession | null>(null);
  const [setup, setSetup] = useState({ participantId: '', segment: '', facilitator: '' });
  const [csv, setCsv] = useState<string | undefined>();
  const [confirmClear, setConfirmClear] = useState(false);

  // Always the same, unfiltered demo data: user settings in the inbox must not change what participants see.
  const situations = useMemo(
    () => (status === 'ready' ? runPipeline(sources, { now, sensitivity: 'conservative' }).situations : []),
    [sources, now, status],
  );
  const scenarioSituations = SCENARIOS.map((sc) => situations.find(sc.pick));
  const ready = scenarioSituations.every(Boolean);

  const pNum = draft ? participantNumber(draft.participantId) : 0;
  const order = displayOrder(pNum);
  const blindLabel = (c: Condition) => `View ${order.indexOf(c) + 1}`;

  const updateResponse = (i: number, patch: Partial<ScenarioResponse>) =>
    setDraft((d) => (d ? { ...d, responses: d.responses.map((r, j) => (j === i ? { ...r, ...patch } : r)) } : d));

  const start = () => {
    const n = participantNumber(setup.participantId);
    const ord = displayOrder(n);
    setDraft({
      sessionId: `S-${setup.participantId}-${Date.now().toString(36)}`,
      participantId: setup.participantId.trim(),
      segment: setup.segment,
      facilitator: setup.facilitator.trim(),
      startedAt: new Date().toISOString(),
      responses: SCENARIOS.map((sc, i) => emptyResponse(sc, firstCondition(n, i), ord)),
      final: emptyFinal,
    });
    setStep({ kind: 'first', i: 0 });
    window.scrollTo?.(0, 0);
  };

  const finish = () => {
    if (!draft) return;
    const done = { ...draft, completedAt: new Date().toISOString() };
    const next = [...sessions, done];
    setSessions(next);
    saveSessions(next);
    setStep({ kind: 'done' });
  };

  const go = (s: Step) => {
    setStep(s);
    window.scrollTo?.(0, 0);
  };

  const header = (
    <div className="mb-4 rounded-lg border border-dashed border-rule-strong px-3 py-2 text-[13px] text-muted">
      Research session. Everything shown is fictional demo data. Answers stay in this browser until the facilitator exports them.
    </div>
  );

  if (status !== 'ready') return <p className="p-10 text-center text-muted">Reading sources…</p>;
  if (!ready) return <p role="alert" className="p-10 text-center">The demo data doesn’t contain all four scenarios. Turn all sources back on in Sources.</p>;

  // ── Setup ──
  if (step.kind === 'setup' || !draft) {
    const canStart = /\S/.test(setup.participantId) && setup.segment !== '';
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        <h1 className="text-[22px] font-semibold">Research session</h1>
        <p className="mt-1 text-[14px] text-muted">
          For the facilitator. Runs the concept session from <span className="font-medium">docs/research/session-template.md</span>: four scenarios, each seen first in one
          view, then compared side by side. Confirm consent before starting.
        </p>
        <div className="mt-6 grid gap-4 rounded-xl border border-rule bg-surface p-4">
          <div>
            <label htmlFor="rs-pid" className="text-[14px] font-semibold">Participant ID</label>
            <p className="text-[12.5px] text-muted">A code like P07. Never a name.</p>
            <input id="rs-pid" value={setup.participantId} onChange={(e) => setSetup({ ...setup, participantId: e.target.value })} className="mt-1 block w-40 rounded-md border border-rule-strong bg-surface px-2 py-1.5" />
          </div>
          <div>
            <label htmlFor="rs-seg" className="text-[14px] font-semibold">Segment</label>
            <select id="rs-seg" value={setup.segment} onChange={(e) => setSetup({ ...setup, segment: e.target.value })} className="mt-1 block rounded-md border border-rule-strong bg-surface px-2 py-1.5">
              <option value="">Choose…</option>
              {SEGMENTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rs-fac" className="text-[14px] font-semibold">Facilitator initials</label>
            <input id="rs-fac" value={setup.facilitator} onChange={(e) => setSetup({ ...setup, facilitator: e.target.value })} className="mt-1 block w-24 rounded-md border border-rule-strong bg-surface px-2 py-1.5" />
          </div>
          <div>
            <Button variant="primary" disabled={!canStart} onClick={start}>
              Start session
            </Button>
          </div>
        </div>

        <section aria-labelledby="rs-saved" className="mt-8">
          <h2 id="rs-saved" className="text-[15px] font-semibold">Completed sessions in this browser: {sessions.length}</h2>
          {sessions.length === 0 ? (
            <p className="mt-1 text-[14px] text-muted">None yet.</p>
          ) : (
            <>
              <ul className="mt-2 text-[14px]">
                {sessions.map((s) => (
                  <li key={s.sessionId}>
                    {s.participantId}, {s.segment}, {s.completedAt ? formatDateTime(s.completedAt) : 'incomplete'}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={() => setCsv(toCsv(sessions))}>Export as CSV</Button>
                {confirmClear ? (
                  <>
                    <Button className="text-warn" onClick={() => { clearSessions(); setSessions([]); setCsv(undefined); setConfirmClear(false); }}>
                      Yes, delete all sessions
                    </Button>
                    <Button variant="quiet" onClick={() => setConfirmClear(false)}>Cancel</Button>
                  </>
                ) : (
                  <Button onClick={() => setConfirmClear(true)}>Delete all sessions</Button>
                )}
              </div>
            </>
          )}
          {csv && (
            <div className="mt-3">
              <label htmlFor="rs-csv" className="text-[13px] font-medium">CSV (matches docs/research/schema/concept_session.csv)</label>
              <textarea id="rs-csv" readOnly value={csv} rows={8} className="mt-1 block w-full rounded-lg border border-rule bg-sunk p-2 font-mono text-[12px]" />
              <Button className="mt-2" onClick={() => navigator.clipboard?.writeText(csv).catch(() => (document.getElementById('rs-csv') as HTMLTextAreaElement | null)?.select())}>
                Copy to clipboard
              </Button>
            </div>
          )}
        </section>
      </div>
    );
  }

  // ── Scenario, first exposure: comprehension before opinions ──
  if (step.kind === 'first') {
    const i = step.i;
    const sc = SCENARIOS[i]!;
    const r = draft.responses[i]!;
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        {header}
        <p className="text-[13px] text-muted">Scenario {i + 1} of {SCENARIOS.length}: {sc.label}</p>
        <h1 className="mt-1 text-[20px] font-semibold">Here’s something you might see this morning</h1>
        <p className="mb-3 text-[14px] text-muted">Imagine you’re Riya, a product consultant who is also interviewing for jobs. It’s Thursday 1 October, 9:00.</p>
        <p className="mb-2 text-[13px] font-semibold text-muted">{blindLabel(r.firstCondition)}</p>
        <ConditionView c={r.firstCondition} situation={scenarioSituations[i]!} scenario={sc} sources={sources} />
        <TextArea id={`rs-next-${i}`} label="What, if anything, would you do next?" hint="Say it out loud; the facilitator types it." value={r.nextAction} onChange={(v) => updateResponse(i, { nextAction: v })} />
        <details className="mt-4 rounded-lg border border-rule bg-sunk p-3 text-[13.5px]">
          <summary className="cursor-pointer font-semibold">Facilitator coding (don’t show the participant)</summary>
          <p className="mt-1 text-muted">A correct answer looks like: {sc.expectedAction}</p>
          <Choice
            name={`rs-code-${i}`}
            legend="Their next action was"
            value={r.actionCoding}
            options={[
              { value: 'correct', label: 'Correct' },
              { value: 'partial', label: 'Partly right' },
              { value: 'missed', label: 'Missed it' },
            ]}
            onChange={(v) => updateResponse(i, { actionCoding: v })}
          />
        </details>
        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={() => go({ kind: 'compare', i })}>
            Compare views
          </Button>
        </div>
      </div>
    );
  }

  // ── Scenario, side-by-side comparison ──
  if (step.kind === 'compare') {
    const i = step.i;
    const sc = SCENARIOS[i]!;
    const r = draft.responses[i]!;
    const opts = order.map((c) => ({ value: c, label: blindLabel(c) }));
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {header}
        <p className="text-[13px] text-muted">Scenario {i + 1} of {SCENARIOS.length}: {sc.label}</p>
        <h1 className="mt-1 text-[20px] font-semibold">The same information, shown three ways</h1>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {order.map((c) => (
            <section key={c} aria-label={blindLabel(c)} className="min-w-0">
              <p className="mb-2 text-[13px] font-semibold text-muted">{blindLabel(c)}</p>
              <ConditionView c={c} situation={scenarioSituations[i]!} scenario={sc} sources={sources} />
            </section>
          ))}
        </div>
        <div className="mx-auto mt-6 max-w-2xl">
          <Choice name={`rs-clear-${i}`} legend="Which view makes it clearest what to do?" value={r.clearest} options={[...opts, { value: 'none' as const, label: 'None of them' }]} onChange={(v) => updateResponse(i, { clearest: v })} />
          <Choice name={`rs-trust-${i}`} legend="Which view would you trust most?" value={r.mostTrusted} options={[...opts, { value: 'none' as const, label: 'None of them' }]} onChange={(v) => updateResponse(i, { mostTrusted: v })} />
          <h2 className="mt-6 text-[15px] font-semibold">About {blindLabel('C')} only</h2>
          {RATING_ITEMS.map((it) => (
            <Scale key={it.key} name={`rs-${it.key}-${i}`} item={it} value={r.ratings[it.key]} onChange={(v) => updateResponse(i, { ratings: { ...r.ratings, [it.key]: v } })} />
          ))}
          <Choice name={`rs-freq-${i}`} legend="How often does something like this happen to you?" value={r.perceivedFrequency} options={FREQ} onChange={(v) => updateResponse(i, { perceivedFrequency: v })} />
          <TextArea id={`rs-own-${i}`} label="Did they mention a real time this happened to them?" hint="Facilitator: note specifics only if they volunteered them (when, which tools, what happened)." value={r.ownIncident} onChange={(v) => updateResponse(i, { ownIncident: v })} />
          <div className="mt-6 flex justify-between">
            <Button onClick={() => go({ kind: 'first', i })}>Back</Button>
            <Button variant="primary" onClick={() => go(i + 1 < SCENARIOS.length ? { kind: 'first', i: i + 1 } : { kind: 'final' })}>
              {i + 1 < SCENARIOS.length ? 'Next scenario' : 'Final questions'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Final questions ──
  if (step.kind === 'final') {
    const f = draft.final;
    const setF = (patch: Partial<SessionFinal>) => setDraft({ ...draft, final: { ...f, ...patch } });
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        {header}
        <h1 className="text-[20px] font-semibold">Last questions</h1>
        <Choice
          name="rs-pref"
          legend="Across all four, which view would you rather get?"
          value={f.overallPreference}
          options={[...order.map((c) => ({ value: c, label: blindLabel(c) })), { value: 'none' as const, label: 'None' }]}
          onChange={(v) => setF({ overallPreference: v })}
        />
        <Choice
          name="rs-connect"
          legend="To get something like this for real, what would you connect?"
          value={f.connectData}
          options={[
            { value: 'none', label: 'Nothing' },
            { value: 'calendar_only', label: 'Calendar only' },
            { value: 'email_readonly', label: 'Email (read-only)' },
            { value: 'all_three', label: 'Email, calendar and files' },
            { value: 'unsure', label: 'Not sure' },
          ]}
          onChange={(v) => setF({ connectData: v })}
        />
        <TextArea id="rs-cond" label="What would need to be true before you connected it?" value={f.connectConditions} onChange={(v) => setF({ connectConditions: v })} />
        <Choice
          name="rs-pilot"
          legend="Facilitator: did they agree to a follow-up pilot with their own account and give contact details (kept outside this app)?"
          value={f.pilotAgreed}
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ]}
          onChange={(v) => setF({ pilotAgreed: v })}
        />
        <TextArea id="rs-notes" label="Session notes" hint="No names, emails or other identifying details." value={f.notes} onChange={(v) => setF({ notes: v })} />
        <div className="mt-6 flex justify-between">
          <Button onClick={() => go({ kind: 'compare', i: SCENARIOS.length - 1 })}>Back</Button>
          <Button variant="primary" onClick={finish}>
            Save session
          </Button>
        </div>
      </div>
    );
  }

  // ── Done: reveal which view was which (for the facilitator's debrief) ──
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="text-[20px] font-semibold">Session saved</h1>
      <p className="mt-1 text-[14px] text-muted">Thank the participant. For the debrief, the views were:</p>
      <ul className="mt-3 text-[14.5px]">
        {order.map((c) => (
          <li key={c}>
            {blindLabel(c)}: {CONDITION_NAME[c]}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13.5px] text-muted">One session is anecdote, not validation. Code it with the evidence rubric before drawing anything from it.</p>
      <Button
        className="mt-5"
        variant="primary"
        onClick={() => {
          setDraft(null);
          setSetup({ participantId: '', segment: '', facilitator: setup.facilitator });
          go({ kind: 'setup' });
        }}
      >
        Back to research start
      </Button>
    </div>
  );
}
