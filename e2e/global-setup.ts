import { createClient } from '@supabase/supabase-js';

export default async function globalSetup() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await db.from('signin_rate_limits').delete().gte('attempt_count', 0);
  await db
    .from('accounts')
    .update({
      failed_signin_count: 0,
      lockout_until: null,
      last_failed_signin_at: null,
    })
    .gte('failed_signin_count', 0);
}
