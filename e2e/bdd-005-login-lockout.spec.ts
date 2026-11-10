import { test, expect } from '@playwright/test';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

test('BDD-005 login lockout after 5 failures', async ({ request }) => {
  for (let i = 0; i < 5; i++) {
    await request.post(`${API}/auth/sign-in`, {
      data: { displayName: '種子西區三', password: 'wrong-pass-xx' },
    });
  }
  const res = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子西區三', password: 'seedpass01' },
  });
  expect(res.status()).toBe(401);
});
