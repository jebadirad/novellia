import { listPets } from '@/server/pets';
import { today } from '@/server/context';
import { petQuerySchema, cleanQuery, type SearchParams } from '@/domain/schemas';
import { PageHeading, AddPetButton, PetCard, EmptyState, Pagination } from '@/components/display';
import { Filters } from '@/components/filters';
import s from '@/components/styles.module.css';
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
        <p role="alert" className={s.queryError}>
          {parsed.error.issues[0].message}
        </p>
      )}
      {result && (
        <>
          {result.items.length ? (
            <div className={s.petGrid}>
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
