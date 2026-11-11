import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
  clearWestUserReportsOnDate,
} from './setup';
import { createTestApp } from './test-app';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { ValidationMessages } from '@yc/validation';
import { taipeiYmd } from '../../src/common/taipei-time';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

const WEST_USER_ID = 'b0000001-0001-4000-8000-000000000003';

describeIntegration('Vera round 6 — B-088 inventory bar (status + message + no write)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  const agent = () => request.agent(app.getHttpServer());

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterAll(async () => app.close());

  it('[R6 L309] reject user create without zone — 400, no new account', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const name = `R6缺區${Date.now()}`;
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin.post('/accounts/users').send({
      displayName: name,
      password: 'userpass1',
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.zoneRequired);
    const { data } = await db.from('accounts').select('id').eq('display_name', name).maybeSingle();
    expect(data).toBeNull();
  });

  it('[R6 L317] reject payroll fixedSalaryManual decimal — 400, no payroll_runs row', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const { count: before } = await db
      .from('payroll_runs')
      .select('id', { count: 'exact', head: true });
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const today = taipeiYmd();
    const res = await admin.post('/payroll/calculate').send({
      startDate: today,
      endDate: today,
      fixedSalaryManual: { [WEST_USER_ID]: 10.5 },
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.fixedSalaryInteger);
    const { count: after } = await db
      .from('payroll_runs')
      .select('id', { count: 'exact', head: true });
    expect(after).toBe(before);
  });

  it('[R6 L317] reject payroll fixedSalaryManual negative — 400, no payroll_runs row', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const { count: before } = await db
      .from('payroll_runs')
      .select('id', { count: 'exact', head: true });
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const today = taipeiYmd();
    const res = await admin.post('/payroll/calculate').send({
      startDate: today,
      endDate: today,
      fixedSalaryManual: { [WEST_USER_ID]: -5 },
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.fixedSalaryInteger);
    const { count: after } = await db
      .from('payroll_runs')
      .select('id', { count: 'exact', head: true });
    expect(after).toBe(before);
  });

  it('[R6 L347] incomplete unit prices — 400, no payroll_runs row', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const today = taipeiYmd();
    await clearWestUserReportsOnDate(app.get(SupabaseService), today);
    await db.from('unit_prices').delete().eq('price_set', 'WEST').eq('item_code', 'direct_13');

    const user = agent();
    await user.post('/auth/sign-in').send({ displayName: '種子西區', password: SEED_PASSWORD });
    const { body: created } = await user
      .post('/reports')
      .send({ reportDate: today, quantities: [{ itemCode: 'direct_13', qty: 1 }] })
      .expect(201);

    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    await admin.post(`/confirmation/${created.id}/confirm`).send({});

    const { count: before } = await db
      .from('payroll_runs')
      .select('id', { count: 'exact', head: true });
    const res = await admin.post('/payroll/calculate').send({
      startDate: today,
      endDate: today,
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.unitPriceIncompletePayroll);
    const { count: after } = await db
      .from('payroll_runs')
      .select('id', { count: 'exact', head: true });
    expect(after).toBe(before);

    await db.from('unit_prices').upsert({ price_set: 'WEST', item_code: 'direct_13', price: 120 });
  });

  it('[R6 L304] reject empty display name on user create — 400, no row', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const { count: before } = await db
      .from('accounts')
      .select('id', { count: 'exact', head: true });
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin.post('/accounts/users').send({
      displayName: '   ',
      password: 'userpass1',
      zone: 'WEST',
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.displayNameRequired);
    const { count: after } = await db
      .from('accounts')
      .select('id', { count: 'exact', head: true });
    expect(after).toBe(before);
  });

  it('[R6 L305] reject short password on user create — 400, no row', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const name = `R6短密${Date.now()}`;
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin.post('/accounts/users').send({
      displayName: name,
      password: 'abc',
      zone: 'WEST',
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.passwordLength);
    const { data } = await db.from('accounts').select('id').eq('display_name', name).maybeSingle();
    expect(data).toBeNull();
  });

  it('[R6 L307] reject password mismatch — 400, password hash unchanged', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const before = await db
      .from('accounts')
      .select('password_hash')
      .eq('id', WEST_USER_ID)
      .single();
    const user = agent();
    await user.post('/auth/sign-in').send({ displayName: '種子西區', password: SEED_PASSWORD });
    const res = await user.post('/accounts/me/password').send({
      currentPassword: SEED_PASSWORD,
      newPassword: 'newpass01',
      newPasswordConfirm: 'otherpass',
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.passwordMismatch);
    const after = await db
      .from('accounts')
      .select('password_hash')
      .eq('id', WEST_USER_ID)
      .single();
    expect(after.data?.password_hash).toBe(before.data?.password_hash);
  });

  it('[R6 L311] reject invalid payment method — 400, payment_method unchanged', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const before = await db
      .from('accounts')
      .select('payment_method')
      .eq('id', WEST_USER_ID)
      .single();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const res = await owner
      .patch(`/accounts/${WEST_USER_ID}/financials`)
      .send({ paymentMethod: 'WIRE' as never });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.paymentRequired);
    const after = await db
      .from('accounts')
      .select('payment_method')
      .eq('id', WEST_USER_ID)
      .single();
    expect(after.data?.payment_method).toBe(before.data?.payment_method);
  });

  it('[R6 L312] reject bank too short — 400, bank unchanged', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const before = await db
      .from('accounts')
      .select('bank_account_last4, bank_account_ciphertext')
      .eq('id', WEST_USER_ID)
      .single();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const res = await owner
      .patch(`/accounts/${WEST_USER_ID}/bank`)
      .send({ bankAccount: '123' });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.bankDigitsInvalid);
    const after = await db
      .from('accounts')
      .select('bank_account_last4, bank_account_ciphertext')
      .eq('id', WEST_USER_ID)
      .single();
    expect(after.data?.bank_account_last4).toBe(before.data?.bank_account_last4);
    expect(after.data?.bank_account_ciphertext).toBe(before.data?.bank_account_ciphertext);
  });

  it('[R6 L313] reject insurance deduction 0.5 — 400, deduction unchanged', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const before = await db
      .from('accounts')
      .select('insurance_deduction')
      .eq('id', WEST_USER_ID)
      .single();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const res = await owner
      .patch(`/accounts/${WEST_USER_ID}/financials`)
      .send({ insuranceDeduction: 0.5 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.insuranceDeductionInteger);
    const after = await db
      .from('accounts')
      .select('insurance_deduction')
      .eq('id', WEST_USER_ID)
      .single();
    expect(after.data?.insurance_deduction).toBe(before.data?.insurance_deduction);
  });

  it('[R6 L320] reject non-integer retention offset — 400, offset unchanged', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const year = new Date().getFullYear();
    const before = await db
      .from('retention_offsets')
      .select('offset_ntd')
      .eq('account_id', WEST_USER_ID)
      .eq('calendar_year', year)
      .maybeSingle();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const res = await owner
      .patch(`/accounts/${WEST_USER_ID}/retention-offset`)
      .send({ calendarYear: year, offsetNtd: 1.25 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.retentionOffsetInteger);
    const after = await db
      .from('retention_offsets')
      .select('offset_ntd')
      .eq('account_id', WEST_USER_ID)
      .eq('calendar_year', year)
      .maybeSingle();
    expect(after.data?.offset_ntd ?? null).toBe(before.data?.offset_ntd ?? null);
  });

  it('[R6 L321] reject negative per-item retention rate — 400, rate unchanged', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const before = await db
      .from('account_item_retention_rates')
      .select('rate_ntd')
      .eq('account_id', WEST_USER_ID)
      .eq('item_code', 'direct_13')
      .maybeSingle();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const res = await owner
      .patch(`/accounts/${WEST_USER_ID}/item-retention-rates/direct_13`)
      .send({ rateNtd: -1 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.perItemRetentionRate);
    const after = await db
      .from('account_item_retention_rates')
      .select('rate_ntd')
      .eq('account_id', WEST_USER_ID)
      .eq('item_code', 'direct_13')
      .maybeSingle();
    expect(after.data?.rate_ntd ?? null).toBe(before.data?.rate_ntd ?? null);
  });

  it('[R6 L346] reject negative unit price patch — 400, price unchanged', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const before = await db
      .from('unit_prices')
      .select('price')
      .eq('price_set', 'WEST')
      .eq('item_code', 'direct_13')
      .maybeSingle();
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin
      .patch('/settings/unit-prices/WEST/direct_13')
      .send({ price: -1 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.unitPriceRange);
    const after = await db
      .from('unit_prices')
      .select('price')
      .eq('price_set', 'WEST')
      .eq('item_code', 'direct_13')
      .maybeSingle();
    expect(Number(after.data?.price ?? before.data?.price)).toBe(Number(before.data?.price ?? 0));
  });

  it('[R6 L349] reject invalid global retention west — 400, setting unchanged', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const before = await db
      .from('system_settings')
      .select('global_retention_west')
      .eq('id', 1)
      .single();
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin
      .patch('/settings/system')
      .send({ globalRetentionWest: -5 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.globalRetentionRate);
    const after = await db
      .from('system_settings')
      .select('global_retention_west')
      .eq('id', 1)
      .single();
    expect(after.data?.global_retention_west).toBe(before.data?.global_retention_west);
  });

  it('[R6 L350] reject negative retention cap — 400, cap unchanged', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const year = new Date().getFullYear();
    const before = await db
      .from('retention_annual_caps')
      .select('cap_ntd')
      .eq('calendar_year', year)
      .maybeSingle();
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin.patch('/settings/retention-cap').send({ capNtd: -1 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.retentionCapInteger);
    const after = await db
      .from('retention_annual_caps')
      .select('cap_ntd')
      .eq('calendar_year', year)
      .maybeSingle();
    expect(after.data?.cap_ntd ?? null).toBe(before.data?.cap_ntd ?? null);
  });

  it('[R6 L353] reject payroll end before start — 400, no payroll_runs row', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const { count: before } = await db
      .from('payroll_runs')
      .select('id', { count: 'exact', head: true });
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin.post('/payroll/calculate').send({
      startDate: '2026-11-10',
      endDate: '2026-11-01',
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.payrollEndBeforeStart);
    const { count: after } = await db
      .from('payroll_runs')
      .select('id', { count: 'exact', head: true });
    expect(after).toBe(before);
  });
});
