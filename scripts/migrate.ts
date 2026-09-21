import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { reconcileSchedulingMigration } from './migration-history';

async function migrate() {
  await reconcileSchedulingMigration(process.env.DIRECT_URL ?? process.env.DATABASE_URL);
  const result = spawnSync(
    process.execPath,
    ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
    { stdio: 'inherit' },
  );
  process.exitCode = result.status ?? 1;
}
migrate().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
