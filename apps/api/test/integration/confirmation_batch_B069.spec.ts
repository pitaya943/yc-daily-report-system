import * as request from 'supertest';
import {
  clearWestUserReportsOnDate,
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { taipeiYmd } from '../../src/common/taipei-time';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-069 batch confirm routes (not shadowed by :id)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterAll(async () => app.close());

  it('POST /confirmation/batch/confirm resolves without 404', async () => {
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
        quantities: [{ itemCode: 'direct_13', qty: 1 }],
      })
      .expect(201);

    const admin = request.agent(app.getHttpServer());
    await admin.post('/auth/sign-in').send({
      displayName: '種子管理員',
      password: SEED_PASSWORD,
    });

    const batch = await admin
      .post('/confirmation/batch/confirm')
      .send({ reportIds: [created.id] });
    expect(batch.status).not.toBe(404);
    expect(batch.status).toBeLessThan(300);

    const reject = await admin
      .post('/confirmation/batch/reject')
      .send({ reportIds: [] });
    expect(reject.status).not.toBe(404);
  });
});
