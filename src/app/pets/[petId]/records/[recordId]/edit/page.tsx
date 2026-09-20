import { listProviders } from '@/server/providers';
import { getRecord } from '@/server/records';
import { pageData, pageId } from '@/server/page-data';
import { today } from '@/server/context';
import { Breadcrumbs, PageHeading } from '@/components/display';
import { RecordForm } from '@/components/record-form';
export default async function EditRecord({
  params,
}: {
  params: Promise<{ petId: string; recordId: string }>;
}) {
  const { petId, recordId } = await params;
  const record = await pageData(() => getRecord(pageId(petId), pageId(recordId)));
  const providers = await listProviders({ q: '', status: 'all' });
  return (
    <>
      <Breadcrumbs
        items={[
          { label: record.pet.name, href: `/pets/${petId}` },
          { label: record.title, href: `/pets/${petId}/records/${recordId}` },
          { label: 'Edit record' },
        ]}
      />
      <PageHeading
        title="Edit medical record"
        subtitle={`Update the details for ${record.pet.name}.`}
      />
      <RecordForm providers={providers} petId={petId} record={record} today={today()} />
    </>
  );
}
