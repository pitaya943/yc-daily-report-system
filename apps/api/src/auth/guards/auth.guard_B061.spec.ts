import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

describe('B-061 idle session (AuthGuard)', () => {
  const guard = new AuthGuard();
  let prevIdle: string | undefined;

  beforeEach(() => {
    prevIdle = process.env.SESSION_IDLE_MINUTES;
    process.env.SESSION_IDLE_MINUTES = '1';
    process.env.SUPABASE_URL ??= 'http://127.0.0.1:54321';
    process.env.SUPABASE_ANON_KEY ??= 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-key';
  });

  afterEach(() => {
    process.env.SESSION_IDLE_MINUTES = prevIdle;
  });

  function ctx(session: Record<string, unknown>) {
    const req = { session };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as never;
  }

  it('B-061 rejects idle session and rolling refresh resets activity', () => {
    const session = {
      account: { id: '1', displayName: 't', role: 'USER' as const },
      lastActivityMs: Date.now() - 120_000,
      destroy: jest.fn(),
    };
    expect(() => guard.canActivate(ctx(session))).toThrow(UnauthorizedException);

    session.lastActivityMs = Date.now();
    expect(guard.canActivate(ctx(session))).toBe(true);
    expect(session.lastActivityMs).toBeGreaterThan(Date.now() - 50);
  });
});
