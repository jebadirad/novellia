import { handle, jsonBody, queryInput, validateId } from '@/server/http';
import { createRecord, listRecords } from '@/server/records';
import { getPet } from '@/server/pets';
import { recordInputSchema, recordQuerySchema, cleanQuery } from '@/domain/schemas';
import { today } from '@/server/context';
type Context = { params: Promise<{ petId: string }> };
export const GET = (request: Request, { params }: Context) =>
  handle(async () => {
    const petId = validateId((await params).petId);
    await getPet(petId);
    return listRecords(
      queryInput(recordQuerySchema, { ...cleanQuery(new URL(request.url).searchParams), petId }),
    );
  });
export const POST = (request: Request, { params }: Context) =>
  handle(
    async () =>
      createRecord(
        validateId((await params).petId),
        recordInputSchema(today()).parse(await jsonBody(request)),
      ),
    201,
  );
