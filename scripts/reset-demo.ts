import 'dotenv/config';
import { prisma, pool } from '../src/server/database';
import { seedDemo } from '../prisma/seed-data';
async function reset() {
  if (!process.argv.includes('--confirm'))
    throw new Error(
      'This deletes every pet and record in DATABASE_URL. Run npm run db:reset -- --confirm only for the intended demo database.',
    );
  await prisma.pet.deleteMany();
  await seedDemo(prisma);
  console.log('Demo database reset.');
}
reset()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
