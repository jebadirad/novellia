import type { RecordDto } from '@/domain/types';
import type { RecordType } from '@/domain/schemas';
import { DetailField } from './display';
import { formatDate } from '@/domain/dates';
type RendererMap = {
  [K in RecordType]: (record: Extract<RecordDto, { type: K }>) => React.ReactNode;
};
const renderers = {
  vet_visit: (record) => (
    <>
      <DetailField label="Reason for visit">{record.details.reason}</DetailField>
      <DetailField label="Assessment">{record.details.assessment}</DetailField>
    </>
  ),
  vaccination: (record) => (
    <>
      <DetailField label="Vaccine">{record.details.vaccineName}</DetailField>
      <DetailField label="Lot number">{record.details.lotNumber}</DetailField>
    </>
  ),
  medication: (record) => (
    <>
      <DetailField label="Medication">{record.details.medicationName}</DetailField>
      <DetailField label="Dose">{record.details.dose}</DetailField>
      <DetailField label="Frequency">{record.details.frequency}</DetailField>
      <DetailField label="End date">{formatDate(record.details.endDate)}</DetailField>
    </>
  ),
} satisfies RendererMap;
export function RecordDetails({ record }: { record: RecordDto }) {
  // The explicit switch preserves the relationship between each type and its details.
  switch (record.type) {
    case 'vet_visit':
      return renderers.vet_visit(record);
    case 'vaccination':
      return renderers.vaccination(record);
    case 'medication':
      return renderers.medication(record);
    default: {
      const unexpected: never = record;
      throw new Error(`Unsupported record: ${unexpected}`);
    }
  }
}
