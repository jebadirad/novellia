import { test, expect } from '@playwright/test';

test('phone formats while typing and supports editing, deletion, and pasted extensions', async ({
  page,
}) => {
  await page.goto('/providers');
  await page.getByRole('button', { name: 'Add provider', exact: true }).click();
  const phone = page.getByRole('dialog').getByRole('textbox', { name: 'Phone' });
  await phone.pressSequentially('480');
  await expect(phone).toHaveValue('(480');
  await phone.pressSequentially('555');
  await expect(phone).toHaveValue('(480) 555');
  await phone.pressSequentially('0100');
  await expect(phone).toHaveValue('(480) 555-0100');
  await phone.evaluate((input: HTMLInputElement) => input.setSelectionRange(6, 6));
  await phone.press('Backspace');
  await expect(phone).toHaveValue('(485) 550-100');
  await phone.pressSequentially('0');
  await expect(phone).toHaveValue('(480) 555-0100');
  await phone.evaluate((input: HTMLInputElement) => input.setSelectionRange(9, 9));
  await phone.press('Delete');
  await expect(phone).toHaveValue('(480) 555-100');
  await phone.pressSequentially('0');
  await expect(phone).toHaveValue('(480) 555-0100');
  await phone.fill('+1 480-555-0100 x23');
  await expect(phone).toHaveValue('+1 (480) 555-0100 x23');
  await phone.press('Tab');
  await expect(phone).toHaveValue('(480) 555-0100 ext. 23');
  await phone.fill('');
  await phone.pressSequentially('4805550100 x23');
  await expect(phone).toHaveValue('(480) 555-0100 x23');
  await phone.press('ControlOrMeta+A');
  await phone.press('Backspace');
  await expect(phone).toHaveValue('');
});
