import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';
import { SupabaseService } from '../../src/supabase/supabase.service';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('S6a B-007–B-012', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterAll(() => app.close());

  describe('B-007 unique display name', () => {
    it('rejects duplicate admin create', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: 'Kuei', password: SEED_PASSWORD });
      const res = await agent
        .post('/owner/admins')
        .send({ displayName: '種子管理員', password: SEED_PASSWORD });
      expect(res.status).toBe(400);
    });
  });

  describe('B-008 password change', () => {
    it('requires current password', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子西區', password: SEED_PASSWORD });
      const res = await agent
        .post('/accounts/me/password')
        .send({
          currentPassword: 'wrong',
          newPassword: 'newpass01',
          newPasswordConfirm: 'newpass01',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('B-009 admin creates USER only', () => {
    it('admin cannot assign ADMIN via accounts/users', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子管理員', password: SEED_PASSWORD });
      const res = await agent.post('/accounts/users').send({
        displayName: `員工${Date.now()}`,
        password: SEED_PASSWORD,
      });
      expect(res.status).toBe(201);
      expect(res.body.account?.role).toBe('USER');
    });
  });

  describe('B-010 west catalogue', () => {
    it('west user sees WEST catalogue', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子西區', password: SEED_PASSWORD });
      const res = await agent.get('/reports/work-items');
      expect(res.body.catalogue).toBe('WEST');
    });
  });

  describe('B-011 big-meter catalogue', () => {
    it('big-meter user sees BIG_METER set', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子大表', password: SEED_PASSWORD });
      const res = await agent.get('/reports/work-items');
      expect(res.body.catalogue).toBe('BIG_METER');
    });
  });

  describe('B-012 archive blocks collaborator', () => {
    it('archived user not in collaborator list', async () => {
      const db = app.get(SupabaseService).getServiceClient();
      const target = 'b0000001-0001-4000-8000-000000000007';
      const admin = request.agent(app.getHttpServer());
      await admin
        .post('/auth/sign-in')
        .send({ displayName: '種子管理員', password: SEED_PASSWORD });
      await admin.post(`/accounts/${target}/archive`);
      const user = request.agent(app.getHttpServer());
      await user
        .post('/auth/sign-in')
        .send({ displayName: '種子西區', password: SEED_PASSWORD });
      const list = await user.get('/reports/collaborators');
      const ids = (list.body ?? []).map((a: { id: string }) => a.id);
      expect(ids).not.toContain(target);
      await admin.post(`/accounts/${target}/restore`);
    });
  });
});
