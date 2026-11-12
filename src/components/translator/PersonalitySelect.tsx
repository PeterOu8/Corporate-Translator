import { useEffect, useRef, useState, useId } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useController, type Control } from 'react-hook-form';
import type { TranslationInput } from '@/lib/validation/translate';

const personalities = [
  { value: 'professional', label: 'Professional', description: 'Polished, confident language for the workplace.' },
  { value: 'startup founder', label: 'Startup Founder', description: 'Big ideas, bold ambition, and a startup mindset.' },
  { value: 'recruiter', label: 'Recruiter', description: 'People-first language with an eye for opportunity.' },
] as const;

export default function PersonalitySelect({ control }: { control: Control<TranslationInput> }) {
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const { field } = useController({ name: 'style', control });
  const selected = personalities.find((item) => item.value === field.value) ?? personalities[0];

  function close(restoreFocus = false) {
    if (!panel.current) return;
    if (restoreFocus) panel.current.querySelector('button')?.focus();
    setOpen(false);
  }

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !panel.current?.contains(event.target)) close();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <div ref={panel} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) { close(); field.onBlur(); }
    }} onKeyDown={(event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(true); }
    }}>
      <button type="button" className="personality-trigger" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(!open)}>
        <span className="sr-only">Personality: </span>{selected.label}
        <ChevronDown className={`size-4 shrink-0 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && <fieldset id={menuId} className="personality-menu">
        <legend className="sr-only">Choose personality</legend>
        <p className="px-4 py-3 text-sm font-semibold">Choose personality</p>
        {personalities.map((personality) => (
          <button type="button" key={personality.value} className="personality-option w-full text-left" aria-pressed={field.value === personality.value} onClick={() => { field.onChange(personality.value); close(true); }}>
            <Check aria-hidden="true" className={`mt-0.5 size-4 shrink-0 text-primary ${field.value === personality.value ? '' : 'invisible'}`} />
            <span>
              <span className="block text-sm font-medium">{personality.label}</span>
              <span className="mt-1 block helper-text">{personality.description}</span>
            </span>
          </button>
        ))}
      </fieldset>}
    </div>
  );
}
