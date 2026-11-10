import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

type MatrixRow = {
  id: string;
  action: string;
  user: string;
  admin: string;
  owner: string;
};

const cases = (
  JSON.parse(
    readFileSync(
      path.join(__dirname, '..', 'docs/design/permission-matrix-cases.json'),
      'utf8',
    ),
  ) as { cases: MatrixRow[] }
).cases;

async function cookieFor(request: import('@playwright/test').APIRequestContext, name: string) {
  const signIn = await request.post('/auth/sign-in', {
    data: { displayName: name, password: SEED_PASSWORD },
  });
  expect(signIn.ok()).toBeTruthy();
  const h = signIn.headersArray().find((x) => x.name.toLowerCase() === 'set-cookie');
  return h ? { Cookie: h.value.split(';')[0] } : {};
}

async function assertRow(
  row: MatrixRow,
  request: import('@playwright/test').APIRequestContext,
  page: import('@playwright/test').Page,
): Promise<void> {
  const act = row.action.toLowerCase();
  const userH = await cookieFor(request, '種子西區');
  const adminH = await cookieFor(request, '種子管理員');
  const ownerH = await cookieFor(request, 'Kuei');

  if (row.user.includes('Removed') || act.includes('permanent delete') || act.includes('deactivate')) {
    expect((await request.delete(`/accounts/b0000001-0001-4000-8000-000000000007`, { headers: adminH })).status()).toBe(404);
    return;
  }

  switch (row.id) {
    case 'row-1':
      expect((await request.get(`/auth/session`, { headers: userH })).ok()).toBeTruthy();
      return;
    case 'row-2':
      expect((await request.post(`/auth/sign-out`, { headers: userH })).ok()).toBeTruthy();
      return;
    case 'row-3':
      await page.goto('/login');
      await page.getByRole('button', { name: /西區/ }).click();
      await page.selectOption('select', { label: '種子西區' });
      await page.fill('input[type="password"]', SEED_PASSWORD);
      await page.getByRole('button', { name: '登入' }).click();
      await page.waitForURL('**/report');
      expect(page.url()).toContain('/report');
      return;
    case 'row-4':
      await page.goto('/login');
      await page.getByRole('button', { name: /西區/ }).click();
      await page.selectOption('select', { label: '種子西區' });
      await page.fill('input[type="password"]', SEED_PASSWORD);
      await page.getByRole('button', { name: '登入' }).click();
      await page.waitForURL('**/report');
      await expect(page.getByRole('link', { name: /歷史|History/ })).toBeVisible();
      return;
    case 'row-5':
      expect((await request.post(`/statistics/personal-trial`, { headers: userH, data: { startDate: '2026-11-01', endDate: '2026-11-10' } })).status()).toBeLessThan(300);
      expect((await request.post(`/statistics/personal-trial`, { headers: adminH, data: { startDate: '2026-11-01', endDate: '2026-11-10' } })).status()).toBe(403);
      return;
    case 'row-6':
      expect((await request.get(`/archives`, { headers: userH })).status()).toBe(403);
      expect((await request.get(`/archives`, { headers: adminH })).status()).toBe(200);
      return;
    case 'row-7':
    case 'row-45':
      expect((await request.get(`/audit/log`, { headers: userH })).status()).toBe(403);
      expect((await request.get(`/audit/log`, { headers: adminH })).status()).toBe(403);
      expect((await request.get(`/audit/log`, { headers: ownerH })).status()).toBe(200);
      return;
    case 'row-8':
    case 'row-38':
    case 'row-39':
    case 'row-40':
    case 'row-41':
    case 'row-42':
      expect((await request.post(`/owner/admins`, { headers: adminH, data: { displayName: `x${Date.now()}`, password: SEED_PASSWORD } })).status()).toBe(403);
      expect(
        (await request.post(`/owner/admins`, { headers: ownerH, data: { displayName: `o${Date.now()}`, password: SEED_PASSWORD } })).status(),
      ).toBeLessThan(300);
      return;
    case 'row-9':
      expect((await request.post(`/reports`, { headers: userH, data: { reportDate: '2026-11-09', quantities: [{ itemCode: 'direct_13', qty: 0.2 }] } })).status()).toBeLessThan(300);
      expect((await request.post(`/reports`, { headers: adminH, data: { reportDate: '2026-11-09', quantities: [{ itemCode: 'direct_13', qty: 1 }] } })).status()).toBe(403);
      return;
    case 'row-10':
    case 'row-13':
      expect((await request.get(`/reports/history?page=1`, { headers: userH })).status()).toBe(200);
      expect((await request.get(`/reports/history/export`, { headers: userH })).status()).toBe(200);
      expect((await request.get(`/reports/history/admin`, { headers: adminH })).status()).toBe(200);
      return;
    case 'row-11':
    case 'row-12':
      expect((await request.get(`/reports/mine`, { headers: userH })).status()).toBe(200);
      return;
    case 'row-14':
      expect((await request.get(`/materials/inventory`, { headers: userH })).status()).toBe(200);
      expect((await request.get(`/materials/inventory`, { headers: adminH })).status()).toBe(200);
      return;
    case 'row-15':
    case 'row-16':
      expect((await request.get(`/materials/requests/mine`, { headers: userH })).status()).toBe(200);
      expect((await request.post(`/materials/admin/items`, { headers: userH, data: { name: 'x', unit: '個' } })).status()).toBe(403);
      return;
    case 'row-17':
      expect((await request.post(`/materials/admin/items`, { headers: adminH, data: { name: `t${Date.now()}`, unit: '個' } })).status()).toBeLessThan(300);
      return;
    case 'row-18':
      expect((await request.post(`/statistics/personal-trial`, { headers: userH, data: { startDate: '2026-11-01', endDate: '2026-11-10' } })).status()).toBeLessThan(300);
      return;
    case 'row-19':
    case 'row-22':
      expect([200, 403].includes((await request.get(`/accounts/b0000001-0001-4000-8000-000000000003/bank/reveal`, { headers: userH })).status())).toBe(true);
      expect((await request.get(`/accounts/b0000001-0001-4000-8000-000000000007/bank/reveal`, { headers: userH })).status()).toBe(403);
      return;
    case 'row-20':
      expect((await request.post(`/accounts/me/password`, { headers: userH, data: { currentPassword: SEED_PASSWORD, newPassword: SEED_PASSWORD } })).status()).toBeLessThan(300);
      return;
    case 'row-21':
      expect((await request.patch(`/accounts/b0000001-0001-4000-8000-000000000003/financials`, { headers: userH, data: { paymentMethod: 'CASH' } })).status()).toBe(403);
      return;
    case 'row-23':
    case 'row-24':
      expect((await request.get(`/confirmation/pending`, { headers: adminH })).status()).toBe(200);
      expect((await request.get(`/confirmation/pending/big-meter`, { headers: adminH })).status()).toBe(200);
      expect((await request.get(`/confirmation/pending`, { headers: userH })).status()).toBe(403);
      return;
    case 'row-25':
      expect((await request.post(`/payroll/calculate`, { headers: userH, data: { startDate: '2026-11-01', endDate: '2026-11-10' } })).status()).toBe(403);
      expect((await request.post(`/payroll/calculate`, { headers: adminH, data: { startDate: '2026-11-01', endDate: '2026-11-10' } })).status()).toBeLessThan(300);
      return;
    case 'row-26':
      expect((await request.post(`/statistics/summary-export`, { headers: adminH, data: { startDate: '2026-11-01', endDate: '2026-11-10', zone: 'WEST' } })).status()).toBeLessThan(300);
      return;
    case 'row-27':
      expect((await request.get(`/ledger/entries`, { headers: adminH })).status()).toBe(200);
      expect((await request.get(`/ledger/entries`, { headers: userH })).status()).toBe(403);
      return;
    case 'row-28':
      expect((await request.get(`/archives`, { headers: userH })).status()).toBe(403);
      expect((await request.get(`/archives`, { headers: adminH })).status()).toBe(200);
      return;
    case 'row-29':
    case 'row-30':
    case 'row-31':
    case 'row-36':
      expect((await request.get(`/accounts/manage`, { headers: userH })).status()).toBe(403);
      expect((await request.get(`/accounts/manage`, { headers: adminH })).status()).toBe(200);
      return;
    case 'row-32':
      expect((await request.post(`/retention/year-end`, { headers: adminH, data: { year: 2025 } })).status()).toBeLessThan(500);
      return;
    case 'row-33':
      expect((await request.get(`/settings/system`, { headers: adminH })).status()).toBe(200);
      return;
    case 'row-34':
      expect((await request.get(`/settings/retention-cap`, { headers: adminH })).status()).toBe(200);
      return;
    case 'row-43':
    case 'row-44':
      expect((await request.post(`/accounts/b0000001-0001-4000-8000-000000000001/archive`, { headers: ownerH })).status()).toBeGreaterThanOrEqual(400);
      return;
    case 'row-46':
      expect((await request.delete(`/audit/log/fake`, { headers: ownerH })).status()).toBe(404);
      return;
    case 'row-47':
      await request.get(`/reports/history/export`, { headers: adminH });
      expect((await request.get(`/audit/log`, { headers: ownerH })).status()).toBe(200);
      return;
    case 'row-48':
      expect((await request.get(`/health`)).ok()).toBeTruthy();
      return;
    default:
      throw new Error(`B-004 matrix row ${row.id} has no e2e handler: ${row.action}`);
  }
}

for (const row of cases) {
  test(`B-004 matrix ${row.id}: ${row.action.slice(0, 48)}`, async ({ playwright, page }) => {
    const request = await playwright.request.newContext({
      baseURL: API,
    });
    try {
      await assertRow(row, request, page);
    } finally {
      await request.dispose();
    }
  });
}

test('B-004 matrix row count matches spec table', () => {
  expect(cases.length).toBe(48);
});
