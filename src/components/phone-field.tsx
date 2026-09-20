'use client';

import { useLayoutEffect, useRef } from 'react';
import { TextInput } from '@astryxdesign/core/TextInput';
import { maskPhone } from '@/domain/phone-mask';
import type { FieldErrors } from '@/domain/types';

export function PhoneField({
  value,
  onChange,
  onBlur,
  errors,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  errors: FieldErrors;
}) {
  const input = useRef<HTMLInputElement>(null);
  const selection = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (selection.current !== null) {
      input.current?.setSelectionRange(selection.current, selection.current);
      selection.current = null;
    }
  });
  function update(raw: string, caret: number) {
    const masked = maskPhone(raw, caret);
    selection.current = masked.caret;
    onChange(masked.value);
  }
  return (
    <div data-field="phone" onBlur={onBlur}>
      <TextInput
        ref={input}
        label="Phone"
        htmlName="phone"
        value={value}
        onChange={(raw, event) => update(raw, event?.target.selectionStart ?? raw.length)}
        onKeyDown={(event) => {
          const element = event.currentTarget;
          const start = element.selectionStart ?? 0;
          if (start !== element.selectionEnd || event.altKey || event.ctrlKey || event.metaKey)
            return;
          // Skip mask punctuation when deleting, so separators never trap the cursor.
          const direction = event.key === 'Backspace' ? -1 : event.key === 'Delete' ? 1 : 0;
          if (!direction) return;
          let index = direction < 0 ? start - 1 : start;
          if (!/[()\s-]/.test(value[index] ?? '') || /[ex#]/i.test(value.slice(0, start))) return;
          while (index >= 0 && index < value.length && /[()\s-]/.test(value[index]))
            index += direction;
          if (index < 0 || index >= value.length || !/\d/.test(value[index])) return;
          event.preventDefault();
          update(value.slice(0, index) + value.slice(index + 1), direction < 0 ? index : start);
        }}
        autoComplete="tel"
        placeholder="(480) 555-0100"
        isOptional
        size="lg"
        width="100%"
        status={errors.phone ? { type: 'error', message: errors.phone[0] } : undefined}
        statusVariant="detached"
      />
    </div>
  );
}
