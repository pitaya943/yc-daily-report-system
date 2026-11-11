import * as request from 'supertest';
import {
  integrationEnabled,
  requireIntegration,
  resetSeedLockouts,
  SEED_PASSWORD,
} from './setup';
import { createTestApp } from './test-app';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { ValidationMessages } from '@yc/validation';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-081 F6 bank field unreadable without key', () => {
  let prev: string | undefined;

  beforeAll(() => {
    requireIntegration();
    prev = process.env.BANK_ENCRYPTION_KEY_BASE64;
    delete process.env.BANK_ENCRYPTION_KEY_BASE64;
  });

  afterAll(() => {
    if (prev !== undefined) {
      process.env.BANK_ENCRYPTION_KEY_BASE64 = prev;
    }
  });

  it('B-081 list accounts shows 無法讀取 for bank last4', async () => {
    const app = await createTestApp();
    try {
      await resetSeedLockouts(app.get(SupabaseService));
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/auth/sign-in')
        .send({ displayName: '種子管理員', password: SEED_PASSWORD });
      const res = await agent.get('/accounts/manage');
      expect(res.status).toBe(200);
      const acct = (res.body.accounts as Array<{ bank_account_last4: string }>).find((a) =>
        String((a as { display_name?: string }).display_name ?? '').includes('種子西區'),
      );
      expect(acct?.bank_account_last4).toBe(ValidationMessages.bankDisplayUnreadable);
    } finally {
      await app.close();
    }
  });
});
