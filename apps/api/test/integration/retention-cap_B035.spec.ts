import * as request from 'supertest';
import { createTestApp } from './test-app';
import {
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { periodRetentionNtd } from '@yc/payroll';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-035 BDD-010 retention cap change', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterAll(async () => app.close());

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  it('unit clamp matches cap mid-year without recalc past runs', () => {
    expect(periodRetentionNtd(8000, 55000, 60000)).toBe(5000);
  });

  it('admin can update cap for current year', async () => {
    const admin = request.agent(app.getHttpServer());
    const login = await admin.post('/auth/sign-in').send({
      displayName: '種子管理員',
      password: SEED_PASSWORD,
    });
    expect([200, 201]).toContain(login.status);
    const res = await admin
      .patch('/settings/retention-cap')
      .send({ capNtd: 55000 });
    expect(res.status).toBe(200);
    expect(res.body.capNtd).toBe(55000);
  });
});
