import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { createTestApp } from './test-app';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-061 idle session expiry', () => {
  it('B-061 destroys session after idle TTL and rolling refresh extends', async () => {
    const prev = process.env.SESSION_IDLE_MINUTES;
    process.env.SESSION_IDLE_MINUTES = '0.05';
    requireIntegration();
    const app = await createTestApp();
    try {
      await resetSeedLockouts(app.get(SupabaseService));
      const agent = request.agent(app.getHttpServer());
      const signedIn = await agent.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      expect(signedIn.status).toBeLessThan(300);
      const ok1 = await agent.get('/confirmation/pending');
      expect(ok1.status).toBeLessThan(300);
      await agent.get('/confirmation/pending');
      await new Promise((r) => setTimeout(r, 2500));
      const ok2 = await agent.get('/confirmation/pending');
      expect(ok2.status).toBeLessThan(300);
      await new Promise((r) => setTimeout(r, 4000));
      const expired = await agent.get('/confirmation/pending');
      expect(expired.status).toBe(401);
    } finally {
      process.env.SESSION_IDLE_MINUTES = prev;
      await app.close();
    }
  });
});
