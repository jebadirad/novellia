type TestDatabase = {
  pet: { deleteMany: () => Promise<unknown> };
  careProvider: { deleteMany: () => Promise<unknown> };
  $disconnect: () => Promise<void>;
};

export function assertTestDatabase(databaseUrl: string | undefined) {
  let url: URL;
  try {
    url = new URL(databaseUrl ?? '');
  } catch {
    throw new Error('Integration tests require a valid DATABASE_URL for novellia_test.');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.pathname !== '/novellia_test') {
    throw new Error('Integration tests require the dedicated novellia_test database.');
  }
}

export function testDatabaseLifecycle(
  db: TestDatabase,
  pool: { end: () => Promise<void> },
  databaseUrl: string | undefined,
) {
  let cleanupAllowed = false;
  async function clearTestData() {
    // Protect every destructive call, including cleanup after partially failed setup.
    assertTestDatabase(databaseUrl);
    await db.pet.deleteMany();
    assertTestDatabase(databaseUrl);
    await db.careProvider.deleteMany();
  }
  return {
    async setup() {
      assertTestDatabase(databaseUrl);
      cleanupAllowed = true;
      await clearTestData();
    },
    async cleanup() {
      try {
        if (cleanupAllowed) await clearTestData();
      } finally {
        try {
          await db.$disconnect();
        } finally {
          await pool.end();
        }
      }
    },
  };
}
