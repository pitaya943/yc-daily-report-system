import * as request from 'supertest';
import { createTestApp } from './test-app';
import {
  clearWestUserReportsOnDate,
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { taipeiYmd } from '../../src/common/taipei-time';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-052 B-072 payroll calculate snapshot', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterAll(async () => app.close());

  it('calculates payroll after confirmed report', async () => {
    const today = taipeiYmd();
    await clearWestUserReportsOnDate(app.get(SupabaseService), today);

    const user = request.agent(app.getHttpServer());
    await user.post('/auth/sign-in').send({
      displayName: '種子西區',
      password: SEED_PASSWORD,
    });
    const { body: created } = await user
      .post('/reports')
      .send({
        reportDate: today,
        quantities: [{ itemCode: 'direct_13', qty: 10 }],
      })
      .expect(201);

    const admin = request.agent(app.getHttpServer());
    await admin.post('/auth/sign-in').send({
      displayName: '種子管理員',
      password: SEED_PASSWORD,
    });
    await admin.post(`/confirmation/${created.id}/confirm`).send({});

    await admin
      .post('/payroll/calculate')
      .send({
        startDate: today,
        endDate: today,
        is10thPayday: false,
      })
      .expect((res) => {
        if (res.status >= 300) {
          throw new Error(JSON.stringify(res.body));
        }
      });
  });
});
