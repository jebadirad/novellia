import 'server-only';
import { notFound } from 'next/navigation';
import { AppError } from './errors';
import { uuidSchema } from '@/domain/schemas';
export function pageId(id: string) {
  if (!uuidSchema.safeParse(id).success) notFound();
  return id;
}
export async function pageData<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
}
