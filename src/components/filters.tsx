'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Selector } from '@astryxdesign/core/Selector';
import { DateInput } from '@astryxdesign/core/DateInput';
import type { ISODateString } from '@astryxdesign/core/Calendar';
import { Button } from '@astryxdesign/core/Button';
import { recordTypes, recordMeta, speciesLabels } from '@/domain/schemas';
import s from './styles.module.css';
export function Filters({
  kind,
  pets = [],
  scoped = false,
}: {
  kind: 'pets' | 'records' | 'follow-ups';
  pets?: { id: string; name: string }[];
  scoped?: boolean;
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
  useEffect(() => {
    currentQuery.current = params.toString();
    // Browser Back/Forward restores controlled inputs to the URL's state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQ(params.get('q') ?? '');
    setDates({ from: params.get('from') ?? '', to: params.get('to') ?? '' });
  }, [params]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function update(changes: Record<string, string>, replace = false) {
    const next = new URLSearchParams(currentQuery.current);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete('page');
    currentQuery.current = next.toString();
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
      <div className={s.toolbar} aria-busy={pending}>
        {kind !== 'follow-ups' && (
          <div className={s.searchField}>
            <TextInput
              label={kind === 'pets' ? 'Search pets' : 'Search records'}
              isLabelHidden
              placeholder={
                kind === 'pets' ? 'Search by name or breed…' : 'Search titles, notes, or clinics…'
              }
              value={q}
              onChange={(value) => {
                setQ(value);
                if (timer.current) clearTimeout(timer.current);
                timer.current = setTimeout(() => update({ q: value }, true), 300);
              }}
              size="lg"
              width="100%"
              hasClear
            />
          </div>
        )}
        {kind === 'pets' && (
          <div className={s.filterField}>
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
          <div className={s.filterField}>
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
            <div className={s.filterField}>
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
            <div className={s.filterDate}>
              <DateInput
                label="From date"
                value={(dates.from || undefined) as ISODateString | undefined}
                onChange={(value) => changeDate('from', value ?? '')}
                nativePicker="always"
                format="system_date"
                size="lg"
                width="100%"
              />
            </div>
            <div className={s.filterDate}>
              <DateInput
                label="To date"
                value={(dates.to || undefined) as ISODateString | undefined}
                onChange={(value) => changeDate('to', value ?? '')}
                nativePicker="always"
                format="system_date"
                size="lg"
                width="100%"
              />
            </div>
            <div className={s.filterField}>
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
              if (timer.current) clearTimeout(timer.current);
              currentQuery.current = '';
              setQ('');
              setDates({ from: '', to: '' });
              router.push(path, { scroll: false });
            }}
          />
        )}
      </div>
      {invalidRange && (
        <p role="alert" className={s.queryError}>
          End date must be on or after start date.
        </p>
      )}
    </>
  );
}
