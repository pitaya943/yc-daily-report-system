import * as request from 'supertest';
import { createTestApp } from './test-app';
import { integrationEnabled, requireIntegration, SEED_PASSWORD } from './setup';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { ValidationMessages } from '@yc/validation';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-056 BDD-002 BDD-003 material approval', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  const materialId = 'c0000001-0001-4000-8000-000000000001';

  async function resetMaterial(remaining: number, received?: number) {
    const supabase = app.get(SupabaseService);
    const recv = received ?? remaining;
    await supabase
      .getServiceClient()
      .from('materials')
      .update({
        cumulative_usage: Math.max(0, recv - remaining),
        received_qty: recv,
        remaining_qty: remaining,
      })
      .eq('id', materialId);
  }

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
    await resetMaterial(100, 100);
  });

  beforeEach(async () => {
    await resetMaterial(100, 100);
  });

  afterAll(async () => app.close());

  it('BDD-003 refuses approve when stock insufficient', async () => {
    const user = request.agent(app.getHttpServer());
    await user.post('/auth/sign-in').send({
      displayName: '種子西區',
      password: SEED_PASSWORD,
    });
    const { body } = await user.post('/materials/requests').send({
      materialId,
      quantity: 10,
    }).expect(201);

    const admin = request.agent(app.getHttpServer());
    await admin.post('/auth/sign-in').send({
      displayName: '種子管理員',
      password: SEED_PASSWORD,
    });
    await resetMaterial(4, 100);
    const fail = await admin
      .post(`/materials/requests/${body.id}/approve`)
      .send({});
    expect(fail.status).toBe(400);
    expect(fail.body.message).toBe(ValidationMessages.materialInsufficientApprove);
  });

  it('BDD-002 concurrent duplicate approve does not double deduct', async () => {
    await resetMaterial(100, 100);
    const user = request.agent(app.getHttpServer());
    await user.post('/auth/sign-in').send({
      displayName: '種子西區',
      password: SEED_PASSWORD,
    });
    const { body } = await user.post('/materials/requests').send({
      materialId,
      quantity: 3,
    }).expect(201);

    const adminA = request.agent(app.getHttpServer());
    const adminB = request.agent(app.getHttpServer());
    await adminA.post('/auth/sign-in').send({
      displayName: '種子管理員',
      password: SEED_PASSWORD,
    });
    await adminB.post('/auth/sign-in').send({
      displayName: 'Kuei',
      password: SEED_PASSWORD,
    });

    const [r1, r2] = await Promise.all([
      adminA.post(`/materials/requests/${body.id}/approve`).send({}),
      adminB.post(`/materials/requests/${body.id}/approve`).send({}),
    ]);
    const ok = [r1.status, r2.status].filter((s) => s === 200 || s === 201).length;
    const bad = [r1.status, r2.status].filter((s) => s === 400).length;
    expect(ok).toBe(1);
    expect(bad).toBe(1);

    const supabase = app.get(SupabaseService);
    const { data: mat } = await supabase
      .getServiceClient()
      .from('materials')
      .select('remaining_qty, cumulative_usage, received_qty')
      .eq('id', materialId)
      .single();
    expect(Number(mat?.remaining_qty)).toBe(97);
    expect(Number(mat?.cumulative_usage)).toBe(3);
    expect(Number(mat?.received_qty)).toBe(100);
  });
});
