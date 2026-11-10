import { createClient } from '@supabase/supabase-js';
import { loadConfig } from '../../src/config';
import { integrationEnabled } from './setup';

/** B-080: supertest shares one client address; clear limits between cases. */
beforeEach(async () => {
  if (!integrationEnabled()) {
    return;
  }
  const config = loadConfig();
  const db = createClient(config.supabaseUrl, config.supabaseServiceKey, {
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
});
