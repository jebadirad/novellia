import { handle, jsonBody, validateId } from '@/server/http';
import { getRecord, updateRecord, deleteRecord } from '@/server/records';
import { recordInputSchema } from '@/domain/schemas';
import { today } from '@/server/context';
type Context = { params: Promise<{ petId: string; recordId: string }> };
export const GET = (_: Request, { params }: Context) =>
  handle(async () => {
    const { petId, recordId } = await params;
    return getRecord(validateId(petId), validateId(recordId));
  });
export const PATCH = (request: Request, { params }: Context) =>
  handle(async () => {
    const { petId, recordId } = await params;
    const existing = await getRecord(validateId(petId), validateId(recordId));
    const { type, title, occurredOn, provider, notes, details, followUpOn, followUpNote } =
      existing;
    const body = await jsonBody(request);
    return updateRecord(
      petId,
      recordId,
      recordInputSchema(today()).parse({
        type,
        title,
        occurredOn,
        provider,
        notes,
        details,
        followUpOn,
        followUpNote,
        ...body,
      }),
    );
  });
export const DELETE = (_: Request, { params }: Context) =>
  handle(async () => {
    const { petId, recordId } = await params;
    return deleteRecord(validateId(petId), validateId(recordId));
  }, 204);
