import { expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { Pool } from 'pg';
import { assertTestDatabase } from '../database-lifecycle';
import { reconcileSchedulingMigration } from '../../scripts/migration-history';

it('bootstraps an empty schema, repeats safely, and reconciles the old applied name', async () => {
  assertTestDatabase(process.env.DATABASE_URL);
  const schema = `migration_test_${randomUUID().replaceAll('-', '')}`;
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set('schema', schema);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const run = (...args: string[]) => {
    const result = spawnSync(process.execPath, args, {
      env: { ...process.env, DATABASE_URL: url.toString(), DIRECT_URL: url.toString() },
      encoding: 'utf8',
      timeout: 60000,
    });
    expect(result.status, result.stdout + result.stderr).toBe(0);
  };
  try {
    await pool.query(`CREATE SCHEMA "${schema}"`);
    run('--import', 'tsx', 'scripts/migrate.ts');
    run('--import', 'tsx', 'scripts/migrate.ts');
    run(
      'node_modules/prisma/build/index.js',
      'migrate',
      'diff',
      '--from-config-datasource',
      '--to-schema',
      'prisma/schema.prisma',
      '--exit-code',
    );
    const rows = await pool.query(
      `SELECT migration_name FROM "${schema}"."_prisma_migrations" WHERE finished_at IS NOT NULL`,
    );
    expect(rows.rows).toHaveLength(6);
    await pool.query(
      `UPDATE "${schema}"."_prisma_migrations" SET migration_name = $1 WHERE migration_name = $2`,
      ['20260920180000_clinic_scheduling', '20260920230000_clinic_scheduling'],
    );
    await reconcileSchedulingMigration(url.toString());
    run('--import', 'tsx', 'scripts/migrate.ts');
    // A modified or failed history entry must not be silently blessed.
    await pool.query(
      `UPDATE "${schema}"."_prisma_migrations" SET migration_name = $1, checksum = 'wrong' WHERE migration_name = $2`,
      ['20260920180000_clinic_scheduling', '20260920230000_clinic_scheduling'],
    );
    await expect(reconcileSchedulingMigration(url.toString())).rejects.toThrow('manual review');
  } finally {
    assertTestDatabase(process.env.DATABASE_URL);
    await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await pool.end();
  }
}, 120000);
