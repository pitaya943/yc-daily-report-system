import * as request from 'supertest';
import { createTestApp } from './test-app';
import {
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { SupabaseService } from '../../src/supabase/supabase.service';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-076 petty cash cumulative balance', () => {
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

  it('excludes voided entries from balance', async () => {
    const admin = request.agent(app.getHttpServer());
    const login = await admin.post('/auth/sign-in').send({
      displayName: '種子管理員',
      password: SEED_PASSWORD,
    });
    expect([200, 201]).toContain(login.status);
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
    const before = (await admin.get('/ledger/entries')).body.pettyCash
      .balance as number;
    const { body: income } = await admin.post('/ledger/entries').send({
      entryDate: today,
      type: 'INCOME',
      amount: 1000,
      description: '測試收入',
    });
    await admin.post('/ledger/entries').send({
      entryDate: today,
      type: 'EXPENSE',
      amount: 200,
      description: '測試支出',
    });
    await admin.post(`/ledger/entries/${income.id}/void`).send({});

    const list = await admin.get('/ledger/entries');
    expect(list.body.pettyCash.balance - before).toBe(-200);
  });
});
