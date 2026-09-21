import 'server-only';
import { z } from 'zod';
import { usStates, zipSchema, type AddressSuggestion } from '@/domain/contact';
import { AppError } from './errors';

const photonResponse = z.object({
  features: z.array(
    z.object({
      geometry: z
        .object({
          coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
        })
        .optional(),
      properties: z.object({
        osm_id: z.union([z.string(), z.number()]).optional(),
        osm_type: z.string().optional(),
        countrycode: z.string().optional(),
        name: z.string().optional(),
        housenumber: z.string().optional(),
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postcode: z.string().optional(),
      }),
    }),
  ),
});

export function photonSuggestions(payload: unknown): AddressSuggestion[] {
  const result = photonResponse.parse(payload);
  return result.features
    .flatMap(({ properties: p, geometry }, index) => {
      // Never put a city, business name, or county into the street-address field.
      if (p.countrycode?.toUpperCase() !== 'US' || !p.street) {
        return [];
      }
      const state =
        Object.entries(usStates).find(
          ([code, name]) =>
            code === p.state?.toUpperCase() || name.toLowerCase() === p.state?.toLowerCase(),
        )?.[0] ?? null;
      const zip = zipSchema.safeParse(p.postcode);
      const addressLine1 = [p.housenumber, p.street].filter(Boolean).join(' ');
      return [
        {
          id: `${p.osm_type ?? ''}-${p.osm_id ?? index}-${addressLine1}`,
          label: [addressLine1, p.city, state, zip.success ? zip.data : null]
            .filter(Boolean)
            .join(', '),
          addressLine1,
          latitude: geometry?.coordinates[1],
          longitude: geometry?.coordinates[0],
          city: p.city ?? null,
          state,
          zip: zip.success ? zip.data : null,
        },
      ];
    })
    .filter(
      (address, index, addresses) =>
        addresses.findIndex((other) => other.label === address.label) === index,
    )
    .slice(0, 5);
}

export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  const url = new URL('https://photon.komoot.io/api/');
  url.search = new URLSearchParams({
    q: query,
    countrycode: 'US',
    lang: 'en',
    limit: '5',
  }).toString();
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86400 },
    });
    if (!response.ok) {
      throw new Error('Address service unavailable');
    }
    return photonSuggestions(await response.json());
  } catch {
    throw new AppError(
      503,
      'ADDRESS_LOOKUP_UNAVAILABLE',
      'Address search is unavailable. Enter the address below.',
    );
  }
}
