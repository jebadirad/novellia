import { getPet } from '@/server/pets';
import { pageData, pageId } from '@/server/page-data';
import { today } from '@/server/context';
import { Breadcrumbs, PageHeading } from '@/components/display';
import { PetForm } from '@/components/pet-form';
import { DeleteAction } from '@/components/actions';
export default async function EditPet({ params }: { params: Promise<{ petId: string }> }) {
  const id = pageId((await params).petId);
  const pet = await pageData(() => getPet(id));
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Pets', href: '/pets' },
          { label: pet.name, href: `/pets/${id}` },
          { label: 'Edit profile' },
        ]}
      />
      <PageHeading
        title={`Edit ${pet.name}’s profile`}
        subtitle="Keep the details up to date as they grow."
      />
      <PetForm pet={pet} today={today()} />
      <section className="mt-8 max-w-180 border-t border-border pt-6 [&>h2]:mb-1 [&>h2]:text-base [&>h2]:text-care-error-text [&>p]:mb-4 [&>p]:text-xs [&>p]:text-secondary">
        <h2>Delete this pet</h2>
        <p>This also removes all medical records and follow-ups for {pet.name}.</p>
        <DeleteAction
          url={`/api/pets/${id}`}
          title="Delete pet"
          description={`Delete ${pet.name} and all ${pet.recordCount} medical records and associated follow-ups? This cannot be undone.`}
          redirect="/pets"
        />
      </section>
    </>
  );
}
