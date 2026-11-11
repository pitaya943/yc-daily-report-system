import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

test('BDD-009 owner creates admin; admin blocked', async ({ request }) => {
  const owner = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: 'Kuei', password: SEED_PASSWORD },
  });
  const oc = owner.headersArray().find((h) => h.name === 'set-cookie')?.value.split(';')[0]!;
  const created = await request.post(`${API}/owner/admins`, {
    headers: { Cookie: oc },
    data: { displayName: `E2E管理員${Date.now()}`, password: SEED_PASSWORD },
  });
  expect(created.ok()).toBeTruthy();
  const admin = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  const ac = admin.headersArray().find((h) => h.name === 'set-cookie')?.value.split(';')[0]!;
  const blocked = await request.post(`${API}/owner/admins`, {
    headers: { Cookie: ac },
    data: { displayName: 'blocked', password: SEED_PASSWORD },
  });
  expect(blocked.status()).toBe(403);
});
