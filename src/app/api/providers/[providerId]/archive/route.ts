import { handle, jsonBody, validateId } from '@/server/http';
import { archiveProvider } from '@/server/providers';
import { providerArchiveSchema } from '@/domain/providers';
export const PATCH = (request: Request, { params }: { params: Promise<{ providerId: string }> }) =>
  handle(async () => {
    const id = validateId((await params).providerId);
    const { archived } = providerArchiveSchema.parse(await jsonBody(request));
    return archiveProvider(id, archived);
  });
