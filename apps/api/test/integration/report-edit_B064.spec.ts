import * as request from 'supertest';
import {
  clearWestUserReportsOnDate,
  integrationEnabled,
  requireIntegration,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';
import { SupabaseService } from '../../src/supabase/supabase.service';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-064 admin edit confirmed with audit diff', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  const reportDate = '2026-11-01';

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
    await clearWestUserReportsOnDate(
      app.get(SupabaseService),
      reportDate,
    );
  });

  afterAll(() => app.close());

  it('unconfirms and writes REPORT_UPDATE diff', async () => {
    const user = request.agent(app.getHttpServer());
    const admin = request.agent(app.getHttpServer());
    await user
      .post('/auth/sign-in')
      .send({ displayName: '種子西區', password: SEED_PASSWORD });
    const created = await user
      .post('/reports')
      .send({
        reportDate,
        quantities: [{ itemCode: 'direct_13', qty: 5 }],
      })
      .expect(201);
    const id = created.body.id;
    await admin
      .post('/auth/sign-in')
      .send({ displayName: '種子管理員', password: SEED_PASSWORD });
    await admin.post(`/confirmation/${id}/confirm`).expect((res) =>
      expect([200, 201]).toContain(res.status),
    );
    const patch = await admin
      .patch(`/reports/${id}`)
      .send({ quantities: [{ itemCode: 'direct_13', qty: 7 }] });
    expect(patch.status).toBe(200);
    expect(patch.body.unconfirmed).toBe(true);
    const db = app.get(SupabaseService).getServiceClient();
    const { data: audits } = await db
      .from('audit_log')
      .select('action_type, description')
      .eq('action_type', 'REPORT_UPDATE')
      .order('id', { ascending: false })
      .limit(1);
    expect(audits?.[0]?.description).toMatch(/direct_13/);
  });
});
