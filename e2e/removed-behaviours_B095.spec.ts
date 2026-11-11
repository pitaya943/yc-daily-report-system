import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';

test('B-095 no permanent account delete API', async ({ request }) => {
  const admin = await request.post('/auth/sign-in', {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  const res = await request.delete(
    'http://127.0.0.1:3001/accounts/b0000001-0001-4000-8000-000000000007',
    { headers: { Cookie: admin.headers()['set-cookie'] ?? '' } },
  );
  expect(res.status()).toBe(404);
});
