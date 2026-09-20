import { handle, jsonBody, validateId } from '@/server/http';
import { getProvider, updateProvider, deleteProvider } from '@/server/providers';
import { providerSchema } from '@/domain/providers';
type Context = { params: Promise<{ providerId: string }> };

export const GET = (_: Request, { params }: Context) =>
  handle(async () => getProvider(validateId((await params).providerId)));
export const PATCH = (request: Request, { params }: Context) =>
  handle(async () => {
    const id = validateId((await params).providerId);
    const { name, kind, phone, addressLine1, addressLine2, city, state, zip, notes } =
      await getProvider(id);
    return updateProvider(
      id,
      providerSchema.parse({
        name,
        kind,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        zip,
        notes,
        ...(await jsonBody(request)),
      }),
    );
  });
export const DELETE = (_: Request, { params }: Context) =>
  handle(async () => deleteProvider(validateId((await params).providerId)), 204);
