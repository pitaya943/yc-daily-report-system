import { createClient } from '@supabase/supabase-js';
import { integrationEnabled, requireIntegration } from './setup';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-067 RLS denies audit_log to non-owner', () => {
  beforeAll(() => {
    requireIntegration();
  });

  it('authenticated USER cannot select audit_log via RLS', async () => {
    const url = process.env.SUPABASE_URL!;
    const anonKey = process.env.SUPABASE_ANON_KEY!;
    const anon = createClient(url, anonKey);
    const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
      email: 'seed-user-west@fixture.yc-daily-report.local',
      password: process.env.SEED_PASSWORD ?? 'seedpass01',
    });
    expect(signInErr).toBeNull();
    expect(signIn.session).toBeTruthy();
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${signIn.session!.access_token}` } },
    });
    const { data, error } = await userClient.from('audit_log').select('id').limit(1);
    expect(error || (data && data.length === 0)).toBeTruthy();
  });
});
