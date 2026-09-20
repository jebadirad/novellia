'use client';
import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { useToast } from '@astryxdesign/core/Toast';
import { Stethoscope, Syringe, Pill } from 'lucide-react';
import { recordInputSchema, recordTypes, recordMeta, type RecordType } from '@/domain/schemas';
import type { RecordDto, FieldErrors } from '@/domain/types';
import { recordFieldComponents } from './record-fields';
import { CalendarField, TextField, NotesField, focusError, useDirtyGuard } from './form-tools';
import { mutate, RequestError } from './actions';
const icons = { vet_visit: Stethoscope, vaccination: Syringe, medication: Pill } satisfies Record<
  RecordType,
  React.ComponentType<{ size?: number }>
>;
export function RecordForm({
  petId,
  record,
  today,
}: {
  petId: string;
  record?: RecordDto;
  today: string;
}) {
  const initial = {
    type: record?.type ?? 'vet_visit',
    title: record?.title ?? '',
    occurredOn: record?.occurredOn ?? today,
    provider: record?.provider ?? '',
    notes: record?.notes ?? '',
    followUpOn: record?.followUpOn ?? '',
    followUpNote: record?.followUpNote ?? '',
  };
  const initialDetails = Object.fromEntries(
    Object.entries(record?.details ?? {}).map(([key, value]) => [key, value ?? '']),
  );
  const [values, setValues] = useState(initial);
  const [details, setDetails] = useState<Record<string, string>>(initialDetails);
  const [followUp, setFollowUp] = useState(!!record?.followUpOn);
  const [nextType, setNextType] = useState<RecordType | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const dirty =
    JSON.stringify(values) !== JSON.stringify(initial) ||
    JSON.stringify(details) !== JSON.stringify(initialDetails) ||
    followUp !== !!record?.followUpOn;
  const guard = useDirtyGuard(dirty);
  const toast = useToast();
  const set = (field: keyof typeof values, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));
  function changeType(type: RecordType) {
    if (type === values.type) return;
    if (Object.values(details).some(Boolean)) setNextType(type);
    else {
      set('type', type);
      setDetails({});
      setErrors({});
    }
  }
  const Fields = recordFieldComponents[values.type];
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setErrors({});
    setError('');
    if (followUp && !values.followUpOn) {
      const fields = { followUpOn: ['Choose a follow-up date.'] };
      setErrors(fields);
      focusError(fields);
      return;
    }
    const parsed = recordInputSchema(today).safeParse({
      ...values,
      details,
      followUpOn: followUp ? values.followUpOn : null,
      followUpNote: followUp ? values.followUpNote : null,
    });
    if (!parsed.success) {
      const fields: FieldErrors = {};
      for (const issue of parsed.error.issues)
        (fields[issue.path.join('.')] ??= []).push(issue.message);
      setErrors(fields);
      focusError(fields);
      return;
    }
    setPending(true);
    try {
      const result = await mutate(
        `/api/pets/${petId}/records${record ? `/${record.id}` : ''}`,
        record ? 'PATCH' : 'POST',
        parsed.data,
      );
      toast({ body: record ? 'Medical record updated.' : 'Medical record added.' });
      guard.saved(`/pets/${petId}/records/${result.id}`);
    } catch (error) {
      setError((error as Error).message);
      if (error instanceof RequestError) {
        setErrors(error.fields);
        focusError(error.fields);
      }
      setPending(false);
    }
  }
  return (
    <>
      <form className="flex max-w-180 flex-col gap-5.5" onSubmit={submit} noValidate>
        {error && (
          <div
            className="rounded-md border border-care-error-border bg-care-error px-4.5 py-3.5 text-sm text-care-error-text"
            role="alert"
          >
            {error}
          </div>
        )}
        {!record && (
          <div className="grid grid-cols-3 gap-2 md:gap-2.5" role="group" aria-label="Record type">
            {recordTypes.map((type) => {
              const Icon = icons[type];
              return (
                <button
                  key={type}
                  type="button"
                  className="flex cursor-pointer flex-col gap-2 rounded-md border border-border bg-surface px-2 py-3 text-left text-xs text-secondary aria-pressed:border-accent aria-pressed:bg-accent-muted aria-pressed:ring-1 aria-pressed:ring-accent md:px-2.5 md:py-4 [&>span]:hidden [&>span]:text-2xs [&>span]:leading-normal md:[&>span]:block [&>strong]:text-primary"
                  aria-pressed={type === values.type}
                  onClick={() => changeType(type)}
                >
                  <Icon size={21} />
                  <strong>{recordMeta[type].label}</strong>
                  <span>{recordMeta[type].description}</span>
                </button>
              );
            })}
          </div>
        )}
        <section className="rounded-lg border border-border bg-surface px-4.5 py-5 md:p-7 [&>h2]:mb-1 [&>h2]:text-base [&>h2]:font-semibold [&>p]:mb-5.5 [&>p]:text-xs [&>p]:text-secondary">
          <h2>Record information</h2>
          <p>{recordMeta[values.type].description}.</p>
          <div className="flex flex-col gap-5 md:gap-5.5">
            <TextField
              name="title"
              label="Title"
              value={values.title}
              onChange={(v) => set('title', v)}
              errors={errors}
              placeholder={recordMeta[values.type].placeholder}
            />
            <div className="grid grid-cols-1 gap-5.5 md:grid-cols-2">
              <CalendarField
                name="occurredOn"
                label={recordMeta[values.type].dateLabel}
                value={values.occurredOn}
                onChange={(v) => set('occurredOn', v)}
                errors={errors}
                max={today}
              />
              <TextField
                name="provider"
                label="Vet or clinic"
                value={values.provider}
                onChange={(v) => set('provider', v)}
                errors={errors}
                optional
              />
            </div>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-surface px-4.5 py-5 md:p-7 [&>h2]:mb-1 [&>h2]:text-base [&>h2]:font-semibold [&>p]:mb-5.5 [&>p]:text-xs [&>p]:text-secondary">
          <h2>{recordMeta[values.type].label} details</h2>
          <p>Capture the information you have from your vet.</p>
          <div className="flex flex-col gap-5 md:gap-5.5">
            <Fields
              values={details}
              set={(key, value) => setDetails((current) => ({ ...current, [key]: value }))}
              errors={errors}
              occurredOn={values.occurredOn}
            />
            <NotesField
              name="notes"
              label="Additional notes"
              value={values.notes}
              onChange={(v) => set('notes', v)}
              errors={errors}
            />
          </div>
        </section>
        <section className="rounded-lg border border-border bg-surface px-4.5 py-5 md:p-7 [&>h2]:mb-1 [&>h2]:text-base [&>h2]:font-semibold [&>p]:mb-5.5 [&>p]:text-xs [&>p]:text-secondary">
          <CheckboxInput
            label="Add a follow-up"
            value={followUp}
            onChange={setFollowUp}
            description="Keep the next step alongside this record."
          />
          {followUp && (
            <div className="mt-5.5 flex flex-col gap-5 md:gap-5.5">
              <CalendarField
                name="followUpOn"
                label="Follow-up date"
                value={values.followUpOn}
                onChange={(v) => set('followUpOn', v)}
                errors={errors}
                min={values.occurredOn}
              />
              <TextField
                name="followUpNote"
                label="What needs to happen?"
                value={values.followUpNote}
                onChange={(v) => set('followUpNote', v)}
                errors={errors}
                optional
                placeholder="e.g. Book a follow-up visit"
              />
            </div>
          )}
        </section>
        <div className="flex justify-end gap-3 pt-1 pb-3">
          <Button
            label="Cancel"
            onClick={() =>
              guard.leave(record ? `/pets/${petId}/records/${record.id}` : `/pets/${petId}`)
            }
            isDisabled={pending}
          />
          <Button
            type="submit"
            label={record ? 'Save changes' : 'Save record'}
            variant="primary"
            isLoading={pending}
            size="lg"
          />
        </div>
      </form>
      {guard.dialog}
      <AlertDialog
        isOpen={!!nextType}
        onOpenChange={(open) => {
          if (!open) setNextType(null);
        }}
        title="Change record type?"
        description="The type-specific details you entered will be cleared. Your title, dates, clinic, notes, and follow-up will stay."
        actionLabel="Change type"
        onAction={() => {
          set('type', nextType!);
          setDetails({});
          setErrors({});
          setNextType(null);
        }}
      />
    </>
  );
}
