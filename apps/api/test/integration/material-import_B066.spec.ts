import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-066 B-054 material import and reset', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  afterAll(() => app.close());

  it('imports csv and sets comparison label', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/auth/sign-in')
      .send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const csv = '材料編號,實領量\ncode1,10\n';
    const res = await agent.post('/materials/admin/import').send({
      fileName: 'stock.csv',
      csvText: csv,
    });
    expect(res.status).toBe(201);
    expect(res.body.comparisonLabel).toMatch(/已對比/);
    await agent.post('/materials/admin/reset').expect(201);
  });
});
