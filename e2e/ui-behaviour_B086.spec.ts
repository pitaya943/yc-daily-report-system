import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

test('B-086 payroll page avoids full-page export overlay marker', async ({
  page,
  request,
}) => {
  const admin = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  const raw = admin
    .headersArray()
    .find((h) => h.name.toLowerCase() === 'set-cookie')!
    .value.split(';')[0];
  const [name, value] = raw.split('=');
  await page.context().addCookies([{ name, value, domain: '127.0.0.1', path: '/' }]);
  await page.goto('/payroll');
  await expect(page.locator('[data-b086="no-fullpage-overlay"]')).toBeVisible();
});
