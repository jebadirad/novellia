import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatUsPhone,
  phoneSchema,
  zipSchema,
  stateSchema,
  formatAddress,
} from '../../src/domain/contact';
import { providerSchema } from '../../src/domain/providers';
vi.mock('server-only', () => ({}));
import { photonSuggestions, searchAddresses } from '../../src/server/address-search';
import { GET } from '../../src/app/api/address-suggestions/route';

afterEach(() => vi.unstubAllGlobals());
describe('U.S. contact validation', () => {
  it('formats common phone punctuation, country code, and extensions', () => {
    for (const phone of [
      '4805550100',
      '480-555-0100',
      '(480) 555-0100',
      '+1 (480) 555-0100',
      '1.480.555.0100',
    ]) {
      expect(phoneSchema.parse(phone)).toBe('(480) 555-0100');
    }
    expect(phoneSchema.parse('4805550100 x23')).toBe('(480) 555-0100 ext. 23');
    expect(formatUsPhone('(480) 555-0100 ext. 23')).toBe('(480) 555-0100 ext. 23');
    expect(phoneSchema.parse('')).toBeNull();
    for (const phone of [
      '555-0100',
      'call me',
      '4805550100123',
      '+44 20 7946 0958',
      '0000000000',
      '(4805550100',
      '4805550100 ext.',
    ]) {
      expect(phoneSchema.safeParse(phone).success).toBe(false);
    }
  });
  it('validates state and ZIP shape, preserves leading zeros, allows partial addresses', () => {
    expect(stateSchema.parse('az')).toBe('AZ');
    expect(stateSchema.safeParse('ZZ').success).toBe(false);
    expect(zipSchema.parse('02108')).toBe('02108');
    expect(zipSchema.parse('021081234')).toBe('02108-1234');
    for (const zip of ['1234', 'ABCDE', '123456', '12345-123']) {
      expect(zipSchema.safeParse(zip).success).toBe(false);
    }
    const partial = providerSchema.parse({ name: 'Clinic', city: 'Phoenix' });
    expect(partial.addressLine1).toBeNull();
    expect(
      formatAddress({
        ...partial,
        addressLine1: '100 Example St',
        addressLine2: 'Suite 2',
        state: 'AZ',
        zip: '85001',
      }),
    ).toBe('100 Example St\nSuite 2\nPhoenix, AZ 85001');
    expect(providerSchema.safeParse({ name: 'Clinic', address: 'old field' }).success).toBe(false);
  });
});

describe('address lookup adapter', () => {
  const payload = {
    features: [
      {
        properties: {
          osm_id: 1,
          osm_type: 'N',
          countrycode: 'US',
          housenumber: '100',
          street: 'Example Street',
          city: 'Phoenix',
          state: 'Arizona',
          postcode: '85001',
        },
      },
    ],
  };
  it('maps U.S. street components without guessing missing data or copying place names', () => {
    expect(photonSuggestions(payload)[0]).toMatchObject({
      addressLine1: '100 Example Street',
      city: 'Phoenix',
      state: 'AZ',
      zip: '85001',
    });
    expect(
      photonSuggestions({ features: [...payload.features, ...payload.features] }),
    ).toHaveLength(1);
    expect(
      photonSuggestions({
        features: [
          { properties: { countrycode: 'CA', street: 'Example Street' } },
          { properties: { countrycode: 'US', name: 'Phoenix', city: 'Phoenix' } },
        ],
      }),
    ).toEqual([]);
    expect(
      photonSuggestions({
        features: [
          { properties: { countrycode: 'US', street: 'Example Street', postcode: 'invalid' } },
        ],
      })[0],
    ).toMatchObject({ addressLine1: 'Example Street', city: null, state: null, zip: null });
  });
  it('restricts upstream requests and handles unavailable or malformed results', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchAddresses('100 Example')).toHaveLength(1);
    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.origin).toBe('https://photon.komoot.io');
    expect(url.searchParams.get('countrycode')).toBe('US');
    expect(url.searchParams.get('limit')).toBe('5');
    for (const response of [new Response(null, { status: 429 }), Response.json({ bad: 'data' })]) {
      fetchMock.mockResolvedValueOnce(response);
      await expect(searchAddresses('100 Example')).rejects.toMatchObject({ status: 503 });
    }
    fetchMock.mockRejectedValueOnce(new Error('timeout'));
    await expect(searchAddresses('100 Example')).rejects.toMatchObject({ status: 503 });
  });
  it('rejects short/oversized queries before any upstream request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    for (const q of ['abc', 'x'.repeat(201)]) {
      expect(
        (await GET(new Request(`http://localhost/api/address-suggestions?q=${q}`))).status,
      ).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
