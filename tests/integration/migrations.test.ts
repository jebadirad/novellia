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
    const saved = (
      await pool.query(`SELECT * FROM "${schema}"."_prisma_migrations" WHERE migration_name = $1`, [
        '20260920230000_clinic_scheduling',
      ])
    ).rows[0];
    const history = () =>
      pool
        .query(`SELECT * FROM "${schema}"."_prisma_migrations" ORDER BY id`)
        .then((result) => result.rows);
    for (const failure of ['checksum', 'unfinished', 'duplicate']) {
      await pool.query(
        `UPDATE "${schema}"."_prisma_migrations" SET migration_name = $1, checksum = $2, finished_at = $3 WHERE id = $4`,
        [
          '20260920180000_clinic_scheduling',
          failure === 'checksum' ? 'wrong' : saved.checksum,
          failure === 'unfinished' ? null : saved.finished_at,
          saved.id,
        ],
      );
      let duplicateId: string | undefined;
      if (failure === 'duplicate') {
        duplicateId = randomUUID();
        await pool.query(
          `INSERT INTO "${schema}"."_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES ($1, $2, $3, $4, $3, 1)`,
          [duplicateId, saved.checksum, saved.finished_at, '20260920230000_clinic_scheduling'],
        );
      }
      const before = await history();
      await expect(reconcileSchedulingMigration(url.toString())).rejects.toThrow('manual review');
      expect(await history()).toEqual(before);
      if (duplicateId) {
        await pool.query(`DELETE FROM "${schema}"."_prisma_migrations" WHERE id = $1`, [
          duplicateId,
        ]);
      }
    }
  } finally {
    assertTestDatabase(process.env.DATABASE_URL);
    await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await pool.end();
  }
}, 120000);
