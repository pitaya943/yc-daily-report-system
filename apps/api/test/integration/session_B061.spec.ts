import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-061 idle session expiry', () => {
  it('B-061 destroys session after idle TTL and rolling refresh extends', async () => {
    const prev = process.env.SESSION_IDLE_MINUTES;
    process.env.SESSION_IDLE_MINUTES = '0.02';
    const app = await createTestApp();
    requireIntegration();
    try {
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const ok1 = await agent.get('/auth/session');
      expect(ok1.body.signedIn).toBe(true);
      await agent.get('/auth/session');
      await new Promise((r) => setTimeout(r, 1500));
      const ok2 = await agent.get('/auth/session');
      expect(ok2.body.signedIn).toBe(true);
      await new Promise((r) => setTimeout(r, 2000));
      const expired = await agent.get('/auth/session');
      expect(expired.body.signedIn).toBe(false);
    } finally {
      process.env.SESSION_IDLE_MINUTES = prev;
      await app.close();
    }
  });
});
