'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@astryxdesign/core/Button';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Dialog } from '@astryxdesign/core/Dialog';
import { useToast } from '@astryxdesign/core/Toast';
import { Plus, Check, ArrowRight, MoreHorizontal } from 'lucide-react';
import type { RecordDto, FieldErrors } from '@/domain/types';

export class RequestError extends Error {
  constructor(
    message: string,
    public fields: FieldErrors = {},
  ) {
    super(message);
  }
}
export async function mutate(url: string, method: string, body?: unknown) {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  } catch {
    throw new RequestError('Could not connect. Your changes are still here; please try again.');
  }
  if (response.status === 204) return null;
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new RequestError(
      result?.error?.message ?? 'Something went wrong. Please try again.',
      result?.error?.fieldErrors,
    );
  return result;
}
export function FollowUpAction({ record }: { record: RecordDto }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const toast = useToast();
  async function update() {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await mutate(`/api/pets/${record.petId}/records/${record.id}/follow-up`, 'PATCH', {
        completed: !record.followUpCompletedAt,
      });
      toast({ body: record.followUpCompletedAt ? 'Follow-up reopened.' : 'Follow-up completed.' });
      router.refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="max-md:group-[]/follow:ml-14 max-md:group-[]/follow:items-start flex max-w-48 flex-col items-end">
      <Button
        label={record.followUpCompletedAt ? 'Reopen' : 'Mark complete'}
        size="sm"
        icon={!record.followUpCompletedAt ? <Check size={14} /> : undefined}
        onClick={update}
        isLoading={pending}
      />
      {error && (
        <p role="alert" className="mt-2 text-xs text-care-error-text">
          {error}
        </p>
      )}
    </div>
  );
}
export function DeleteAction({
  url,
  title,
  description,
  redirect,
  overflow = false,
}: {
  url: string;
  title: string;
  description: string;
  redirect: string;
  overflow?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const toast = useToast();
  async function remove() {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await mutate(url, 'DELETE');
      setOpen(false);
      toast({ body: 'Deleted successfully.' });
      router.push(redirect);
      router.refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setPending(false);
    }
  }
  const trigger = <Button label={title} variant="destructive" onClick={() => setOpen(true)} />;
  return (
    <>
      {overflow ? (
        <details>
          <summary aria-label="Record actions" className="cursor-pointer list-none p-2">
            <MoreHorizontal size={22} />
          </summary>
          {trigger}
        </details>
      ) : (
        trigger
      )}
      <AlertDialog
        isOpen={open}
        onOpenChange={(value) => {
          if (!pending) setOpen(value);
        }}
        title={title}
        description={error ? `${description} ${error}` : description}
        actionLabel="Delete permanently"
        isActionLoading={pending}
        onAction={remove}
      />
      {error && (
        <p className="mt-2 text-xs text-care-error-text" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
export function AddRecordButton({
  pets,
  petId,
}: {
  pets?: { id: string; name: string; species: string }[];
  petId?: string;
}) {
  const [open, setOpen] = useState(false);
  if (petId)
    return (
      <Button
        href={`/pets/${petId}/records/new`}
        label="Add record"
        icon={<Plus size={17} />}
        variant="primary"
        size="lg"
      />
    );
  if (!pets?.length)
    return (
      <Button
        href="/pets/new"
        label="Add your first pet"
        variant="primary"
        icon={<Plus size={17} />}
      />
    );
  return (
    <>
      <Button
        label="Add record"
        icon={<Plus size={17} />}
        variant="primary"
        size="lg"
        onClick={() => setOpen(true)}
      />
      <Dialog isOpen={open} onOpenChange={setOpen} aria-labelledby="pet-picker-heading" width={460}>
        <div className="flex flex-col gap-2.5 p-5.5">
          <h2 id="pet-picker-heading">Who is this record for?</h2>
          <p className="text-xs text-secondary">Choose a pet to add to their medical history.</p>
          {pets.map((pet) => (
            <Link
              key={pet.id}
              href={`/pets/${pet.id}/records/new`}
              className="flex items-center gap-3 rounded-md border border-border p-3 hover:bg-muted [&>svg:last-child]:ml-auto"
              onClick={() => setOpen(false)}
            >
              <span>{pet.name}</span>
              <ArrowRight size={16} />
            </Link>
          ))}
          <Button label="Cancel" onClick={() => setOpen(false)} variant="ghost" />
        </div>
      </Dialog>
    </>
  );
}
