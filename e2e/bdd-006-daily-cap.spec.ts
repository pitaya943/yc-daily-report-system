import { test, expect } from '@playwright/test';
import { clearWestUserReportsToday } from './helpers-fixtures';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

test('BDD-006 delete pending frees daily cap', async ({ request }) => {
  await clearWestUserReportsToday();
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });

  const login = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子西區', password: SEED_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const cookie = login
    .headersArray()
    .find((h) => h.name.toLowerCase() === 'set-cookie')
    ?.value?.split(';')[0];
  expect(cookie).toBeTruthy();

  const hdrs = { Cookie: cookie! };
  const ids: string[] = [];
  for (let i = 0; i < 3; i++) {
    const res = await request.post(`${API}/reports`, {
      headers: hdrs,
      data: {
        reportDate: today,
        quantities: [{ itemCode: 'direct_13', qty: 0.1 * (i + 1) }],
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { id: string };
    ids.push(body.id);
  }
  const blocked = await request.post(`${API}/reports`, {
    headers: hdrs,
    data: {
      reportDate: today,
      quantities: [{ itemCode: 'direct_13', qty: 0.1 }],
    },
  });
  expect(blocked.status()).toBe(400);

  await request.delete(`${API}/reports/${ids[0]}`, { headers: hdrs });
  const again = await request.post(`${API}/reports`, {
    headers: hdrs,
    data: {
      reportDate: today,
      quantities: [{ itemCode: 'direct_13', qty: 0.4 }],
    },
  });
  expect(again.ok()).toBeTruthy();
});

test('B-005 USER lands on 日報 after login', async ({ page }) => {
  await page.goto('/login');
  await page.route('**/auth/sign-in-names?type=admin', async (route) => {
    const res = await route.fetch();
    const json = (await res.json()) as { names: string[] };
    await route.fulfill({
      response: res,
      json: {
        names: [...json.names, '種子西區'],
      },
    });
  });
  await page.reload();
  await page.selectOption('select', { label: '種子西區' });
  await page.fill('input[type="password"]', SEED_PASSWORD);
  await page.getByRole('button', { name: '登入' }).click();
  await page.waitForURL('**/report');
  await expect(page.getByRole('heading', { name: '填寫日報' })).toBeVisible();
});
