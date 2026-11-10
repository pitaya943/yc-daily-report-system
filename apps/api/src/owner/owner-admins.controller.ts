import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Session,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { validateDisplayName, validatePasswordLength } from '@yc/validation';

class CreateAdminDto {
  displayName!: string;
  password!: string;
}

/** B-096 owner-only admin management (create stub for S2). */
@Controller('owner/admins')
@UseGuards(AuthGuard, RolesGuard)
@Roles('OWNER')
export class OwnerAdminsController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  async createAdmin(
    @Body() body: CreateAdminDto,
    @Session() session: Request['session'],
  ) {
    const nameErr = validateDisplayName(body.displayName);
    if (nameErr) {
      throw new ForbiddenException(nameErr.message);
    }
    const pwErr = validatePasswordLength(body.password);
    if (pwErr) {
      throw new ForbiddenException(pwErr.message);
    }
    // Full account+auth creation lands in a later stage; S2 proves owner-only gate.
    await this.audit.write({
      actorId: session.account!.id,
      actorDisplayName: session.account!.displayName,
      actionType: 'ACCOUNT_CREATE',
      description: `建立管理員帳戶：${body.displayName.trim()}`,
    });
    return { ok: true, pending: true };
  }
}

/** B-096 negative path — admin cannot hit owner route. */
@Controller('admin/admins')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'OWNER')
export class AdminAdminsController {
  constructor(private readonly audit: AuditService) {}

  @Post()
  async forbiddenForAdminOnly(@Session() session: Request['session']) {
    if (session.account?.role === 'ADMIN') {
      await this.audit.logAccessDenied(
        session.account.id,
        session.account.displayName,
        'add_admin_account',
      );
      throw new ForbiddenException();
    }
    return { ok: true };
  }
}
