'use client';

import type { ComponentProps } from 'react';
import { DateInput as AstryxDateInput } from '@astryxdesign/core/DateInput';

type Props = Omit<
  ComponentProps<typeof AstryxDateInput>,
  'nativePicker' | 'format' | 'placeholder'
>;

// Native pickers reveal a browser-specific format on focus. Keep every field
// in ISO format using Astryx's desktop calendar and touch picker instead.
export function DateInput(props: Props) {
  return (
    <AstryxDateInput
      {...props}
      nativePicker="never"
      format="system_date"
      placeholder="YYYY-MM-DD"
    />
  );
}
