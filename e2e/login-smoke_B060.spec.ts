import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';

test('B-060 login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: '登入' })).toBeVisible();
  await expect(page.locator('select')).toBeVisible();
});

test('seeded owner can sign in', async ({ page }) => {
  await page.goto('/login');
  await page.selectOption('select', { label: 'Kuei' });
  await page.fill('input[type="password"]', SEED_PASSWORD);
  await page.getByRole('button', { name: '登入' }).click();
  await expect(page.getByRole('status')).toContainText('登入成功');
});
