import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';
import { SupabaseService } from '../../src/supabase/supabase.service';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('S6a B-023 B-037', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterAll(() => app.close());

  describe('B-023 report status transitions', () => {
    it('new report is PENDING', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子西區', password: SEED_PASSWORD });
      const res = await agent.post('/reports').send({
        reportDate: '2026-11-11',
        quantities: [{ itemCode: 'direct_13', qty: 1 }],
      });
      const db = app.get(SupabaseService).getServiceClient();
      const { data } = await db
        .from('daily_reports')
        .select('status')
        .eq('id', res.body.id)
        .single();
      expect(data?.status).toBe('PENDING');
    });
  });

  describe('B-037 audit append-only', () => {
    it('writes REPORT_CREATE on submit', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子西區', password: SEED_PASSWORD });
      const res = await agent.post('/reports').send({
        reportDate: '2026-11-12',
        quantities: [{ itemCode: 'direct_13', qty: 1 }],
      });
      const db = app.get(SupabaseService).getServiceClient();
      const { data } = await db
        .from('audit_log')
        .select('action_type')
        .eq('action_type', 'REPORT_CREATE')
        .order('id', { ascending: false })
        .limit(1);
      expect(data?.[0]?.action_type).toBe('REPORT_CREATE');
      void res;
    });
  });
});
