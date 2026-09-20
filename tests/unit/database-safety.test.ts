import { describe, expect, it, vi } from 'vitest';
import { testDatabaseLifecycle } from '../database-lifecycle';

function fixture(databaseUrl: string | undefined) {
  const db = {
    pet: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    careProvider: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  const pool = { end: vi.fn().mockResolvedValue(undefined) };
  return { db, pool, ...testDatabaseLifecycle(db, pool, databaseUrl) };
}

describe('integration database safety', () => {
  it.each([
    undefined,
    '',
    'not a URL',
    'postgresql://localhost/novellia',
    'postgresql://localhost/production',
    'postgresql://localhost/prefix/novellia_test',
    'postgresql://localhost/novellia_test_backup',
    'https://localhost/novellia_test',
  ])('never deletes data after rejecting %s, even when teardown runs', async (url) => {
    const database = fixture(url);
    await expect(database.setup()).rejects.toThrow('Integration tests require');
    await database.cleanup();
    expect(database.db.pet.deleteMany).not.toHaveBeenCalled();
    expect(database.db.careProvider.deleteMany).not.toHaveBeenCalled();
    expect(database.db.$disconnect).toHaveBeenCalledOnce();
    expect(database.pool.end).toHaveBeenCalledOnce();
  });

  it('cleans the authorized database before and after tests', async () => {
    const database = fixture('postgresql://localhost/novellia_test');
    await database.setup();
    await database.cleanup();
    expect(database.db.pet.deleteMany).toHaveBeenCalledTimes(2);
    expect(database.db.careProvider.deleteMany).toHaveBeenCalledTimes(2);
    expect(database.db.$disconnect).toHaveBeenCalledOnce();
    expect(database.pool.end).toHaveBeenCalledOnce();
  });

  it('can clean up partially failed setup after authorization', async () => {
    const database = fixture('postgresql://localhost/novellia_test');
    database.db.careProvider.deleteMany.mockRejectedValueOnce(new Error('Setup interrupted'));
    await expect(database.setup()).rejects.toThrow('Setup interrupted');
    await database.cleanup();
    expect(database.db.careProvider.deleteMany).toHaveBeenCalledTimes(2);
    expect(database.pool.end).toHaveBeenCalledOnce();
  });

  it('closes connections even when cleanup and disconnect fail', async () => {
    const database = fixture('postgresql://localhost/novellia_test');
    await database.setup();
    database.db.pet.deleteMany.mockRejectedValueOnce(new Error('Cleanup failed'));
    database.db.$disconnect.mockRejectedValueOnce(new Error('Disconnect failed'));
    await expect(database.cleanup()).rejects.toThrow();
    expect(database.db.$disconnect).toHaveBeenCalledOnce();
    expect(database.pool.end).toHaveBeenCalledOnce();
  });
});
