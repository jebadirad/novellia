import Link from 'next/link';
import { getRecord } from '@/server/records';
import { pageData, pageId } from '@/server/page-data';
import { today } from '@/server/context';
import { formatDate } from '@/domain/dates';
import { recordMeta } from '@/domain/schemas';
import {
  Breadcrumbs,
  PageHeading,
  Panel,
  DetailField,
  TypeBadge,
  DueBadge,
} from '@/components/display';
import { RecordDetails } from '@/components/record-details';
import { DeleteAction, FollowUpAction } from '@/components/actions';
import { Button } from '@/components/ui';
export default async function RecordPage({
  params,
}: {
  params: Promise<{ petId: string; recordId: string }>;
}) {
  const { petId, recordId } = await params;
  const record = await pageData(() => getRecord(pageId(petId), pageId(recordId)));
  const href = `/pets/${petId}/records/${recordId}`;
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Pets', href: '/pets' },
          { label: record.pet.name, href: `/pets/${petId}` },
          { label: record.title },
        ]}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3 md:flex-nowrap">
        <TypeBadge type={record.type} />
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <Button href={`${href}/edit`} label="Edit record" />
          <DeleteAction
            overflow
            title="Delete record"
            url={`/api/pets/${petId}/records/${recordId}`}
            description={`Delete “${record.title}” and its follow-up? This cannot be undone.`}
            redirect={`/pets/${petId}`}
          />
        </div>
      </div>
      <PageHeading
        title={record.title}
        subtitle={`${record.pet.name} · ${formatDate(record.occurredOn)}`}
      />
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_250px] desk:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-5.5">
          <Panel title="Record details">
            <div className="p-5 md:p-6">
              <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-1.5 md:gap-x-7">
                <DetailField label="Pet">
                  <Link href={`/pets/${petId}`}>{record.pet.name}</Link>
                </DetailField>
                <DetailField label={recordMeta[record.type].dateLabel}>
                  {formatDate(record.occurredOn)}
                </DetailField>
                <DetailField label="Vet or clinic">
                  {record.provider ? (
                    <Link href={`/providers/${record.provider.id}`}>
                      {record.provider.name}
                      {record.provider.archivedAt ? ' (archived)' : ''}
                    </Link>
                  ) : null}
                </DetailField>
                <RecordDetails record={record} />
              </dl>
            </div>
          </Panel>
          <Panel title="Additional notes">
            <div className="p-5 md:p-6">
              <p className="text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap text-secondary">
                {record.notes || 'No additional notes recorded.'}
              </p>
            </div>
          </Panel>
        </div>
        <Panel title="What happens next">
          <div className="p-5 md:p-6">
            {record.followUpOn ? (
              <>
                <DueBadge record={record} today={today()} />
                <h3 className="mt-4 mb-2 text-lg">{record.followUpNote || record.title}</h3>
                <p className="mb-4 text-xs text-secondary">Due {formatDate(record.followUpOn)}</p>
                {record.followUpCompletedAt && (
                  <p className="mb-4 text-xs text-secondary">
                    Completed {formatDate(record.followUpCompletedAt.slice(0, 10))}
                  </p>
                )}
                <FollowUpAction record={record} />
              </>
            ) : (
              <>
                <p className="mb-4 text-xs text-secondary">No follow-up added to this record.</p>
                <Button label="Add a follow-up" href={`${href}/edit`} />
              </>
            )}
          </div>
        </Panel>
      </div>
      <p className="px-1 py-4.5 text-xs text-secondary">
        Added {formatDate(record.createdAt.slice(0, 10))} · Updated{' '}
        {formatDate(record.updatedAt.slice(0, 10))}
      </p>
    </>
  );
}
