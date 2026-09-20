import { handle, jsonBody, queryInput } from '@/server/http';
import { createProvider, listProviders } from '@/server/providers';
import { providerSchema, providerQuerySchema } from '@/domain/providers';
import { cleanQuery } from '@/domain/schemas';

export const GET = (request: Request) =>
  handle(async () =>
    listProviders(queryInput(providerQuerySchema, cleanQuery(new URL(request.url).searchParams))),
  );
export const POST = (request: Request) =>
  handle(async () => createProvider(providerSchema.parse(await jsonBody(request))), 201);
