import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  resetOwnerLockout,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { createTestApp } from './test-app';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

const SEED_ADMIN_ID = 'b0000001-0001-4000-8000-000000000002';
const OWNER_ID = 'b0000001-0001-4000-8000-000000000001';

describeIntegration('B-096 B-097 admin cannot manage admin via real routes', () => {
  let app: INestApplication;
  const agent = () => request.agent(app.getHttpServer());

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
    const supabase = app.get(SupabaseService);
    await resetOwnerLockout(supabase);
    await resetSeedLockouts(supabase);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
    const db = app.get(SupabaseService).getServiceClient();
    await db
      .from('accounts')
      .update({ archived_at: null, archived_by: null })
      .eq('id', SEED_ADMIN_ID);
  });

  async function latestAccessDenied(actorId: string) {
    const db = app.get(SupabaseService).getServiceClient();
    const { data } = await db
      .from('audit_log')
      .select('action_type, description, actor_id')
      .eq('actor_id', actorId)
      .eq('action_type', 'ACCESS_DENIED')
      .order('occurred_at', { ascending: false })
      .limit(1);
    return data?.[0];
  }

  it('B-096 ADMIN cannot archive another ADMIN — row unchanged + ACCESS_DENIED', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const name = `副管理員測試${Date.now()}`;
    await owner
      .post('/owner/admins')
      .send({ displayName: name, password: 'admin001' })
      .expect((r) => expect(r.status).toBeLessThan(300));
    const { data: targetRow } = await db
      .from('accounts')
      .select('id, archived_at')
      .eq('display_name', name)
      .single();
    const targetId = targetRow!.id as string;

    const a = agent();
    await a
      .post('/auth/sign-in')
      .send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await a.post(`/accounts/${targetId}/archive`);
    expect(res.status).toBe(403);

    const after = await db.from('accounts').select('archived_at').eq('id', targetId).single();
    expect(after.data?.archived_at).toBeNull();

    const denied = await latestAccessDenied(SEED_ADMIN_ID);
    expect(denied?.action_type).toBe('ACCESS_DENIED');
    expect(String(denied?.description)).toContain('ACCOUNT_ARCHIVE');
    expect(String(denied?.description)).toContain('已拒絕');
  });

  it('B-097 ACCESS_DENIED rows are persisted for admin archive attempt', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const name = `稽核測試管理員${Date.now()}`;
    await owner.post('/owner/admins').send({ displayName: name, password: 'admin001' });
    const { data: row } = await db.from('accounts').select('id').eq('display_name', name).single();
    const a = agent();
    await a.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    await a.post(`/accounts/${row!.id}/archive`).expect(403);
    const { data } = await db
      .from('audit_log')
      .select('action_type, description')
      .eq('action_type', 'ACCESS_DENIED')
      .order('occurred_at', { ascending: false })
      .limit(3);
    expect((data ?? []).some((r) => String(r.description).includes('ACCOUNT_ARCHIVE'))).toBe(true);
  });

  it('B-096 ADMIN cannot restore an ADMIN — ACCESS_DENIED', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const owner = agent();
    await owner.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const name = `復原測試管理員${Date.now()}`;
    await owner.post('/owner/admins').send({ displayName: name, password: 'admin001' });
    const { data: targetRow } = await db.from('accounts').select('id').eq('display_name', name).single();
    const targetId = targetRow!.id as string;
    await owner.post(`/accounts/${targetId}/archive`);

    const a = agent();
    await a.post('/auth/sign-in').send({ displayName: '種子管理員', password: SEED_PASSWORD });
    const res = await a.post(`/accounts/${targetId}/restore`);
    expect(res.status).toBe(403);
    expect(String(res.body.message ?? res.body)).toMatch(/禁止/);

    const row = await db.from('accounts').select('archived_at').eq('id', targetId).single();
    expect(row.data?.archived_at).not.toBeNull();

    const denied = await latestAccessDenied(SEED_ADMIN_ID);
    expect(denied?.description).toContain('ACCOUNT_RESTORE');
  });

  it('B-096 OWNER can archive and restore an ADMIN', async () => {
    const db = app.get(SupabaseService).getServiceClient();
    const o = agent();
    await o.post('/auth/sign-in').send({ displayName: 'Kuei', password: SEED_PASSWORD });

    const arch = await o.post(`/accounts/${SEED_ADMIN_ID}/archive`);
    expect(arch.status).toBeLessThan(300);
    const archived = await db
      .from('accounts')
      .select('archived_at')
      .eq('id', SEED_ADMIN_ID)
      .single();
    expect(archived.data?.archived_at).not.toBeNull();

    const restore = await o.post(`/accounts/${SEED_ADMIN_ID}/restore`);
    expect(restore.status).toBeLessThan(300);
    const open = await db
      .from('accounts')
      .select('archived_at')
      .eq('id', SEED_ADMIN_ID)
      .single();
    expect(open.data?.archived_at).toBeNull();
  });

});
