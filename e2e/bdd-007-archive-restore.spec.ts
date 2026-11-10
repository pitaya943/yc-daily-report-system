import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

test('BDD-007 archive and restore user', async ({ request }) => {
  const admin = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  const cookie = admin.headersArray().find((h) => h.name === 'set-cookie')?.value.split(';')[0]!;
  const target = 'b0000001-0001-4000-8000-000000000007';
  await request.post(`${API}/accounts/${target}/archive`, {
    headers: { Cookie: cookie },
  });
  const restored = await request.post(`${API}/accounts/${target}/restore`, {
    headers: { Cookie: cookie },
  });
  expect(restored.ok()).toBeTruthy();
});
