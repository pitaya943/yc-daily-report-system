import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { WRITE_ROUTE_VALIDATORS } from '../../src/write-route-registry';
import { ValidationMessages } from '@yc/validation';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

/** One bad payload per registry row → 4xx Chinese message (B-088). */
const REJECTIONS: Record<
  string,
  { method: 'post' | 'patch' | 'delete'; path: string; body?: object }
> = {
  'auth-sign-in': { method: 'post', path: '/auth/sign-in', body: { displayName: '', password: 'x' } },
  'report-create': {
    method: 'post',
    path: '/reports',
    body: { reportDate: '2099-01-01', quantities: [] },
  },
  'report-update': {
    method: 'patch',
    path: '/reports/00000000-0000-4000-8000-000000000099',
    body: { quantities: [{ itemCode: 'direct_13', qty: 99999 }] },
  },
  'report-delete': {
    method: 'delete',
    path: '/reports/00000000-0000-4000-8000-000000000099',
  },
  'material-request': { method: 'post', path: '/materials/requests', body: { materialId: 'x', quantity: 0 } },
  'material-admin-add': {
    method: 'post',
    path: '/materials/admin/items',
    body: { name: 't', unit: '個', specification: 'x'.repeat(201) },
  },
  'material-admin-update': {
    method: 'post',
    path: '/materials/admin/items/c0000001-0001-4000-8000-000000000001',
    body: { remainingQty: -2, tab: 99 },
  },
  'material-import': {
    method: 'post',
    path: '/materials/admin/import',
    body: { fileName: '' },
  },
  'payroll-calculate': {
    method: 'post',
    path: '/payroll/calculate',
    body: { startDate: '2026-11-10', endDate: '2026-11-01' },
  },
  'ledger-create': {
    method: 'post',
    path: '/ledger/entries',
    body: {
      entryDate: '2026-11-10',
      type: 'INCOME',
      amount: 100,
      description: '測試',
      payerAccountId: 'b0000001-0001-4000-8000-000000000003',
    },
  },
  'ledger-evidence': {
    method: 'post',
    path: '/ledger/entries/00000000-0000-4000-8000-000000000099/evidence',
  },
  'retention-cap': { method: 'patch', path: '/settings/retention-cap', body: { capNtd: -1 } },
  'settings-system': {
    method: 'patch',
    path: '/settings/system',
    body: { tabName1: 'x'.repeat(51) },
  },
  'account-create-admin': { method: 'post', path: '/owner/admins', body: { displayName: '', password: 'x' } },
  'account-create-user': { method: 'post', path: '/accounts/users', body: { displayName: '', password: 'x' } },
  'bank-account': {
    method: 'patch',
    path: '/accounts/b0000001-0001-4000-8000-000000000003/bank',
    body: { bankAccount: '123' },
  },
  'account-financials': {
    method: 'patch',
    path: '/accounts/b0000001-0001-4000-8000-000000000003/financials',
    body: { paymentMethod: 'WIRE' },
  },
  'retention-offset': {
    method: 'patch',
    path: '/accounts/b0000001-0001-4000-8000-000000000003/retention-offset',
    body: { calendarYear: 2026, offsetNtd: 1.5 },
  },
  'password-change': {
    method: 'post',
    path: '/accounts/me/password',
    body: {
      currentPassword: SEED_PASSWORD,
      newPassword: 'newpass01',
      newPasswordConfirm: 'mismatch1',
    },
  },
  'retention-year-end': { method: 'post', path: '/retention/year-end', body: { year: -1 } },
  'archive-daily': { method: 'post', path: '/archives/daily', body: { archiveDate: 'not-a-date' } },
  'auth-sign-out': { method: 'post', path: '/auth/sign-out' },
  'material-approve': {
    method: 'post',
    path: '/materials/requests/00000000-0000-4000-8000-000000000099/approve',
  },
  'material-reject': {
    method: 'post',
    path: '/materials/requests/00000000-0000-4000-8000-000000000099/reject',
  },
  'material-cancel': {
    method: 'post',
    path: '/materials/requests/00000000-0000-4000-8000-000000000099/cancel',
  },
  'material-admin-delete': {
    method: 'delete',
    path: '/materials/admin/items/00000000-0000-4000-8000-000000000099',
  },
  'material-reset': { method: 'post', path: '/materials/admin/reset', body: {} },
  'material-quarantine-a': {
    method: 'post',
    path: '/materials/admin/items/00000000-0000-4000-8000-000000000099/quarantine/keep-a',
  },
  'material-quarantine-b': {
    method: 'post',
    path: '/materials/admin/items/00000000-0000-4000-8000-000000000099/quarantine/sync-b',
  },
  'ledger-void': {
    method: 'post',
    path: '/ledger/entries/00000000-0000-4000-8000-000000000099/void',
  },
  'ledger-delete': {
    method: 'delete',
    path: '/ledger/entries/00000000-0000-4000-8000-000000000099',
  },
  'ledger-settle': {
    method: 'post',
    path: '/ledger/entries/00000000-0000-4000-8000-000000000099/settle',
  },
  'unit-price': {
    method: 'patch',
    path: '/settings/unit-prices/WEST/direct_13',
    body: { price: -1 },
  },
  'account-archive': {
    method: 'post',
    path: '/accounts/b0000001-0001-4000-8000-000000000001/archive',
  },
  'account-restore': {
    method: 'post',
    path: '/accounts/b0000001-0001-4000-8000-000000000099/restore',
  },
  'account-role': {
    method: 'post',
    path: '/accounts/b0000001-0001-4000-8000-000000000001/role',
    body: { role: 'USER' },
  },
  'account-item-retention': {
    method: 'patch',
    path: '/accounts/b0000001-0001-4000-8000-000000000003/item-retention-rates/direct_13',
    body: { rateNtd: -1 },
  },
  'archive-delete': {
    method: 'delete',
    path: '/archives/00000000-0000-4000-8000-000000000099',
  },
  'confirmation-batch-reject': {
    method: 'post',
    path: '/confirmation/batch/reject',
    body: { reportIds: [] },
  },
  'confirmation-batch-confirm': {
    method: 'post',
    path: '/confirmation/batch/confirm',
    body: { reportIds: [] },
  },
  'confirmation-confirm': {
    method: 'post',
    path: '/confirmation/00000000-0000-4000-8000-000000000099/confirm',
  },
  'confirmation-reject': {
    method: 'post',
    path: '/confirmation/00000000-0000-4000-8000-000000000099/reject',
  },
  'statistics-personal-trial': {
    method: 'post',
    path: '/statistics/personal-trial',
    body: { startDate: 'bad', endDate: '2026-11-10' },
  },
  'statistics-summary-export': {
    method: 'post',
    path: '/statistics/summary-export',
    body: { startDate: 'bad', endDate: '2026-11-10' },
  },
};

describeIntegration('B-088 write route rejection per registry', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  const server = () => app.getHttpServer();

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterAll(async () => app.close());

  async function authedAgent(role: 'user' | 'admin' | 'owner') {
    const a = request.agent(server());
    const name =
      role === 'owner' ? 'Kuei' : role === 'admin' ? '種子管理員' : '種子西區';
    await a.post('/auth/sign-in').send({ displayName: name, password: SEED_PASSWORD });
    return a;
  }

  for (const row of WRITE_ROUTE_VALIDATORS) {
    it(`B-088 rejects invalid ${row.validator} (${row.method} ${row.path})`, async () => {
      const spec = REJECTIONS[row.validator];
      expect(spec).toBeDefined();
      const needsOwner =
        row.validator === 'account-financials' ||
        row.validator === 'bank-account' ||
        row.validator === 'account-role' ||
        row.validator === 'account-item-retention' ||
        row.path.startsWith('/owner/') ||
        row.validator === 'account-archive' && spec.path.includes('000001');
      const agent =
        row.validator === 'auth-sign-out'
          ? request.agent(server())
          : row.validator === 'auth-sign-in'
            ? request.agent(server())
            : row.path.startsWith('/reports') && row.validator === 'report-create'
              ? await authedAgent('user')
              : row.path.startsWith('/materials/requests') &&
                  row.validator === 'material-request'
                ? await authedAgent('user')
              : needsOwner
                ? await authedAgent('owner')
                : row.path === '/accounts/users'
                  ? await authedAgent('admin')
                  : await authedAgent('admin');

      let res;
      if (spec.method === 'post') {
        res = await agent.post(spec.path).send(spec.body ?? {});
      } else if (spec.method === 'delete') {
        res = await agent.delete(spec.path);
      } else {
        res = await agent.patch(spec.path).send(spec.body ?? {});
      }
      expect(res.status).toBeGreaterThanOrEqual(400);
      const msg = JSON.stringify(res.body);
      if (res.status === 400) {
        expect(msg).toMatch(/[\u4e00-\u9fff]/);
      }
      if (row.validator === 'payroll-calculate') {
        expect(msg).toContain(ValidationMessages.payrollEndBeforeStart);
      }
      if (row.validator === 'ledger-create') {
        expect(msg).toContain(ValidationMessages.ledgerPayerIncomeOnly);
      }
      if (row.validator === 'password-change') {
        expect(msg).toContain(ValidationMessages.passwordMismatch);
      }
      if (row.validator === 'material-import') {
        expect(msg).toContain(ValidationMessages.importFileInvalid);
      }
    });
  }
});
