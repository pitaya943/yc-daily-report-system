import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AccountRole } from '../types';
import { AuditService } from '../../audit/audit.service';
import { AuthGuard } from './auth.guard';
import { ValidationMessages } from '@yc/validation';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AccountRole[]) => SetMetadata(ROLES_KEY, roles);

export const OWNER_ADMIN_ACTION = 'owner_admin_management';

/** B-004, B-006, B-087, B-096 — server-side role enforcement. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
    private readonly authGuard: AuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.authGuard.canActivate(context);
    const roles = this.reflector.getAllAndOverride<AccountRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) {
      return true;
    }
    const req = context.switchToHttp().getRequest<Request>();
    const account = req.session.account!;
    if (!roles.includes(account.role)) {
      await this.audit.logAccessDenied(
        account.id,
        account.displayName,
        OWNER_ADMIN_ACTION,
      );
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
    return true;
  }
}
