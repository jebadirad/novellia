import { listPets } from '@/server/pets';
import { today } from '@/server/context';
import { petQuerySchema, cleanQuery, type SearchParams } from '@/domain/schemas';
import { PageHeading, AddPetButton, PetCard, EmptyState, Pagination } from '@/components/display';
import { Filters } from '@/components/filters';
export const metadata = { title: 'Your pets' };
export default async function PetsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const parsed = petQuerySchema.safeParse(cleanQuery(params));
  const result = parsed.success ? await listPets(parsed.data) : null;
  const filtered = !!params.q || !!params.species || Number(params.page) > 1;
  return (
    <>
      <PageHeading
        title="Your companions"
        subtitle="A place for every pet, and every part of their story."
        eyebrow="PETS"
        action={<AddPetButton />}
      />
      <Filters kind="pets" />
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
          {result.items.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5.5 desk:grid-cols-3">
              {result.items.map((pet) => (
                <PetCard key={pet.id} pet={pet} today={today()} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={filtered ? 'No pets found' : 'Meet your first companion'}
              description={
                filtered
                  ? 'Try another name, breed, or species.'
                  : 'Add a pet to start keeping their medical history together.'
              }
              href={filtered ? '/pets' : '/pets/new'}
              label={filtered ? 'Clear filters' : 'Add your first pet'}
              search={filtered}
            />
          )}
          <Pagination result={result} params={params} path="/pets" />
        </>
      )}
    </>
  );
}
