import Link from 'next/link';
import {
  PawPrint,
  Cat,
  Dog,
  Bird,
  Rabbit,
  ArrowRight,
  CalendarDays,
  FileHeart,
  Plus,
  Search,
  Heart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Badge } from './ui';
import { FollowUpAction } from './actions';
import { formatDate, followUpGroup, followUpLabels, petAge } from '@/domain/dates';
import { recordMeta, speciesLabels, type SearchParams, type Species } from '@/domain/schemas';
import type { PageResult, PetDto, PetSummary, RecordDto } from '@/domain/types';
import s from './styles.module.css';
export function PageHeading({
  title,
  subtitle,
  action,
  eyebrow,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className={s.pageHeading}>
      <div>
        {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action && <div className={s.headingAction}>{action}</div>}
    </div>
  );
}
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className={s.breadcrumbs}>
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && (
            <span aria-hidden="true" className={s.crumbDivider}>
              /
            </span>
          )}
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
const speciesIcons: Record<Species, LucideIcon> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  reptile: PawPrint,
  small_mammal: PawPrint,
  other: Heart,
};
export function PetAvatar({
  pet,
  large = false,
}: {
  pet: Pick<PetDto, 'name' | 'species'>;
  large?: boolean;
}) {
  const Icon = speciesIcons[pet.species] ?? PawPrint;
  return (
    <div
      aria-hidden="true"
      className={`${s.avatar} ${large ? s.avatarLarge : ''}`}
      data-species={pet.species}
    >
      <Icon size={large ? 39 : 24} strokeWidth={1.5} />
      <span>{pet.name.slice(0, 1).toUpperCase()}</span>
    </div>
  );
}
export function TypeBadge({ type }: { type: RecordDto['type'] }) {
  return (
    <Badge
      label={recordMeta[type].label}
      variant={type === 'vaccination' ? 'green' : type === 'medication' ? 'purple' : 'blue'}
    />
  );
}
export function DueBadge({ record, today }: { record: RecordDto; today: string }) {
  if (!record.followUpOn) return null;
  const group = followUpGroup(record.followUpOn, record.followUpCompletedAt, today);
  return (
    <Badge
      label={followUpLabels[group]}
      variant={
        group === 'overdue'
          ? 'error'
          : group === 'today'
            ? 'warning'
            : group === 'completed'
              ? 'success'
              : 'neutral'
      }
    />
  );
}
export function EmptyState({
  title,
  description,
  href,
  label,
  search = false,
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
  search?: boolean;
}) {
  const Icon = search ? Search : FileHeart;
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}>
        <Icon size={30} strokeWidth={1.5} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {href && <Button href={href} label={label ?? 'Get started'} variant="primary" />}
    </div>
  );
}
export function PetCard({ pet, today }: { pet: PetSummary; today: string }) {
  return (
    <article className={s.petCard}>
      <div className={s.petCardTop}>
        <PetAvatar pet={pet} large />
        <span className={s.speciesLabel}>{speciesLabels[pet.species]}</span>
      </div>
      <Link href={`/pets/${pet.id}`} className={s.petName}>
        {pet.name}
        <ArrowRight size={19} />
      </Link>
      <p className={s.muted}>
        {pet.breed || speciesLabels[pet.species]} · {petAge(pet.birthDate, today)}
      </p>
      <div className={s.petCardStats}>
        <span>
          <FileHeart size={16} />
          {pet.recordCount} {pet.recordCount === 1 ? 'record' : 'records'}
        </span>
        <span className={s.capitalize}>{pet.sex === 'unknown' ? 'Sex not recorded' : pet.sex}</span>
      </div>
      <div className={s.petCardBottom}>
        {pet.nextFollowUp ? (
          <Link href={recordHref(pet.nextFollowUp)}>
            <CalendarDays size={15} />
            {pet.nextFollowUp.followUpOn! < today ? 'Overdue · ' : 'Next follow-up · '}
            {formatDate(pet.nextFollowUp.followUpOn, true)}
          </Link>
        ) : (
          <span>No open follow-ups</span>
        )}
      </div>
    </article>
  );
}
export const recordHref = (record: Pick<RecordDto, 'petId' | 'id'>) =>
  `/pets/${record.petId}/records/${record.id}`;
export function RecordList({
  records,
  showPet = true,
}: {
  records: RecordDto[];
  showPet?: boolean;
}) {
  return (
    <div className={s.recordList}>
      {records.map((record) => (
        <article className={s.recordRow} key={record.id}>
          <div className={s.recordIcon}>
            <FileHeart size={21} strokeWidth={1.6} />
          </div>
          <div className={s.recordBody}>
            <div className={s.recordTitleLine}>
              <Link href={recordHref(record)}>{record.title}</Link>
              <TypeBadge type={record.type} />
            </div>
            <div className={s.recordMeta}>
              {showPet && (
                <>
                  <Link href={`/pets/${record.petId}`}>{record.pet.name}</Link>
                  <span>·</span>
                </>
              )}
              <span>{record.provider || 'Clinic not recorded'}</span>
            </div>
          </div>
          <time className={s.recordDate} dateTime={record.occurredOn}>
            {formatDate(record.occurredOn, true)}
          </time>
          <ArrowRight size={17} className={s.rowArrow} aria-hidden="true" />
        </article>
      ))}
    </div>
  );
}
export function RecordTable({ records }: { records: RecordDto[] }) {
  return (
    <>
      <div className={s.desktopRecords}>
        <table className={s.recordTable}>
          <caption className={s.srOnly}>Medical records across your pets</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Pet</th>
              <th scope="col">Type</th>
              <th scope="col">Record</th>
              <th scope="col">Vet or clinic</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>
                  <time dateTime={record.occurredOn}>{formatDate(record.occurredOn, true)}</time>
                </td>
                <td>
                  <Link href={`/pets/${record.petId}`}>{record.pet.name}</Link>
                </td>
                <td>
                  <TypeBadge type={record.type} />
                </td>
                <th scope="row">
                  <Link href={recordHref(record)}>{record.title}</Link>
                </th>
                <td>{record.provider || 'Not recorded'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={s.mobileRecords}>
        <RecordList records={records} />
      </div>
    </>
  );
}
export function FollowUpList({ records, today }: { records: RecordDto[]; today: string }) {
  return (
    <div className={s.followList}>
      {records.map((record) => (
        <article className={s.followRow} key={record.id}>
          <PetAvatar pet={record.pet} />
          <div className={s.followBody}>
            <Link className={s.itemTitle} href={recordHref(record)}>
              {record.followUpNote || record.title}
            </Link>
            <p>
              <Link href={`/pets/${record.petId}`}>{record.pet.name}</Link> ·{' '}
              {record.followUpCompletedAt
                ? `Completed ${formatDate(record.followUpCompletedAt.slice(0, 10), true)}`
                : `Due ${formatDate(record.followUpOn, true)}`}
            </p>
            <DueBadge record={record} today={today} />
          </div>
          <FollowUpAction record={record} />
        </article>
      ))}
    </div>
  );
}
export function Panel({
  title,
  href,
  linkLabel = 'View all',
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={s.panel}>
      <div className={s.panelHeading}>
        <h2>{title}</h2>
        {href && (
          <Link href={href}>
            {linkLabel}
            <ArrowRight size={15} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
export function Pagination({
  result,
  params,
  path,
}: {
  result: Pick<PageResult<unknown>, 'total' | 'page' | 'pageSize'>;
  params: SearchParams;
  path: string;
}) {
  if (result.total <= result.pageSize && result.page === 1) return null;
  const url = (page: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (typeof v === 'string' && v) q.set(k, v);
    q.set('page', String(page));
    return `${path}?${q}`;
  };
  return (
    <div className={s.pagination}>
      <span>
        {result.total
          ? `Showing ${Math.min((result.page - 1) * 20 + 1, result.total)}–${Math.min(result.page * 20, result.total)} of ${result.total}`
          : 'No results'}
      </span>
      <div>
        {result.page > 1 && <Button href={url(result.page - 1)} label="Previous" />}
        {result.page * 20 < result.total && <Button href={url(result.page + 1)} label="Next" />}
      </div>
    </div>
  );
}
export function AddPetButton() {
  return (
    <Button
      href="/pets/new"
      label="Add pet"
      variant="primary"
      icon={<Plus size={17} />}
      size="lg"
    />
  );
}
export function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={s.detailField}>
      <dt>{label}</dt>
      <dd>{children || 'Not recorded'}</dd>
    </div>
  );
}
