import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { todayIn } from '../../src/domain/dates';

let petId: string;
let providerIds: string[];
test.beforeEach(async ({ request }) => {
  providerIds = [];
  const response = await request.post('/api/pets', {
    data: { name: 'Provider browser pet', species: 'cat' },
  });
  expect(response.status()).toBe(201);
  petId = (await response.json()).id;
});
test.afterEach(async ({ request }) => {
  await request.delete(`/api/pets/${petId}`);
  for (const id of providerIds) await request.delete(`/api/providers/${id}`);
});

test('inline creation preserves the record, handles failed saves, and selects existing providers', async ({
  page,
  request,
}) => {
  const name = `Inline Clinic ${Date.now()}`;
  await page.goto(`/pets/${petId}/records/new`);
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Kept record title');
  await page.getByRole('textbox', { name: 'Reason for visit' }).fill('Annual exam');
  await page.getByRole('combobox', { name: 'Vet or clinic' }).fill(name);
  await page.getByRole('button', { name: 'Add new provider' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('textbox', { name: 'Provider name' })).toHaveValue(name);
  await dialog.getByRole('textbox', { name: 'Provider notes' }).fill('x'.repeat(2001));
  await dialog.getByRole('button', { name: 'Add provider', exact: true }).click();
  await expect(dialog.getByRole('textbox', { name: 'Provider notes' })).toBeFocused();
  await dialog.getByRole('textbox', { name: 'Provider notes' }).fill('');
  await page.route('**/api/providers', async (route) => {
    if (route.request().method() === 'POST')
      await route.fulfill({ status: 500, json: { error: { message: 'Provider save failed' } } });
    else await route.continue();
  });
  await dialog.getByRole('button', { name: 'Add provider', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Provider save failed');
  await expect(dialog.getByRole('textbox', { name: 'Provider name' })).toHaveValue(name);
  await page.unroute('**/api/providers');
  const savedResponse = page.waitForResponse(
    (r) => r.url().endsWith('/api/providers') && r.request().method() === 'POST',
  );
  await dialog.getByRole('button', { name: 'Add provider', exact: true }).click();
  const created = await (await savedResponse).json();
  providerIds.push(created.id);
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue(
    'Kept record title',
  );
  expect((await (await request.get(`/api/pets/${petId}/records`)).json()).total).toBe(0);
  // Canceling a second provider dialog does not alter the parent form.
  await page.getByRole('button', { name: 'Add new provider' }).click();
  await dialog.getByRole('textbox', { name: 'Provider name' }).fill('Unsaved provider');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Discard changes' }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: 'Save record', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Kept record title' })).toBeVisible();
  await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
  await page.goto(`/pets/${petId}/records/new`);
  await page.getByRole('combobox', { name: 'Vet or clinic' }).fill(name);
  await expect(page.getByRole('option', { name: new RegExp(name) })).toBeVisible();
  await page.getByRole('combobox', { name: 'Vet or clinic' }).press('ArrowDown');
  await page.getByRole('combobox', { name: 'Vet or clinic' }).press('Enter');
  await page.getByRole('button', { name: 'Add new provider' }).click();
  await dialog
    .getByRole('textbox', { name: 'Provider name' })
    .fill(`  ${name.toUpperCase().replace(' ', '   ')}  `);
  await expect(dialog.getByText('This provider already exists')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Add provider', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Use this provider' }).click();
  await expect(dialog).not.toBeVisible();
});

test('provider management protects historical links and works on mobile', async ({
  page,
  request,
}) => {
  const name = `Care Clinic ${Date.now()}`;
  const providerResponse = await request.post('/api/providers', { data: { name, kind: 'clinic' } });
  const provider = await providerResponse.json();
  providerIds.push(provider.id);
  const recordResponse = await request.post(`/api/pets/${petId}/records`, {
    data: {
      type: 'vet_visit',
      title: 'Provider history',
      occurredOn: todayIn('America/Phoenix'),
      providerId: provider.id,
      details: { reason: 'Annual' },
    },
  });
  const record = await recordResponse.json();
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(`/providers/${provider.id}`);
  await expect(page.getByRole('button', { name: 'Delete provider', exact: true })).toHaveCount(0);
  expect((await request.delete(`/api/providers/${provider.id}`)).status()).toBe(409);
  await page.getByRole('button', { name: 'Edit provider', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Provider name' }).fill(`${name} North`);
  await dialog.getByRole('textbox', { name: 'Phone' }).fill('555-0101');
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 375);
  // Measure the settled dialog, not its translucent opening animation.
  await dialog.evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  await dialog.getByRole('button', { name: 'Save provider' }).click();
  await expect(page.getByRole('heading', { name: `${name} North`, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Archive provider', exact: true }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Archive provider', exact: true })
    .click();
  await expect(page.getByRole('button', { name: 'Restore provider', exact: true })).toBeVisible();
  await page.goto(`/pets/${petId}/records/${record.id}`);
  await expect(page.getByRole('link', { name: `${name} North (archived)` })).toBeVisible();
  await page.getByRole('link', { name: 'Edit record' }).click();
  await page.getByRole('textbox', { name: 'Additional notes' }).fill('History retained');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('History retained', { exact: true })).toBeVisible();
  await page.goto(`/pets/${petId}/records/new`);
  await page.getByRole('combobox', { name: 'Vet or clinic' }).fill(name);
  await expect(page.getByRole('option', { name: new RegExp(name) })).toHaveCount(0);
  await page.goto(`/providers/${provider.id}`);
  await page.getByRole('button', { name: 'Restore provider', exact: true }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Restore provider', exact: true })
    .click();
  await expect(page.getByRole('button', { name: 'Archive provider', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'View linked records' }).click();
  await expect(page.getByRole('link', { name: 'Provider history', exact: true })).toBeVisible();
  await request.delete(`/api/pets/${petId}/records/${record.id}`);
  await page.goto(`/providers/${provider.id}`);
  await page.getByRole('button', { name: 'Delete provider', exact: true }).click();
  await page.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(page).toHaveURL('/providers');
  expect((await request.get(`/api/providers/${provider.id}`)).status()).toBe(404);
});
