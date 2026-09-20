import { test, expect } from '@playwright/test';

test('Back and Forward discard an uncommitted search without rewriting history', async ({
  page,
}) => {
  await page.goto('/records?q=original');
  const search = page.getByRole('textbox', { name: 'Search records' });
  await page.getByRole('combobox', { name: 'Sort records' }).click();
  await page.getByRole('option', { name: 'Oldest first' }).click();
  await expect(page).toHaveURL(/q=original&sort=oldest/);
  await page.clock.install({ time: new Date('2026-09-20T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-20T12:01:00Z'));
  await search.fill('abandoned back search');
  await page.goBack();
  await expect(search).toHaveValue('original');
  await page.clock.runFor(1000);
  await expect(page).toHaveURL(/\/records\?q=original$/);
  await search.fill('abandoned forward search');
  await page.goForward();
  await expect(search).toHaveValue('original');
  await page.clock.runFor(1000);
  await expect(page).toHaveURL(/q=original&sort=oldest/);
});

test('select changes include pending search text and clear cancels it', async ({ page }) => {
  await page.goto('/records?q=original&page=2');
  const search = page.getByRole('textbox', { name: 'Search records' });
  await expect(search).toHaveValue('original');
  await page.clock.install({ time: new Date('2026-09-20T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-20T12:01:00Z'));
  await search.fill('updated');
  await page.getByRole('combobox', { name: 'Sort records' }).click();
  await page.getByRole('option', { name: 'Oldest first' }).click();
  await expect(page).toHaveURL(/\/records\?q=updated&sort=oldest$/);
  await page.clock.runFor(1000);
  await expect(search).toHaveValue('updated');
  await search.fill('discard this');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.clock.runFor(1000);
  await expect(page).toHaveURL(/\/records$/);
  await expect(search).toHaveValue('');
});

test('an earlier search response does not erase newer typing', async ({ page }) => {
  await page.goto('/records?q=original');
  const search = page.getByRole('textbox', { name: 'Search records' });
  await expect(search).toHaveValue('original');
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested!: () => void;
  const started = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route('**/records?*', async (route) => {
    if (new URL(route.request().url()).searchParams.get('q') === 'first') {
      requested();
      await gate;
    }
    await route.continue();
  });
  await page.clock.install({ time: new Date('2026-09-20T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-20T12:01:00Z'));
  await search.fill('first');
  await page.clock.runFor(301);
  await started;
  await search.fill('second');
  release();
  await expect(page).toHaveURL(/q=first/);
  await expect(page.locator('[aria-busy]').first()).toHaveAttribute('aria-busy', 'false');
  await expect(search).toHaveValue('second');
  await page.clock.runFor(301);
  await expect(page).toHaveURL(/q=second/);
  await expect(search).toHaveValue('second');
});
