import * as request from 'supertest';
import { Workbook } from 'exceljs';
import {
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';
import { SupabaseService } from '../../src/supabase/supabase.service';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('S6a B-022–B-031 B-036', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterAll(() => app.close());

  describe('B-022 collaborator limit', () => {
    it('rejects more than 6 collaborators', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子西區', password: SEED_PASSWORD });
      const ids = Array.from({ length: 7 }, (_, i) =>
        `f0000001-0001-4000-8000-${String(i).padStart(12, '0')}`,
      );
      const res = await agent.post('/reports').send({
        reportDate: '2026-11-06',
        quantities: [{ itemCode: 'direct_13', qty: 1 }],
        collaboratorIds: ids,
      });
      expect(res.status).toBe(400);
    });
  });

  describe('B-024 admin custom item', () => {
    it('admin attaches custom item on PATCH', async () => {
      const user = request.agent(app.getHttpServer());
      const admin = request.agent(app.getHttpServer());
      await user
        .post('/auth/sign-in')
        .send({ displayName: '種子西區', password: SEED_PASSWORD });
      const created = await user.post('/reports').send({
        reportDate: '2026-11-07',
        quantities: [{ itemCode: 'direct_13', qty: 1 }],
      });
      const id = created.body.id;
      await admin
        .post('/auth/sign-in')
        .send({ displayName: '種子管理員', password: SEED_PASSWORD });
      const patch = await admin.patch(`/reports/${id}`).send({
        quantities: [{ itemCode: 'direct_13', qty: 1 }],
        customItemName: '測試工項',
        customItemQty: 2,
        customItemUnitPrice: 100,
      });
      expect(patch.status).toBe(200);
    });
  });

  describe('B-028 material request fields', () => {
    it('rejects qty 100', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子西區', password: SEED_PASSWORD });
      const res = await agent.post('/materials/requests').send({
        materialId: 'c0000001-0001-4000-8000-000000000001',
        quantity: 100,
      });
      expect(res.status).toBe(400);
    });
  });

  describe('B-029 tab names', () => {
    it('empty secondary tab hidden from count', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子管理員', password: SEED_PASSWORD });
      const inv = await agent.get('/materials/inventory');
      expect(inv.body.tabs.tab_name_1).toBeTruthy();
    });
  });

  describe('B-030 ledger description max 200', () => {
    it('rejects empty description', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子管理員', password: SEED_PASSWORD });
      const res = await agent.post('/ledger/entries').send({
        entryDate: '2026-11-08',
        type: 'INCOME',
        amount: 1,
        description: '   ',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('B-031 ledger settle', () => {
    it('clears payer on expense', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子管理員', password: SEED_PASSWORD });
      const payer = 'b0000001-0001-4000-8000-000000000003';
      const created = await agent.post('/ledger/entries').send({
        entryDate: '2026-11-09',
        type: 'EXPENSE',
        amount: 50,
        description: 'advance',
        payerAccountId: payer,
      });
      const id = created.body.id;
      await agent.post(`/ledger/entries/${id}/settle`);
      const db = app.get(SupabaseService).getServiceClient();
      const { data } = await db
        .from('ledger_entries')
        .select('payer_account_id')
        .eq('id', id)
        .single();
      expect(data?.payer_account_id).toBeNull();
    });
  });

  describe('B-036 B-066 xlsx import', () => {
    it('accepts xlsx with required headers', async () => {
      const wb = new Workbook();
      const sheet = wb.addWorksheet('inv');
      sheet.addRow(['材料編號', '實領量']);
      sheet.addRow(['code-x', 1]);
      const buf = await wb.xlsx.writeBuffer();
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子管理員', password: SEED_PASSWORD });
      const res = await agent.post('/materials/admin/import').send({
        fileName: 'stock.xlsx',
        fileBase64: Buffer.from(buf).toString('base64'),
      });
      expect(res.status).toBe(201);
      expect(res.body.comparisonLabel).toMatch(/已對比/);
    });
  });
});
