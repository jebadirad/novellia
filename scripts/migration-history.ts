import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Pool } from 'pg';

const oldName = '20260920180000_clinic_scheduling';
const newName = '20260920230000_clinic_scheduling';

/** Repair only the name of the exact, successfully applied scheduling migration. */
export async function reconcileSchedulingMigration(connectionString: string | undefined) {
  if (!connectionString) {
    throw new Error('Set DATABASE_URL or DIRECT_URL before applying migrations.');
  }
  const schema = new URL(connectionString).searchParams.get('schema') ?? 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
    throw new Error('Unsupported database schema name.');
  }
  const pool = new Pool({ connectionString, options: `-c search_path=${schema}` });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const table = await client.query("SELECT to_regclass('_prisma_migrations') AS name");
    if (table.rows[0].name) {
      await client.query('LOCK TABLE "_prisma_migrations" IN EXCLUSIVE MODE');
      const rows = await client.query(
        'SELECT * FROM "_prisma_migrations" WHERE migration_name IN ($1, $2) AND rolled_back_at IS NULL',
        [oldName, newName],
      );
      const old = rows.rows.find((row) => row.migration_name === oldName);
      if (old) {
        const checksum = createHash('sha256')
          .update(readFileSync(`prisma/migrations/${newName}/migration.sql`))
          .digest('hex');
        if (!old.finished_at || old.checksum !== checksum || rows.rows.length !== 1) {
          throw new Error(
            'Scheduling migration history needs manual review: failed, modified, or duplicate entry. No changes made.',
          );
        }
        await client.query('UPDATE "_prisma_migrations" SET migration_name = $1 WHERE id = $2', [
          newName,
          old.id,
        ]);
        console.log(
          'Reconciled the previously applied scheduling migration name. SQL and application data unchanged.',
        );
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
