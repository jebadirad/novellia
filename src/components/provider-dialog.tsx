'use client';

import { useRef, useState } from 'react';
import { Dialog } from '@astryxdesign/core/Dialog';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { useToast } from '@astryxdesign/core/Toast';
import {
  providerSchema,
  providerKinds,
  normalizeProviderName,
  type ProviderDto,
} from '@/domain/providers';
import { usStates } from '@/domain/contact';
import { AddressPicker } from './address-picker';
import { PhoneField } from './phone-field';
import type { FieldErrors } from '@/domain/types';
import { TextField, NotesField, focusError, useDirtyGuard } from './form-tools';
import { mutate, RequestError } from './actions';

// Mount only while open so a new dialog always starts with fresh values.
export function ProviderDialog({
  provider,
  initialName = '',
  providers,
  onSaved,
  onClose,
  onSelect,
}: {
  provider?: ProviderDto;
  initialName?: string;
  providers: ProviderDto[];
  onSaved: (provider: ProviderDto) => void;
  onClose: () => void;
  onSelect?: (provider: ProviderDto) => void;
}) {
  const initial = {
    name: provider?.name ?? initialName,
    kind: provider?.kind ?? 'clinic',
    phone: provider?.phone ?? '',
    addressLine1: provider?.addressLine1 ?? '',
    addressLine2: provider?.addressLine2 ?? '',
    city: provider?.city ?? '',
    state: provider?.state ?? '',
    zip: provider?.zip ?? '',
    notes: provider?.notes ?? '',
  };
  const [values, setValues] = useState(initial);
  const [knownProviders, setKnownProviders] = useState(providers);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [discard, setDiscard] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const guard = useDirtyGuard(dirty);
  const toast = useToast();
  const normalized = normalizeProviderName(values.name);
  const matches = knownProviders
    .filter(
      (p) =>
        p.id !== provider?.id &&
        normalized.length >= 3 &&
        (normalizeProviderName(p.name).includes(normalized) ||
          normalized.includes(normalizeProviderName(p.name)) ||
          normalized
            .split(' ')
            .some(
              (word) => word.length >= 4 && normalizeProviderName(p.name).split(' ').includes(word),
            )),
    )
    .slice(0, 5);
  const exact = knownProviders.find(
    (p) => p.id !== provider?.id && normalizeProviderName(p.name) === normalized,
  );
  const set = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };
  function validateField(key: keyof typeof values) {
    const result = providerSchema.shape[key].safeParse(values[key]);
    if (!result.success) {
      setErrors((current) => ({
        ...current,
        [key]: result.error.issues.map((issue) => issue.message),
      }));
    } else {
      setValues((current) => ({ ...current, [key]: result.data ?? '' }));
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }
  function close() {
    if (pending) {
      return;
    }
    if (dirty) {
      setDiscard(true);
    } else {
      onClose();
    }
  }
  async function select(existing: ProviderDto) {
    setPending(true);
    setError('');
    try {
      const selected = existing.archivedAt
        ? await mutate(`/api/providers/${existing.id}/archive`, 'PATCH', { archived: false })
        : existing;
      onSelect?.(selected);
    } catch (error) {
      setError((error as Error).message);
      setPending(false);
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    // Keep submission scoped to the provider form.
    event.stopPropagation();
    if (pending) {
      return;
    }
    setError('');
    setErrors({});
    const parsed = providerSchema.safeParse(values);
    if (!parsed.success) {
      const fields: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        (fields[issue.path.join('.')] ??= []).push(issue.message);
      }
      setErrors(fields);
      focusError(fields, formRef.current);
      return;
    }
    setPending(true);
    try {
      const saved = await mutate(
        `/api/providers${provider ? `/${provider.id}` : ''}`,
        provider ? 'PATCH' : 'POST',
        parsed.data,
      );
      toast({ body: provider ? 'Provider updated.' : 'Provider added.' });
      onSaved(saved);
    } catch (error) {
      setError((error as Error).message);
      if (error instanceof RequestError) {
        setErrors(error.fields);
        focusError(error.fields, formRef.current);
      }
      // Another visitor may have created the same provider while this form was open.
      try {
        const response = await fetch('/api/providers?status=all');
        if (response.ok) {
          setKnownProviders(await response.json());
        }
      } catch {
        /* Keep the original save error visible. */
      }
      setPending(false);
    }
  }
  return (
    <>
      <Dialog
        isOpen
        onOpenChange={(open) => {
          if (!open) {
            close();
          }
        }}
        aria-labelledby="provider-dialog-title"
        width={560}
      >
        <form
          ref={formRef}
          onSubmit={submit}
          noValidate
          className="flex max-h-[85dvh] flex-col gap-5 overflow-y-auto p-5 md:p-7"
        >
          <div>
            <h2 id="provider-dialog-title" className="text-xl font-semibold">
              {provider ? 'Edit provider' : 'Add provider'}
            </h2>
            <p className="mt-1 text-sm text-secondary">
              Save a vet or clinic once, then use it across your pets’ records.
            </p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-care-error-text">
              {error}
            </p>
          )}
          <TextField
            name="name"
            label="Provider name"
            value={values.name}
            onChange={(v) => set('name', v)}
            onBlur={() => validateField('name')}
            errors={errors}
          />
          {(exact || matches.length > 0) && (
            <div className="rounded-md border border-border bg-muted p-3 text-sm">
              <p className="mb-2 font-semibold">
                {exact ? 'This provider already exists' : 'Could this be the same provider?'}
              </p>
              {(exact ? [exact] : matches).map((match) => (
                <div
                  key={match.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-1"
                >
                  <span>
                    {match.name}
                    {match.archivedAt ? ' · Archived' : ''}
                  </span>
                  {onSelect && (
                    <Button
                      label={match.archivedAt ? 'Restore and select' : 'Use this provider'}
                      size="sm"
                      isDisabled={pending}
                      onClick={() => select(match)}
                    />
                  )}
                </div>
              ))}
              {!exact && (
                <p className="mt-2 text-xs text-secondary">
                  If this is a different location, include the location in its name.
                </p>
              )}
            </div>
          )}
          <Selector
            label="Provider type"
            value={values.kind}
            onChange={(v) => set('kind', v)}
            options={Object.entries(providerKinds).map(([value, label]) => ({ value, label }))}
            width="100%"
          />
          <PhoneField
            value={values.phone}
            onChange={(v) => set('phone', v)}
            onBlur={() => validateField('phone')}
            errors={errors}
          />
          <fieldset className="min-w-0 space-y-4 border-t border-border pt-4">
            <legend className="text-base font-semibold">Address</legend>
            <AddressPicker
              onSelect={(address) => {
                setValues((current) => ({
                  ...current,
                  addressLine1: address.addressLine1 ?? '',
                  city: address.city ?? '',
                  state: address.state ?? '',
                  zip: address.zip ?? '',
                }));
                setErrors((current) => {
                  const next = { ...current };
                  for (const key of ['addressLine1', 'city', 'state', 'zip']) {
                    delete next[key];
                  }
                  return next;
                });
              }}
            />
            <TextField
              name="addressLine1"
              label="Address line 1"
              value={values.addressLine1}
              onChange={(v) => set('addressLine1', v)}
              onBlur={() => validateField('addressLine1')}
              errors={errors}
              autoComplete="address-line1"
              placeholder="Street number and street"
              optional
            />
            <TextField
              name="addressLine2"
              label="Address line 2"
              value={values.addressLine2}
              onChange={(v) => set('addressLine2', v)}
              onBlur={() => validateField('addressLine2')}
              errors={errors}
              autoComplete="address-line2"
              placeholder="Suite, unit, or building"
              optional
            />
            <TextField
              name="city"
              label="City"
              value={values.city}
              onChange={(v) => set('city', v)}
              onBlur={() => validateField('city')}
              errors={errors}
              autoComplete="address-level2"
              optional
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div data-field="state">
                <Selector
                  label="State"
                  isOptional
                  width="100%"
                  value={values.state}
                  onChange={(v) => set('state', v)}
                  options={[
                    { value: '', label: 'Select a state' },
                    ...Object.entries(usStates).map(([value, label]) => ({ value, label })),
                  ]}
                  status={errors.state ? { type: 'error', message: errors.state[0] } : undefined}
                  statusVariant="detached"
                />
              </div>
              <TextField
                name="zip"
                label="ZIP code"
                value={values.zip}
                onChange={(v) => set('zip', v)}
                onBlur={() => validateField('zip')}
                errors={errors}
                autoComplete="postal-code"
                placeholder="85001 or 85001-1234"
                optional
              />
            </div>
          </fieldset>
          <NotesField
            name="notes"
            label="Provider notes"
            value={values.notes}
            onChange={(v) => set('notes', v)}
            errors={errors}
          />
          <div className="flex justify-end gap-3">
            <Button label="Cancel" onClick={close} isDisabled={pending} />
            <Button
              label={provider ? 'Save provider' : 'Add provider'}
              type="submit"
              variant="primary"
              isLoading={pending}
              isDisabled={!!exact}
            />
          </div>
        </form>
      </Dialog>
      <AlertDialog
        isOpen={discard}
        onOpenChange={setDiscard}
        title="Discard provider changes?"
        description="Your provider changes have not been saved. Your medical record form will stay as it is."
        actionLabel="Discard changes"
        onAction={onClose}
      />
      {guard.dialog}
    </>
  );
}
