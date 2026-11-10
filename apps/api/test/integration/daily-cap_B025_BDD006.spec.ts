import * as request from 'supertest';
import { createTestApp } from './test-app';
import {
  clearWestUserReportsOnDate,
  integrationEnabled,
  requireIntegration,
  SEED_PASSWORD,
} from './setup';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { taipeiYmd } from '../../src/common/taipei-time';
import { ValidationMessages } from '@yc/validation';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-025 BDD-006 daily cap and delete frees quota', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    app = await createTestApp();
  });

  afterAll(async () => app.close());

  it('allows 3 reports then rejects 4th until delete', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/auth/sign-in')
      .send({ displayName: '種子西區', password: SEED_PASSWORD });

    const today = taipeiYmd();
    await clearWestUserReportsOnDate(app.get(SupabaseService), today);
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await agent
        .post('/reports')
        .send({
          reportDate: today,
          quantities: [{ itemCode: 'direct_13', qty: 1 }],
        })
        .expect(201);
      ids.push(res.body.id);
    }
    const fourth = await agent.post('/reports').send({
      reportDate: today,
      quantities: [{ itemCode: 'direct_13', qty: 0.1 }],
    });
    expect(fourth.status).toBe(400);
    expect(fourth.body.message).toContain(ValidationMessages.dailyCap);

    await agent.delete(`/reports/${ids[0]}`).expect(200);
    const again = await agent
      .post('/reports')
      .send({
        reportDate: today,
        quantities: [{ itemCode: 'direct_13', qty: 0.2 }],
      })
      .expect(201);
    expect(again.body.id).toBeTruthy();
  });
});
