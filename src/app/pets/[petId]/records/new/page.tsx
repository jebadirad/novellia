import { getPet } from '@/server/pets';
import { pageData, pageId } from '@/server/page-data';
import { today } from '@/server/context';
import { Breadcrumbs, PageHeading } from '@/components/display';
import { RecordForm } from '@/components/record-form';
export default async function NewRecord({ params }: { params: Promise<{ petId: string }> }) {
  const id = pageId((await params).petId);
  const pet = await pageData(() => getPet(id));
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Pets', href: '/pets' },
          { label: pet.name, href: `/pets/${id}` },
          { label: 'Add record' },
        ]}
      />
      <PageHeading
        title="Add a medical record"
        subtitle={`Another part of ${pet.name}’s story, kept safe and easy to find.`}
      />
      <RecordForm petId={id} today={today()} />
    </>
  );
}
