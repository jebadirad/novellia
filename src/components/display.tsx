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
    <div className="mb-6 flex items-start justify-between gap-3 md:mb-7 md:items-center md:gap-4.5">
      <div>
        {eyebrow && (
          <p className="mb-2 text-2xs font-bold tracking-[0.2em] text-secondary">{eyebrow}</p>
        )}
        <h1 className="text-3xl leading-tight font-semibold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-2 text-xs text-secondary max-md:max-w-60 md:text-sm">{subtitle}</p>
      </div>
      {action && <div className="shrink-0 max-md:pt-1">{action}</div>}
    </div>
  );
}
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5.5 flex flex-wrap gap-2 text-xs text-secondary [&_a:hover]:text-accent [&_a:hover]:underline"
    >
      {items.map((item, i) => (
        <span key={item.href ?? item.label}>
          {i > 0 && (
            <span aria-hidden="true" className="mr-2 text-secondary">
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
      className={`relative flex shrink-0 items-center justify-center bg-pet-dog text-secondary data-[species=bird]:bg-pet-bird data-[species=cat]:bg-pet-cat data-[species=rabbit]:bg-pet-rabbit ${large ? 'size-20 rounded-xl' : 'size-12 rounded-lg'}`}
      data-species={pet.species}
    >
      <Icon size={large ? 39 : 24} strokeWidth={1.5} />
      <span
        className={`absolute -right-1 -bottom-1 rounded-full border-2 border-surface bg-surface text-center font-bold ${large ? 'size-5.5 text-xs' : 'size-4.5 text-2xs'}`}
      >
        {pet.name.slice(0, 1).toUpperCase()}
      </span>
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
  if (!record.followUpOn) {
    return null;
  }
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
    <div className="mx-auto max-w-xl px-6 py-11 text-center [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:tracking-tight [&>p]:mx-auto [&>p]:mt-2 [&>p]:mb-5 [&>p]:max-w-85 [&>p]:text-sm [&>p]:text-secondary">
      <span className="mb-4.5 inline-flex size-16 items-center justify-center rounded-xl bg-muted text-secondary">
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
    <article className="rounded-lg border border-border bg-surface p-5.5 transition-shadow hover:border-border-strong hover:shadow-sm motion-reduce:transition-none md:p-6">
      <div className="mb-4 flex items-start justify-between md:mb-6">
        <PetAvatar pet={pet} large />
        <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-secondary">
          {speciesLabels[pet.species]}
        </span>
      </div>
      <Link
        href={`/pets/${pet.id}`}
        className="mb-1 flex items-center justify-between text-2xl font-semibold tracking-tight [&>svg]:text-secondary"
      >
        {pet.name}
        <ArrowRight size={19} />
      </Link>
      <p className="text-xs text-secondary">
        {pet.breed || speciesLabels[pet.species]} · {petAge(pet.birthDate, today)}
      </p>
      <div className="mt-6 flex items-center justify-between gap-1.5 text-xs text-secondary [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-1.5">
        <span>
          <FileHeart size={16} />
          {pet.recordCount} {pet.recordCount === 1 ? 'record' : 'records'}
        </span>
        <span className="capitalize">{pet.sex === 'unknown' ? 'Sex not recorded' : pet.sex}</span>
      </div>
      <div className="mt-4.5 border-t border-border pt-3.5 text-xs text-secondary [&>a]:flex [&>a]:items-center [&>a]:gap-2">
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
    <div className="px-4 md:px-6">
      {records.map((record) => (
        <article
          className="flex flex-wrap items-center gap-2.5 border-b border-border py-4.5 last:border-b-0 md:flex-nowrap md:gap-3.5 md:py-5"
          key={record.id}
        >
          <div className="flex h-9 w-8.5 shrink-0 items-center justify-center rounded-md bg-muted text-secondary md:h-11 md:w-10">
            <FileHeart size={21} strokeWidth={1.6} />
          </div>
          <div className="min-w-0 flex-1 max-md:basis-[calc(100%-54px)]">
            <div className="flex flex-wrap items-center gap-2 desk:gap-3 [&>a]:text-sm [&>a]:font-semibold [&>a]:wrap-anywhere">
              <Link href={recordHref(record)}>{record.title}</Link>
              <TypeBadge type={record.type} />
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-secondary">
              {showPet && (
                <>
                  <Link href={`/pets/${record.petId}`}>{record.pet.name}</Link>
                  <span>·</span>
                </>
              )}
              <span>{record.provider?.name || 'Clinic not recorded'}</span>
            </div>
          </div>
          <time
            className="text-xs whitespace-nowrap text-secondary max-md:-mt-1 max-md:ml-11"
            dateTime={record.occurredOn}
          >
            {formatDate(record.occurredOn, true)}
          </time>
          <ArrowRight size={17} className="hidden text-secondary desk:block" aria-hidden="true" />
        </article>
      ))}
    </div>
  );
}
export function RecordTable({ records }: { records: RecordDto[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm [&_a:hover]:underline">
          <caption className="sr-only">Medical records across your pets</caption>
          <thead className="bg-muted text-xs text-secondary">
            <tr className="border-b border-border [&>th]:px-5 [&>th]:py-4.5 [&>th]:font-medium">
              <th scope="col">Date</th>
              <th scope="col">Pet</th>
              <th scope="col">Type</th>
              <th scope="col">Record</th>
              <th scope="col">Vet or clinic</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b border-border last:border-b-0">
                <td className="px-5 py-4.5 text-secondary">
                  <time dateTime={record.occurredOn}>{formatDate(record.occurredOn, true)}</time>
                </td>
                <td className="px-5 py-4.5 text-secondary">
                  <Link href={`/pets/${record.petId}`}>{record.pet.name}</Link>
                </td>
                <td className="px-5 py-4.5">
                  <TypeBadge type={record.type} />
                </td>
                <th scope="row" className="min-w-45 px-5 py-4.5 font-semibold wrap-anywhere">
                  <Link href={recordHref(record)}>{record.title}</Link>
                </th>
                <td className="px-5 py-4.5 text-secondary">
                  {record.provider?.name || 'Not recorded'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden">
        <RecordList records={records} />
      </div>
    </>
  );
}
export function FollowUpList({ records, today }: { records: RecordDto[]; today: string }) {
  return (
    <div className="px-4 md:px-5.5">
      {records.map((record) => (
        <article
          className="group/follow flex flex-wrap items-center gap-2.5 border-b border-border py-5 last:border-b-0 md:flex-nowrap md:gap-3"
          key={record.id}
        >
          <PetAvatar pet={record.pet} />
          <div className="min-w-0 flex-1 max-md:basis-[calc(100%-65px)] [&>p]:mt-1 [&>p]:mb-2 [&>p]:text-xs [&>p]:text-secondary">
            <Link className="text-sm font-semibold wrap-anywhere" href={recordHref(record)}>
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
    <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4.5 py-4 md:px-6 md:py-5">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {href && (
          <Link href={href} className="flex items-center gap-1.5 text-xs text-secondary">
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
  if (result.total <= result.pageSize && result.page === 1) {
    return null;
  }
  const url = (page: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (typeof v === 'string' && v) {
        q.set(k, v);
      }
    }
    q.set('page', String(page));
    return `${path}?${q}`;
  };
  return (
    <div className="flex items-center justify-between py-4.5 text-xs text-secondary [&>div]:flex [&>div]:gap-2">
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
    <div className="py-2.5 [&>dd]:m-0 [&>dd]:text-sm [&>dd]:wrap-anywhere [&>dd]:whitespace-pre-wrap [&>dd]:text-primary [&>dt]:mb-1 [&>dt]:text-xs [&>dt]:text-secondary">
      <dt>{label}</dt>
      <dd>{children || 'Not recorded'}</dd>
    </div>
  );
}
