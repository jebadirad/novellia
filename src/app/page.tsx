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
import s from '@/components/styles.module.css';
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
      <div className={s.hero}>
        <div>
          <p className={s.eyebrow}>FOR EVERY CHAPTER OF THEIR LIFE</p>
          <h2>
            Good days start
            <br />
            with thoughtful care.
          </h2>
          <p>Keep the little details that make a big difference, all in one place.</p>
        </div>
        <div className={s.heroArt} aria-hidden="true">
          <Dog />
          <Cat />
        </div>
      </div>
      <div className={s.stats}>
        <Link href="/pets" className={s.stat}>
          <div>
            <p className={s.statLabel}>Your companions</p>
            <div className={s.statValue}>{data.petCount}</div>
          </div>
          <div className={s.statIcon}>
            <PawPrint size={22} />
          </div>
        </Link>
        <Link href="/follow-ups?group=overdue" className={s.stat}>
          <div>
            <p className={s.statLabel}>Overdue follow-ups</p>
            <div className={s.statValue}>{data.overdueCount}</div>
          </div>
          <div className={`${s.statIcon} ${s.statRed}`}>
            <Clock3 size={22} />
          </div>
        </Link>
        <Link href="/follow-ups?group=due" className={s.stat}>
          <div>
            <p className={s.statLabel}>Due in 30 days</p>
            <div className={s.statValue}>{data.dueCount}</div>
          </div>
          <div className={`${s.statIcon} ${s.statAmber}`}>
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
          <div className={s.dashboardGrid}>
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
                <Link className={s.petMini} key={pet.id} href={`/pets/${pet.id}`}>
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
