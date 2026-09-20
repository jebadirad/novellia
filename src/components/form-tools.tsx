'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { DateInput } from '@/components/date-input';
import type { ISODateString } from '@astryxdesign/core/Calendar';
import type { FieldErrors } from '@/domain/types';

export function useDirtyGuard(dirty: boolean) {
  const [target, setTarget] = useState<string | null>(null);
  const bypass = useRef(false);
  const router = useRouter();
  useEffect(() => {
    function unload(event: BeforeUnloadEvent) {
      if (dirty && !bypass.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
    function click(event: MouseEvent) {
      if (
        !dirty ||
        bypass.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href);
      if (
        url.origin !== location.origin ||
        anchor.getAttribute('href')?.startsWith('#') ||
        url.href === location.href
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setTarget(url.pathname + url.search);
    }
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', click, true);
    };
  }, [dirty]);
  function leave(href: string) {
    if (dirty && !bypass.current) setTarget(href);
    else router.push(href);
  }
  function saved(href: string) {
    bypass.current = true;
    router.push(href);
    router.refresh();
  }
  const dialog = (
    <AlertDialog
      isOpen={!!target}
      onOpenChange={(open) => {
        if (!open) setTarget(null);
      }}
      title="Discard unsaved changes?"
      description="Your changes have not been saved. Leave this page and discard them?"
      actionLabel="Discard changes"
      onAction={() => {
        bypass.current = true;
        router.push(target!);
        setTarget(null);
      }}
    />
  );
  return { leave, saved, dialog };
}
export function focusError(fields: FieldErrors, scope?: HTMLElement | null) {
  const first = Object.keys(fields)[0];
  if (!first) return;
  requestAnimationFrame(() => {
    const wrapper = (scope ?? document).querySelector<HTMLElement>(
      `[data-field="${CSS.escape(first)}"]`,
    );
    const element = wrapper?.querySelector<HTMLElement>(
      'input:not([type="hidden"]),textarea,button,[tabindex="0"]',
    );
    element?.focus();
  });
}
type FieldProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  errors: FieldErrors;
  optional?: boolean;
  placeholder?: string;
};
export function TextField({
  name,
  label,
  value,
  onChange,
  errors,
  optional,
  placeholder,
}: FieldProps) {
  return (
    <div data-field={name}>
      <TextInput
        label={label}
        htmlName={name}
        value={value}
        onChange={onChange}
        size="lg"
        width="100%"
        isOptional={optional}
        placeholder={placeholder}
        status={errors[name] ? { type: 'error', message: errors[name][0] } : undefined}
        statusVariant="detached"
      />
    </div>
  );
}
export function NotesField({ name, label, value, onChange, errors, optional = true }: FieldProps) {
  return (
    <div data-field={name}>
      <TextArea
        label={label}
        htmlName={name}
        value={value}
        onChange={onChange}
        rows={4}
        width="100%"
        isOptional={optional}
        status={errors[name] ? { type: 'error', message: errors[name][0] } : undefined}
        statusVariant="detached"
      />
    </div>
  );
}
export function CalendarField({
  name,
  label,
  value,
  onChange,
  errors,
  optional,
  max,
  min,
}: FieldProps & { max?: string; min?: string }) {
  return (
    <div data-field={name}>
      <DateInput
        label={label}
        value={(value || undefined) as ISODateString | undefined}
        onChange={(value) => onChange(value ?? '')}
        max={max as ISODateString | undefined}
        min={min as ISODateString | undefined}
        size="lg"
        width="100%"
        isOptional={optional}
        status={errors[name] ? { type: 'error', message: errors[name][0] } : undefined}
        statusVariant="detached"
      />
    </div>
  );
}
