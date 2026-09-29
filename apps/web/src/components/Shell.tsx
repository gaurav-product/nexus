import { useEffect, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { formatDateTime } from '@nexus/core';
import { useStore } from '../state/store';

function Toast() {
  const { toast, dismissToast } = useStore();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 3500);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      {toast && (
        <div key={toast.id} className="pointer-events-auto rounded-lg bg-ink px-4 py-2.5 text-[14px] font-medium text-paper shadow-lg">
          {toast.text}
        </div>
      )}
    </div>
  );
}

const LINKS = [
  { to: '/inbox', label: 'Inbox' },
  { to: '/sources', label: 'Sources' },
  { to: '/activity', label: 'Activity' },
  { to: '/about', label: 'How it works' },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  const first = pathname.split('/')[1];
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [first]);
  return null;
}

export function Shell({ children }: { children: ReactNode }) {
  const { now, counts } = useStore();
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
          <NavLink to="/inbox" className="flex items-center gap-2" aria-label="Nexus, go to inbox">
            <svg aria-hidden width="22" height="22" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="7" fill="var(--action)" />
              <path d="M9 22V10l14 12V10" stroke="var(--action-ink)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[17px] font-semibold tracking-[-0.01em]">Nexus</span>
          </NavLink>
          <span className="rounded-full border border-dashed border-rule-strong px-2 py-0.5 text-[12px] font-medium text-muted" title={`The demo clock is fixed at ${formatDateTime(now)} so every visitor sees the same thing.`}>
            Demo mode, fictional data
          </span>
          <nav aria-label="Main" className="ml-auto hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-md px-2.5 py-1.5 text-[14px] font-medium ${isActive ? 'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--rule)]' : 'text-muted hover:text-ink'}`
                }
              >
                {l.label}
                {l.to === '/inbox' && counts.needs_attention > 0 && (
                  <span className="ml-1.5 rounded-full bg-action px-1.5 text-[11.5px] text-action-ink">{counts.needs_attention}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `shrink-0 rounded-md px-2.5 py-1 text-[13.5px] font-medium ${isActive ? 'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--rule)]' : 'text-muted'}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="main" className="flex min-h-0 flex-1 flex-col">
        {children}
      </main>
      <Toast />
    </div>
  );
}
