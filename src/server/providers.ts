import 'server-only';
import { prisma } from './database';
import { AppError, missing } from './errors';
import { providerDto } from './serialize';
import { normalizeProviderName, type ProviderInput, type ProviderQuery } from '@/domain/providers';
import type { Prisma } from '@/generated/prisma/client';

const counts = { _count: { select: { records: true } } } as const;
export async function listProviders(query: ProviderQuery) {
  return (
    await prisma.careProvider.findMany({
      where: {
        ...(query.status !== 'all' && {
          archivedAt: query.status === 'active' ? null : { not: null },
        }),
        ...(query.q && { name: { contains: query.q, mode: 'insensitive' } }),
      },
      include: counts,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    })
  ).map(providerDto);
}
export async function getProvider(id: string) {
  const provider = await prisma.careProvider.findUnique({ where: { id }, include: counts });
  if (!provider) {
    throw missing();
  }
  return providerDto(provider);
}
function duplicate(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
    throw new AppError(
      409,
      'DUPLICATE_PROVIDER',
      'A provider with this name already exists. Select it, or restore it if archived.',
      {
        name: ['This provider already exists. Use the existing entry.'],
      },
    );
  }
  throw error;
}
export async function createProvider(input: ProviderInput) {
  try {
    return providerDto(
      await prisma.careProvider.create({
        data: { ...input, normalizedName: normalizeProviderName(input.name) },
        include: counts,
      }),
    );
  } catch (error) {
    duplicate(error);
  }
}
export async function updateProvider(id: string, input: ProviderInput) {
  try {
    return providerDto(
      await prisma.careProvider.update({
        where: { id },
        data: { ...input, normalizedName: normalizeProviderName(input.name) },
        include: counts,
      }),
    );
  } catch (error) {
    duplicate(error);
  }
}
export async function archiveProvider(id: string, archived: boolean) {
  // Idempotent archive preserves the original timestamp.
  await prisma.careProvider.updateMany({
    where: { id, ...(archived && { archivedAt: null }) },
    data: { archivedAt: archived ? new Date() : null },
  });
  return getProvider(id);
}
export async function deleteProvider(id: string) {
  try {
    // The restrictive foreign key is the final authority, even if a record is
    // linked concurrently after the UI displayed a zero record count.
    await prisma.careProvider.delete({ where: { id } });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      throw new AppError(
        409,
        'PROVIDER_IN_USE',
        'This provider has linked medical records. Archive it instead.',
      );
    }
    throw error;
  }
}
export async function validateRecordProvider(
  tx: Prisma.TransactionClient,
  id: string | null,
  previousId?: string | null,
) {
  if (!id) {
    return;
  }
  // Serialize assignment with archive/delete so an archived provider cannot
  // acquire new records. Existing historical links can still be retained.
  const rows = await tx.$queryRaw<{ archivedAt: Date | null }[]>`
    SELECT "archivedAt" FROM "CareProvider" WHERE "id" = ${id}::uuid FOR UPDATE
  `;
  const provider = rows[0];
  if (!provider || (provider.archivedAt && id !== previousId)) {
    throw new AppError(422, 'INVALID_PROVIDER', 'Choose an active provider.', {
      providerId: [
        'This provider is unavailable. Choose an active provider or clear the selection.',
      ],
    });
  }
}
