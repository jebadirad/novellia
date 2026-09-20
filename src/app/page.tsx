import Link from 'next/link';
import { PawPrint, CalendarDays, Clock3, Cat, Dog, ArrowRight } from 'lucide-react';
import { getDashboard } from '@/server/overview';
import { petOptions } from '@/server/pets';
import { today } from '@/server/context';
import {
  PageHeading,
  Panel,
  FollowUpList,
  RecordList,
  EmptyState,
  PetAvatar,
} from '@/components/display';
import { AddRecordButton } from '@/components/actions';
import { speciesLabels } from '@/domain/schemas';
export default async function Overview() {
  const [data, pets] = await Promise.all([getDashboard(), petOptions()]);
  return (
    <>
      <PageHeading
        title="A little care, all together."
        subtitle="Their history. Their next steps. More peace of mind for you."
        eyebrow="YOUR PETS, AT A GLANCE"
        action={<AddRecordButton pets={pets} />}
      />
      <div className="relative mb-6 flex min-h-40 justify-between overflow-hidden rounded-xl border border-border bg-pet-hero p-5.5 md:min-h-43 md:px-8 md:py-7">
        <div>
          <p className="mb-2 text-2xs font-bold tracking-[0.2em] text-secondary">
            FOR EVERY CHAPTER OF THEIR LIFE
          </p>
          <h2 className="max-w-60 text-2xl leading-tight font-semibold tracking-tight md:max-w-100 md:text-3xl">
            Good days start
            <br />
            with thoughtful care.
          </h2>
          <p className="mt-2.5 max-w-52 text-xs text-secondary md:max-w-100 md:text-sm">
            Keep the little details that make a big difference, all in one place.
          </p>
        </div>
        <div
          className="relative flex w-11 min-w-10 -rotate-8 items-center justify-center gap-2.5 self-end text-secondary before:absolute before:right-[-50px] before:size-24 before:rounded-full before:bg-pet-hero-decoration before:content-[''] md:w-auto md:min-w-40 md:self-auto md:before:right-2.5 md:before:size-41 desk:min-w-55"
          aria-hidden="true"
        >
          <Dog className="z-10 size-16 rounded-full border-8 border-pet-hero-decoration bg-muted p-2 max-md:absolute max-md:right-[-7px] max-md:bottom-5 md:size-24 md:p-4.5" />
          <Cat className="z-10 size-13 rounded-full border-8 border-pet-hero-decoration bg-pet-cat p-2 max-md:absolute max-md:right-[-34px] max-md:bottom-[-5px] md:mt-10 md:size-24 md:p-4.5" />
        </div>
      </div>
      <div className="mb-5 grid grid-cols-3 gap-2 md:mb-6 md:gap-4.5">
        <Link
          href="/pets"
          className="block rounded-lg border border-border bg-surface px-3 py-3 transition-colors hover:border-border-strong motion-reduce:transition-none md:flex md:items-center md:justify-between md:px-5.5 md:py-5"
        >
          <div>
            <p className="text-2xs text-secondary md:text-xs">Your companions</p>
            <div className="text-2xl leading-snug font-semibold tracking-tight md:text-3xl">
              {data.petCount}
            </div>
          </div>
          <div className="hidden size-11 items-center justify-center rounded-lg bg-muted text-secondary md:flex">
            <PawPrint size={22} />
          </div>
        </Link>
        <Link
          href="/follow-ups?group=overdue"
          className="block rounded-lg border border-border bg-surface px-3 py-3 transition-colors hover:border-border-strong motion-reduce:transition-none md:flex md:items-center md:justify-between md:px-5.5 md:py-5"
        >
          <div>
            <p className="text-2xs text-secondary md:text-xs">Overdue follow-ups</p>
            <div className="text-2xl leading-snug font-semibold tracking-tight md:text-3xl">
              {data.overdueCount}
            </div>
          </div>
          <div className="hidden size-11 items-center justify-center rounded-lg bg-care-error text-secondary md:flex">
            <Clock3 size={22} />
          </div>
        </Link>
        <Link
          href="/follow-ups?group=due"
          className="block rounded-lg border border-border bg-surface px-3 py-3 transition-colors hover:border-border-strong motion-reduce:transition-none md:flex md:items-center md:justify-between md:px-5.5 md:py-5"
        >
          <div>
            <p className="text-2xs text-secondary md:text-xs">Due in 30 days</p>
            <div className="text-2xl leading-snug font-semibold tracking-tight md:text-3xl">
              {data.dueCount}
            </div>
          </div>
          <div className="hidden size-11 items-center justify-center rounded-lg bg-care-warning text-secondary md:flex">
            <CalendarDays size={22} />
          </div>
        </Link>
      </div>
      {data.petCount === 0 ? (
        <Panel title="Welcome to Novellia Pets">
          <EmptyState
            title="Every companion has a story"
            description="Add your first pet to start keeping their medical history and next steps together."
            href="/pets/new"
            label="Add your first pet"
          />
        </Panel>
      ) : (
        <>
          <div className="mb-5.5 grid grid-cols-1 gap-5 md:gap-5.5 desk:grid-cols-[minmax(0,1.35fr)_minmax(270px,1fr)]">
            <Panel title="A little attention needed" href="/follow-ups" linkLabel="All follow-ups">
              {data.attention.length ? (
                <FollowUpList records={data.attention} today={today()} />
              ) : (
                <EmptyState
                  title="Nothing coming up"
                  description="No follow-ups due in the next 30 days."
                />
              )}
            </Panel>
            <Panel title="Your companions" href="/pets" linkLabel="All pets">
              {data.pets.map((pet) => (
                <Link
                  className="flex items-center gap-3 border-b border-border px-4.5 py-3.5 last:border-b-0 md:px-6 [&_p]:text-xs [&_p]:text-secondary [&_strong]:text-sm [&_strong]:font-semibold [&>svg]:ml-auto [&>svg]:text-secondary"
                  key={pet.id}
                  href={`/pets/${pet.id}`}
                >
                  <PetAvatar pet={pet} />
                  <div>
                    <strong>{pet.name}</strong>
                    <p>
                      {pet.breed || speciesLabels[pet.species]} · {pet.recordCount} records
                    </p>
                  </div>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </Panel>
          </div>
          <Panel title="Recent medical history" href="/records" linkLabel="All records">
            {data.recent.length ? (
              <RecordList records={data.recent} />
            ) : (
              <EmptyState
                title="Their story starts here"
                description="Add a visit, vaccination, or medication to your pet’s profile."
                href="/pets"
                label="Choose a pet"
              />
            )}
          </Panel>
        </>
      )}
    </>
  );
}
