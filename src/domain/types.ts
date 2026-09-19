import type { PetInput, RecordInput } from './schemas';
export type PetDto = PetInput & { id: string; createdAt: string; updatedAt: string };
export type RecordDto = RecordInput & {
  id: string;
  petId: string;
  detailsVersion: number;
  followUpCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  pet: PetDto;
};
export type PetSummary = PetDto & { recordCount: number; nextFollowUp: RecordDto | null };
export type PageResult<T> = { items: T[]; total: number; page: number; pageSize: number };
export type FieldErrors = Record<string, string[]>;
