import { describe, expect, it } from 'vitest';
import { maskPhone } from '../../src/domain/phone-mask';

describe('live phone masking', () => {
  it('formats partial numbers without requiring blur', () => {
    for (const [input, value] of [
      ['', ''],
      ['4', '(4'],
      ['480', '(480'],
      ['4805', '(480) 5'],
      ['4805550', '(480) 555-0'],
      ['4805550100', '(480) 555-0100'],
    ])
      expect(maskPhone(input).value).toBe(value);
  });
  it('preserves country codes, extensions, and invalid extra input for validation', () => {
    expect(maskPhone('+1 4805550100 x23').value).toBe('+1 (480) 555-0100 x23');
    expect(maskPhone('48055501000').value).toBe('(480) 555-01000');
    expect(maskPhone('call me').value).toBe('call me');
  });
  it('keeps the caret beside the edited digit', () => {
    expect(maskPhone('(480) 9555-0100', 7)).toEqual({ value: '(480) 955-50100', caret: 7 });
  });
});
