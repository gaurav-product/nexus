import type { Situation } from '@nexus/core';

/**
 * Research concept session (Phase 16) — the four scenarios and the three ways of
 * presenting each one. See docs/research/validation-plan.md § Comparison design.
 *
 * Fairness rule: the AI-briefing condition is given PERFECT detection — it states
 * the same facts Nexus found. Any difference participants show is therefore about
 * presentation, evidence and persistence, not about Nexus detecting more.
 */

export type Condition = 'A' | 'B' | 'C';
export const CONDITION_NAME: Record<Condition, string> = {
  A: 'Current workflow (raw email, calendar, files)',
  B: 'AI daily briefing',
  C: 'Nexus situation card',
};

export type ScenarioKey = 'conflict' | 'change' | 'commitment' | 'missing';

export interface Scenario {
  key: ScenarioKey;
  label: string; // neutral, shown to participant
  /** Picks the Nexus situation for this scenario from the pipeline output. */
  pick: (s: Situation) => boolean;
  /** Unrelated sources shown alongside the relevant ones in the raw view (realistic noise). */
  distractorIds: string[];
  /** The briefing section for this scenario — same facts as the Nexus card, written as a digest. */
  briefing: string;
  /** Facilitator-only: what a correct next action looks like. Never shown to participants. */
  expectedAction: string;
}

export const SCENARIOS: Scenario[] = [
  {
    key: 'conflict',
    label: 'An upcoming interview',
    pick: (s) => s.details.type === 'conflict' && s.details.linkStrength === 'strong',
    distractorIds: ['em-zenith-followup', 'em-newsletter'],
    briefing:
      'Acme interview (Round 2): Neha Kapoor confirmed it for Monday 5 October at 11:00 AM with the product panel, and your invitation letter says the same. Your calendar has it on Tuesday 6 October at 11:00. Neha also said the panel names would come by Wednesday.',
    expectedAction: 'Check the date with the recruiter (Neha) before the interview, then fix the calendar or tell her.',
  },
  {
    key: 'change',
    label: 'A trip next week',
    pick: (s) => s.details.type === 'change',
    distractorIds: ['em-priya', 'cal-zenith'],
    briefing:
      'Travel: Kestrel Air rescheduled flight KS 2134 on Thursday 8 October. It now departs Delhi at 10:30 and lands in Bengaluru at 13:10. Your calendar still shows 08:15. Your Northwind product strategy workshop in Indiranagar starts at 13:30 that day.',
    expectedAction: 'Update the calendar and deal with the workshop clash: ask Arjun to move it or find an earlier flight.',
  },
  {
    key: 'commitment',
    label: 'Work for a client',
    pick: (s) => s.details.type === 'commitment' && s.details.owner === 'me' && s.details.state !== 'appears_fulfilled' && !s.details.isDeadline,
    distractorIds: ['em-zenith-invite', 'em-portfolio-sent'],
    briefing:
      "Northwind: on Tuesday you told Arjun Rao you'd send the revised proposal by Thursday, which is today. There's no later email from you to Arjun with it yet.",
    expectedAction: 'Send the revised proposal to Arjun today, or tell him when to expect it.',
  },
  {
    key: 'missing',
    label: 'A document someone asked for',
    pick: (s) => s.details.type === 'missing_info',
    distractorIds: ['em-flight-booking', 'doc-acme-letter'],
    briefing:
      "Northwind: Arjun Rao asked you to send the signed NDA before the 8 October workshop. You uploaded Northwind_Mutual_NDA.pdf on 29 September, but its signature lines are blank, and your later email to Arjun didn't attach it.",
    expectedAction: 'Sign the NDA and send it to Arjun (or confirm it was already sent another way).',
  },
];

/** All six orderings of the three conditions, for counterbalancing side-by-side display. */
export const ORDERS: Condition[][] = [
  ['A', 'B', 'C'],
  ['A', 'C', 'B'],
  ['B', 'A', 'C'],
  ['B', 'C', 'A'],
  ['C', 'A', 'B'],
  ['C', 'B', 'A'],
];

/** Participant number from an id like "P07" (falls back to a stable hash). */
export function participantNumber(id: string): number {
  const m = /(\d+)/.exec(id);
  if (m) return Number(m[1]);
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * First-exposure condition for scenario i: rotates A→B→C across scenarios and
 * across participants, so each condition is seen "cold" by different people on
 * different scenarios. Comprehension is measured on that first view only.
 */
export function firstCondition(pNum: number, scenarioIndex: number): Condition {
  return (['A', 'B', 'C'] as const)[(pNum + scenarioIndex) % 3]!;
}

export function displayOrder(pNum: number): Condition[] {
  return ORDERS[pNum % ORDERS.length]!;
}
