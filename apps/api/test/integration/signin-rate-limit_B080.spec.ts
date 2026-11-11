import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-080 ten sign-ins per address per minute', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  afterAll(() => app.close());

  it('blocks the 11th attempt with 401', async () => {
    const addr = `rate-${Date.now()}`;
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .set('X-Forwarded-For', addr)
        .send({ displayName: '種子西區', password: SEED_PASSWORD });
    }
    const res = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .set('X-Forwarded-For', addr)
      .send({ displayName: '種子西區', password: SEED_PASSWORD });
    expect(res.status).toBe(401);
  });
});
