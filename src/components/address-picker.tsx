'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Typeahead } from '@astryxdesign/core/Typeahead';
import type { AddressSuggestion } from '@/domain/contact';

export function AddressPicker({ onSelect }: { onSelect: (address: AddressSuggestion) => void }) {
  const [selected, setSelected] = useState<AddressSuggestion | null>(null);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const source = useMemo(
    () => ({
      bootstrap: () => [],
      search: async (query: string): Promise<AddressSuggestion[]> => {
        controller.current?.abort();
        const request = new AbortController();
        controller.current = request;
        setError('');
        try {
          const response = await fetch(`/api/address-suggestions?q=${encodeURIComponent(query)}`, {
            signal: request.signal,
          });
          if (!response.ok) {
            throw new Error('Search unavailable');
          }
          const result = await response.json();
          return request.signal.aborted ? [] : result.suggestions;
        } catch {
          if (!request.signal.aborted) {
            setError('Address search is unavailable. You can still enter the address below.');
          }
          return [];
        }
      },
    }),
    [],
  );
  return (
    <div>
      <Typeahead
        label="Find a U.S. address"
        isOptional
        placeholder="Start typing a street address"
        value={selected}
        searchSource={source}
        minQueryLength={4}
        debounceMs={500}
        maxMenuItems={5}
        width="100%"
        onChangeQuery={() => {
          controller.current?.abort();
          setError('');
        }}
        onChange={(address) => {
          setSelected(address);
          if (address) {
            onSelect(address);
          }
        }}
        emptySearchResultsText="No matching street addresses. Enter the details below."
      />
      <p className="mt-2 text-xs text-secondary">
        Choose a suggestion to fill the fields below, or enter them yourself. Check the street
        number and add any suite separately.
      </p>
      {error && (
        <p role="status" className="mt-2 text-sm text-secondary">
          {error}
        </p>
      )}
      <p className="mt-1 text-xs text-secondary">
        Search by{' '}
        <a href="https://photon.komoot.io" target="_blank" rel="noreferrer" className="underline">
          Photon
        </a>{' '}
        · ©{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          OpenStreetMap contributors
        </a>
      </p>
    </div>
  );
}
