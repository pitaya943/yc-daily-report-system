import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
const materialId = 'c0000001-0001-4000-8000-000000000001';

test('BDD-002 duplicate approve does not double deduct', async ({ request }) => {
  const userLogin = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子西區', password: SEED_PASSWORD },
  });
  const userCookie = userLogin
    .headersArray()
    .find((h) => h.name.toLowerCase() === 'set-cookie')
    ?.value?.split(';')[0]!;

  const reqRes = await request.post(`${API}/materials/requests`, {
    headers: { Cookie: userCookie },
    data: { materialId, quantity: 2 },
  });
  const { id: requestId } = (await reqRes.json()) as { id: string };

  const admin1 = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  const admin2 = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: 'Kuei', password: SEED_PASSWORD },
  });
  const c1 = admin1.headersArray().find((h) => h.name === 'set-cookie')?.value.split(';')[0]!;
  const c2 = admin2.headersArray().find((h) => h.name === 'set-cookie')?.value.split(';')[0]!;

  const [r1, r2] = await Promise.all([
    request.post(`${API}/materials/requests/${requestId}/approve`, {
      headers: { Cookie: c1 },
    }),
    request.post(`${API}/materials/requests/${requestId}/approve`, {
      headers: { Cookie: c2 },
    }),
  ]);
  const statuses = [r1.status(), r2.status()];
  expect(statuses.filter((s) => s === 200 || s === 201).length).toBe(1);
  expect(statuses.filter((s) => s === 400).length).toBe(1);
});
