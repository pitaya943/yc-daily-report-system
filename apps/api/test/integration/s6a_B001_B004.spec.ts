import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';
import { SupabaseService } from '../../src/supabase/supabase.service';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('S6a B-001–B-004', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  afterAll(() => app.close());

  describe('B-001 system purpose smoke', () => {
    it('health and authenticated report catalogue', async () => {
      await request(app.getHttpServer()).get('/health').expect(200);
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子西區', password: SEED_PASSWORD });
      const items = await agent.get('/reports/work-items');
      expect(items.status).toBe(200);
      expect(Array.isArray(items.body.items)).toBe(true);
    });
  });

  describe('B-002 design capacity', () => {
    it('daily_reports table supports list query', async () => {
      const db = app.get(SupabaseService).getServiceClient();
      const { data, error } = await db
        .from('daily_reports')
        .select('id, submitter_id, report_date')
        .limit(10);
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('B-003 exactly one OWNER', () => {
    it('seed has single owner row', async () => {
      const db = app.get(SupabaseService).getServiceClient();
      const { count } = await db
        .from('accounts')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'OWNER');
      expect(count).toBe(1);
    });
  });

  describe('B-004 forbidden USER on admin route', () => {
    it('USER cannot list admin history', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子西區', password: SEED_PASSWORD });
      const res = await agent.get('/reports/history/admin');
      expect(res.status).toBe(403);
    });
  });
});
