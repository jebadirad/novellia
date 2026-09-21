import { z } from 'zod';
import { optionalText, requiredText } from './schemas';
import { addressFields, phoneSchema } from './contact';

export const providerKinds = { clinic: 'Clinic', vet: 'Individual vet' } as const;
export const cleanProviderName = (name: string) => name.trim().replace(/\s+/g, ' ');
export const normalizeProviderName = (name: string) => cleanProviderName(name).toLowerCase();
export const providerSchema = z.strictObject({
  name: z.string().transform(cleanProviderName).pipe(requiredText(120, 'Enter a provider name.')),
  kind: z.enum(['clinic', 'vet']).default('clinic'),
  phone: phoneSchema,
  ...addressFields,
  notes: optionalText(2000),
});
export const providerQuerySchema = z.object({
  q: z.string().trim().max(200).default(''),
  status: z.enum(['active', 'archived', 'all']).default('active'),
});
export const providerArchiveSchema = z.strictObject({ archived: z.boolean() });
export type ProviderInput = z.infer<typeof providerSchema>;
export type ProviderQuery = z.infer<typeof providerQuerySchema>;
export type ProviderDto = ProviderInput & {
  id: string;
  archivedAt: string | null;
  recordCount: number;
  followUpCount: number;
  timeZone: string | null;
};
