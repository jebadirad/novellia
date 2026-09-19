import { handle, queryInput } from '@/server/http';
import { listRecords } from '@/server/records';
import { recordQuerySchema, cleanQuery } from '@/domain/schemas';
export const GET = (request: Request) =>
  handle(() =>
    listRecords(queryInput(recordQuerySchema, cleanQuery(new URL(request.url).searchParams))),
  );
