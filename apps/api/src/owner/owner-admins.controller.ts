import { Body, Controller, Post, Session, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AccountsService } from '../accounts/accounts.service';

/** B-096 owner-only admin management. */
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
