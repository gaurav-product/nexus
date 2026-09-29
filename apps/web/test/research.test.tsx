import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEMO_NOW, DEMO_SOURCES, formatTime, localParts, runPipeline } from '@nexus/core';
import { App } from '../src/App';
import { SCENARIOS, displayOrder, firstCondition, participantNumber } from '../src/research/scenarios';
import { CSV_COLUMNS, toCsv, type ResearchSession } from '../src/research/session';

const situations = runPipeline(DEMO_SOURCES, { now: DEMO_NOW, sensitivity: 'conservative' }).situations;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

describe('research scenarios', () => {
  it('each scenario maps to exactly one Nexus situation', () => {
    for (const sc of SCENARIOS) expect(situations.filter(sc.pick)).toHaveLength(1);
  });

  it('fairness: every briefing states the same key dates/times as the Nexus situation', () => {
    for (const sc of SCENARIOS) {
      const s = situations.find(sc.pick)!;
      const values: string[] = [];
      if (s.details.type === 'conflict') values.push(...s.details.versions.map((v) => v.value));
      if (s.details.type === 'change') values.push(...s.details.changes.map((c) => c.after));
      for (const v of values) {
        const p = localParts(v);
        expect(sc.briefing, `${sc.key} day`).toContain(`${p.day} ${MONTHS[p.month - 1]}`);
        const t = formatTime(v);
        const t12 = `${((p.hour + 11) % 12) + 1}:${String(p.minute).padStart(2, '0')}`;
        expect(sc.briefing.includes(t) || sc.briefing.includes(t12), `${sc.key} time ${t}`).toBe(true);
      }
      if (s.details.type === 'commitment') expect(sc.briefing).toMatch(/revised proposal/);
      if (s.details.type === 'missing_info') expect(sc.briefing).toMatch(/signed NDA/);
    }
  });

  it('counterbalancing: across 6 participants every condition is seen first on every scenario', () => {
    for (let i = 0; i < SCENARIOS.length; i++) {
      const seen = new Set([1, 2, 3, 4, 5, 6].map((p) => firstCondition(p, i)));
      expect(seen).toEqual(new Set(['A', 'B', 'C']));
    }
    expect(new Set([1, 2, 3, 4, 5, 6].map((p) => displayOrder(p).join('')))).toHaveProperty('size', 6);
    expect(participantNumber('P07')).toBe(7);
  });
});

describe('research CSV', () => {
  const session: ResearchSession = {
    sessionId: 'S1', participantId: 'P01', segment: 'Job seeker', facilitator: 'GS', startedAt: '2026-10-05T04:00:00.000Z', completedAt: '2026-10-05T04:30:00.000Z',
    responses: [{
      scenario: 'conflict', firstCondition: 'B', displayOrder: 'A,C,B', nextAction: 'Email Neha, "check" the date\nthen fix calendar', actionCoding: 'correct',
      clearest: 'C', mostTrusted: 'C', ratings: { usefulness: 4, clarity: 5, trust: 4, evidence_quality: 5, actionability: 4, annoyance: 1 },
      perceivedFrequency: 'monthly', ownIncident: '=HYPERLINK("x")',
    }],
    final: { connectData: 'calendar_only', connectConditions: '', pilotAgreed: 'no', overallPreference: 'C', notes: '' },
  };

  it('header matches the committed schema file exactly', () => {
    const header = readFileSync(resolve(__dirname, '../../../docs/research/schema/concept_session.csv'), 'utf8').split('\n')[0]!.trim();
    expect(header).toBe(CSV_COLUMNS.join(','));
  });

  it('quotes commas, quotes and newlines, and neutralises formulas', () => {
    const csv = toCsv([session]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(CSV_COLUMNS.join(','));
    expect(csv).toContain('"Email Neha, ""check"" the date\nthen fix calendar"');
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });

  it('no sessions → header only (nothing fabricated)', () => {
    expect(toCsv([])).toBe(CSV_COLUMNS.join(','));
  });
});

describe('research session flow', () => {
  it('runs a full session and exports one row per scenario', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/research';
    render(<App />);
    await user.type(await screen.findByLabelText('Participant ID'), 'P02');
    await user.selectOptions(screen.getByLabelText('Segment'), 'Job seeker');
    await user.click(screen.getByRole('button', { name: 'Start session' }));
    for (let i = 0; i < SCENARIOS.length; i++) {
      expect(await screen.findByText(`Scenario ${i + 1} of 4: ${SCENARIOS[i]!.label}`)).toBeInTheDocument();
      // Blind: the participant never sees the word Nexus before the debrief
      expect(screen.getByRole('main')).not.toHaveTextContent(/Nexus situation card|AI daily briefing|Current workflow/);
      await user.type(screen.getByLabelText('What, if anything, would you do next?'), 'check it');
      await user.click(screen.getByRole('button', { name: 'Compare views' }));
      expect(screen.getAllByRole('region', { name: /View [123]/ })).toHaveLength(3);
      await user.click(within(screen.getByRole('group', { name: 'Which view makes it clearest what to do?' })).getByText('View 1'));
      await user.click(screen.getByRole('button', { name: i < 3 ? 'Next scenario' : 'Final questions' }));
    }
    await user.click(screen.getByText('Calendar only'));
    await user.click(screen.getByRole('button', { name: 'Save session' }));
    expect(await screen.findByText('Session saved')).toBeInTheDocument();
    expect(screen.getByText(/Nexus situation card/)).toBeInTheDocument(); // revealed only now
    await user.click(screen.getByRole('button', { name: 'Back to research start' }));
    expect(screen.getByText('Completed sessions in this browser: 1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Export as CSV' }));
    const csv = (screen.getByLabelText(/CSV \(matches/) as HTMLTextAreaElement).value.split('\n');
    expect(csv).toHaveLength(5);
    expect(csv[1]).toContain('P02');
  });
});
