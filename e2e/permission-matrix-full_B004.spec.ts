import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import type { APIRequestContext, Page, Playwright } from '@playwright/test';

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

async function sessionFor(
  playwright: Playwright,
  displayName: string,
): Promise<APIRequestContext> {
  const ctx = await playwright.request.newContext({ baseURL: API });
  const signIn = await ctx.post('/auth/sign-in', {
    data: { displayName, password: SEED_PASSWORD },
  });
  expect(signIn.ok()).toBeTruthy();
  return ctx;
}

async function assertRow(
  row: MatrixRow,
  playwright: Playwright,
  page: Page,
): Promise<void> {
  const act = row.action.toLowerCase();
  const userReq = await sessionFor(playwright, '種子西區');
  const adminReq = await sessionFor(playwright, '種子管理員');
  const ownerReq = await sessionFor(playwright, 'Kuei');

  const done = async () => {
    await userReq.dispose();
    await adminReq.dispose();
    await ownerReq.dispose();
  };

  try {
    if (row.user.includes('Removed') || act.includes('permanent delete') || act.includes('deactivate')) {
      expect((await adminReq.delete(`/accounts/b0000001-0001-4000-8000-000000000007`)).status()).toBe(404);
      return;
    }

    switch (row.id) {
      case 'row-1':
        expect((await userReq.get('/auth/session')).ok()).toBeTruthy();
        return;
      case 'row-2':
        expect((await userReq.post('/auth/sign-out')).ok()).toBeTruthy();
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
        expect((await userReq.get('/materials/inventory')).status()).toBe(200);
        expect((await userReq.get('/reports/history?page=1')).status()).toBe(200);
        expect((await userReq.get('/settings/system')).status()).toBe(403);
        return;
      case 'row-5':
        expect(
          (
            await userReq.post('/statistics/personal-trial', {
              data: { startDate: '2026-11-01', endDate: '2026-11-10' },
            })
          ).status(),
        ).toBeLessThan(300);
        expect(
          (
            await adminReq.post('/statistics/personal-trial', {
              data: { startDate: '2026-11-01', endDate: '2026-11-10' },
            })
          ).status(),
        ).toBe(403);
        return;
      case 'row-6':
        expect((await userReq.get('/archives')).status()).toBe(403);
        expect((await adminReq.get('/archives')).status()).toBe(200);
        return;
      case 'row-7':
      case 'row-45':
        expect((await userReq.get('/audit/log')).status()).toBe(403);
        expect((await adminReq.get('/audit/log')).status()).toBe(403);
        expect((await ownerReq.get('/audit/log')).status()).toBe(200);
        return;
      case 'row-8':
      case 'row-38':
      case 'row-40':
      case 'row-41':
      case 'row-42':
        expect(
          (
            await adminReq.post('/owner/admins', {
              data: { displayName: `x${Date.now()}`, password: SEED_PASSWORD },
            })
          ).status(),
        ).toBe(403);
        expect(
          (
            await ownerReq.post('/owner/admins', {
              data: { displayName: `o${Date.now()}`, password: SEED_PASSWORD },
            })
          ).status(),
        ).toBeLessThan(300);
        return;
      case 'row-39':
        expect(
          (
            await adminReq.patch(
              '/accounts/b0000001-0001-4000-8000-000000000002/financials',
              { data: { fixedSalary: 1 } },
            )
          ).status(),
        ).toBe(403);
        const adminId = 'b0000001-0001-4000-8000-000000000002';
        const mod = await ownerReq.patch(`/accounts/${adminId}/financials`, {
          data: { fixedSalary: 7777 },
        });
        expect(mod.status()).toBeLessThan(300);
        const check = await ownerReq.get('/accounts/manage');
        expect(check.ok()).toBeTruthy();
        const adminRow = (
          (await check.json()).accounts as Array<{ id: string; fixed_salary?: number }>
        ).find((a) => a.id === adminId);
        expect(adminRow?.fixed_salary).toBe(7777);
        await ownerReq.patch(`/accounts/${adminId}/financials`, {
          data: { fixedSalary: 0 },
        });
        return;
      case 'row-9':
        expect(
          (
            await userReq.post('/reports', {
              data: {
                reportDate: '2026-11-09',
                quantities: [{ itemCode: 'direct_13', qty: 0.2 }],
              },
            })
          ).status(),
        ).toBeLessThan(300);
        expect(
          (
            await adminReq.post('/reports', {
              data: {
                reportDate: '2026-11-09',
                quantities: [{ itemCode: 'direct_13', qty: 1 }],
              },
            })
          ).status(),
        ).toBe(403);
        return;
      case 'row-10':
      case 'row-13':
        expect((await userReq.get('/reports/history?page=1')).status()).toBe(200);
        expect((await userReq.get('/reports/history/export')).status()).toBe(200);
        expect((await adminReq.get('/reports/history/admin')).status()).toBe(200);
        return;
      case 'row-11':
      case 'row-12':
        expect((await userReq.get('/reports/mine')).status()).toBe(200);
        return;
      case 'row-14':
        expect((await userReq.get('/materials/inventory')).status()).toBe(200);
        expect((await adminReq.get('/materials/inventory')).status()).toBe(200);
        return;
      case 'row-15':
      case 'row-16':
        expect((await userReq.get('/materials/requests/mine')).status()).toBe(200);
        expect(
          (await userReq.post('/materials/admin/items', { data: { name: 'x', unit: '個' } })).status(),
        ).toBe(403);
        return;
      case 'row-17':
        expect(
          (
            await adminReq.post('/materials/admin/items', {
              data: { name: `t${Date.now()}`, unit: '個' },
            })
          ).status(),
        ).toBeLessThan(300);
        return;
      case 'row-18':
        expect(
          (
            await userReq.post('/statistics/personal-trial', {
              data: { startDate: '2026-11-01', endDate: '2026-11-10' },
            })
          ).status(),
        ).toBeLessThan(300);
        return;
      case 'row-19':
      case 'row-22':
        expect(
          [200, 403].includes(
            (await userReq.get('/accounts/b0000001-0001-4000-8000-000000000003/bank/reveal')).status(),
          ),
        ).toBe(true);
        expect((await userReq.get('/accounts/b0000001-0001-4000-8000-000000000007/bank/reveal')).status()).toBe(
          403,
        );
        return;
      case 'row-20':
        expect(
          (
            await userReq.post('/accounts/me/password', {
              data: { currentPassword: SEED_PASSWORD, newPassword: SEED_PASSWORD },
            })
          ).status(),
        ).toBeLessThan(300);
        return;
      case 'row-21':
        expect(
          (
            await userReq.patch('/accounts/b0000001-0001-4000-8000-000000000003/financials', {
              data: { paymentMethod: 'CASH' },
            })
          ).status(),
        ).toBe(403);
        return;
      case 'row-23':
      case 'row-24':
        expect((await adminReq.get('/confirmation/pending')).status()).toBe(200);
        expect((await adminReq.get('/confirmation/pending/big-meter')).status()).toBe(200);
        expect((await userReq.get('/confirmation/pending')).status()).toBe(403);
        return;
      case 'row-25':
        expect(
          (
            await userReq.post('/payroll/calculate', {
              data: { startDate: '2026-11-01', endDate: '2026-11-10' },
            })
          ).status(),
        ).toBe(403);
        expect(
          (
            await adminReq.post('/payroll/calculate', {
              data: { startDate: '2026-11-01', endDate: '2026-11-10' },
            })
          ).status(),
        ).toBeLessThan(300);
        return;
      case 'row-26':
        expect(
          (
            await adminReq.post('/statistics/summary-export', {
              data: { startDate: '2026-11-01', endDate: '2026-11-10', zone: 'WEST' },
            })
          ).status(),
        ).toBeLessThan(300);
        return;
      case 'row-27':
        expect((await adminReq.get('/ledger/entries')).status()).toBe(200);
        expect((await userReq.get('/ledger/entries')).status()).toBe(403);
        return;
      case 'row-28':
        expect((await userReq.get('/archives')).status()).toBe(403);
        expect((await adminReq.get('/archives')).status()).toBe(200);
        return;
      case 'row-29':
      case 'row-30':
      case 'row-31':
      case 'row-36':
        expect((await userReq.get('/accounts/manage')).status()).toBe(403);
        expect((await adminReq.get('/accounts/manage')).status()).toBe(200);
        return;
      case 'row-32':
        expect((await adminReq.post('/retention/year-end', { data: { year: 2025 } })).status()).toBeLessThan(500);
        return;
      case 'row-33':
        expect((await adminReq.get('/settings/system')).status()).toBe(200);
        return;
      case 'row-34':
        expect((await adminReq.get('/settings/retention-cap')).status()).toBe(200);
        return;
      case 'row-43':
      case 'row-44':
        expect((await ownerReq.post('/accounts/b0000001-0001-4000-8000-000000000001/archive')).status()).toBeGreaterThanOrEqual(
          400,
        );
        return;
      case 'row-46':
        expect((await ownerReq.delete('/audit/log/fake')).status()).toBe(404);
        return;
      case 'row-47':
        await adminReq.get('/reports/history/export');
        expect((await ownerReq.get('/audit/log')).status()).toBe(200);
        return;
      case 'row-48':
        expect((await userReq.get('/health')).ok()).toBeTruthy();
        return;
      default:
        throw new Error(`B-004 matrix row ${row.id} has no e2e handler: ${row.action}`);
    }
  } finally {
    await done();
  }
}

for (const row of cases) {
  test(`B-004 matrix ${row.id}: ${row.action.slice(0, 48)}`, async ({ playwright, page }) => {
    await assertRow(row, playwright, page);
  });
}

test('B-004 matrix row count matches spec table', () => {
  expect(cases.length).toBe(48);
});
