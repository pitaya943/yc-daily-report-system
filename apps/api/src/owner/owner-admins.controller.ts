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
import { AuditService } from '../audit/audit.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AccountsService } from '../accounts/accounts.service';

/** B-096 owner-only admin management (create stub for S2). */
@Controller('owner/admins')
@UseGuards(AuthGuard, RolesGuard)
@Roles('OWNER')
export class OwnerAdminsController {
  constructor(private readonly accounts: AccountsService) {}

  @Post()
  async createAdmin(
    @Body() body: CreateAdminDto,
    @Session() session: Request['session'],
  ) {
  return this.accounts.createAdmin(
      session.account!,
      body.displayName,
      body.password,
    );
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
