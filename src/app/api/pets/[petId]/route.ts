import { handle, jsonBody, validateId } from '@/server/http';
import { getPet, updatePet, deletePet } from '@/server/pets';
import { petInputSchema } from '@/domain/schemas';
import { today } from '@/server/context';
type Context = { params: Promise<{ petId: string }> };
export const GET = (_: Request, { params }: Context) =>
  handle(async () => getPet(validateId((await params).petId)));
export const PATCH = (request: Request, { params }: Context) =>
  handle(async () => {
    const id = validateId((await params).petId);
    const existing = await getPet(id);
    const { name, species, breed, birthDate, sex, notes } = existing;
    const body = await jsonBody(request);
    return updatePet(
      id,
      petInputSchema(today()).parse({ name, species, breed, birthDate, sex, notes, ...body }),
    );
  });
export const DELETE = (_: Request, { params }: Context) =>
  handle(async () => deletePet(validateId((await params).petId)), 204);
