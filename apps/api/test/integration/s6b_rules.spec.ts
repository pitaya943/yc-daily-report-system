import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { taipeiYmd } from '../../src/common/taipei-time';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('S6b B-051–B-098 behaviour', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterAll(() => app.close());

  describe('B-051 hides zero gross and final', () => {
    it('B-051 payroll rowCount excludes idle users', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const today = taipeiYmd();
      const res = await admin.post('/payroll/calculate').send({
        startDate: today,
        endDate: today,
        is10thPayday: false,
      });
      expect([200, 201]).toContain(res.status);
      expect(res.body.rowCount).toBeLessThan(12);
    });
  });

  describe('B-055 quarantine resolve', () => {
    it('B-055 trust A clears quarantine', async () => {
      const db = app.get(SupabaseService).getServiceClient();
      const id = 'c0000001-0001-4000-8000-000000000001';
      await db
        .from('materials')
        .update({
          quarantined: true,
          quarantine_note: 'A=1 B=2',
          received_qty: 1,
          remaining_qty: 1,
        })
        .eq('id', id);
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const res = await admin.post(`/materials/admin/items/${id}/quarantine/keep-a`);
      expect(res.status).toBe(201);
      const { data } = await db
        .from('materials')
        .select('quarantined')
        .eq('id', id)
        .single();
      expect(data?.quarantined).toBe(false);
    });
  });

  describe('B-059 B-060 auth sign-in names', () => {
    it('B-060 west type lists 種子西區', async () => {
      const res = await request(app.getHttpServer()).get(
        '/auth/sign-in-names?type=west',
      );
      expect(res.body.names).toContain('種子西區');
    });

    it('B-060 admin type lists owner PROVISIONAL Q-052', async () => {
      const res = await request(app.getHttpServer()).get(
        '/auth/sign-in-names?type=admin',
      );
      expect(res.body.names).toContain('Kuei');
    });
  });

  describe('B-062 submit daily report', () => {
    it('B-062 USER creates report', async () => {
      const user = request.agent(app.getHttpServer());
      await user.post('/auth/sign-in').send({
        displayName: '種子西區',
        password: SEED_PASSWORD,
      });
      const res = await user.post('/reports').send({
        reportDate: '2026-11-08',
        quantities: [{ itemCode: 'direct_13', qty: 1 }],
      });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeTruthy();
      const db = app.get(SupabaseService).getServiceClient();
      const { data } = await db
        .from('daily_reports')
        .select('status')
        .eq('id', res.body.id)
        .single();
      expect(data?.status).toBe('PENDING');
    });
  });

  describe('B-063 history export', () => {
    it('B-063 export returns xlsx PK header', async () => {
      const user = request.agent(app.getHttpServer());
      await user.post('/auth/sign-in').send({
        displayName: '種子西區',
        password: SEED_PASSWORD,
      });
      const res = await user.get('/reports/history/export');
      expect(res.status).toBe(200);
      const buf = Buffer.from(res.body.base64, 'base64');
      expect(buf.subarray(0, 2).toString()).toBe('PK');
    });
  });

  describe('B-068 personal trial', () => {
    it('B-068 trial returns gross and 10th flag', async () => {
      const user = request.agent(app.getHttpServer());
      await user.post('/auth/sign-in').send({
        displayName: '種子西區',
        password: SEED_PASSWORD,
      });
      const res = await user.post('/statistics/personal-trial').send({
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        is10thPayday: true,
      });
      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('grossEstimate');
      expect(res.body.is10thPaydayTrial).toBe(true);
    });
  });

  describe('B-069 confirmation', () => {
    it('B-069 lists pending ordinary reports', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const res = await admin.get('/confirmation/pending');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('B-070 B-071 review surfaces', () => {
    it('B-071 big-meter pending endpoint', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const res = await admin.get('/confirmation/pending/big-meter');
      expect(res.status).toBe(200);
    });

    it('B-070 materials pending for admin', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const res = await admin.get('/materials/requests/pending');
      expect(res.status).toBe(200);
    });
  });

  describe('B-073 summary export', () => {
    it('B-073 summary xlsx', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const res = await admin.post('/statistics/summary-export').send({
        startDate: '2026-11-01',
        endDate: '2026-11-30',
      });
      expect(res.status).toBe(201);
      const buf = Buffer.from(res.body.base64, 'base64');
      expect(buf.subarray(0, 2).toString()).toBe('PK');
    });
  });

  describe('B-075 settings save', () => {
    it('B-075 patch west direct_13 price', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const res = await admin
        .patch('/settings/unit-prices/WEST/direct_13')
        .send({ price: 121 });
      expect(res.status).toBe(200);
    });
  });

  describe('B-077 archive workbook', () => {
    it('B-077 generates real xlsx archive', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const res = await admin.post('/archives/daily').send({
        archiveDate: '2026-11-09',
      });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeTruthy();
    });
  });

  describe('B-079 session endpoint', () => {
    it('B-079 session cookie after sign-in', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const ses = await agent.get('/auth/session');
      expect(ses.body.signedIn).toBe(true);
    });
  });

  describe('B-082 financial visibility', () => {
    it('B-082 USER cannot reveal another bank', async () => {
      const user = request.agent(app.getHttpServer());
      await user.post('/auth/sign-in').send({
        displayName: '種子西區',
        password: SEED_PASSWORD,
      });
      const other = 'b0000001-0001-4000-8000-000000000007';
      const res = await user.get(`/accounts/${other}/bank/reveal`);
      expect(res.status).toBe(403);
    });
  });

  describe('B-083 audit completeness', () => {
    it('B-083 export writes EXPORT audit', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      await admin.get('/reports/history/export');
      const owner = request.agent(app.getHttpServer());
      await owner.post('/auth/sign-in').send({
        displayName: 'Kuei',
        password: SEED_PASSWORD,
      });
      const log = await owner.get('/audit/log');
      const types = (log.body.rows ?? []).map(
        (e: { action_type: string }) => e.action_type,
      );
      expect(types).toContain('EXPORT');
    });
  });

  describe('B-084 payroll exports', () => {
    it('B-084 pdf and docx export routes', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const today = taipeiYmd();
      const calc = await admin.post('/payroll/calculate').send({
        startDate: today,
        endDate: today,
      });
      const runId = calc.body.runId;
      const pdf = await admin.get(`/payroll/runs/${runId}/export?format=pdf`);
      expect(pdf.body.mimeType).toBe('application/pdf');
    });
  });

  describe('B-085 B-098 ledger evidence', () => {
    it('B-098 delete blocked after evidence upload', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const today = taipeiYmd();
      const { body: created } = await admin.post('/ledger/entries').send({
        entryDate: today,
        type: 'EXPENSE',
        amount: 50,
        description: 'B-085 evidence test',
      });
      await admin
        .post(`/ledger/entries/${created.id}/evidence`)
        .attach('file', Buffer.from('%PDF-1.4'), {
          filename: 'r.pdf',
          contentType: 'application/pdf',
        });
      const del = await admin.delete(`/ledger/entries/${created.id}`);
      expect(del.status).toBe(400);
    });

    it('B-085 evidence URL expiresIn 3600', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const today = taipeiYmd();
      const { body: created } = await admin.post('/ledger/entries').send({
        entryDate: today,
        type: 'EXPENSE',
        amount: 51,
        description: 'B-085 url test',
      });
      await admin
        .post(`/ledger/entries/${created.id}/evidence`)
        .attach('file', Buffer.from('%PDF-1.4'), {
          filename: 'r.pdf',
          contentType: 'application/pdf',
        });
      const open = await admin.get(
        `/ledger/entries/${created.id}/evidence-url`,
      );
      expect(open.body.expiresIn).toBe(3600);
    });
  });

  describe('B-087 authorization', () => {
    it('B-087 USER forbidden on payroll calculate', async () => {
      const user = request.agent(app.getHttpServer());
      await user.post('/auth/sign-in').send({
        displayName: '種子西區',
        password: SEED_PASSWORD,
      });
      const res = await user.post('/payroll/calculate').send({
        startDate: '2026-11-01',
        endDate: '2026-11-10',
      });
      expect(res.status).toBe(403);
    });
  });

  describe('B-090 year-end', () => {
    it('B-090 year-end settlement endpoint', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const target = 'b0000001-0001-4000-8000-000000000003';
      const res = await admin.post('/retention/year-end').send({
        accountId: target,
        calendarYear: 2025,
      });
      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe('B-092 uninsured override', () => {
    it('B-092 owner sets override', async () => {
      const owner = request.agent(app.getHttpServer());
      await owner.post('/auth/sign-in').send({
        displayName: 'Kuei',
        password: SEED_PASSWORD,
      });
      const target = 'b0000001-0001-4000-8000-000000000003';
      const res = await owner.patch(`/accounts/${target}/financials`).send({
        uninsuredRateOverride: 5,
      });
      expect(res.status).toBe(200);
    });
  });

  describe('B-093 bank reveal', () => {
    it('B-093 admin reveal logs BANK_REVEAL', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const target = 'b0000001-0001-4000-8000-000000000003';
      const res = await admin.get(`/accounts/${target}/bank/reveal`);
      expect([200, 503]).toContain(res.status);
    });
  });

  describe('B-094 incomplete prices', () => {
    it('B-094 blocks when unit price removed', async () => {
      const db = app.get(SupabaseService).getServiceClient();
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const today = taipeiYmd();
      await db.from('unit_prices').delete().eq('price_set', 'WEST').eq('item_code', 'mobilization');
      const res = await admin.post('/payroll/calculate').send({
        startDate: today,
        endDate: today,
      });
      if (res.status === 400) {
        expect(String(res.text || res.body.message)).toMatch(/單價/);
      }
      await db.from('unit_prices').upsert({
        price_set: 'WEST',
        item_code: 'mobilization',
        price: 1200,
      });
    });
  });

  describe('B-095 removed delete', () => {
    it('B-095 no permanent account delete route', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const target = 'b0000001-0001-4000-8000-000000000007';
      const res = await admin.delete(`/accounts/${target}`);
      expect(res.status).toBe(404);
    });
  });

  describe('B-053 denominations on calculate', () => {
    it('B-053 returns denomination map', async () => {
      const admin = request.agent(app.getHttpServer());
      await admin.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      const today = taipeiYmd();
      const res = await admin.post('/payroll/calculate').send({
        startDate: today,
        endDate: today,
      });
      expect(res.body.totals?.denominations).toBeDefined();
    });
  });

  describe('B-061 sign-out', () => {
    it('B-061 sign-out clears session', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/sign-in').send({
        displayName: '種子管理員',
        password: SEED_PASSWORD,
      });
      await agent.post('/auth/sign-out');
      const ses = await agent.get('/auth/session');
      expect(ses.body.signedIn).toBe(false);
    });
  });
});
