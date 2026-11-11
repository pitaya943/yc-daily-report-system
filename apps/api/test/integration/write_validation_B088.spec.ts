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
  'material-import': { method: 'post', path: '/materials/admin/import' },
  'payroll-calculate': {
    method: 'post',
    path: '/payroll/calculate',
    body: { startDate: '2026-11-10', endDate: '2026-11-01' },
  },
  'ledger-create': {
    method: 'post',
    path: '/ledger/entries',
    body: { entryDate: '2026-11-10', type: 'INCOME', amount: 0, description: 'x' },
  },
  'ledger-evidence': {
    method: 'post',
    path: '/ledger/entries/00000000-0000-4000-8000-000000000099/evidence',
  },
  'retention-cap': { method: 'patch', path: '/settings/retention-cap', body: { capNtd: -1 } },
  'account-create-admin': { method: 'post', path: '/owner/admins', body: { displayName: '', password: 'x' } },
  'account-create-user': { method: 'post', path: '/accounts/users', body: { displayName: '', password: 'x' } },
  'bank-account': {
    method: 'patch',
    path: '/accounts/b0000001-0001-4000-8000-000000000003/bank',
    body: { bankAccount: '123' },
  },
  'retention-year-end': { method: 'post', path: '/retention/year-end', body: { year: -1 } },
  'archive-daily': { method: 'post', path: '/archives/daily', body: { archiveDate: 'not-a-date' } },
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
      const agent =
        row.path.startsWith('/reports') && row.validator === 'report-create'
          ? await authedAgent('user')
          : row.path.startsWith('/materials/requests')
            ? await authedAgent('user')
            : row.path.startsWith('/owner/')
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
        expect(msg).toContain(ValidationMessages.ledgerAmountPositive);
      }
    });
  }
});
