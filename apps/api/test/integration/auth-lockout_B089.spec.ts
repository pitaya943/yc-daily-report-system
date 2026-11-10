import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/auth/auth.service';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { integrationEnabled, requireIntegration, SEED_PASSWORD } from './setup';
import { ValidationMessages } from '@yc/validation';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('B-089 sign-in lockout', () => {
  let auth: AuthService;
  let supabase: SupabaseService;

  beforeAll(() => {
    requireIntegration();
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    auth = moduleRef.get(AuthService);
    supabase = moduleRef.get(SupabaseService);
    const db = supabase.getServiceClient();
    await db
      .from('accounts')
      .update({
        failed_signin_count: 0,
        lockout_until: null,
        last_failed_signin_at: null,
      })
      .eq('display_name', 'Kuei');
  });

  it('locks account after 5 failed passwords', async () => {
    for (let i = 0; i < 5; i++) {
      await expect(
        auth.signIn({
          displayName: 'Kuei',
          password: 'wrong-password',
          clientAddress: `test-client-${Date.now()}`,
        }),
      ).rejects.toThrow();
    }
    await expect(
      auth.signIn({
        displayName: 'Kuei',
        password: SEED_PASSWORD,
        clientAddress: 'test-client-final',
      }),
    ).rejects.toMatchObject({
      response: ValidationMessages.lockout,
    });
  });
});
