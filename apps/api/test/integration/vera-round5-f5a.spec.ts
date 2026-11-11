import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { ValidationMessages } from '@yc/validation';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

const SEED_ADMIN_ID = 'b0000001-0001-4000-8000-000000000002';
const WEST_USER_ID = 'b0000001-0001-4000-8000-000000000003';

describeIntegration('Vera round 5 — F-5a B-088 field rejection', () => {
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

  it('[F-5a L308] reject role OWNER — 400, message, role unchanged', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const before = await db
      .from('accounts')
      .select('role')
      .eq('id', SEED_ADMIN_ID)
      .single();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const res = await owner
      .post(`/accounts/${SEED_ADMIN_ID}/role`)
      .send({ role: 'OWNER' });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.roleRequired);
    const after = await db
      .from('accounts')
      .select('role')
      .eq('id', SEED_ADMIN_ID)
      .single();
    expect(after.data?.role).toBe(before.data?.role);
  });

  it('[F-5a L310] reject big-meter without confirm — 400, no new account', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const name = `R5大表${Date.now()}`;
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin.post('/accounts/users').send({
      displayName: name,
      password: 'userpass1',
      zone: 'WEST',
      bigMeter: true,
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.bigMeterConfirm);
    const { data } = await db
      .from('accounts')
      .select('id')
      .eq('display_name', name)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it('[F-5a L315] reject non-boolean uninsuredExempt — 400, row unchanged', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const before = await db
      .from('accounts')
      .select('uninsured_exempt')
      .eq('id', WEST_USER_ID)
      .single();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const res = await owner
      .patch(`/accounts/${WEST_USER_ID}/financials`)
      .send({ uninsuredExempt: 1 as never });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(
      ValidationMessages.uninsuredExemptConfirm,
    );
    const after = await db
      .from('accounts')
      .select('uninsured_exempt')
      .eq('id', WEST_USER_ID)
      .single();
    expect(after.data?.uninsured_exempt).toBe(before.data?.uninsured_exempt);
  });

  it('[F-5a L314] reject uninsured rate out of range — 400, override unchanged', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const before = await db
      .from('accounts')
      .select('uninsured_rate_override')
      .eq('id', WEST_USER_ID)
      .single();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const res = await owner
      .patch(`/accounts/${WEST_USER_ID}/financials`)
      .send({ uninsuredRateOverride: 150 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.uninsuredRateRange);
    const after = await db
      .from('accounts')
      .select('uninsured_rate_override')
      .eq('id', WEST_USER_ID)
      .single();
    expect(after.data?.uninsured_rate_override).toBe(
      before.data?.uninsured_rate_override,
    );
  });

  it('[F-5a L316] reject non-integer fixed salary — 400, fixed_salary unchanged', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const before = await db
      .from('accounts')
      .select('fixed_salary')
      .eq('id', WEST_USER_ID)
      .single();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const res = await owner
      .patch(`/accounts/${WEST_USER_ID}/financials`)
      .send({ fixedSalary: 100.5 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.fixedSalaryInteger);
    const after = await db
      .from('accounts')
      .select('fixed_salary')
      .eq('id', WEST_USER_ID)
      .single();
    expect(after.data?.fixed_salary).toBe(before.data?.fixed_salary);
  });

  it('[F-5a L348] reject invalid global retention west — 400, setting unchanged', async () => {
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
      .send({ globalRetentionWest: -1 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(ValidationMessages.globalRetentionRate);
    const after = await db
      .from('system_settings')
      .select('global_retention_west')
      .eq('id', 1)
      .single();
    expect(after.data?.global_retention_west).toBe(before.data?.global_retention_west);
  });
});
