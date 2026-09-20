'use client';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Selector } from '@astryxdesign/core/Selector';
import { DateInput } from '@/components/date-input';
import type { ISODateString } from '@astryxdesign/core/Calendar';
import { Button } from '@astryxdesign/core/Button';
import { recordTypes, recordMeta, speciesLabels } from '@/domain/schemas';
export function Filters({
  kind,
  pets = [],
  providers = [],
  scoped = false,
}: {
  kind: 'pets' | 'records' | 'follow-ups';
  pets?: { id: string; name: string }[];
  scoped?: boolean;
  providers?: { id: string; name: string; archivedAt: string | null }[];
}) {
  const params = useSearchParams();
  const path = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [dates, setDates] = useState({
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQuery = useRef(params.toString());
  const pendingSearch = useRef<string | null>(null);
  const navigationQuery = useRef<string | null>(null);
  const cancelSearch = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pendingSearch.current = null;
  }, []);
  useEffect(() => {
    const query = params.toString();
    // External navigation replaces the draft. Our own navigation may finish
    // while the owner is already typing their next search, which must survive.
    if (query !== navigationQuery.current) cancelSearch();
    navigationQuery.current = null;
    currentQuery.current = query;
    setQ(pendingSearch.current ?? params.get('q') ?? '');
    setDates({ from: params.get('from') ?? '', to: params.get('to') ?? '' });
  }, [params, cancelSearch]);
  useEffect(() => {
    function restoreHistory() {
      // Cancel immediately, before the restored server page finishes loading.
      cancelSearch();
      navigationQuery.current = null;
      currentQuery.current = window.location.search.slice(1);
    }
    window.addEventListener('popstate', restoreHistory);
    return () => {
      cancelSearch();
      window.removeEventListener('popstate', restoreHistory);
    };
  }, [cancelSearch]);
  function update(changes: Record<string, string>, replace = false) {
    const next = new URLSearchParams(currentQuery.current);
    // A select/date change commits the pending text together with the filter.
    if (pendingSearch.current !== null) changes = { q: pendingSearch.current, ...changes };
    cancelSearch();
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete('page');
    currentQuery.current = next.toString();
    navigationQuery.current = next.toString();
    startTransition(() => {
      const href = `${path}${next.size ? `?${next}` : ''}`;
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    });
  }
  const invalidRange = !!dates.from && !!dates.to && dates.from > dates.to;
  function changeDate(key: 'from' | 'to', value: string) {
    const next = { ...dates, [key]: value };
    setDates(next);
    if (!next.from || !next.to || next.from <= next.to) update(next);
  }
  return (
    <>
      <div
        className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3.5 md:px-5 md:py-4"
        aria-busy={pending}
      >
        {kind !== 'follow-ups' && (
          <div className="w-full min-w-full flex-1 md:w-auto md:min-w-50">
            <TextInput
              label={kind === 'pets' ? 'Search pets' : 'Search records'}
              isLabelHidden
              placeholder={
                kind === 'pets' ? 'Search by name or breed…' : 'Search titles, notes, or clinics…'
              }
              value={q}
              onChange={(value) => {
                setQ(value);
                cancelSearch();
                pendingSearch.current = value;
                timer.current = setTimeout(() => update({ q: value }, true), 300);
              }}
              size="lg"
              width="100%"
              hasClear
            />
          </div>
        )}
        {kind === 'records' && !scoped && (
          <div className="min-w-40 flex-1 md:flex-[0_1_190px]">
            <Selector
              label="Filter by provider"
              isLabelHidden
              value={params.get('providerId') ?? ''}
              onChange={(value) => update({ providerId: value })}
              size="lg"
              width="100%"
              options={[
                { value: '', label: 'All providers' },
                ...providers.map((p) => ({
                  value: p.id,
                  label: p.name + (p.archivedAt ? ' (archived)' : ''),
                })),
              ]}
            />
          </div>
        )}
        {kind === 'pets' && (
          <div className="min-w-32 flex-1 md:min-w-36 md:flex-[0_1_160px]">
            <Selector
              label="Species filter"
              isLabelHidden
              value={params.get('species') ?? 'all'}
              options={[
                { value: 'all', label: 'All species' },
                ...Object.entries(speciesLabels).map(([value, label]) => ({ value, label })),
              ]}
              onChange={(value) => update({ species: value === 'all' ? '' : value })}
              width="100%"
              size="lg"
            />
          </div>
        )}
        {kind !== 'pets' && !scoped && (
          <div className="min-w-32 flex-1 md:min-w-36 md:flex-[0_1_160px]">
            <Selector
              label="Pet filter"
              isLabelHidden
              value={params.get('petId') ?? 'all'}
              options={[
                { value: 'all', label: 'All pets' },
                ...pets.map((pet) => ({ value: pet.id, label: pet.name })),
              ]}
              onChange={(value) => update({ petId: value === 'all' ? '' : value })}
              width="100%"
              size="lg"
            />
          </div>
        )}
        {kind === 'records' && (
          <>
            <div className="min-w-32 flex-1 md:min-w-36 md:flex-[0_1_160px]">
              <Selector
                label="Record type filter"
                isLabelHidden
                value={params.get('type') ?? 'all'}
                options={[
                  { value: 'all', label: 'All types' },
                  ...recordTypes.map((value) => ({ value, label: recordMeta[value].label })),
                ]}
                onChange={(value) => update({ type: value === 'all' ? '' : value })}
                width="100%"
                size="lg"
              />
            </div>
            <div className="min-w-0 flex-[1_0_100%] md:min-w-45 md:flex-[0_1_190px]">
              <DateInput
                label="From date"
                value={(dates.from || undefined) as ISODateString | undefined}
                onChange={(value) => changeDate('from', value ?? '')}
                size="lg"
                width="100%"
              />
            </div>
            <div className="min-w-0 flex-[1_0_100%] md:min-w-45 md:flex-[0_1_190px]">
              <DateInput
                label="To date"
                value={(dates.to || undefined) as ISODateString | undefined}
                onChange={(value) => changeDate('to', value ?? '')}
                size="lg"
                width="100%"
              />
            </div>
            <div className="min-w-32 flex-1 md:min-w-36 md:flex-[0_1_160px]">
              <Selector
                label="Sort records"
                isLabelHidden
                value={params.get('sort') ?? 'newest'}
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                ]}
                onChange={(value) => update({ sort: value })}
                size="lg"
                width="100%"
              />
            </div>
          </>
        )}
        {params.size > 0 && (
          <Button
            label="Clear filters"
            variant="ghost"
            size="sm"
            onClick={() => {
              cancelSearch();
              navigationQuery.current = '';
              currentQuery.current = '';
              setQ('');
              setDates({ from: '', to: '' });
              router.push(path, { scroll: false });
            }}
          />
        )}
      </div>
      {invalidRange && (
        <p
          role="alert"
          className="mb-5 rounded-md border border-care-error-border bg-care-error px-4 py-3 text-sm text-care-error-text"
        >
          End date must be on or after start date.
        </p>
      )}
    </>
  );
}
