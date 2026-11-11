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

  it('stored payroll run rows stay unchanged after cap update', async () => {
    const today = taipeiYmd();
    await clearWestUserReportsOnDate(app.get(SupabaseService), today);

    const admin = request.agent(app.getHttpServer());
    await admin.post('/auth/sign-in').send({
      displayName: '種子管理員',
      password: SEED_PASSWORD,
    });

    const user = request.agent(app.getHttpServer());
    await user.post('/auth/sign-in').send({
      displayName: '種子西區',
      password: SEED_PASSWORD,
    });
    const { body: created } = await user
      .post('/reports')
      .send({ reportDate: today, quantities: [{ itemCode: 'direct_13', qty: 2 }] })
      .expect(201);
    await admin.post(`/confirmation/${created.id}/confirm`).send({});

    const calc = await admin.post('/payroll/calculate').send({
      startDate: today,
      endDate: today,
      is10thPayday: false,
    });
    const runId = calc.body.runId as string;
    const db = app.get(SupabaseService).getServiceClient();
    const { data: before } = await db
      .from('payroll_run_rows')
      .select('gross, period_retention, final_pay')
      .eq('run_id', runId);

    await admin.patch('/settings/retention-cap').send({ capNtd: 55000 });

    const { data: after } = await db
      .from('payroll_run_rows')
      .select('gross, period_retention, final_pay')
      .eq('run_id', runId);
    expect(after).toEqual(before);
  });
});
