import { z } from 'zod';
import { optionalText } from './schemas';

export const usStates = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  AS: 'American Samoa',
  GU: 'Guam',
  MP: 'Northern Mariana Islands',
  PR: 'Puerto Rico',
  VI: 'U.S. Virgin Islands',
  AA: 'Armed Forces Americas',
  AE: 'Armed Forces Europe',
  AP: 'Armed Forces Pacific',
} as const;

// A shape check, not proof that a phone number exists. Accept familiar US
// punctuation, optional +1, and an extension; store one readable format.
export function formatUsPhone(input: string): string | null {
  const match = input.trim().match(/^(.+?)(?:\s*(?:ext\.?|x|#)\s*(\d{1,6}))?$/i);
  if (
    !match ||
    !/^(?:\+?1[\s.-]*)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]*[2-9]\d{2}[\s.-]*\d{4}$/.test(match[1])
  ) {
    return null;
  }
  const digits = match[1].replace(/\D/g, '').slice(-10);
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}${match[2] ? ` ext. ${match[2]}` : ''}`;
}
export const phoneSchema = optionalText(80)
  .refine(
    (value) => !value || formatUsPhone(value) !== null,
    'Enter a 10-digit U.S. phone number, including area code.',
  )
  .transform((value) => (value ? formatUsPhone(value)! : null));
export const stateSchema = optionalText(2)
  .transform((value) => value?.toUpperCase() ?? null)
  .refine((value) => !value || Object.hasOwn(usStates, value), 'Choose a U.S. state or territory.');
export const zipSchema = optionalText(10)
  .refine(
    (value) => !value || /^\d{5}(?:-?\d{4})?$/.test(value),
    'Enter a 5-digit ZIP code or ZIP+4 (12345-6789).',
  )
  .transform((value) => (value?.length === 9 ? `${value.slice(0, 5)}-${value.slice(5)}` : value));
export const addressFields = {
  // 500 preserves the entire legacy free-text address when it is migrated.
  addressLine1: optionalText(500),
  addressLine2: optionalText(120),
  city: optionalText(100),
  state: stateSchema,
  zip: zipSchema,
};
export type Address = z.infer<z.ZodObject<typeof addressFields>>;
export type AddressSuggestion = Omit<Address, 'addressLine2'> & {
  id: string;
  label: string;
  latitude?: number;
  longitude?: number;
};
export function formatAddress(address: Address): string {
  const locality = [address.city, [address.state, address.zip].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  return [address.addressLine1, address.addressLine2, locality].filter(Boolean).join('\n');
}
