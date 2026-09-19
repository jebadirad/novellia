'use client';
import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { useToast } from '@astryxdesign/core/Toast';
import { petInputSchema, speciesLabels, type Species } from '@/domain/schemas';
import type { PetDto, FieldErrors } from '@/domain/types';
import { TextField, CalendarField, NotesField, focusError, useDirtyGuard } from './form-tools';
import { mutate, RequestError } from './actions';
import s from './styles.module.css';
export function PetForm({ pet, today }: { pet?: PetDto; today: string }) {
  const initial = {
    name: pet?.name ?? '',
    species: pet?.species ?? 'dog',
    breed: pet?.breed ?? '',
    birthDate: pet?.birthDate ?? '',
    sex: pet?.sex ?? 'unknown',
    notes: pet?.notes ?? '',
  };
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [unknownBirth, setUnknownBirth] = useState(!pet?.birthDate);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const guard = useDirtyGuard(dirty);
  const toast = useToast();
  const set = (field: keyof typeof values, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setErrors({});
    setError('');
    const parsed = petInputSchema(today).safeParse(values);
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
        pet ? `/api/pets/${pet.id}` : '/api/pets',
        pet ? 'PATCH' : 'POST',
        parsed.data,
      );
      toast({ body: pet ? 'Pet profile updated.' : `${result.name} has been added.` });
      guard.saved(`/pets/${result.id}`);
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
      <form className={s.form} onSubmit={submit} noValidate>
        {error && (
          <div role="alert" className={s.formError}>
            {error}
          </div>
        )}
        <section className={s.formSection}>
          <h2>A little about your pet</h2>
          <p>Start with the basics. You can add more information anytime.</p>
          <div className={s.formFields}>
            <div className={s.twoColumns}>
              <TextField
                name="name"
                label="Pet name"
                value={values.name}
                onChange={(v) => set('name', v)}
                errors={errors}
                placeholder="e.g. Luna"
              />
              <div data-field="species">
                <Selector
                  label="Species"
                  value={values.species}
                  onChange={(value) => set('species', value as Species)}
                  options={Object.entries(speciesLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  size="lg"
                  width="100%"
                />
              </div>
            </div>
            <TextField
              name="breed"
              label="Breed"
              value={values.breed}
              onChange={(v) => set('breed', v)}
              errors={errors}
              optional
              placeholder="e.g. Labrador Retriever"
            />
            <div className={s.twoColumns}>
              <div>
                <CheckboxInput
                  label="Birth date unknown"
                  value={unknownBirth}
                  onChange={(value) => {
                    setUnknownBirth(value);
                    if (value) set('birthDate', '');
                  }}
                />
                {!unknownBirth && (
                  <CalendarField
                    name="birthDate"
                    label="Birth date"
                    value={values.birthDate}
                    onChange={(v) => set('birthDate', v)}
                    errors={errors}
                    max={today}
                    optional
                  />
                )}
              </div>
              <Selector
                label="Sex"
                value={values.sex}
                onChange={(value) => set('sex', value)}
                options={[
                  { value: 'unknown', label: 'Unknown' },
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                ]}
                width="100%"
                size="lg"
              />
            </div>
            <NotesField
              name="notes"
              label="Notes about your pet"
              value={values.notes}
              onChange={(v) => set('notes', v)}
              errors={errors}
            />
          </div>
        </section>
        <div className={s.formActions}>
          <Button
            label="Cancel"
            onClick={() => guard.leave(pet ? `/pets/${pet.id}` : '/pets')}
            isDisabled={pending}
          />
          <Button
            type="submit"
            label={pet ? 'Save changes' : 'Add pet'}
            variant="primary"
            isLoading={pending}
            size="lg"
          />
        </div>
      </form>
      {guard.dialog}
    </>
  );
}
