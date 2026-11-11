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

describeIntegration('B-054 import step 2 apply', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterAll(() => app.close());

  it('B-054 applies positive delta without quarantine', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const { data: mat } = await db
      .from('materials')
      .select('id, code, received_qty')
      .not('code', 'is', null)
      .limit(1)
      .single();
    expect(mat?.code).toBeTruthy();
    const before = Number(mat!.received_qty);
    const csv = `材料編號,實領量\n${mat!.code},${before + 2}`;
    const admin = request.agent(app.getHttpServer());
    await admin.post('/auth/sign-in').send({
      displayName: '種子管理員',
      password: SEED_PASSWORD,
    });
    const res = await admin.post('/materials/admin/import').send({
      fileName: 'stock.csv',
      csvText: csv,
    });
    expect(res.body.applied).toBeGreaterThanOrEqual(1);
    const { data: after } = await db
      .from('materials')
      .select('received_qty, quarantined')
      .eq('id', mat!.id)
      .single();
    expect(after?.quarantined).toBe(false);
    expect(Number(after?.received_qty)).toBe(before + 2);
  });
});
