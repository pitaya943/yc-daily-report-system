import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

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
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const db = createClient(url, key);
    await db
      .from('accounts')
      .update({
        failed_signin_count: 0,
        lockout_until: null,
        last_failed_signin_at: null,
      })
      .eq('display_name', '種子西區三');
  }
});
