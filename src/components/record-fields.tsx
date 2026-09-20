'use client';
import type { FieldErrors } from '@/domain/types';
import type { RecordType } from '@/domain/schemas';
import { CalendarField, NotesField, TextField } from './form-tools';
type Props = {
  values: Record<string, string>;
  set: (name: string, value: string) => void;
  errors: FieldErrors;
  occurredOn: string;
};
function VisitFields({ values, set, errors }: Props) {
  return (
    <>
      <TextField
        name="details.reason"
        label="Reason for visit"
        value={values.reason ?? ''}
        onChange={(v) => set('reason', v)}
        errors={errors}
        placeholder="e.g. Annual wellness check"
      />
      <NotesField
        name="details.assessment"
        label="Assessment"
        value={values.assessment ?? ''}
        onChange={(v) => set('assessment', v)}
        errors={errors}
      />
    </>
  );
}
function VaccinationFields({ values, set, errors }: Props) {
  return (
    <div className="grid grid-cols-1 gap-5.5 md:grid-cols-2">
      <TextField
        name="details.vaccineName"
        label="Vaccine name"
        value={values.vaccineName ?? ''}
        onChange={(v) => set('vaccineName', v)}
        errors={errors}
      />
      <TextField
        name="details.lotNumber"
        label="Lot number"
        value={values.lotNumber ?? ''}
        onChange={(v) => set('lotNumber', v)}
        errors={errors}
        optional
      />
    </div>
  );
}
function MedicationFields({ values, set, errors, occurredOn }: Props) {
  return (
    <>
      <TextField
        name="details.medicationName"
        label="Medication name"
        value={values.medicationName ?? ''}
        onChange={(v) => set('medicationName', v)}
        errors={errors}
      />
      <div className="grid grid-cols-1 gap-5.5 md:grid-cols-2">
        <TextField
          name="details.dose"
          label="Dose"
          value={values.dose ?? ''}
          onChange={(v) => set('dose', v)}
          errors={errors}
          optional
          placeholder="As written by your vet"
        />
        <TextField
          name="details.frequency"
          label="Frequency"
          value={values.frequency ?? ''}
          onChange={(v) => set('frequency', v)}
          errors={errors}
          optional
        />
      </div>
      <CalendarField
        name="details.endDate"
        label="End date"
        value={values.endDate ?? ''}
        onChange={(v) => set('endDate', v)}
        errors={errors}
        optional
        min={occurredOn}
      />
    </>
  );
}
export const recordFieldComponents = {
  vet_visit: VisitFields,
  vaccination: VaccinationFields,
  medication: MedicationFields,
} satisfies Record<RecordType, React.ComponentType<Props>>;
