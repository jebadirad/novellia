import { z } from 'zod';

export const speciesLabels = {
  dog: 'Dog',
  cat: 'Cat',
  bird: 'Bird',
  rabbit: 'Rabbit',
  reptile: 'Reptile',
  small_mammal: 'Small mammal',
  other: 'Other',
} as const;
export const speciesSchema = z.enum([
  'dog',
  'cat',
  'bird',
  'rabbit',
  'reptile',
  'small_mammal',
  'other',
]);
export type Species = z.infer<typeof speciesSchema>;
export const requiredText = (max: number, message: string) =>
  z.string().trim().min(1, message).max(max);
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => value || null);
export const calendarDate = z.iso.date();
const optionalDate = z
  .union([calendarDate, z.literal(''), z.null()])
  .optional()
  .transform((value) => value || null);
export const petSchema = z.strictObject({
  name: requiredText(80, 'Enter your pet’s name.'),
  species: speciesSchema,
  breed: optionalText(100),
  birthDate: optionalDate,
  sex: z.enum(['male', 'female', 'unknown']).default('unknown'),
  notes: optionalText(2000),
});
export const petInputSchema = (today: string) =>
  petSchema.refine((value) => !value.birthDate || value.birthDate <= today, {
    path: ['birthDate'],
    message: 'Birth date cannot be in the future.',
  });
export type PetInput = z.infer<typeof petSchema>;

export const visitDetails = z.strictObject({
  reason: requiredText(500, 'Enter a reason for the visit.'),
  assessment: optionalText(2000),
});
export const vaccinationDetails = z.strictObject({
  vaccineName: requiredText(120, 'Enter a vaccine name.'),
  lotNumber: optionalText(80),
});
export const medicationDetails = z.strictObject({
  medicationName: requiredText(120, 'Enter a medication name.'),
  dose: optionalText(120),
  frequency: optionalText(120),
  endDate: optionalDate,
});
const common = {
  title: requiredText(120, 'Enter a title.'),
  occurredOn: calendarDate,
  provider: optionalText(120),
  notes: optionalText(5000),
  followUpOn: optionalDate,
  followUpNote: optionalText(240),
};
export const recordSchema = z.discriminatedUnion('type', [
  z.strictObject({ ...common, type: z.literal('vet_visit'), details: visitDetails }),
  z.strictObject({ ...common, type: z.literal('vaccination'), details: vaccinationDetails }),
  z.strictObject({ ...common, type: z.literal('medication'), details: medicationDetails }),
]);
export type RecordInput = z.infer<typeof recordSchema>;
export type RecordType = RecordInput['type'];
export const recordTypes = recordSchema.options.map((schema) => schema.shape.type.value);
export const recordMeta = {
  vet_visit: {
    label: 'Vet visit',
    dateLabel: 'Visit date',
    placeholder: 'Annual wellness check',
    description: 'Visits, checkups, and observations',
  },
  vaccination: {
    label: 'Vaccination',
    dateLabel: 'Vaccinated on',
    placeholder: 'Rabies booster',
    description: 'Vaccines and immunization history',
  },
  medication: {
    label: 'Medication',
    dateLabel: 'Prescribed on',
    placeholder: 'Ear drops prescription',
    description: 'Prescriptions and care instructions',
  },
} satisfies Record<
  RecordType,
  { label: string; dateLabel: string; placeholder: string; description: string }
>;
export function recordInputSchema(today: string) {
  return recordSchema.superRefine((value, ctx) => {
    if (value.occurredOn > today)
      ctx.addIssue({
        code: 'custom',
        path: ['occurredOn'],
        message: 'The record date cannot be in the future.',
      });
    if (value.followUpOn && value.followUpOn < value.occurredOn)
      ctx.addIssue({
        code: 'custom',
        path: ['followUpOn'],
        message: 'Follow-up must be on or after the record date.',
      });
    if (
      value.type === 'medication' &&
      value.details.endDate &&
      value.details.endDate < value.occurredOn
    )
      ctx.addIssue({
        code: 'custom',
        path: ['details', 'endDate'],
        message: 'End date must be on or after the prescribed date.',
      });
  });
}
export const followUpSchema = z.strictObject({ completed: z.boolean() });
export const uuidSchema = z.uuid();

const queryBase = {
  q: z.string().trim().max(200).default(''),
  page: z.coerce.number().int().min(1).max(100000).default(1),
};
export const petQuerySchema = z.object({ ...queryBase, species: speciesSchema.optional() });
export const recordQuerySchema = z
  .object({
    ...queryBase,
    petId: uuidSchema.optional(),
    type: z.enum(recordTypes).optional(),
    from: calendarDate.optional(),
    to: calendarDate.optional(),
    sort: z.enum(['newest', 'oldest']).default('newest'),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    path: ['to'],
    message: 'End date must be on or after start date.',
  });
export const followUpQuerySchema = z.object({
  petId: uuidSchema.optional(),
  tab: z.enum(['open', 'completed']).default('open'),
  group: z.enum(['overdue', 'due']).optional(),
});
export type PetQuery = z.infer<typeof petQuerySchema>;
export type RecordQuery = z.infer<typeof recordQuerySchema>;
export type FollowUpQuery = z.infer<typeof followUpQuerySchema>;
export type SearchParams = Record<string, string | string[] | undefined>;
export function cleanQuery(params: SearchParams | URLSearchParams) {
  const entries =
    params instanceof URLSearchParams ? [...params.entries()] : Object.entries(params);
  return Object.fromEntries(entries.filter(([, value]) => value !== '' && value !== undefined));
}
