import 'server-only';
import { appointmentInstant, appointmentTime } from '@/domain/scheduling';
import { dateOnly } from '@/domain/dates';
import type { RecordInput } from '@/domain/schemas';
import type { MedicalRecord, Prisma } from '@/generated/prisma/client';
import { AppError } from './errors';
import { validateRecordProvider } from './providers';

export async function followUpData(
  tx: Prisma.TransactionClient,
  input: RecordInput,
  existing?: MedicalRecord,
) {
  if (!input.followUpOn) {
    return {
      followUpProviderId: null,
      followUpAt: null,
      followUpTimeZone: null,
      followUpCompletedAt: null,
    };
  }
  const unchanged =
    existing &&
    dateOnly(existing.followUpOn) === input.followUpOn &&
    existing.followUpProviderId === input.followUpProviderId &&
    (existing.followUpAt && existing.followUpTimeZone
      ? appointmentTime(existing.followUpAt.toISOString(), existing.followUpTimeZone)
      : null) === input.followUpTime;
  // Preserve old unassigned reminders, and the original zone after a clinic moves.
  if (unchanged) {
    return {
      followUpProviderId: existing.followUpProviderId,
      followUpAt: existing.followUpAt,
      followUpTimeZone: existing.followUpTimeZone,
    };
  }
  if (!input.followUpProviderId) {
    throw new AppError(
      422,
      'FOLLOW_UP_PROVIDER_REQUIRED',
      'Choose a vet or clinic for this follow-up.',
      { followUpProviderId: ['Choose a vet or clinic for this follow-up.'] },
    );
  }
  await validateRecordProvider(
    tx,
    input.followUpProviderId,
    existing?.followUpProviderId,
    'followUpProviderId',
  );
  const provider = await tx.careProvider.findUniqueOrThrow({
    where: { id: input.followUpProviderId },
  });
  if (input.followUpTime && !provider.timeZone) {
    throw new AppError(
      422,
      'UNRESOLVED_LOCATION',
      'Update the provider’s address before scheduling a time.',
      {
        followUpProviderId: [
          'Choose a provider with a resolved street address, or update this provider’s address.',
        ],
      },
    );
  }
  let followUpAt: Date | null = null;
  if (input.followUpTime) {
    try {
      followUpAt = new Date(
        appointmentInstant(input.followUpOn, input.followUpTime, provider.timeZone!),
      );
    } catch {
      throw new AppError(
        422,
        'AMBIGUOUS_APPOINTMENT',
        'This clock time is skipped or repeated by daylight saving time. Confirm another time with the clinic.',
        {
          followUpTime: [
            'This time is skipped or repeated by daylight saving time. Confirm another time with the clinic.',
          ],
        },
      );
    }
  }
  return {
    followUpProviderId: provider.id,
    followUpAt,
    followUpTimeZone: provider.timeZone,
    followUpCompletedAt: null,
  };
}
