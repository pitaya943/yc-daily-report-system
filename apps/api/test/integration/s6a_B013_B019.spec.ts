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

describeIntegration('S6a B-013–B-019', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    process.env.BANK_ENCRYPTION_KEY_BASE64 =
      process.env.BANK_ENCRYPTION_KEY_BASE64 ??
      Buffer.alloc(32, 1).toString('base64');
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterAll(() => app.close());

  describe('B-013 transfer payment method', () => {
    it('owner sets TRANSFER with bank', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: 'Kuei', password: SEED_PASSWORD });
      const id = 'b0000001-0001-4000-8000-000000000003';
      await agent.patch(`/accounts/${id}/bank`).send({
        bankAccount: '12345678901234',
      });
      const db = app.get(SupabaseService).getServiceClient();
      const { data } = await db
        .from('accounts')
        .select('payment_method')
        .eq('id', id)
        .single();
      expect(data?.payment_method).toBe('TRANSFER');
    });
  });

  describe('B-015 insurance on 10th', () => {
    it('owner can set insurance deduction', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: 'Kuei', password: SEED_PASSWORD });
      const id = 'b0000001-0001-4000-8000-000000000003';
      await agent.patch(`/accounts/${id}/financials`).send({
        insuranceDeduction: 834,
      });
      const db = app.get(SupabaseService).getServiceClient();
      const { data } = await db
        .from('accounts')
        .select('insurance_deduction')
        .eq('id', id)
        .single();
      expect(data?.insurance_deduction).toBe(834);
    });
  });

  describe('B-016 default uninsured rates in settings', () => {
    it('system settings default 3%', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子管理員', password: SEED_PASSWORD });
      const sys = await agent.get('/settings/system');
      expect(Number(sys.body.uninsured_rate_west)).toBe(3);
    });
  });

  describe('B-017 B-018 fixed salary flags', () => {
    it('owner sets fixed salary and every period', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: 'Kuei', password: SEED_PASSWORD });
      const id = 'b0000001-0001-4000-8000-000000000003';
      await agent.patch(`/accounts/${id}/financials`).send({
        fixedSalary: 5000,
        payFixedEveryPeriod: true,
      });
      const db = app.get(SupabaseService).getServiceClient();
      const { data } = await db
        .from('accounts')
        .select('fixed_salary, pay_fixed_every_period')
        .eq('id', id)
        .single();
      expect(data?.fixed_salary).toBe(5000);
      expect(data?.pay_fixed_every_period).toBe(true);
    });
  });

  describe('B-019 retention offset row', () => {
    it('admin stores offset for year', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子管理員', password: SEED_PASSWORD });
      const id = 'b0000001-0001-4000-8000-000000000003';
      const year = new Date().getFullYear();
      await agent.patch(`/accounts/${id}/retention-offset`).send({
        calendarYear: year,
        offsetNtd: -200,
      });
      const db = app.get(SupabaseService).getServiceClient();
      const { data } = await db
        .from('retention_offsets')
        .select('offset_ntd')
        .eq('account_id', id)
        .eq('calendar_year', year)
        .single();
      expect(data?.offset_ntd).toBe(-200);
    });
  });
});
