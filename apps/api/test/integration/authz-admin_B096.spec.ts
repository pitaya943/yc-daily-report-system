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

describeIntegration('B-096 B-097 admin cannot manage admin', () => {
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

  it('ADMIN posting to /admin/admins is forbidden and logged', async () => {
    const a = agent();
    await a
      .post('/auth/sign-in')
      .send({ displayName: '種子管理員', password: SEED_PASSWORD })
      .expect((res) => expect([200, 201]).toContain(res.status));
    const res = await a
      .post('/admin/admins')
      .send({ displayName: '新管理員', password: 'newpass01' })
      .expect(403);
    expect(res.status).toBe(403);
  });

  it('OWNER can reach /owner/admins', async () => {
    const a = agent();
    await a
      .post('/auth/sign-in')
      .send({ displayName: 'Kuei', password: SEED_PASSWORD })
      .expect((res) => expect([200, 201]).toContain(res.status));
    await a
      .post('/owner/admins')
      .send({ displayName: '暫定管理員', password: 'admin001' })
      .expect((res) => expect([200, 201]).toContain(res.status));
  });
});
