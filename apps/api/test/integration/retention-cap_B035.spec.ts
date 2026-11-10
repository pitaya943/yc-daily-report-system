import * as request from 'supertest';
import { createTestApp } from './test-app';
import { integrationEnabled, requireIntegration, SEED_PASSWORD } from './setup';
import { periodRetentionNtd } from '@yc/payroll';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-035 BDD-010 retention cap change', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  afterAll(async () => app.close());

  it('unit clamp matches cap mid-year without recalc past runs', () => {
    expect(periodRetentionNtd(8000, 55000, 60000)).toBe(5000);
  });

  it('admin can update cap for current year', async () => {
    const admin = request.agent(app.getHttpServer());
    await admin.post('/auth/sign-in').send({
      displayName: 'Kuei',
      password: SEED_PASSWORD,
    });
    const res = await admin
      .patch('/settings/retention-cap')
      .send({ capNtd: 55000 });
    expect(res.status).toBe(200);
    expect(res.body.capNtd).toBe(55000);
  });
});
