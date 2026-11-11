import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

test('BDD-004 retention year-end settlement', async ({ request }) => {
  const admin = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  const cookie = admin.headersArray().find((h) => h.name === 'set-cookie')?.value.split(';')[0]!;
  const year = new Date().getFullYear();
  const res = await request.post(`${API}/retention/year-end`, {
    headers: { Cookie: cookie },
    data: { calendarYear: year },
  });
  expect([200, 201, 400]).toContain(res.status());
});
