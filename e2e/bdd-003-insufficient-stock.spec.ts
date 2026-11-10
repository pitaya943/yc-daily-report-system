import { test, expect } from '@playwright/test';
import pg from 'pg';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
const materialId = 'c0000001-0001-4000-8000-000000000001';

test.beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query(
    `UPDATE materials SET remaining_qty = 4, cumulative_usage = 96, received_qty = 100 WHERE id = $1`,
    [materialId],
  );
  await client.end();
});

test('BDD-003 approve refused when stock insufficient', async ({ request }) => {
  const userLogin = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子西區', password: SEED_PASSWORD },
  });
  const userCookie = userLogin
    .headersArray()
    .find((h) => h.name.toLowerCase() === 'set-cookie')
    ?.value?.split(';')[0]!;

  const reqRes = await request.post(`${API}/materials/requests`, {
    headers: { Cookie: userCookie },
    data: { materialId, quantity: 10 },
  });
  const { id: requestId } = (await reqRes.json()) as { id: string };

  const adminLogin = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  const adminCookie = adminLogin
    .headersArray()
    .find((h) => h.name.toLowerCase() === 'set-cookie')
    ?.value?.split(';')[0]!;

  const fail = await request.post(
    `${API}/materials/requests/${requestId}/approve`,
    { headers: { Cookie: adminCookie } },
  );
  expect(fail.status()).toBe(400);
  expect(await fail.text()).toContain('庫存不足，無法核准');
});
