import 'server-only';
import { find } from 'geo-tz';
import type { Address, AddressSuggestion } from '@/domain/contact';
import { searchAddresses } from './address-search';

const normalized = (value: string | null) => (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function sameAddress(a: Address, b: Address) {
  return ['addressLine1', 'city', 'state', 'zip'].every(
    (key) => normalized(a[key as keyof Address]) === normalized(b[key as keyof Address]),
  );
}
export function addressTimeZone(address: Address, suggestions: AddressSuggestion[]): string | null {
  if (!address.addressLine1 || !address.city || !address.state || !address.zip) {
    return null;
  }
  const matches = suggestions.filter(
    (item) =>
      sameAddress(
        { ...address, zip: address.zip?.slice(0, 5) ?? null },
        { ...item, addressLine2: null, zip: item.zip?.slice(0, 5) ?? null },
      ) &&
      item.latitude !== undefined &&
      item.longitude !== undefined,
  );
  const zones = new Set(matches.flatMap((item) => find(item.latitude!, item.longitude!)));
  // Multiple matches spanning a boundary must not silently pick a timezone.
  return zones.size === 1 && ![...zones][0].startsWith('Etc/') ? [...zones][0] : null;
}
export async function resolveAddressTimeZone(address: Address): Promise<string | null> {
  if (!address.addressLine1 || !address.city || !address.state || !address.zip) {
    return null;
  }
  try {
    const matches = await searchAddresses(
      [address.addressLine1, address.city, address.state, address.zip].join(', '),
    );
    return addressTimeZone(address, matches);
  } catch {
    // Manual addresses remain usable; appointments require a resolved location.
    return null;
  }
}
