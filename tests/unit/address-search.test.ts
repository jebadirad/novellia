import { afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { photonSuggestions, searchAddresses } from '../../src/server/address-search';
import { resolveAddressTimeZone } from '../../src/server/provider-location';
import { GET } from '../../src/app/api/address-suggestions/route';
const address = {
  addressLine1: '100 Example Street',
  addressLine2: null,
  city: 'Example',
  state: 'AZ',
  zip: '85001',
};
const feature = (coordinates = [-112.074, 33.4484]) => ({
  geometry: { coordinates },
  properties: {
    countrycode: 'US',
    housenumber: '100',
    street: 'Example Street',
    city: 'Example',
    state: 'Arizona',
    postcode: '85001',
  },
});
afterEach(() => vi.unstubAllGlobals());
it('maps only US street addresses and normalizes state, ZIP, and coordinates', () => {
  const valid = feature();
  const result = photonSuggestions({
    features: [
      valid,
      valid,
      { properties: { countrycode: 'US', name: 'City' } },
      { ...valid, properties: { ...valid.properties, countrycode: 'CA' } },
    ],
  });
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({
    addressLine1: address.addressLine1,
    city: 'Example',
    state: 'AZ',
    zip: '85001',
    latitude: 33.4484,
    longitude: -112.074,
  });
});
it('retains conflicting coordinates so timezone resolution rejects ambiguity', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(Response.json({ features: [feature(), feature([-109.052, 36.866])] }));
  vi.stubGlobal('fetch', fetchMock);
  expect(await resolveAddressTimeZone(address)).toBeNull();
});
it.each(['throttle', 'network', 'malformed'])(
  'returns a recoverable lookup error for %s',
  async (failure) => {
    const fetchMock = vi.fn();
    if (failure === 'network') {
      fetchMock.mockRejectedValue(new DOMException('Timed out', 'TimeoutError'));
    } else {
      fetchMock.mockResolvedValue(
        failure === 'throttle'
          ? new Response('', { status: 429 })
          : Response.json({ unexpected: true }),
      );
    }
    vi.stubGlobal('fetch', fetchMock);
    await expect(searchAddresses('100 Example Street')).rejects.toMatchObject({
      status: 503,
      code: 'ADDRESS_LOOKUP_UNAVAILABLE',
    });
    expect(await resolveAddressTimeZone(address)).toBeNull();
  },
);
it('skips external requests for incomplete addresses and invalid search queries', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  expect(await resolveAddressTimeZone({ ...address, zip: null })).toBeNull();
  for (const q of ['', 'abc', 'a'.repeat(201)]) {
    expect((await GET(new Request(`http://localhost/api/address-suggestions?q=${q}`))).status).toBe(
      400,
    );
  }
  expect(fetchMock).not.toHaveBeenCalled();
});
it('encodes the query and uses a bounded request to the US geocoder', async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ features: [feature()] }));
  vi.stubGlobal('fetch', fetchMock);
  await searchAddresses('100 Example & Main');
  const [url, options] = fetchMock.mock.calls[0];
  expect(url.searchParams.get('q')).toBe('100 Example & Main');
  expect(url.searchParams.get('countrycode')).toBe('US');
  expect(options.signal).toBeInstanceOf(AbortSignal);
});
