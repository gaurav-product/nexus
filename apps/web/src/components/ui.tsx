import { useEffect, useId, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import {
  CalendarClock,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleHelp,
  FileQuestion,
  GitCompareArrows,
  History,
  Hourglass,
  Split,
  type LucideIcon,
} from 'lucide-react';
import type { Bucket, EvidenceStatus } from '@nexus/core';

// ─── Status: the trust contract (PRD §8) ────────────────────────────────────

export const STATUS: Record<EvidenceStatus, { label: string; help: string; icon: LucideIcon; tone: string }> = {
  confirmed: {
    label: 'Confirmed',
    help: 'Two or more sources agree, or you confirmed it.',
    icon: CircleCheck,
    tone: 'text-ok border-current',
  },
  strong: {
    label: 'Strong evidence',
    help: 'A source states this directly and nothing contradicts it.',
    icon: CircleDot,
    tone: 'text-ink border-rule-strong',
  },
  conflicting: {
    label: 'Sources disagree',
    help: 'Linked sources give different answers. Nexus won’t pick one for you.',
    icon: Split,
    tone: 'text-conflict border-current',
  },
  possible: {
    label: 'Possible',
    help: 'Based on a loose match or an inference. Worth a quick check.',
    icon: CircleHelp,
    tone: 'text-muted border-dashed border-rule-strong',
  },
  needs_confirmation: {
    label: 'Needs your confirmation',
    help: 'Nexus can’t verify this from your connected sources.',
    icon: CircleDashed,
    tone: 'text-missing border-dashed border-current',
  },
};

export function StatusBadge({ status, withHelp = false }: { status: EvidenceStatus; withHelp?: boolean }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <span className="inline-flex flex-col gap-1">
      <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[12.5px] font-medium ${s.tone}`}>
        <Icon aria-hidden size={13} strokeWidth={2.25} />
        <span>{s.label}</span>
      </span>
      {withHelp && <span className="text-[12.5px] text-muted">{s.help}</span>}
    </span>
  );
}

// ─── Situation type ─────────────────────────────────────────────────────────

export const TYPE: Record<Bucket, { label: string; icon: LucideIcon; stripe: string; text: string; tint: string }> = {
  conflicts: { label: 'Conflict', icon: GitCompareArrows, stripe: 'bg-conflict', text: 'text-conflict', tint: 'bg-conflict-tint' },
  changes: { label: 'Change', icon: History, stripe: 'bg-change', text: 'text-change', tint: 'bg-change-tint' },
  commitments: { label: 'Commitment', icon: CalendarClock, stripe: 'bg-commitment', text: 'text-commitment', tint: 'bg-commitment-tint' },
  waiting: { label: 'Waiting', icon: Hourglass, stripe: 'bg-waiting', text: 'text-waiting', tint: 'bg-waiting-tint' },
  missing: { label: 'Request', icon: FileQuestion, stripe: 'bg-missing', text: 'text-missing', tint: 'bg-missing-tint' },
};

export function TypeTag({ bucket }: { bucket: Bucket }) {
  const t = TYPE[bucket];
  const Icon = t.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold ${t.text}`}>
      <Icon aria-hidden size={14} strokeWidth={2.25} />
      {t.label}
    </span>
  );
}

// ─── Buttons ────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'quiet';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-action text-action-ink hover:opacity-90',
  secondary: 'bg-surface text-ink border border-rule-strong hover:bg-sunk',
  quiet: 'text-muted hover:text-ink hover:bg-sunk',
};

export function Button({ variant = 'secondary', className = '', ...p }: ComponentPropsWithRef<'button'> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...p}
      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[14px] font-medium transition-colors disabled:opacity-50 ${VARIANT[variant]} ${className}`}
    />
  );
}

// ─── Menu (disclosure pattern; Escape and outside click close it) ──────────

export function Menu({
  label,
  icon,
  items,
}: {
  label: string;
  icon?: ReactNode;
  items: { label: string; hint?: string; onSelect: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLButtonElement>('[data-menu-item]')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button ref={btn} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {icon}
        {label}
      </Button>
      {open && (
        <div id={id} className="absolute bottom-full left-0 z-20 mb-1 min-w-56 rounded-lg border border-rule bg-surface p-1 shadow-lg sm:bottom-auto sm:top-full sm:mb-0 sm:mt-1">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              data-menu-item
              className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-[14px] hover:bg-sunk focus-visible:bg-sunk"
              onClick={() => {
                setOpen(false);
                it.onSelect();
              }}
            >
              <span className="font-medium">{it.label}</span>
              {it.hint && <span className="text-[12.5px] text-muted">{it.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-3 text-faint">{icon}</div>}
      <p className="text-[16px] font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-sm text-[14px] text-muted">{children}</div>}
    </div>
  );
}
