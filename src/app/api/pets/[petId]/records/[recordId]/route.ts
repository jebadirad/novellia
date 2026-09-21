import { handle, jsonBody, validateId } from '@/server/http';
import { getRecord, updateRecord, deleteRecord } from '@/server/records';
type Context = { params: Promise<{ petId: string; recordId: string }> };
export const GET = (_: Request, { params }: Context) =>
  handle(async () => {
    const { petId, recordId } = await params;
    return getRecord(validateId(petId), validateId(recordId));
  });
export const PATCH = (request: Request, { params }: Context) =>
  handle(async () => {
    const { petId, recordId } = await params;
    return updateRecord(validateId(petId), validateId(recordId), await jsonBody(request));
  });
export const DELETE = (_: Request, { params }: Context) =>
  handle(async () => {
    const { petId, recordId } = await params;
    return deleteRecord(validateId(petId), validateId(recordId));
  }, 204);
