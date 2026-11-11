import * as request from 'supertest';
import { randomUUID } from 'crypto';
import {
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';
import { SupabaseService } from '../../src/supabase/supabase.service';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

const SEED_ADMIN_ID = 'b0000001-0001-4000-8000-000000000002';
const WEST_USER_ID = 'b0000001-0001-4000-8000-000000000003';

/** B-034 per-item retention — canonical write route (fix round must add; not mounted today). */
const perItemRetentionPath = (accountId: string, itemCode: string) =>
  `/accounts/${accountId}/item-retention-rates/${itemCode}`;

const SPEC = {
  duplicateDisplayName: '此顯示名稱已被使用',
  passwordCurrentIncorrect: '目前密碼不正確',
  zoneRequired: '請選擇施工區域',
  bigMeterBeforeAdmin: '請先關閉大表旗標，再切換為管理員',
  transferNeedsBank: '請先設定銀行帳號再改為轉帳',
  insuranceEnrolledMin: '已投保時，扣除額須至少為 1',
  filterInvalid: '請輸入有效的篩選條件',
  perItemRetentionRate: '保留金費率須為 0 到 9999 的整數（NTD/只）',
  unitPrice: '單價須為 0 或正數，最多兩位小數',
  voidedLedger: '此紀錄已作廢',
  passwordMismatch: '兩次輸入的密碼不一致',
};

describeIntegration('Vera round 4 — failing acceptance tests (step 1)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  const agent = () => request.agent(app.getHttpServer());

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterEach(async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const { data } = await db
      .from('accounts')
      .select('auth_user_id')
      .eq('id', SEED_ADMIN_ID)
      .single();
    if (data?.auth_user_id) {
      await db.auth.admin.updateUserById(data.auth_user_id, {
        password: SEED_PASSWORD,
      });
    }
    await restoreWestUserFinancials(db);
  });

  afterAll(async () => app.close());

  async function restoreWestUserFinancials(
    db: ReturnType<SupabaseService['getServiceClient']>,
  ) {
    await db
      .from('accounts')
      .update({
        payment_method: 'TRANSFER',
        bank_account_ciphertext: null,
        bank_account_last4: '1234',
        insurance_deduction: 0,
      })
      .eq('id', WEST_USER_ID);
  }

  async function countAccessDenied(actorId: string) {
    const db = app.get(SupabaseService).getServiceClient();
    const { count } = await db
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('actor_id', actorId)
      .eq('action_type', 'ACCESS_DENIED');
    return count ?? 0;
  }

  async function assertExactlyOneNewAccessDenied(
    actorId: string,
    beforeCount: number,
    assertDescription: (description: string) => void,
  ) {
    const db = app.get(SupabaseService).getServiceClient();
    const afterCount = await countAccessDenied(actorId);
    expect(afterCount).toBe(beforeCount + 1);
    const { data } = await db
      .from('audit_log')
      .select('description, occurred_at')
      .eq('actor_id', actorId)
      .eq('action_type', 'ACCESS_DENIED')
      .order('occurred_at', { ascending: false })
      .limit(1);
    const row = data?.[0];
    expect(row).toBeTruthy();
    assertDescription(String(row?.description ?? ''));
  }

  async function createOtherAdmin(owner: ReturnType<typeof agent>) {
    const db = app.get(SupabaseService).getServiceClient();
    const name = `R4副管理員${Date.now()}`;
    await owner
      .post('/owner/admins')
      .send({ displayName: name, password: 'admin001' })
      .expect((r) => expect(r.status).toBeLessThan(300));
    const { data } = await db
      .from('accounts')
      .select(
        'id, payment_method, role, fixed_salary, bank_account_last4, bank_account_ciphertext',
      )
      .eq('display_name', name)
      .single();
    return data!;
  }

  it('[R4-1] ADMIN cannot PATCH financials on another ADMIN — row unchanged + ACCESS_DENIED', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const target = await createOtherAdmin(owner);
    const before = await db
      .from('accounts')
      .select('payment_method, fixed_salary')
      .eq('id', target.id)
      .single();

    const deniedBefore = await countAccessDenied(SEED_ADMIN_ID);
    const admin = agent();
    await admin
      .post('/auth/sign-in')
      .send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin
      .patch(`/accounts/${target.id}/financials`)
      .send({ paymentMethod: 'CASH' });
    expect(res.status).toBe(403);

    const after = await db
      .from('accounts')
      .select('payment_method, fixed_salary')
      .eq('id', target.id)
      .single();
    expect(after.data).toEqual(before.data);

    await assertExactlyOneNewAccessDenied(SEED_ADMIN_ID, deniedBefore, (d) => {
      expect(d).toContain('已拒絕');
    });
  });

  it('[R4-1] ADMIN cannot PATCH bank on another ADMIN — row unchanged + ACCESS_DENIED', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const target = await createOtherAdmin(owner);
    const before = await db
      .from('accounts')
      .select('bank_account_last4, bank_account_ciphertext')
      .eq('id', target.id)
      .single();

    const deniedBefore = await countAccessDenied(SEED_ADMIN_ID);
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin
      .patch(`/accounts/${target.id}/bank`)
      .send({ bankAccount: '12345678901234' });
    expect(res.status).toBe(403);

    const after = await db
      .from('accounts')
      .select('bank_account_last4, bank_account_ciphertext')
      .eq('id', target.id)
      .single();
    expect(after.data?.bank_account_last4).toBe(before.data?.bank_account_last4);
    expect(after.data?.bank_account_ciphertext).toBe(
      before.data?.bank_account_ciphertext,
    );

    await assertExactlyOneNewAccessDenied(SEED_ADMIN_ID, deniedBefore, (d) => {
      expect(d).toContain('已拒絕');
    });
  });

  it('[R4-1] ADMIN cannot POST role on another ADMIN — role unchanged + ACCESS_DENIED', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const target = await createOtherAdmin(owner);

    const deniedBefore = await countAccessDenied(SEED_ADMIN_ID);
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin
      .post(`/accounts/${target.id}/role`)
      .send({ role: 'USER' });
    expect(res.status).toBe(403);

    const row = await db.from('accounts').select('role').eq('id', target.id).single();
    expect(row.data?.role).toBe('ADMIN');

    await assertExactlyOneNewAccessDenied(SEED_ADMIN_ID, deniedBefore, (d) => {
      expect(d).toContain('已拒絕');
    });
  });

  it('[R4-1] OWNER can PATCH financials / bank / role on another ADMIN with read-back', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const target = await createOtherAdmin(owner);

    try {
      const fin = await owner
        .patch(`/accounts/${target.id}/financials`)
        .send({ fixedSalary: 3210 });
      expect(fin.status).toBeLessThan(300);
      const afterFin = await db
        .from('accounts')
        .select('fixed_salary')
        .eq('id', target.id)
        .single();
      expect(afterFin.data?.fixed_salary).toBe(3210);

      const bank = await owner
        .patch(`/accounts/${target.id}/bank`)
        .send({ bankAccount: '12345678901234' });
      expect(bank.status).toBeLessThan(300);
      const afterBank = await db
        .from('accounts')
        .select('bank_account_last4')
        .eq('id', target.id)
        .single();
      expect(afterBank.data?.bank_account_last4).toBe('1234');

      const roleDown = await owner
        .post(`/accounts/${target.id}/role`)
        .send({ role: 'USER' });
      expect(roleDown.status).toBeLessThan(300);
      const afterRole = await db
        .from('accounts')
        .select('role')
        .eq('id', target.id)
        .single();
      expect(afterRole.data?.role).toBe('USER');
    } finally {
      await owner
        .patch(`/accounts/${target.id}/financials`)
        .send({ fixedSalary: 0 });
      await db
        .from('accounts')
        .update({
          role: 'ADMIN',
          bank_account_ciphertext: null,
          bank_account_last4: null,
        })
        .eq('id', target.id);
    }
  });

  it('[R4-2] ACCESS_DENIED audit names financials attempt — not owner_admin_management bucket', async () => {
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const target = await createOtherAdmin(owner);

    const deniedBefore = await countAccessDenied(SEED_ADMIN_ID);
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    await admin
      .patch(`/accounts/${target.id}/financials`)
      .send({ paymentMethod: 'CASH' });

    await assertExactlyOneNewAccessDenied(SEED_ADMIN_ID, deniedBefore, (d) => {
      expect(d).toContain('已拒絕');
      expect(d).not.toContain('owner_admin_management');
      expect(d).toMatch(/financials|財務|FINANCIAL/i);
    });
  });

  it('[R4-2] ACCESS_DENIED audit names bank attempt — not owner_admin_management bucket', async () => {
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const target = await createOtherAdmin(owner);

    const deniedBefore = await countAccessDenied(SEED_ADMIN_ID);
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    await admin
      .patch(`/accounts/${target.id}/bank`)
      .send({ bankAccount: '12345678901234' });

    await assertExactlyOneNewAccessDenied(SEED_ADMIN_ID, deniedBefore, (d) => {
      expect(d).toContain('已拒絕');
      expect(d).not.toContain('owner_admin_management');
      expect(d).toMatch(/bank|銀行|BANK/i);
    });
  });

  it('[R4-2] ACCESS_DENIED audit names role change — not owner_admin_management bucket', async () => {
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const target = await createOtherAdmin(owner);

    const deniedBefore = await countAccessDenied(SEED_ADMIN_ID);
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    await admin.post(`/accounts/${target.id}/role`).send({ role: 'USER' });

    await assertExactlyOneNewAccessDenied(SEED_ADMIN_ID, deniedBefore, (d) => {
      expect(d).toContain('已拒絕');
      expect(d).not.toContain('owner_admin_management');
      expect(d).toMatch(/role|角色|ROLE/i);
    });
  });

  it('[R4-3] ADMIN can PATCH USER financials paymentMethod CASH with read-back', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    await db
      .from('accounts')
      .update({ payment_method: 'TRANSFER' })
      .eq('id', WEST_USER_ID);

    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin
      .patch(`/accounts/${WEST_USER_ID}/financials`)
      .send({ paymentMethod: 'CASH' });
    expect(res.status).toBe(200);

    const row = await db
      .from('accounts')
      .select('payment_method')
      .eq('id', WEST_USER_ID)
      .single();
    expect(row.data?.payment_method).toBe('CASH');
  });

  it('[R4-4] POST /accounts/me/password without confirm → 400 and password unchanged', async () => {
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin.post('/accounts/me/password').send({
      currentPassword: SEED_PASSWORD,
      newPassword: 'newpass9',
    });
    expect(res.status).toBe(400);
    expect(String(res.body.message)).toContain(SPEC.passwordMismatch);

    const again = agent();
    const signIn = await again.post('/auth/sign-in').send({
      displayName: '種子管理員',
      password: SEED_PASSWORD,
    });
    expect(signIn.status).toBeLessThan(300);
  });

  it('[R4-4] POST /accounts/me/password with mismatched confirm → 400 and password unchanged', async () => {
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin.post('/accounts/me/password').send({
      currentPassword: SEED_PASSWORD,
      newPassword: 'newpass9',
      newPasswordConfirm: 'otherpass',
    });
    expect(res.status).toBe(400);
    expect(String(res.body.message)).toContain(SPEC.passwordMismatch);

    const again = agent();
    const signIn = await again.post('/auth/sign-in').send({
      displayName: '種子管理員',
      password: SEED_PASSWORD,
    });
    expect(signIn.status).toBeLessThan(300);
  });

  it('[R4-5] reject duplicate display name', async () => {
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const res = await owner.post('/owner/admins').send({
      displayName: '種子管理員',
      password: 'admin001',
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(SPEC.duplicateDisplayName);
  });

  it('[R4-5] reject wrong current password', async () => {
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin.post('/accounts/me/password').send({
      currentPassword: 'wrong-password',
      newPassword: 'newpass9',
      newPasswordConfirm: 'newpass9',
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(SPEC.passwordCurrentIncorrect);
  });

  it('[R4-5] reject user create without zone', async () => {
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin.post('/accounts/users').send({
      displayName: `R4用戶${Date.now()}`,
      password: 'userpass1',
      zone: 'INVALID' as never,
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(SPEC.zoneRequired);
  });

  it('[R4-5] reject role ADMIN when big_meter is on', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const userId = 'b0000001-0001-4000-8000-000000000005';
    await db.from('accounts').update({ big_meter: true, role: 'USER' }).eq('id', userId);
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const res = await owner.post(`/accounts/${userId}/role`).send({ role: 'ADMIN' });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(SPEC.bigMeterBeforeAdmin);
    await db.from('accounts').update({ big_meter: true, role: 'USER' }).eq('id', userId);
  });

  it('[R4-5] reject TRANSFER without bank account', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const prev = await db
      .from('accounts')
      .select('payment_method, bank_account_ciphertext, bank_account_last4')
      .eq('id', WEST_USER_ID)
      .single();
    try {
      await db
        .from('accounts')
        .update({
          payment_method: 'CASH',
          bank_account_ciphertext: null,
          bank_account_last4: null,
        })
        .eq('id', WEST_USER_ID);
      const owner = agent();
      await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
      const res = await owner
        .patch(`/accounts/${WEST_USER_ID}/financials`)
        .send({ paymentMethod: 'TRANSFER' });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain(SPEC.transferNeedsBank);
    } finally {
      await db
        .from('accounts')
        .update({
          payment_method: prev.data?.payment_method ?? 'TRANSFER',
          bank_account_ciphertext: prev.data?.bank_account_ciphertext ?? null,
          bank_account_last4: prev.data?.bank_account_last4 ?? null,
        })
        .eq('id', WEST_USER_ID);
    }
  });

  it('[R4-5] reject enrolled insurance choice with deduction 0', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const prev = await db
      .from('accounts')
      .select('insurance_deduction, uninsured_exempt')
      .eq('id', WEST_USER_ID)
      .single();
    try {
      await db
        .from('accounts')
        .update({ insurance_deduction: 834, uninsured_exempt: false })
        .eq('id', WEST_USER_ID);
      const owner = agent();
      await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
      const res = await owner
        .patch(`/accounts/${WEST_USER_ID}/financials`)
        .send({ insuranceEnrollment: 'ENROLLED', insuranceDeduction: 0 });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain(SPEC.insuranceEnrolledMin);
      const row = await db
        .from('accounts')
        .select('insurance_deduction')
        .eq('id', WEST_USER_ID)
        .single();
      expect(row.data?.insurance_deduction).toBe(834);
    } finally {
      await db
        .from('accounts')
        .update({
          insurance_deduction: prev.data?.insurance_deduction ?? 0,
          uninsured_exempt: prev.data?.uninsured_exempt ?? false,
        })
        .eq('id', WEST_USER_ID);
    }
  });

  it('[R4-5] switching to not-enrolled with deduction 0 succeeds', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const prev = await db
      .from('accounts')
      .select('insurance_deduction, uninsured_exempt')
      .eq('id', WEST_USER_ID)
      .single();
    try {
      await db
        .from('accounts')
        .update({ insurance_deduction: 834, uninsured_exempt: false })
        .eq('id', WEST_USER_ID);
      const owner = agent();
      await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
      const res = await owner
        .patch(`/accounts/${WEST_USER_ID}/financials`)
        .send({ insuranceEnrollment: 'NOT_ENROLLED', insuranceDeduction: 0 });
      expect(res.status).toBe(200);
      const row = await db
        .from('accounts')
        .select('insurance_deduction, uninsured_exempt')
        .eq('id', WEST_USER_ID)
        .single();
      expect(row.data?.insurance_deduction).toBe(0);
      expect(row.data?.uninsured_exempt).toBe(false);
    } finally {
      await db
        .from('accounts')
        .update({
          insurance_deduction: prev.data?.insurance_deduction ?? 0,
          uninsured_exempt: prev.data?.uninsured_exempt ?? false,
        })
        .eq('id', WEST_USER_ID);
    }
  });

  it('[R4-5] reject invalid audit/history filter', async () => {
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const res = await owner.get('/audit/log').query({ from: 'not-a-date' });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(SPEC.filterInvalid);
  });

  it('[R4-5] reject invalid per-item retention rate on canonical B-034 route', async () => {
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const res = await owner
      .patch(perItemRetentionPath(WEST_USER_ID, 'direct_13'))
      .send({ rateNtd: -1 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(SPEC.perItemRetentionRate);
  });

  it('[R4-5] reject invalid unit price (pinned seed state)', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const seededPrice = 120;
    await db.from('unit_prices').upsert({
      price_set: 'WEST',
      item_code: 'direct_13',
      price: seededPrice,
    });
    const { data: beforeRow } = await db
      .from('unit_prices')
      .select('price')
      .eq('price_set', 'WEST')
      .eq('item_code', 'direct_13')
      .single();

    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin
      .patch('/settings/unit-prices/WEST/direct_13')
      .send({ price: -1 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain(SPEC.unitPrice);

    const { data: afterRow } = await db
      .from('unit_prices')
      .select('price')
      .eq('price_set', 'WEST')
      .eq('item_code', 'direct_13')
      .single();
    expect(afterRow?.price).toBe(beforeRow?.price);
  });

  it('[R4-6] voiding an already-voided ledger entry returns 400', async () => {
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const created = await admin.post('/ledger/entries').send({
      entryDate: '2026-11-10',
      type: 'EXPENSE',
      amount: 100,
      description: 'R4 void test',
    });
    expect(created.status).toBeLessThan(300);
    const id = created.body.id as string;
    await admin.post(`/ledger/entries/${id}/void`).expect((r) =>
      expect(r.status).toBeLessThan(300),
    );
    const again = await admin.post(`/ledger/entries/${id}/void`);
    expect(again.status).toBe(400);
    expect(String(again.body.message)).toContain(SPEC.voidedLedger);
  });

  it('[R4-8] GET missing report returns Chinese 404 — not English Not Found', async () => {
    const admin = agent();
    await admin.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await admin.get(`/reports/${randomUUID()}`);
    expect(res.status).toBe(404);
    expect(String(res.body.message)).toMatch(/[\u4e00-\u9fff]/);
    expect(String(res.body.message)).not.toMatch(/Not Found/i);
  });
});
