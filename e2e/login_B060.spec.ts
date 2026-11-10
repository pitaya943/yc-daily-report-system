import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';

test('B-060 type-first then name sign-in', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /西區/ }).click();
  await page.selectOption('select', { label: '種子西區' });
  await page.fill('input[type="password"]', SEED_PASSWORD);
  await page.getByRole('button', { name: '登入' }).click();
  await page.waitForURL('**/report');
  expect(page.url()).toContain('/report');
});
