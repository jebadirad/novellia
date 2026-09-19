import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError } from './errors';
import { uuidSchema } from '@/domain/schemas';
export function validateId(id: string) {
  if (!uuidSchema.safeParse(id).success)
    throw new AppError(404, 'NOT_FOUND', 'This item could not be found.');
  return id;
}
export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new Error('Expected an object');
    return body;
  } catch {
    throw new AppError(400, 'BAD_REQUEST', 'Send a valid JSON object.');
  }
}
export function queryInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError(400, 'INVALID_QUERY', result.error.issues[0].message);
  return result.data;
}
export async function handle(action: () => Promise<unknown>, status = 200) {
  try {
    const result = await action();
    return status === 204 ? new Response(null, { status }) : NextResponse.json(result, { status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of error.issues)
        (fieldErrors[issue.path.join('.')] ??= []).push(issue.message);
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Check the highlighted fields.',
            fieldErrors,
          },
        },
        { status: 422 },
      );
    }
    if (error instanceof AppError)
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      ['P2025', 'P2003'].includes(String(error.code))
    )
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'This item could not be found. It may have been deleted.',
          },
        },
        { status: 404 },
      );
    console.error('Request failed', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    );
  }
}
