import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { assertTestDatabase } from '../database-lifecycle';

for (const [timezoneId, day, compactDay] of [
  ['America/Phoenix', 'January 1, 2026', 'Jan 1'],
  ['Asia/Tokyo', 'January 2, 2026', 'Jan 2'],
]) {
  test.describe(timezoneId, () => {
    test.use({ timezoneId });
    test('timestamps use the browser timezone while calendar dates stay fixed', async ({
      page,
    }) => {
      assertTestDatabase(process.env.DATABASE_URL);
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const petId = randomUUID();
      const recordId = randomUUID();
      const instant = '2026-01-02T02:00:00.000Z';
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      try {
        await pool.query(
          'INSERT INTO "Pet" (id, name, species, "updatedAt") VALUES ($1, $2, $3, now())',
          [petId, 'Timezone fixture', 'cat'],
        );
        await pool.query(
          `INSERT INTO "MedicalRecord"
          (id, "petId", type, title, "occurredOn", details, "followUpOn", "followUpCompletedAt", "createdAt", "updatedAt")
          VALUES ($1, $2, 'vet_visit', 'Timezone check', '2026-01-01', '{"reason":"Routine check"}', '2026-01-02', $3, $3, $3)`,
          [recordId, petId, instant],
        );
        await page.goto(`/pets/${petId}/records/${recordId}`);
        const timestamps = page.locator(`time[datetime="${instant}"]`);
        await expect(timestamps).toHaveCount(3);
        await expect(timestamps).toHaveText([day, day, day]);
        await expect(timestamps.first()).toHaveAttribute('title', new RegExp(timezoneId));
        await expect(page.getByText('Due January 2, 2026', { exact: true })).toBeVisible();
        await expect(page.getByText('January 1, 2026', { exact: true }).first()).toBeVisible();
        await page.reload();
        await expect(timestamps).toHaveText([day, day, day]);
        await page.goto(`/follow-ups?tab=completed&petId=${petId}`);
        await expect(page.locator(`time[datetime="${instant}"]`)).toHaveText(compactDay);
        expect(errors).toEqual([]);
      } finally {
        try {
          await pool.query('DELETE FROM "Pet" WHERE id = $1', [petId]);
        } finally {
          await pool.end();
        }
      }
    });
  });
}
