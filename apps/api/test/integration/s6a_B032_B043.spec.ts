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

describeIntegration('S6a B-032–B-043', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterAll(() => app.close());

  describe('B-032 unit prices no south fallback', () => {
    it('patches south price independently', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子管理員', password: SEED_PASSWORD });
      await agent
        .patch('/settings/unit-prices/SOUTH/direct_13')
        .send({ price: 99 });
      const list = await agent.get('/settings/unit-prices/SOUTH');
      const row = (list.body as Array<{ item_code: string; price: number }>).find(
        (r) => r.item_code === 'direct_13',
      );
      expect(Number(row?.price)).toBe(99);
    });
  });

  describe('B-033 B-034 global rates', () => {
    it('patch system retention and uninsured', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子管理員', password: SEED_PASSWORD });
      await agent.patch('/settings/system').send({
        globalRetentionWest: 20,
        uninsuredRateWest: 3,
      });
      const sys = await agent.get('/settings/system');
      expect(Number(sys.body.global_retention_west)).toBe(20);
    });
  });

  describe('B-038 west 32 items', () => {
    it('counts work_items WEST catalogue', async () => {
      const db = app.get(SupabaseService).getServiceClient();
      const { count } = await db
        .from('work_items')
        .select('code', { count: 'exact', head: true })
        .eq('catalogue', 'WEST');
      expect(count).toBe(32);
    });
  });

  describe('B-039 south 37 items', () => {
    it('counts SOUTH catalogue', async () => {
      const db = app.get(SupabaseService).getServiceClient();
      const { count } = await db
        .from('work_items')
        .select('code', { count: 'exact', head: true })
        .eq('catalogue', 'SOUTH');
      expect(count).toBe(37);
    });
  });

  describe('B-040 big-meter 25 without bm_40_fen', () => {
    it('excludes bm_40_fen', async () => {
      const db = app.get(SupabaseService).getServiceClient();
      const { count } = await db
        .from('work_items')
        .select('code', { count: 'exact', head: true })
        .eq('catalogue', 'BIG_METER');
      const { data: bad } = await db
        .from('work_items')
        .select('code')
        .eq('code', 'bm_40_fen');
      expect(count).toBe(25);
      expect(bad?.length ?? 0).toBe(0);
    });
  });

  describe('B-041 west retention item count', () => {
    it('eight west retention codes in seed', async () => {
      const db = app.get(SupabaseService).getServiceClient();
      const { count } = await db
        .from('work_items')
        .select('code', { count: 'exact', head: true })
        .eq('catalogue', 'WEST')
        .eq('attracts_retention', true);
      expect(count).toBe(8);
    });
  });

  describe('B-042 south retention items', () => {
    it('twenty-eight south retention items', async () => {
      const db = app.get(SupabaseService).getServiceClient();
      const { count } = await db
        .from('work_items')
        .select('code', { count: 'exact', head: true })
        .eq('catalogue', 'SOUTH')
        .eq('attracts_retention', true);
      expect(count).toBe(28);
    });
  });

  describe('B-043 big-meter users zero retention path', () => {
    it('big-meter user has big_meter flag', async () => {
      const db = app.get(SupabaseService).getServiceClient();
      const { data } = await db
        .from('accounts')
        .select('big_meter')
        .eq('display_name', '種子大表')
        .single();
      expect(data?.big_meter).toBe(true);
    });
  });
});
