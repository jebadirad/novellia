import { getPet } from '@/server/pets';
import { pageData, pageId } from '@/server/page-data';
import { today } from '@/server/context';
import { Breadcrumbs, PageHeading } from '@/components/display';
import { PetForm } from '@/components/pet-form';
import { DeleteAction } from '@/components/actions';
import s from '@/components/styles.module.css';
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
      <section className={s.danger}>
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
