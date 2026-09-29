import { Link } from 'react-router-dom';
import { STATUS, StatusBadge, TypeTag } from '../components/ui';
import type { EvidenceStatus } from '@nexus/core';

const TYPES = [
  ['conflicts', 'Two linked sources disagree, for example your calendar and the organiser’s email give different dates. Nexus shows both and never picks one for you.'],
  ['changes', 'Something you planned around was changed by the same sender, for example an airline moving your flight. Nexus shows before and after, and what may be affected.'],
  ['commitments', 'Something you promised in an email, with its due date. It closes when Nexus sees evidence you did it, and you can always reopen it.'],
  ['waiting', 'Something someone promised you. It comes to your attention only if it’s late.'],
  ['missing', 'Someone asked you for a document and Nexus couldn’t find it in your connected sources. “Not found” is not the same as “missing”.'],
] as const;

export function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[72ch] px-4 py-6 sm:px-6">
      <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.01em]">How Nexus works</h1>
      <p className="mt-2 text-[16px] leading-relaxed">
        Nexus reads your email, calendar and uploaded files, and looks for the places where they <em>disagree</em>, where something <em>changed</em>, and where something is
        still <em>open</em>. It shows you a few of those, with the exact source text, and lets you decide.
      </p>
      <p className="mt-3 text-[15px] text-muted">It’s not a chatbot, a second brain or an assistant that acts for you.</p>

      <h2 className="mt-8 text-[17px] font-semibold">What it looks for</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {TYPES.map(([b, text]) => (
          <li key={b} className="rounded-lg border border-rule bg-surface p-3">
            <TypeTag bucket={b} />
            <p className="mt-1 text-[14.5px]">{text}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-[17px] font-semibold">How sure it is</h2>
      <p className="mt-1 text-[14.5px] text-muted">Every item carries one of five labels. They come from fixed rules, not from an AI’s guess, so there are no percentages.</p>
      <ul className="mt-3 flex flex-col gap-3">
        {(Object.keys(STATUS) as EvidenceStatus[]).map((s) => (
          <li key={s}>
            <StatusBadge status={s} withHelp />
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-[17px] font-semibold">What it will never do</h2>
      <ul className="mt-2 list-disc pl-5 text-[14.5px] leading-relaxed">
        <li>Send, reply, reschedule, archive or delete anything.</li>
        <li>Follow instructions written inside an email, event or document. Those are data.</li>
        <li>Present a guess as a fact. Anything inferred is labelled “Inferred by Nexus”.</li>
        <li>Put your email text into logs or analytics.</li>
      </ul>

      <h2 className="mt-8 text-[17px] font-semibold">About this demo</h2>
      <p className="mt-2 text-[14.5px] leading-relaxed">
        Everything here is fictional: the persona (Riya Mehta, a product consultant who is also interviewing), the companies, the airline and the documents. The demo clock is
        fixed at Thursday 1 October 2026, 09:00 IST so everyone sees the same thing. No real accounts are connected and no AI model is called; detection runs on
        deterministic rules in your browser.
      </p>
      <p className="mt-2 text-[14.5px] leading-relaxed">
        Nexus is a portfolio project. Its product thesis, research, PRD and trade-offs are documented in the repository. None of it has been validated with real users yet.
      </p>
      <p className="mt-4">
        <Link to="/inbox" className="font-medium text-action underline-offset-2 hover:underline">
          Back to the inbox
        </Link>
      </p>
    </div>
  );
}
