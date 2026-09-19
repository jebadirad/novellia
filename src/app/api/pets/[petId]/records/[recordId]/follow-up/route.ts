import { handle, jsonBody, validateId } from '@/server/http';
import { setFollowUpCompleted } from '@/server/records';
import { followUpSchema } from '@/domain/schemas';
type Context = { params: Promise<{ petId: string; recordId: string }> };
export const PATCH = (request: Request, { params }: Context) =>
  handle(async () => {
    const { petId, recordId } = await params;
    const { completed } = followUpSchema.parse(await jsonBody(request));
    return setFollowUpCompleted(validateId(petId), validateId(recordId), completed);
  });
