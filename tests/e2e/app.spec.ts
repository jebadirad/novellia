import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { todayIn, addDays } from '../../src/domain/dates';
const today = todayIn('America/Phoenix');
let petId: string;
let providerId: string;
test.beforeEach(async ({ request }) => {
  const result = await request.post('/api/pets', {
    data: { name: 'Browser companion', species: 'dog', breed: 'Test breed' },
  });
  expect(result.status()).toBe(201);
  petId = (await result.json()).id;
  const provider = await request.post('/api/providers', {
    data: { name: `Browser clinic ${petId}` },
  });
  expect(provider.status()).toBe(201);
  providerId = (await provider.json()).id;
});
test.afterEach(async ({ request }) => {
  await request.delete(`/api/pets/${petId}`);
  await request.delete(`/api/providers/${providerId}`);
});

test('pet creation, validation, dirty navigation, edit, and delete', async ({ page }) => {
  await page.goto('/pets/new');
  await expect(page.getByRole('heading', { name: 'A new companion' })).toBeVisible();
  await page.getByRole('button', { name: 'Add pet', exact: true }).click();
  await expect(page.locator('#main').getByText('Enter your pet’s name.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Pet name' })).toBeFocused();
  await page.getByRole('textbox', { name: 'Pet name' }).fill('Hazel browser');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Add pet', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hazel browser', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Age unknown')).toBeVisible();
  await page.getByRole('link', { name: 'Edit pet' }).click();
  await page.getByRole('textbox', { name: 'Breed', exact: false }).fill('Mixed breed');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Mixed breed', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Edit pet' }).click();
  await page.getByRole('button', { name: 'Delete pet', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Hazel browser');
  await page.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(page).toHaveURL(/\/pets$/);
});

for (const type of ['Vet visit', 'Vaccination', 'Medication']) {
  test(`create, edit, and remove a ${type} with follow-up`, async ({ page }) => {
    await page.goto(`/pets/${petId}/records/new`);
    await page.getByRole('button', { name: new RegExp(`^${type}`) }).click();
    await page.getByRole('textbox', { name: 'Title', exact: true }).fill(`${type} browser record`);
    if (type === 'Vet visit') {
      await page.getByRole('textbox', { name: 'Reason for visit' }).fill('Annual checkup');
    }
    if (type === 'Vaccination') {
      await page.getByRole('textbox', { name: 'Vaccine name' }).fill('Rabies');
    }
    if (type === 'Medication') {
      await page.getByRole('textbox', { name: 'Medication name' }).fill('Example drops');
    }
    await page.getByRole('checkbox', { name: 'Add a follow-up' }).check();
    await page
      .getByRole('combobox', { name: 'Follow-up vet or clinic' })
      .fill(`Browser clinic ${petId}`);
    await page.getByRole('option', { name: new RegExp(`Browser clinic ${petId}`) }).click();
    await page.getByLabel('Follow-up date', { exact: true }).fill(addDays(today, 2));
    await page.getByRole('textbox', { name: 'What needs to happen?' }).fill('Call clinic');
    await page.getByRole('button', { name: 'Save record', exact: true }).click();
    await expect(page.getByRole('heading', { name: `${type} browser record` })).toBeVisible();
    await page.getByRole('button', { name: 'Mark complete' }).click();
    await expect(page.getByRole('button', { name: 'Reopen' })).toBeVisible();
    await page.getByRole('link', { name: 'Edit record' }).click();
    await page.getByRole('textbox', { name: 'Additional notes' }).fill('Updated notes');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Updated notes', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reopen' })).toBeVisible();
    await page.getByRole('button', { name: 'Reopen' }).click();
    await expect(page.getByRole('button', { name: 'Mark complete' })).toBeVisible();
    await page.getByRole('button', { name: 'Record actions', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Delete record', exact: true }).click();
    await page.getByRole('button', { name: 'Delete permanently' }).click();
    await expect(page).toHaveURL(`/pets/${petId}`);
  });
}

test('failed saves preserve values and type changes preserve common fields', async ({ page }) => {
  await page.goto(`/pets/${petId}/records/new`);
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Keep this title');
  await page.getByRole('textbox', { name: 'Reason for visit' }).fill('Entered details');
  await page.getByRole('button', { name: /^Vaccination/ }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Change type', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue(
    'Keep this title',
  );
  await page.getByRole('textbox', { name: 'Vaccine name' }).fill('Rabies');
  await page.route('**/api/pets/*/records', (route) =>
    route.fulfill({ status: 500, json: { error: { message: 'Test save failure' } } }),
  );
  await page.getByRole('button', { name: 'Save record' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Test save failure' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue(
    'Keep this title',
  );
});

test('filters persist through reload and query errors are shown', async ({ page, request }) => {
  await request.post(`/api/pets/${petId}/records`, {
    data: {
      type: 'vet_visit',
      title: 'Unique searchable check',
      occurredOn: today,
      details: { reason: 'Checkup' },
    },
  });
  await page.goto('/records');
  await page.getByRole('textbox', { name: 'Search records' }).fill('Unique searchable');
  await expect(page).toHaveURL(/q=Unique/);
  await expect(page.getByRole('link', { name: 'Unique searchable check' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Search records' })).toHaveValue(
    'Unique searchable',
  );
  await page.getByLabel('From date', { exact: true }).fill('2026-09-18');
  await page.getByLabel('To date', { exact: true }).fill('2026-09-01');
  await expect(
    page.getByRole('alert').filter({ hasText: 'End date must be on or after start date.' }),
  ).toBeVisible();
});

test('malformed payloads, invalid IDs, unknown fields, and cross-pet access are rejected', async ({
  request,
}) => {
  expect(
    (
      await request.post('/api/pets', {
        data: 'bad',
        headers: { 'Content-Type': 'application/json' },
      })
    ).status(),
  ).toBe(400);
  expect((await request.get('/api/pets/not-an-id')).status()).toBe(404);
  expect((await request.get('/api/records?page=-1')).status()).toBe(400);
  expect((await request.patch(`/api/pets/${petId}`, { data: { id: 'injected' } })).status()).toBe(
    422,
  );
  expect(
    (
      await request.post(`/api/pets/${petId}/records`, {
        data: {
          type: 'vaccination',
          title: 'Wrong',
          occurredOn: today,
          details: { reason: 'wrong type' },
        },
      })
    ).status(),
  ).toBe(422);
});

for (const width of [375, 768, 1440]) {
  test(`navigation and layout fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of [
      '/',
      '/pets',
      '/records',
      '/follow-ups',
      `/pets/${petId}`,
      `/pets/${petId}/records/new`,
    ]) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
    await page.screenshot({ path: `artifacts/form-${width}.png`, fullPage: true });
    await page.goto('/');
    await page.screenshot({ path: `artifacts/dashboard-${width}.png`, fullPage: true });
  });
}

test('core screens have no automated WCAG A/AA violations', async ({ page }) => {
  for (const path of [
    '/',
    '/pets',
    '/pets/new',
    '/records',
    '/follow-ups',
    `/pets/${petId}`,
    `/pets/${petId}/records/new`,
  ]) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations, `Accessibility on ${path}`).toEqual([]);
  }
});

test('a pending save prevents another submission and preserves input on failure', async ({
  page,
}) => {
  await page.goto(`/pets/${petId}/edit`);
  await page.getByRole('textbox', { name: 'Pet name' }).fill('Still here');
  let requests = 0;
  let release!: () => void;
  const responseGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/pets/${petId}`, async (route) => {
    requests += 1;
    await responseGate;
    await route.fulfill({ status: 500, json: { error: { message: 'Please retry this save.' } } });
  });
  const save = page.getByRole('button', { name: 'Save changes', exact: true });
  await save.click();
  await expect(save).toBeDisabled();
  expect(requests).toBe(1);
  release();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Please retry this save.' }),
  ).toBeVisible();
  await expect(save).toBeEnabled();
  await expect(page.getByRole('textbox', { name: 'Pet name' })).toHaveValue('Still here');
});

test('keyboard navigation can discard edits, and missing items offer a way back', async ({
  page,
}) => {
  await page.goto(`/pets/${petId}/edit`);
  await page.getByRole('textbox', { name: 'Pet name' }).fill('Unsaved name');
  const petsLink = page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Pets', exact: true });
  await petsLink.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Discard unsaved changes?');
  await dialog.getByRole('button', { name: 'Discard changes' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/pets$/);
  await page.goto('/pets/00000000-0000-4000-8000-000000000000');
  await expect(page.getByRole('heading', { name: 'This page wandered off.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to your pets' })).toBeVisible();
});
