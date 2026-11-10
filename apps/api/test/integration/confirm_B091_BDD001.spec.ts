import * as request from 'supertest';
import { createTestApp } from './test-app';
import { integrationEnabled, requireIntegration, SEED_PASSWORD } from './setup';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { taipeiYmd } from '../../src/common/taipei-time';
import { unitsToQty } from '@yc/allocation';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

const WEST_2 = 'b0000001-0001-4000-8000-000000000006';
const WEST_3 = 'b0000001-0001-4000-8000-000000000007';
const SUBMITTER = 'b0000001-0001-4000-8000-000000000003';

describeIntegration('B-091 BDD-001 confirm stores B-044 shares', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  afterAll(async () => app.close());

  it('persists largest-remainder shares at approval', async () => {
    const user = request.agent(app.getHttpServer());
    await user.post('/auth/sign-in').send({
      displayName: '種子西區',
      password: SEED_PASSWORD,
    });
    const { body: created } = await user
      .post('/reports')
      .send({
        reportDate: taipeiYmd(),
        quantities: [{ itemCode: 'direct_13', qty: 7 }],
        collaboratorIds: [WEST_3, WEST_2],
      })
      .expect(201);

    const admin = request.agent(app.getHttpServer());
    await admin.post('/auth/sign-in').send({
      displayName: '種子管理員',
      password: SEED_PASSWORD,
    });
    await admin
      .post(`/confirmation/${created.id}/confirm`)
      .send({})
      .expect(200);

    const supabase = app.get(SupabaseService);
    const { data: shares } = await supabase
      .getServiceClient()
      .from('report_shares')
      .select('account_id, item_code, share_units')
      .eq('report_id', created.id);
    expect(shares?.length).toBe(3);
    const byPerson = Object.fromEntries(
      (shares ?? []).map((s) => [s.account_id, s.share_units]),
    );
    expect(unitsToQty(byPerson[SUBMITTER] as number)).toBe(2.4);
    expect(unitsToQty(byPerson[WEST_3] as number)).toBe(2.3);
    expect(unitsToQty(byPerson[WEST_2] as number)).toBe(2.3);
  });
});
