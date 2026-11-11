import * as request from 'supertest';
import {
  clearWestUserReportsOnDate,
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { ValidationMessages } from '@yc/validation';
import { taipeiYmd } from '../../src/common/taipei-time';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

const WEST_USER_ID = 'b0000001-0001-4000-8000-000000000003';
const ADMIN_ID = 'b0000001-0001-4000-8000-000000000002';
const OWNER_ID = 'b0000001-0001-4000-8000-000000000001';
const MATERIAL_ID = 'c0000001-0001-4000-8000-000000000001';
const MISSING_ID = '00000000-0000-4000-8000-000000000099';

describeIntegration('R6 T2b — B-088 gaps reject before write', () => {
  jest.setTimeout(120000);
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

  function db() {
    return app.get(SupabaseService).getServiceClient();
  }

  async function sign(name: string) {
    const a = agent();
    const res = await a
      .post('/auth/sign-in')
      .send({ displayName: name, password: SEED_PASSWORD });
    expect(res.status).toBeLessThan(300);
    return a;
  }

  function expectRejected(
    res: { status: number; body: unknown },
    status: number,
    message: string,
  ) {
    expect(res.status).toBe(status);
    expect(JSON.stringify(res.body)).toContain(message);
  }

  async function countOf(table: string) {
    const { count } = await db()
      .from(table)
      .select('id', { count: 'exact', head: true });
    return count ?? 0;
  }

  it('[R6-T2b L307] wrong current password leaves the stored password unchanged', async () => {
    const user = await sign('種子西區');
    const res = await user.post('/accounts/me/password').send({
      currentPassword: 'wrong-password',
      newPassword: 'newpass01',
      newPasswordConfirm: 'newpass01',
    });
    expectRejected(res, 400, ValidationMessages.passwordCurrentIncorrect);
    const still = await request(app.getHttpServer()).post('/auth/sign-in').send({
      displayName: '種子西區',
      password: SEED_PASSWORD,
    });
    expect(still.status).toBeLessThan(300);
    const rejected = await request(app.getHttpServer()).post('/auth/sign-in').send({
      displayName: '種子西區',
      password: 'newpass01',
    });
    expect(rejected.status).toBe(401);
  });

  it('[R6-T2b L318] non-boolean fixedSalaryAddBack writes no payroll run', async () => {
    const before = await countOf('payroll_runs');
    const admin = await sign('種子管理員');
    const today = taipeiYmd();
    const res = await admin.post('/payroll/calculate').send({
      startDate: today,
      endDate: today,
      fixedSalaryAddBack: { [WEST_USER_ID]: 'yes' },
    });
    expectRejected(res, 400, ValidationMessages.fixedSalaryAddBackConfirm);
    expect(await countOf('payroll_runs')).toBe(before);
  });

  it('[R6-T2b L319] non-boolean payFixedEveryPeriod leaves the account unchanged', async () => {
    const before = await db()
      .from('accounts')
      .select('pay_fixed_every_period')
      .eq('id', WEST_USER_ID)
      .single();
    const admin = await sign('種子管理員');
    const res = await admin
      .patch(`/accounts/${WEST_USER_ID}/financials`)
      .send({ payFixedEveryPeriod: 'yes' });
    expectRejected(res, 400, ValidationMessages.payFixedEveryPeriodConfirm);
    const after = await db()
      .from('accounts')
      .select('pay_fixed_every_period')
      .eq('id', WEST_USER_ID)
      .single();
    expect(after.data?.pay_fixed_every_period).toBe(
      before.data?.pay_fixed_every_period,
    );
  });

  it('[R6-T2b L322] future report date inserts no report', async () => {
    const before = await countOf('daily_reports');
    const user = await sign('種子西區');
    const res = await user.post('/reports').send({
      reportDate: '2099-01-01',
      quantities: [{ itemCode: 'direct_13', qty: 1 }],
    });
    expectRejected(res, 400, ValidationMessages.reportDateInvalid);
    expect(await countOf('daily_reports')).toBe(before);
  });

  it('[R6-T2b L323] out-of-range quantity leaves item rows unchanged', async () => {
    const today = taipeiYmd();
    await clearWestUserReportsOnDate(app.get(SupabaseService), today);
    const user = await sign('種子西區');
    const created = await user.post('/reports').send({
      reportDate: today,
      quantities: [{ itemCode: 'direct_13', qty: 1 }],
    });
    expect(created.status).toBe(201);
    const before = await db()
      .from('report_item_quantities')
      .select('qty_units')
      .eq('report_id', created.body.id)
      .eq('item_code', 'direct_13')
      .single();
    const res = await user.patch(`/reports/${created.body.id}`).send({
      quantities: [{ itemCode: 'direct_13', qty: 1000 }],
    });
    expectRejected(res, 400, ValidationMessages.qtyInvalid);
    const after = await db()
      .from('report_item_quantities')
      .select('qty_units')
      .eq('report_id', created.body.id)
      .eq('item_code', 'direct_13')
      .single();
    expect(after.data?.qty_units).toBe(before.data?.qty_units);
  });

  it('[R6-T2b L324] seven collaborators insert no report', async () => {
    const before = await countOf('daily_reports');
    await clearWestUserReportsOnDate(app.get(SupabaseService), '2026-11-06');
    const user = await sign('種子西區');
    const ids = Array.from(
      { length: 7 },
      (_, i) => `f0000001-0001-4000-8000-${String(i).padStart(12, '0')}`,
    );
    const res = await user.post('/reports').send({
      reportDate: '2026-11-06',
      quantities: [{ itemCode: 'direct_13', qty: 1 }],
      collaboratorIds: ids,
    });
    expectRejected(res, 400, ValidationMessages.collaboratorLimit);
    expect(await countOf('daily_reports')).toBe(before);
  });

  it('[R6-T2b L325-L327] invalid custom item fields leave the report unchanged', async () => {
    const today = taipeiYmd();
    await clearWestUserReportsOnDate(app.get(SupabaseService), today);
    const user = await sign('種子西區');
    const created = await user.post('/reports').send({
      reportDate: today,
      quantities: [{ itemCode: 'direct_13', qty: 1 }],
    });
    expect(created.status).toBe(201);
    const id = created.body.id as string;
    const before = await db()
      .from('daily_reports')
      .select('custom_item_name, custom_item_qty_units, custom_item_unit_price')
      .eq('id', id)
      .single();
    const admin = await sign('種子管理員');
    const name = await admin.patch(`/reports/${id}`).send({
      quantities: [{ itemCode: 'direct_13', qty: 1 }],
      customItemName: '名'.repeat(101),
      customItemQty: 1,
      customItemUnitPrice: 1,
    });
    expectRejected(name, 400, ValidationMessages.customItemNameMax);
    const qty = await admin.patch(`/reports/${id}`).send({
      quantities: [{ itemCode: 'direct_13', qty: 1 }],
      customItemName: '合法名稱',
      customItemQty: 0.05,
      customItemUnitPrice: 1,
    });
    expectRejected(qty, 400, ValidationMessages.customItemQty);
    const price = await admin.patch(`/reports/${id}`).send({
      quantities: [{ itemCode: 'direct_13', qty: 1 }],
      customItemName: '合法名稱',
      customItemQty: 1,
      customItemUnitPrice: 1.5,
    });
    expectRejected(price, 400, ValidationMessages.customItemPrice);
    const after = await db()
      .from('daily_reports')
      .select('custom_item_name, custom_item_qty_units, custom_item_unit_price')
      .eq('id', id)
      .single();
    expect(after.data).toEqual(before.data);
  });

  it('[R6-T2b L328-L331] invalid material fields insert no material', async () => {
    const before = await countOf('materials');
    const admin = await sign('種子管理員');
    const code = await admin.post('/materials/admin/items').send({
      name: '編號過長',
      unit: '個',
      code: 'C'.repeat(51),
    });
    expectRejected(code, 400, ValidationMessages.materialCodeMax);
    const name = await admin.post('/materials/admin/items').send({
      name: '   ',
      unit: '個',
    });
    expectRejected(name, 400, ValidationMessages.materialNameRequired);
    const spec = await admin.post('/materials/admin/items').send({
      name: '規格過長',
      unit: '個',
      specification: '規'.repeat(201),
    });
    expectRejected(spec, 400, ValidationMessages.materialSpecificationMax);
    const unit = await admin.post('/materials/admin/items').send({
      name: '缺單位',
      unit: '   ',
    });
    expectRejected(unit, 400, ValidationMessages.materialUnitRequired);
    expect(await countOf('materials')).toBe(before);
  });

  it('[R6-T2b L332-L333] bad remaining, cumulative, and tab leave the material unchanged', async () => {
    const before = await db()
      .from('materials')
      .select('remaining_qty, cumulative_usage, tab, hidden')
      .eq('id', MATERIAL_ID)
      .single();
    const admin = await sign('種子管理員');
    const remaining = await admin
      .post(`/materials/admin/items/${MATERIAL_ID}`)
      .send({ remainingQty: -2 });
    expectRejected(remaining, 400, ValidationMessages.materialQtyRange);
    const cumulative = await admin
      .post(`/materials/admin/items/${MATERIAL_ID}`)
      .send({ cumulativeUsage: -1 });
    expectRejected(cumulative, 400, ValidationMessages.materialQtyRange);
    const tab = await admin
      .post(`/materials/admin/items/${MATERIAL_ID}`)
      .send({ tab: 99 });
    expectRejected(tab, 400, ValidationMessages.materialTabRange);
    const hidden = await admin
      .post(`/materials/admin/items/${MATERIAL_ID}`)
      .send({ hidden: 'yes' });
    expectRejected(hidden, 400, ValidationMessages.materialHiddenConfirm);
    const after = await db()
      .from('materials')
      .select('remaining_qty, cumulative_usage, tab, hidden')
      .eq('id', MATERIAL_ID)
      .single();
    expect(Number(after.data?.remaining_qty)).toBe(Number(before.data?.remaining_qty));
    expect(Number(after.data?.cumulative_usage)).toBe(
      Number(before.data?.cumulative_usage),
    );
    expect(after.data?.tab).toBe(before.data?.tab);
    expect(after.data?.hidden).toBe(before.data?.hidden);
  });

  it('[R6-T2b L334] over-long tab name leaves system settings unchanged', async () => {
    const before = await db()
      .from('system_settings')
      .select('tab_name_1')
      .eq('id', 1)
      .single();
    const admin = await sign('種子管理員');
    const res = await admin
      .patch('/settings/system')
      .send({ tabName1: '頁'.repeat(51) });
    expectRejected(res, 400, ValidationMessages.materialTabNameMax);
    const after = await db()
      .from('system_settings')
      .select('tab_name_1')
      .eq('id', 1)
      .single();
    expect(after.data?.tab_name_1).toBe(before.data?.tab_name_1);
  });

  it('[R6-T2b L335-L336] bad request qty and note insert no request', async () => {
    const before = await countOf('material_requests');
    const user = await sign('種子西區');
    const qty = await user.post('/materials/requests').send({
      materialId: MATERIAL_ID,
      quantity: 0,
    });
    expectRejected(qty, 400, ValidationMessages.materialRequestQty);
    const note = await user.post('/materials/requests').send({
      materialId: MATERIAL_ID,
      quantity: 1,
      note: '註'.repeat(51),
    });
    expectRejected(note, 400, ValidationMessages.materialRequestNoteMax);
    expect(await countOf('material_requests')).toBe(before);
  });

  it('[R6-T2b L337] empty import leaves the comparison label unchanged', async () => {
    const before = await db()
      .from('system_settings')
      .select('inventory_comparison_label')
      .eq('id', 1)
      .single();
    const admin = await sign('種子管理員');
    const res = await admin
      .post('/materials/admin/import')
      .send({ fileName: '' });
    expectRejected(res, 400, ValidationMessages.importFileInvalid);
    const after = await db()
      .from('system_settings')
      .select('inventory_comparison_label')
      .eq('id', 1)
      .single();
    expect(after.data?.inventory_comparison_label).toBe(
      before.data?.inventory_comparison_label,
    );
  });

  it('[R6-T2b L338-L344] invalid ledger fields insert no entry', async () => {
    const before = await countOf('ledger_entries');
    const admin = await sign('種子管理員');
    const date = await admin.post('/ledger/entries').send({
      entryDate: '11/11/2026',
      type: 'EXPENSE',
      amount: 10,
      description: '日期',
    });
    expectRejected(date, 400, ValidationMessages.ledgerDateRequired);
    const type = await admin.post('/ledger/entries').send({
      entryDate: '2026-11-11',
      type: 'WIRE',
      amount: 10,
      description: '類型',
    });
    expectRejected(type, 400, ValidationMessages.ledgerTypeRequired);
    const amount = await admin.post('/ledger/entries').send({
      entryDate: '2026-11-11',
      type: 'EXPENSE',
      amount: 0,
      description: '金額',
    });
    expectRejected(amount, 400, ValidationMessages.ledgerAmountPositive);
    const description = await admin.post('/ledger/entries').send({
      entryDate: '2026-11-11',
      type: 'EXPENSE',
      amount: 10,
      description: '   ',
    });
    expectRejected(description, 400, ValidationMessages.ledgerDescriptionRequired);
    const category = await admin.post('/ledger/entries').send({
      entryDate: '2026-11-11',
      type: 'EXPENSE',
      amount: 10,
      description: '分類',
      category: '不是分類',
    });
    expectRejected(category, 400, ValidationMessages.ledgerCategoryInvalid);
    const note = await admin.post('/ledger/entries').send({
      entryDate: '2026-11-11',
      type: 'EXPENSE',
      amount: 10,
      description: '備註',
      note: '註'.repeat(101),
    });
    expectRejected(note, 400, ValidationMessages.ledgerNoteMax);
    const payer = await admin.post('/ledger/entries').send({
      entryDate: '2026-11-11',
      type: 'INCOME',
      amount: 10,
      description: '支出者',
      payerAccountId: WEST_USER_ID,
    });
    expectRejected(payer, 400, ValidationMessages.ledgerPayerIncomeOnly);
    expect(await countOf('ledger_entries')).toBe(before);
  });

  it('[R6-T2b L345] bad evidence format and size write no evidence file', async () => {
    const admin = await sign('種子管理員');
    const created = await admin.post('/ledger/entries').send({
      entryDate: '2026-11-11',
      type: 'EXPENSE',
      amount: 12,
      description: '憑證拒絕',
    });
    expect(created.status).toBeLessThan(300);
    const id = created.body.id as string;
    const before = await db()
      .from('ledger_entries')
      .select('has_ever_had_evidence')
      .eq('id', id)
      .single();
    const filesBefore = await db()
      .from('ledger_evidence_files')
      .select('id', { count: 'exact', head: true })
      .eq('entry_id', id);
    const format = await admin
      .post(`/ledger/entries/${id}/evidence`)
      .attach('file', Buffer.from('not-a-pdf'), {
        filename: 'note.txt',
        contentType: 'text/plain',
      });
    expectRejected(format, 400, ValidationMessages.evidenceFormatInvalid);
    const size = await admin
      .post(`/ledger/entries/${id}/evidence`)
      .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1), {
        filename: 'big.png',
        contentType: 'image/png',
      });
    expectRejected(size, 400, ValidationMessages.evidenceSizeExceeded);
    const after = await db()
      .from('ledger_entries')
      .select('has_ever_had_evidence')
      .eq('id', id)
      .single();
    const filesAfter = await db()
      .from('ledger_evidence_files')
      .select('id', { count: 'exact', head: true })
      .eq('entry_id', id);
    expect(after.data?.has_ever_had_evidence).toBe(before.data?.has_ever_had_evidence);
    expect(filesAfter.count ?? 0).toBe(filesBefore.count ?? 0);
  });

  it('[R6-T2b L346] evidence blocks delete and a second void does not rewrite voided_at', async () => {
    const admin = await sign('種子管理員');
    const created = await admin.post('/ledger/entries').send({
      entryDate: '2026-11-11',
      type: 'EXPENSE',
      amount: 13,
      description: '不能刪',
    });
    expect(created.status).toBeLessThan(300);
    const id = created.body.id as string;
    const uploaded = await admin
      .post(`/ledger/entries/${id}/evidence`)
      .attach('file', Buffer.from('%PDF-1.4'), {
        filename: 'r.pdf',
        contentType: 'application/pdf',
      });
    expect(uploaded.status).toBeLessThan(300);
    const del = await admin.delete(`/ledger/entries/${id}`);
    expectRejected(del, 400, ValidationMessages.ledgerEvidenceDeleteBlocked);
    const still = await db().from('ledger_entries').select('id').eq('id', id).maybeSingle();
    expect(still.data?.id).toBe(id);

    const other = await admin.post('/ledger/entries').send({
      entryDate: '2026-11-11',
      type: 'EXPENSE',
      amount: 14,
      description: '再作廢',
    });
    expect(other.status).toBeLessThan(300);
    const otherId = other.body.id as string;
    expect((await admin.post(`/ledger/entries/${otherId}/void`)).status).toBeLessThan(300);
    const first = await db()
      .from('ledger_entries')
      .select('voided_at')
      .eq('id', otherId)
      .single();
    const again = await admin.post(`/ledger/entries/${otherId}/void`);
    expectRejected(again, 400, ValidationMessages.ledgerRecordVoided);
    const second = await db()
      .from('ledger_entries')
      .select('voided_at')
      .eq('id', otherId)
      .single();
    expect(second.data?.voided_at).toBe(first.data?.voided_at);
  });

  it('[R6-T2b L350] empty sign-in account does not lock anyone or open a session', async () => {
    const before = await db()
      .from('accounts')
      .select('failed_signin_count')
      .eq('id', WEST_USER_ID)
      .single();
    const res = await request(app.getHttpServer()).post('/auth/sign-in').send({
      displayName: '   ',
      password: SEED_PASSWORD,
    });
    expectRejected(res, 400, ValidationMessages.accountRequired);
    const after = await db()
      .from('accounts')
      .select('failed_signin_count')
      .eq('id', WEST_USER_ID)
      .single();
    expect(after.data?.failed_signin_count).toBe(before.data?.failed_signin_count);
    const session = await request(app.getHttpServer()).get('/auth/session');
    expect(session.body.signedIn).toBe(false);
  });

  it('[R6-T2b L351] wrong password returns the spec sentence and no session', async () => {
    const before = await db()
      .from('accounts')
      .select('role, archived_at')
      .eq('display_name', '種子西區')
      .single();
    const res = await request(app.getHttpServer()).post('/auth/sign-in').send({
      displayName: '種子西區',
      password: 'not-the-password',
    });
    expectRejected(res, 401, ValidationMessages.passwordWrong);
    const session = await request(app.getHttpServer()).get('/auth/session');
    expect(session.body.signedIn).toBe(false);
    const after = await db()
      .from('accounts')
      .select('role, archived_at')
      .eq('display_name', '種子西區')
      .single();
    expect(after.data?.role).toBe(before.data?.role);
    expect(after.data?.archived_at).toBe(before.data?.archived_at);
  });

  it('[R6-T2b L351] the sixth failure returns the lockout sentence and no session', async () => {
    const http = request(app.getHttpServer());
    for (let i = 0; i < 5; i++) {
      const fail = await http.post('/auth/sign-in').send({
        displayName: '種子西區',
        password: 'not-the-password',
      });
      expect(fail.status).toBe(401);
    }
    const locked = await http.post('/auth/sign-in').send({
      displayName: '種子西區',
      password: SEED_PASSWORD,
    });
    expectRejected(locked, 401, ValidationMessages.lockout);
    const session = await http.get('/auth/session');
    expect(session.body.signedIn).toBe(false);
  });

  it('[R6-T2b L352] the fourth report is not inserted', async () => {
    const today = taipeiYmd();
    await clearWestUserReportsOnDate(app.get(SupabaseService), today);
    const user = await sign('種子西區');
    for (let i = 0; i < 3; i++) {
      const ok = await user.post('/reports').send({
        reportDate: today,
        quantities: [{ itemCode: 'direct_13', qty: 0.1 }],
      });
      expect(ok.status).toBe(201);
    }
    const { count: before } = await db()
      .from('daily_reports')
      .select('id', { count: 'exact', head: true })
      .eq('submitter_id', WEST_USER_ID)
      .eq('report_date', today);
    const fourth = await user.post('/reports').send({
      reportDate: today,
      quantities: [{ itemCode: 'direct_13', qty: 0.1 }],
    });
    expectRejected(fourth, 400, ValidationMessages.dailyCap);
    const { count: after } = await db()
      .from('daily_reports')
      .select('id', { count: 'exact', head: true })
      .eq('submitter_id', WEST_USER_ID)
      .eq('report_date', today);
    expect(after).toBe(before);
  });

  it('[R6-T2b L354] non-boolean 10th-payday flag writes no payroll run', async () => {
    const before = await countOf('payroll_runs');
    const admin = await sign('種子管理員');
    const today = taipeiYmd();
    const res = await admin.post('/payroll/calculate').send({
      startDate: today,
      endDate: today,
      is10thPayday: 'yes',
    });
    expectRejected(res, 400, ValidationMessages.is10thPaydayConfirm);
    expect(await countOf('payroll_runs')).toBe(before);
    const user = await sign('種子西區');
    const trial = await user.post('/statistics/personal-trial').send({
      startDate: today,
      endDate: today,
      is10thPayday: 'yes',
    });
    expectRejected(trial, 400, ValidationMessages.is10thPaydayConfirm);
    expect(await countOf('payroll_runs')).toBe(before);
  });

  it('[R6-T2b L355] invalid filter date, zone, account, and action type do not write the audit log', async () => {
    const before = await countOf('audit_log');
    const owner = await sign('Kuei');
    const date = await owner.get('/audit/log').query({ from: 'not-a-date' });
    expectRejected(date, 400, ValidationMessages.filterInvalid);
    const zone = await owner.get('/confirmation/pending').query({ zone: 'EAST' });
    expectRejected(zone, 400, ValidationMessages.filterInvalid);
    const account = await owner.get('/audit/log').query({ account: '不存在的帳戶' });
    expectRejected(account, 400, ValidationMessages.filterInvalid);
    const action = await owner.get('/audit/log').query({ actionType: 'NOT_A_TYPE' });
    expectRejected(action, 400, ValidationMessages.filterInvalid);
    expect(await countOf('audit_log')).toBe(before);
  });

  it('[R6-T2b L356] missing date, bad type, and bad source insert no archive', async () => {
    const before = await countOf('archives');
    const admin = await sign('種子管理員');
    const missing = await admin.post('/archives/daily').send({});
    expectRejected(missing, 400, ValidationMessages.archiveTypeAndDate);
    const type = await admin.post('/archives/daily').send({
      archiveDate: '2024-03-03',
      type: 'WEEKLY',
    });
    expectRejected(type, 400, ValidationMessages.archiveTypeAndDate);
    const source = await admin.post('/archives/daily').send({
      archiveDate: '2024-03-04',
      type: 'DAILY',
      source: 'NOPE',
    });
    expectRejected(source, 400, ValidationMessages.archiveTypeAndDate);
    expect(await countOf('archives')).toBe(before);
  });

  it('[R6-T2b L357] a non-year does not insert a settlement', async () => {
    const before = await countOf('retention_year_end_settlements');
    const admin = await sign('種子管理員');
    const res = await admin.post('/retention/year-end').send({ calendarYear: -1 });
    expectRejected(res, 400, ValidationMessages.yearEndRequired);
    expect(await countOf('retention_year_end_settlements')).toBe(before);
  });

  it('[R6-T2b L358] archive self, owner, and another admin leave archived_at unchanged', async () => {
    const admin = await sign('種子管理員');
    const selfBefore = await db()
      .from('accounts')
      .select('archived_at')
      .eq('id', ADMIN_ID)
      .single();
    const self = await admin.post(`/accounts/${ADMIN_ID}/archive`);
    expectRejected(self, 403, ValidationMessages.cannotArchiveSelf);
    const selfAfter = await db()
      .from('accounts')
      .select('archived_at')
      .eq('id', ADMIN_ID)
      .single();
    expect(selfAfter.data?.archived_at).toBe(selfBefore.data?.archived_at);

    const ownerBefore = await db()
      .from('accounts')
      .select('archived_at')
      .eq('id', OWNER_ID)
      .single();
    const owner = await admin.post(`/accounts/${OWNER_ID}/archive`);
    expectRejected(owner, 400, ValidationMessages.cannotArchiveOwner);
    const ownerAfter = await db()
      .from('accounts')
      .select('archived_at')
      .eq('id', OWNER_ID)
      .single();
    expect(ownerAfter.data?.archived_at).toBe(ownerBefore.data?.archived_at);

    const ownerSession = await sign('Kuei');
    const name = `T2b副管${Date.now()}`;
    const created = await ownerSession
      .post('/owner/admins')
      .send({ displayName: name, password: 'admin001' });
    expect(created.status).toBeLessThan(300);
    const target = await db()
      .from('accounts')
      .select('id, archived_at')
      .eq('display_name', name)
      .single();
    const blocked = await admin.post(`/accounts/${target.data?.id}/archive`);
    expectRejected(blocked, 403, ValidationMessages.accessDenied);
    const targetAfter = await db()
      .from('accounts')
      .select('archived_at')
      .eq('id', target.data?.id)
      .single();
    expect(targetAfter.data?.archived_at).toBeNull();
  });

  it('[R6-T2b L359] ADMIN cannot change another ADMIN financials', async () => {
    const owner = await sign('Kuei');
    const name = `T2b財務${Date.now()}`;
    const created = await owner
      .post('/owner/admins')
      .send({ displayName: name, password: 'admin001' });
    expect(created.status).toBeLessThan(300);
    const target = await db()
      .from('accounts')
      .select('id, payment_method')
      .eq('display_name', name)
      .single();
    const admin = await sign('種子管理員');
    const res = await admin
      .patch(`/accounts/${target.data?.id}/financials`)
      .send({ paymentMethod: 'CASH' });
    expectRejected(res, 403, ValidationMessages.accessDenied);
    const after = await db()
      .from('accounts')
      .select('payment_method')
      .eq('id', target.data?.id)
      .single();
    expect(after.data?.payment_method).toBe(target.data?.payment_method);
  });

  it('[R6-T2b confirmation] empty and unknown ids confirm nothing', async () => {
    const today = taipeiYmd();
    await clearWestUserReportsOnDate(app.get(SupabaseService), today);
    const user = await sign('種子西區');
    const created = await user.post('/reports').send({
      reportDate: today,
      quantities: [{ itemCode: 'direct_13', qty: 1 }],
    });
    expect(created.status).toBe(201);
    const admin = await sign('種子管理員');
    const empty = await admin
      .post('/confirmation/batch/confirm')
      .send({ reportIds: [] });
    expectRejected(empty, 400, ValidationMessages.confirmationNotFound);
    const mixed = await admin.post('/confirmation/batch/confirm').send({
      reportIds: [created.body.id, MISSING_ID],
    });
    expectRejected(mixed, 400, ValidationMessages.confirmationNotFound);
    const row = await db()
      .from('daily_reports')
      .select('status')
      .eq('id', created.body.id)
      .single();
    expect(row.data?.status).toBe('PENDING');
  });

  it('[R6-T2b material reset] confirm false leaves quantities unchanged', async () => {
    const before = await db()
      .from('materials')
      .select('remaining_qty')
      .eq('id', MATERIAL_ID)
      .single();
    const admin = await sign('種子管理員');
    const res = await admin.post('/materials/admin/reset').send({ confirm: false });
    expectRejected(res, 400, ValidationMessages.materialResetConfirm);
    const after = await db()
      .from('materials')
      .select('remaining_qty')
      .eq('id', MATERIAL_ID)
      .single();
    expect(Number(after.data?.remaining_qty)).toBe(Number(before.data?.remaining_qty));
  });

  it('[R6-T2b calendarYear] a fractional year does not upsert an offset', async () => {
    const before = await db()
      .from('retention_offsets')
      .select('account_id', { count: 'exact', head: true });
    const owner = await sign('Kuei');
    const res = await owner
      .patch(`/accounts/${WEST_USER_ID}/retention-offset`)
      .send({ calendarYear: 1.5, offsetNtd: 0 });
    expectRejected(res, 400, ValidationMessages.yearEndRequired);
    const after = await db()
      .from('retention_offsets')
      .select('account_id', { count: 'exact', head: true });
    expect(after.count ?? 0).toBe(before.count ?? 0);
  });

  it('[R6-T2b valid] boolean flags, a short ledger note, and a dated archive still succeed', async () => {
    const admin = await sign('種子管理員');
    const today = taipeiYmd();
    const payroll = await admin.post('/payroll/calculate').send({
      startDate: today,
      endDate: today,
      is10thPayday: false,
      fixedSalaryAddBack: { [WEST_USER_ID]: false },
    });
    expect(payroll.status).toBeLessThan(300);

    const beforePay = await db()
      .from('accounts')
      .select('pay_fixed_every_period')
      .eq('id', WEST_USER_ID)
      .single();
    const fin = await admin
      .patch(`/accounts/${WEST_USER_ID}/financials`)
      .send({ payFixedEveryPeriod: false });
    expect(fin.status).toBeLessThan(300);
    await db()
      .from('accounts')
      .update({ pay_fixed_every_period: beforePay.data?.pay_fixed_every_period })
      .eq('id', WEST_USER_ID);

    const entry = await admin.post('/ledger/entries').send({
      entryDate: '2026-11-11',
      type: 'EXPENSE',
      amount: 15,
      description: '有效備註',
      note: '短備註',
    });
    expect(entry.status).toBeLessThan(300);
    const stored = await db()
      .from('ledger_entries')
      .select('note')
      .eq('id', entry.body.id)
      .single();
    expect(stored.data?.note).toBe('短備註');

    const archive = await admin.post('/archives/daily').send({
      archiveDate: '2024-03-05',
      type: 'DAILY',
      source: 'MANUAL',
    });
    expect(archive.status).toBeLessThan(300);
    expect(archive.body.id).toBeTruthy();
  });
});
