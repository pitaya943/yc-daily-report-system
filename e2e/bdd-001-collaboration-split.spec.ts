import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

test('BDD-001 collaboration split persisted at confirm', async ({ request }) => {
  const west = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子西區', password: SEED_PASSWORD },
  });
  const cookie = west
    .headersArray()
    .find((h) => h.name.toLowerCase() === 'set-cookie')
    ?.value?.split(';')[0]!;
  const res = await request.post(`${API}/reports`, {
    headers: { Cookie: cookie },
    data: {
      reportDate: '2026-11-03',
      quantities: [{ itemCode: 'direct_13', qty: 7 }],
      collaboratorIds: ['b0000001-0001-4000-8000-000000000006'],
    },
  });
  expect(res.ok()).toBeTruthy();
  const { id } = (await res.json()) as { id: string };
  const admin = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  const ac = admin.headersArray().find((h) => h.name === 'set-cookie')?.value.split(';')[0]!;
  await request.post(`${API}/confirmation/${id}/confirm`, { headers: { Cookie: ac } });
  const detail = await request.get(`${API}/reports/${id}`, { headers: { Cookie: ac } });
  const body = await detail.json();
  expect(body.shares?.length).toBeGreaterThan(0);
});
