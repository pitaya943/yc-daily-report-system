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
const bankKey = Buffer.alloc(32, 9).toString('base64');

describeIntegration('B-081 bank encryption at rest', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    requireIntegration();
    process.env.BANK_ENCRYPTION_KEY_BASE64 = bankKey;
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetSeedLockouts(app.get(SupabaseService));
  });

  afterAll(() => app.close());

  it('stores ciphertext and masks last4', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/auth/sign-in')
      .send({ displayName: 'Kuei', password: SEED_PASSWORD });
    const target = 'b0000001-0001-4000-8000-000000000003';
    const res = await agent
      .patch(`/accounts/${target}/bank`)
      .send({ bankAccount: '12345678901234' });
    expect(res.status).toBe(200);
    expect(res.body.last4).toBe('1234');
    const reveal = await agent.get(`/accounts/${target}/bank/reveal`);
    expect(reveal.status).toBe(200);
    expect(reveal.body.account).toBe('12345678901234');
  });
});
