import { z } from 'zod';
import { handle, queryInput } from '@/server/http';
import { searchAddresses } from '@/server/address-search';

const querySchema = z.object({ q: z.string().trim().min(4).max(200) });
export const GET = (request: Request) =>
  handle(async () => {
    const { q } = queryInput(querySchema, Object.fromEntries(new URL(request.url).searchParams));
    return { suggestions: await searchAddresses(q) };
  });
