import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

async function loginAs(page: import('@playwright/test').Page, type: RegExp, name: string) {
  await page.goto('/login');
  await page.getByRole('button', { name: type }).click();
  await page.selectOption('select', { label: name });
  await page.fill('input[type="password"]', SEED_PASSWORD);
  await page.getByRole('button', { name: '登入' }).click();
}

test('B-063 history filter pagination and export', async ({ page, request }) => {
  await loginAs(page, /西區/, '種子西區');
  await page.waitForURL('**/report');
  await page.goto('/history');
  await expect(page.getByText('B-063')).toBeVisible();
  await page.selectOption('select', { label: '未確認' });
  await expect(page.getByText('每頁 20')).toBeVisible();
  await page.getByRole('button', { name: '匯出 Excel' }).click();
  await expect(page.getByRole('status')).toContainText('匯出');
});

test('B-069 confirmation zone filter and batch UI', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /管理員/ }).click();
  await page.selectOption('select', '種子管理員');
  await page.fill('input[type="password"]', SEED_PASSWORD);
  await page.getByRole('button', { name: '登入' }).click();
  await page.goto('/confirmation');
  await expect(page.getByText('B-069')).toBeVisible();
  await page.selectOption('select', { label: '西區' });
  await expect(page.getByRole('button', { name: '批次核准勾選' })).toBeVisible();
});

test('B-071 big-meter confirmation batch', async ({ page }) => {
  await loginAs(page, /管理員/, '種子管理員');
  await page.waitForURL('**/confirmation');
  await page.goto('/confirmation-big-meter');
  await expect(page.getByText('B-071')).toBeVisible();
  await expect(page.getByRole('button', { name: '批次核准' })).toBeVisible();
});
