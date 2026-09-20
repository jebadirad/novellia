'use client';

import { useMemo, useState } from 'react';
import { Typeahead } from '@astryxdesign/core/Typeahead';
import { Button } from '@astryxdesign/core/Button';
import { Plus } from 'lucide-react';
import { providerKinds, type ProviderDto } from '@/domain/providers';

export function ProviderPicker({
  providers,
  value,
  onChange,
  error,
  onAdd,
}: {
  providers: ProviderDto[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
  onAdd: (name: string) => void;
}) {
  const [query, setQuery] = useState('');
  const items = useMemo(
    () =>
      providers.map((p) => ({
        ...p,
        label: p.name + (p.archivedAt ? ' (archived)' : ''),
        description: providerKinds[p.kind],
      })),
    [providers],
  );
  const source = useMemo(
    () => ({
      search: (q: string) =>
        items.filter((p) => !p.archivedAt && p.name.toLowerCase().includes(q.toLowerCase())),
      bootstrap: () => items.filter((p) => !p.archivedAt),
    }),
    [items],
  );
  return (
    <div data-field="providerId" className="min-w-0">
      <Typeahead
        label="Vet or clinic"
        isOptional
        value={items.find((p) => p.id === value) ?? null}
        onChange={(p) => onChange(p?.id ?? '')}
        searchSource={source}
        onChangeQuery={setQuery}
        hasEntriesOnFocus
        minQueryLength={0}
        debounceMs={0}
        placeholder="Search or select a provider"
        emptySearchResultsText="No matching providers. Add one below."
        size="lg"
        width="100%"
        status={error ? { type: 'error', message: error } : undefined}
        statusVariant="detached"
      />
      <div className="mt-2">
        <Button
          label="Add new provider"
          icon={<Plus size={15} />}
          variant="ghost"
          size="sm"
          onClick={() => onAdd(query)}
        />
      </div>
      {items.find((p) => p.id === value)?.archivedAt && (
        <p className="mt-1 text-xs text-secondary">
          Archived provider. This historical link will be kept unless you change it.
        </p>
      )}
    </div>
  );
}
