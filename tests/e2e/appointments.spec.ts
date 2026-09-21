import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import AxeBuilder from '@axe-core/playwright';
import { assertTestDatabase } from '../database-lifecycle';

for (const [day, localTime, width] of [
  ['2027-01-15', '10:00 AM MST', 1440],
  ['2027-07-15', '9:00 AM MST', 375],
] as const) {
  test.describe(day, () => {
    test.use({ timezoneId: 'America/Phoenix', viewport: { width, height: 900 } });
    test('creates and displays a clinic appointment in both timezones', async ({
      page,
      request,
    }) => {
      assertTestDatabase(process.env.DATABASE_URL);
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const providerId = randomUUID();
      const name = `California clinic ${providerId.slice(0, 8)}`;
      let petId: string | undefined;
      try {
        await pool.query(
          `INSERT INTO "CareProvider" (id, name, "normalizedName", "timeZone", "updatedAt") VALUES ($1, $2, $2, 'America/Los_Angeles', now())`,
          [providerId, name],
        );
        const response = await request.post('/api/pets', {
          data: { name: 'Appointment companion', species: 'cat' },
        });
        expect(response.status()).toBe(201);
        petId = (await response.json()).id;
        await page.goto(`/pets/${petId}/records/new`);
        await page
          .getByRole('textbox', { name: 'Title', exact: true })
          .fill('Referral appointment');
        await page.getByRole('textbox', { name: 'Reason for visit' }).fill('Follow-up examination');
        await page.getByRole('checkbox', { name: 'Add a follow-up' }).check();
        await page.getByRole('combobox', { name: 'Follow-up vet or clinic' }).fill(name);
        await page.getByRole('option', { name: new RegExp(name) }).click();
        await page.getByLabel('Follow-up date', { exact: true }).fill(day);
        await page.getByRole('textbox', { name: 'Appointment time at clinic' }).fill('9:00 AM');
        await page.getByRole('textbox', { name: 'What needs to happen?' }).click();
        await expect(page.getByLabel('Appointment time', { exact: true })).toContainText(localTime);
        await page.getByRole('button', { name: 'Save record', exact: true }).click();
        await expect(
          page.getByRole('heading', { name: 'Referral appointment', exact: true, level: 1 }),
        ).toBeVisible();
        await page.reload();
        await expect(page.getByLabel('Appointment time', { exact: true })).toContainText(localTime);
        const recordId = page.url().split('/').at(-1);
        const saved = await (await request.get(`/api/pets/${petId}/records/${recordId}`)).json();
        expect(saved.followUpTimeZone).toBe('America/Los_Angeles');
        expect(saved.followUpTime).toBe('09:00');
        expect(saved.providerId).toBeNull();
        expect(saved.followUpProviderId).toBe(providerId);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await page.screenshot({ path: `artifacts/appointment-${day}.png`, fullPage: true });
        await page.goto(`/follow-ups?petId=${petId}`);
        await expect(page.getByLabel('Appointment time', { exact: true })).toContainText(localTime);
        await page.getByRole('button', { name: 'Mark complete' }).click();
        await page.getByRole('link', { name: 'Completed', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Reopen' })).toBeVisible();
        await expect(page.getByLabel('Appointment time', { exact: true })).toContainText(localTime);
      } finally {
        try {
          if (petId) {
            await request.delete(`/api/pets/${petId}`);
          }
          await pool.query('DELETE FROM "CareProvider" WHERE id = $1', [providerId]);
        } finally {
          await pool.end();
        }
      }
    });
  });
}
