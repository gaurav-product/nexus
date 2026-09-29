import { useEffect, useRef, useState } from 'react';
import { formatDateTime, sourcePhrase, type SituationView } from '@nexus/core';
import { useStore } from '../state/store';
import { Button } from './ui';

/**
 * Resolving a conflict means choosing which version is right (or neither).
 * Native <dialog> gives us focus trapping, Escape to close and inertness.
 */
export function ResolveDialog({
  situation,
  open,
  onClose,
  onConfirm,
}: {
  situation: SituationView;
  open: boolean;
  onClose: () => void;
  onConfirm: (choice: string) => void;
}) {
  const { sources } = useStore();
  const ref = useRef<HTMLDialogElement>(null);
  const [choice, setChoice] = useState<string>('');

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setChoice('');
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open]);

  if (situation.details.type !== 'conflict') return null;
  const details = situation.details;
  const labelFor = (ids: string[]) => {
    const phrases = ids.map((id) => {
      const src = sources.find((x) => x.id === id);
      return src ? sourcePhrase(src) : id;
    });
    return phrases.length > 1 ? `${phrases.slice(0, -1).join(', ')} and ${phrases[phrases.length - 1]}` : phrases[0];
  };

  const options = [
    ...details.versions.map((v) => ({ value: v.key, title: formatDateTime(v.value), hint: `What ${labelFor(v.sourceIds)} ${v.sourceIds.length > 1 ? 'say' : 'says'}` })),
    ...(details.linkStrength === 'weak' ? [{ value: 'not_same', title: 'These are different events', hint: 'Nexus matched them by name only.' }] : []),
    { value: 'neither', title: 'Neither is right', hint: 'You’ll fix both sources yourself.' },
  ];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="resolve-title"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-rule bg-surface p-0 text-ink shadow-2xl"
    >
      <form
        method="dialog"
        className="p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (choice) onConfirm(choice);
        }}
      >
        <h2 id="resolve-title" className="text-[18px] font-semibold">
          Which version is correct?
        </h2>
        <p className="mt-1 text-[14px] text-muted">
          Nexus will remember your answer. If a source changes later, it will ask again.
        </p>
        <fieldset className="mt-4 flex flex-col gap-2">
          <legend className="sr-only">Correct version</legend>
          {options.map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 ${choice === o.value ? 'border-action bg-action-tint' : 'border-rule hover:bg-sunk'}`}
            >
              <input type="radio" name="choice" value={o.value} checked={choice === o.value} onChange={() => setChoice(o.value)} className="mt-1 accent-[var(--action)]" />
              <span>
                <span className="block font-medium">{o.title}</span>
                <span className="block text-[13px] text-muted">{o.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="mt-3 text-[12.5px] text-muted">Nexus won’t change your calendar or email anyone. Fix the wrong source yourself.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={!choice}>
            Save answer
          </Button>
        </div>
      </form>
    </dialog>
  );
}
