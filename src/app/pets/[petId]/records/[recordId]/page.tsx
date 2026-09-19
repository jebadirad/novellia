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
import s from '@/components/styles.module.css';
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
      <div className={s.recordHeader}>
        <TypeBadge type={record.type} />
        <div className={s.headingAction}>
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
      <div className={s.detailLayout}>
        <div className={s.stack}>
          <Panel title="Record details">
            <div className={s.panelBody}>
              <dl className={s.detailGrid}>
                <DetailField label="Pet">
                  <Link href={`/pets/${petId}`}>{record.pet.name}</Link>
                </DetailField>
                <DetailField label={recordMeta[record.type].dateLabel}>
                  {formatDate(record.occurredOn)}
                </DetailField>
                <DetailField label="Vet or clinic">{record.provider}</DetailField>
                <RecordDetails record={record} />
              </dl>
            </div>
          </Panel>
          <Panel title="Additional notes">
            <div className={s.panelBody}>
              <p className={s.noteText}>{record.notes || 'No additional notes recorded.'}</p>
            </div>
          </Panel>
        </div>
        <Panel title="What happens next">
          <div className={s.panelBody}>
            {record.followUpOn ? (
              <>
                <DueBadge record={record} today={today()} />
                <h3 style={{ margin: '15px 0 8px', fontSize: 17 }}>
                  {record.followUpNote || record.title}
                </h3>
                <p className={s.sectionIntro}>Due {formatDate(record.followUpOn)}</p>
                {record.followUpCompletedAt && (
                  <p className={s.sectionIntro}>
                    Completed {formatDate(record.followUpCompletedAt.slice(0, 10))}
                  </p>
                )}
                <FollowUpAction record={record} />
              </>
            ) : (
              <>
                <p className={s.sectionIntro}>No follow-up added to this record.</p>
                <Button label="Add a follow-up" href={`${href}/edit`} />
              </>
            )}
          </div>
        </Panel>
      </div>
      <p className={s.metadata}>
        Added {formatDate(record.createdAt.slice(0, 10))} · Updated{' '}
        {formatDate(record.updatedAt.slice(0, 10))}
      </p>
    </>
  );
}
