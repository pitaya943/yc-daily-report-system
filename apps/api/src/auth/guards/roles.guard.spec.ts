/** @jest-environment node */
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { AuthGuard } from './auth.guard';
import { AuditService } from '../../audit/audit.service';

describe('B-096 B-006 RolesGuard', () => {
  const audit = {
    logAccessDenied: jest.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;
  const authGuard = { canActivate: jest.fn().mockReturnValue(true) } as unknown as AuthGuard;

  it('allows OWNER for owner-only roles', async () => {
    const guard = new RolesGuard(new Reflector(), audit, authGuard);
    const ctx = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({
          session: {
            account: { id: '1', displayName: 'Kuei', role: 'OWNER' },
          },
        }),
      }),
    } as never;
    jest.spyOn(Reflector.prototype, 'getAllAndOverride').mockReturnValue(['OWNER']);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('denies ADMIN for owner-only roles and logs ACCESS_DENIED', async () => {
    const guard = new RolesGuard(new Reflector(), audit, authGuard);
    const ctx = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({
          session: {
            account: { id: '2', displayName: '種子管理員', role: 'ADMIN' },
          },
        }),
      }),
    } as never;
    jest.spyOn(Reflector.prototype, 'getAllAndOverride').mockReturnValue(['OWNER']);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
    expect(audit.logAccessDenied).toHaveBeenCalled();
  });
});
