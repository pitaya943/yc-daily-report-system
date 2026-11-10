import { test, expect } from '@playwright/test';
import { materialId, resetMaterialInventory, withPg } from './helpers-fixtures';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

test.beforeAll(async () => {
  await resetMaterialInventory(100, 100);
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
    data: { materialId, quantity: 5 },
  });
  expect(reqRes.ok()).toBeTruthy();
  const { id: requestId } = (await reqRes.json()) as { id: string };

  await withPg(async (client) => {
    await client.query(
      `UPDATE public.materials SET remaining_qty = 4, cumulative_usage = 96, received_qty = 100 WHERE id = $1`,
      [materialId],
    );
  });

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
