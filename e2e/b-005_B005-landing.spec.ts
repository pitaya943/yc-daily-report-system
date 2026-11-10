import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';

test('B-005 USER lands on report after login', async ({ page }) => {
  await page.goto('/login');
  await page.selectOption('select', '種子西區');
  await page.fill('input[type="password"]', SEED_PASSWORD);
  await page.getByRole('button', { name: '登入' }).click();
  await page.waitForURL('**/report');
  await expect(page).toHaveURL(/\/report/);
});

test('B-005 ADMIN lands on confirmation', async ({ page }) => {
  await page.goto('/login');
  await page.selectOption('select', '種子管理員');
  await page.fill('input[type="password"]', SEED_PASSWORD);
  await page.getByRole('button', { name: '登入' }).click();
  await page.waitForURL('**/confirmation');
});
