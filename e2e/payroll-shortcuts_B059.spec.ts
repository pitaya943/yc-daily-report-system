import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

test('B-059 payday shortcut fills dates', async ({ page, request }) => {
  const admin = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  const cookie = admin
    .headersArray()
    .find((h) => h.name.toLowerCase() === 'set-cookie')!
    .value.split(';')[0];
  await page.context().addCookies([
    {
      name: cookie.split('=')[0],
      value: cookie.split('=')[1],
      url: API,
    },
  ]);
  await page.goto('/payroll');
  await page.getByRole('button', { name: 'B-059 10號發薪' }).click();
  await expect(page.locator('input[type="date"]').first()).not.toHaveValue('');
  await expect(page.getByRole('checkbox')).toBeChecked();
});
