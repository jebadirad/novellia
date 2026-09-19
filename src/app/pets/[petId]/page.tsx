import { getPet } from '@/server/pets';
import { listRecords } from '@/server/records';
import { pageData, pageId } from '@/server/page-data';
import { today } from '@/server/context';
import { cleanQuery, recordQuerySchema, speciesLabels, type SearchParams } from '@/domain/schemas';
import { formatDate, petAge } from '@/domain/dates';
import {
  Breadcrumbs,
  PetAvatar,
  Panel,
  DetailField,
  RecordList,
  EmptyState,
  Pagination,
  FollowUpList,
} from '@/components/display';
import { Button } from '@/components/ui';
import { AddRecordButton } from '@/components/actions';
import { Filters } from '@/components/filters';
import s from '@/components/styles.module.css';
export default async function PetPage({
  params,
  searchParams,
}: {
  params: Promise<{ petId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const id = pageId((await params).petId);
  const pet = await pageData(() => getPet(id));
  const query = await searchParams;
  const parsed = recordQuerySchema.safeParse({ ...cleanQuery(query), petId: id });
  const result = parsed.success ? await listRecords(parsed.data) : null;
  return (
    <>
      <Breadcrumbs items={[{ label: 'Pets', href: '/pets' }, { label: pet.name }]} />
      <div className={s.profileHeader}>
        <PetAvatar pet={pet} large />
        <div>
          <h1>{pet.name}</h1>
          <p>
            {speciesLabels[pet.species]}
            {pet.breed && ` · ${pet.breed}`} · {petAge(pet.birthDate, today())}
          </p>
        </div>
        <div className={s.profileActions}>
          <Button href={`/pets/${id}/edit`} label="Edit pet" size="lg" />
          <AddRecordButton petId={id} />
        </div>
      </div>
      <div className={s.profileGrid}>
        <div className={s.stack}>
          <Panel title={`About ${pet.name}`}>
            <div className={s.panelBody}>
              <dl style={{ margin: 0 }}>
                <DetailField label="Species">{speciesLabels[pet.species]}</DetailField>
                <DetailField label="Breed">{pet.breed}</DetailField>
                <DetailField label="Birth date">{formatDate(pet.birthDate)}</DetailField>
                <DetailField label="Sex">
                  <span className={s.capitalize}>{pet.sex}</span>
                </DetailField>
                <DetailField label="Notes">{pet.notes}</DetailField>
              </dl>
            </div>
          </Panel>
        </div>
        <div className={s.stack}>
          {pet.nextFollowUp && (
            <Panel title="Next follow-up">
              <FollowUpList records={[pet.nextFollowUp]} today={today()} />
            </Panel>
          )}
          <section>
            <h2 className={s.subheading}>
              Medical history <span className={s.muted}>({pet.recordCount})</span>
            </h2>
            <Filters kind="records" scoped />
            {!parsed.success && (
              <p role="alert" className={s.queryError}>
                {parsed.error.issues[0].message}
              </p>
            )}
            {result && (
              <>
                <Panel title="All records">
                  {result.items.length ? (
                    <RecordList records={result.items} showPet={false} />
                  ) : (
                    <EmptyState
                      title={
                        pet.recordCount ? 'No matching records' : 'A fresh page in their story'
                      }
                      description={
                        pet.recordCount
                          ? 'Try changing the search or filters.'
                          : 'Start with a visit, vaccination, or medication.'
                      }
                      href={pet.recordCount ? `/pets/${id}` : `/pets/${id}/records/new`}
                      label={pet.recordCount ? 'Clear filters' : 'Add first medical record'}
                      search={!!pet.recordCount}
                    />
                  )}
                </Panel>
                <Pagination result={result} params={query} path={`/pets/${id}`} />
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
