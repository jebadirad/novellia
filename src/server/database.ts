import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { attachDatabasePool } from '@vercel/functions';
import { Pool } from 'pg';

// Also used by seed/test scripts. Application imports go through server-only services.
const globalDb = globalThis as unknown as { novelliaPrisma?: PrismaClient; novelliaPool?: Pool };
export const pool =
  globalDb.novelliaPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
  });
if (process.env.VERCEL) attachDatabasePool(pool);
export const prisma = globalDb.novelliaPrisma ?? new PrismaClient({ adapter: new PrismaPg(pool) });
if (process.env.NODE_ENV !== 'production') {
  globalDb.novelliaPool = pool;
  globalDb.novelliaPrisma = prisma;
}
