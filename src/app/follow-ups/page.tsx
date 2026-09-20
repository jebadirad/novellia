import Link from 'next/link';
import { getFollowUps } from '@/server/overview';
import { petOptions } from '@/server/pets';
import { today } from '@/server/context';
import { followUpGroup, followUpLabels, type FollowUpGroup } from '@/domain/dates';
import { followUpQuerySchema, cleanQuery, type SearchParams } from '@/domain/schemas';
import { PageHeading, Panel, FollowUpList, EmptyState } from '@/components/display';
import { Filters } from '@/components/filters';
export const metadata = { title: 'Follow-ups' };
export default async function FollowUps({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const parsed = followUpQuerySchema.safeParse(cleanQuery(params));
  const pets = await petOptions();
  const records = parsed.success ? await getFollowUps(parsed.data) : [];
  const day = today();
  const completed = params.tab === 'completed';
  const groups: FollowUpGroup[] = completed ? ['completed'] : ['overdue', 'today', 'soon', 'later'];
  const petQuery =
    typeof params.petId === 'string' ? `&petId=${encodeURIComponent(params.petId)}` : '';
  return (
    <>
      <PageHeading
        title="A little look ahead."
        subtitle="Keep track of the next step in their care."
        eyebrow="FOLLOW-UPS"
      />
      <div className="mb-5.5 flex gap-2">
        <Link
          href={`/follow-ups?tab=open${petQuery}`}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-secondary aria-[current=page]:border-border-strong aria-[current=page]:bg-accent-muted aria-[current=page]:text-accent"
          aria-current={!completed ? 'page' : undefined}
        >
          Open follow-ups
        </Link>
        <Link
          href={`/follow-ups?tab=completed${petQuery}`}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-secondary aria-[current=page]:border-border-strong aria-[current=page]:bg-accent-muted aria-[current=page]:text-accent"
          aria-current={completed ? 'page' : undefined}
        >
          Completed
        </Link>
      </div>
      <Filters kind="follow-ups" pets={pets} />
      {params.group && (
        <p className="mb-4 text-xs text-secondary">
          {params.group === 'overdue'
            ? 'Showing overdue follow-ups.'
            : 'Showing follow-ups due today through the next 30 days.'}
        </p>
      )}
      {!parsed.success ? (
        <p
          role="alert"
          className="mb-5 rounded-md border border-care-error-border bg-care-error px-4 py-3 text-sm text-care-error-text"
        >
          {parsed.error.issues[0].message}
        </p>
      ) : records.length ? (
        groups.map((group) => {
          const items = records.filter(
            (record) =>
              followUpGroup(record.followUpOn!, record.followUpCompletedAt, day) === group,
          );
          return items.length ? (
            <section
              className="mt-6 [&>h2]:mb-3 [&>h2]:text-xs [&>h2]:font-semibold [&>h2]:tracking-wide [&>h2]:text-secondary"
              key={group}
            >
              <h2>
                {followUpLabels[group]} · {items.length}
              </h2>
              <Panel
                title={
                  group === 'completed'
                    ? 'Taken care of'
                    : group === 'overdue'
                      ? 'Ready for your attention'
                      : 'On the calendar'
                }
              >
                <FollowUpList records={items} today={day} />
              </Panel>
            </section>
          ) : null;
        })
      ) : (
        <Panel title={completed ? 'Completed follow-ups' : 'Your next steps'}>
          <EmptyState
            title={completed ? 'Nothing completed yet' : 'Nothing on this list'}
            description={
              completed
                ? 'Completed follow-ups will appear here.'
                : 'Add a follow-up date to a medical record, or change the filters.'
            }
            href="/records"
            label="View medical records"
          />
        </Panel>
      )}
    </>
  );
}
