import { listRecords } from '@/server/records';
import { petOptions } from '@/server/pets';
import { recordQuerySchema, cleanQuery, type SearchParams } from '@/domain/schemas';
import { PageHeading, Panel, RecordTable, EmptyState, Pagination } from '@/components/display';
import { AddRecordButton } from '@/components/actions';
import { Filters } from '@/components/filters';
export const metadata = { title: 'Medical records' };
export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const parsed = recordQuerySchema.safeParse(cleanQuery(params));
  const pets = await petOptions();
  const result = parsed.success ? await listRecords(parsed.data) : null;
  const filtered = Object.values(cleanQuery(params)).length > 0;
  return (
    <>
      <PageHeading
        title="Every detail, remembered."
        subtitle="Find a visit, vaccination, or medication across all your pets."
        eyebrow="MEDICAL RECORDS"
        action={<AddRecordButton pets={pets} />}
      />
      <Filters kind="records" pets={pets} />
      {!parsed.success && (
        <p
          role="alert"
          className="mb-5 rounded-md border border-care-error-border bg-care-error px-4 py-3 text-sm text-care-error-text"
        >
          {parsed.error.issues[0].message}
        </p>
      )}
      {result && (
        <>
          <Panel title={`${result.total} medical ${result.total === 1 ? 'record' : 'records'}`}>
            {result.items.length ? (
              <RecordTable records={result.items} />
            ) : (
              <EmptyState
                title={filtered ? 'No matching records' : 'The little details belong here'}
                description={
                  filtered
                    ? 'Try another search or clear your filters.'
                    : 'Add a medical record from a pet’s profile to get started.'
                }
                href={filtered ? '/records' : '/pets'}
                label={filtered ? 'Clear filters' : 'Go to pets'}
                search={filtered}
              />
            )}
          </Panel>
          <Pagination result={result} params={params} path="/records" />
        </>
      )}
    </>
  );
}
