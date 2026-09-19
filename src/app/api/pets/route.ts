import { handle, jsonBody, queryInput } from '@/server/http';
import { listPets, createPet } from '@/server/pets';
import { petInputSchema, petQuerySchema, cleanQuery } from '@/domain/schemas';
import { today } from '@/server/context';
export const GET = (request: Request) =>
  handle(() => listPets(queryInput(petQuerySchema, cleanQuery(new URL(request.url).searchParams))));
export const POST = (request: Request) =>
  handle(async () => createPet(petInputSchema(today()).parse(await jsonBody(request))), 201);
