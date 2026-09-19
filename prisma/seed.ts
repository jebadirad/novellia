import 'dotenv/config';
import { prisma, pool } from '../src/server/database';
import { seedDemo } from './seed-data';
seedDemo(prisma)
  .then(() =>
    console.log('Seeded four fictional pets and twelve records. Existing entries were preserved.'),
  )
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
