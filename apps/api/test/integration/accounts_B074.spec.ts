import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-074 B-096 account lifecycle', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  afterAll(() => app.close());

  it('owner creates admin with real row', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/auth/sign-in')
      .send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const name = `測試管理員${Date.now()}`;
    const res = await agent
      .post('/owner/admins')
      .send({ displayName: name, password: SEED_PASSWORD });
    expect([200, 201]).toContain(res.status);
    expect(res.body.account?.role).toBe('ADMIN');
  });
});
