import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

async function cookieHeader(
  res: Awaited<ReturnType<typeof test.info>> extends never ? never : import('@playwright/test').APIResponse,
) {
  const h = res.headersArray().find((x) => x.name.toLowerCase() === 'set-cookie');
  return h ? { Cookie: h.value.split(';')[0] } : {};
}

test('B-004 B-006 permission matrix server checks', async ({ request }) => {
  const userSign = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子西區', password: SEED_PASSWORD },
  });
  const userPay = await request.post(`${API}/payroll/calculate`, {
    headers: await cookieHeader(userSign),
    data: { startDate: '2026-11-01', endDate: '2026-11-10' },
  });
  expect(userPay.status()).toBe(403);

  const adminSign = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  const adminAudit = await request.get(`${API}/audit/log`, {
    headers: await cookieHeader(adminSign),
  });
  expect(adminAudit.status()).toBe(403);
});

test('B-006 B-097 admin managing admin denied and logged', async ({ request }) => {
  const admin = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  const block = await request.post(`${API}/owner/admins`, {
    headers: await cookieHeader(admin),
    data: {
      displayName: `管理${Date.now()}`,
      password: SEED_PASSWORD,
    },
  });
  expect(block.status()).toBe(403);

  const owner = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: 'Kuei', password: SEED_PASSWORD },
  });
  const log = await request.get(`${API}/audit/log`, {
    headers: await cookieHeader(owner),
  });
  const types = (
    (await log.json()) as { rows: Array<{ action_type: string }> }
  ).rows.map((r) => r.action_type);
  expect(types).toContain('ACCESS_DENIED');
});
