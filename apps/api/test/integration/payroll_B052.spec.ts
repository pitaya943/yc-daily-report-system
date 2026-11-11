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

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  it('calculates payroll with non-zero gross for confirmed west report', async () => {
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

    const calc = await admin.post('/payroll/calculate').send({
      startDate: today,
      endDate: today,
      is10thPayday: false,
    });
    expect(calc.status).toBeLessThan(300);
    expect(calc.body.rowCount).toBeGreaterThan(0);

    const db = app.get(SupabaseService).getServiceClient();
    const { data: rows } = await db
      .from('payroll_run_rows')
      .select('gross, final_pay, display_name_snapshot')
      .eq('run_id', calc.body.runId);
    const west = (rows ?? []).find((r) => String(r.display_name_snapshot).includes('種子西區'));
    expect(west).toBeTruthy();
    expect(Number(west!.gross)).toBeGreaterThan(0);
    expect(Number(west!.final_pay)).toBeGreaterThan(0);
  });
});
