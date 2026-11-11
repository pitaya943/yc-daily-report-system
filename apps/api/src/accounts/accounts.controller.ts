import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import {
  AccessDeniedAction,
  Roles,
  RolesGuard,
} from '../auth/guards/roles.guard';
import { CurrentAccount } from '../common/current-account.decorator';
import { SessionAccount } from '../auth/types';
import { AccountsService } from './accounts.service';

@Controller('accounts')
@UseGuards(AuthGuard, RolesGuard)
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get('manage')
  @Roles('ADMIN', 'OWNER')
  list(@CurrentAccount() actor: SessionAccount) {
    return this.accounts.listForManagement(actor);
  }

  @Post('users')
  @Roles('ADMIN', 'OWNER')
  createUser(
    @CurrentAccount() actor: SessionAccount,
    @Body()
    body: {
      displayName: string;
      password: string;
      zone?: 'WEST' | 'SOUTH';
      bigMeter?: boolean;
      confirmBigMeter?: boolean;
    },
  ) {
    return this.accounts.createUser(actor, body);
  }

  @Post(':id/archive')
  @Roles('ADMIN', 'OWNER')
  archive(
    @CurrentAccount() actor: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.accounts.archiveAccount(actor, id);
  }

  @Post(':id/restore')
  @Roles('ADMIN', 'OWNER')
  restore(
    @CurrentAccount() actor: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.accounts.restoreAccount(actor, id);
  }

  @Post(':id/role')
  @Roles('ADMIN', 'OWNER')
  @AccessDeniedAction('ACCOUNT_ROLE')
  switchRole(
    @CurrentAccount() actor: SessionAccount,
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    return this.accounts.switchRole(actor, id, body.role);
  }

  @Post('me/password')
  @Roles('USER', 'ADMIN', 'OWNER')
  changePassword(
    @CurrentAccount() actor: SessionAccount,
    @Body()
    body: {
      currentPassword: string;
      newPassword: string;
      newPasswordConfirm?: string;
    },
  ) {
    return this.accounts.changePassword(
      actor,
      body.currentPassword,
      body.newPassword,
      body.newPasswordConfirm,
    );
  }

  @Patch(':id/bank')
  @Roles('ADMIN', 'OWNER')
  @AccessDeniedAction('ACCOUNT_BANK')
  setBank(
    @CurrentAccount() actor: SessionAccount,
    @Param('id') id: string,
    @Body() body: { bankAccount: string },
  ) {
    return this.accounts.setBankAccount(actor, id, body.bankAccount);
  }

  @Get(':id/bank/reveal')
  @Roles('ADMIN', 'OWNER')
  revealBank(
    @CurrentAccount() actor: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.accounts.revealBank(actor, id);
  }

  @Patch(':id/financials')
  @Roles('ADMIN', 'OWNER')
  @AccessDeniedAction('ACCOUNT_FINANCIALS')
  financials(
    @CurrentAccount() actor: SessionAccount,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.accounts.updateUserFinancials(actor, id, body as never);
  }

  @Patch(':id/item-retention-rates/:itemCode')
  @Roles('ADMIN', 'OWNER')
  itemRetention(
    @CurrentAccount() actor: SessionAccount,
    @Param('id') id: string,
    @Param('itemCode') itemCode: string,
    @Body() body: { rateNtd: number },
  ) {
    return this.accounts.setItemRetentionRate(actor, id, itemCode, body.rateNtd);
  }

  @Patch(':id/retention-offset')
  @Roles('ADMIN', 'OWNER')
  retentionOffset(
    @CurrentAccount() actor: SessionAccount,
    @Param('id') id: string,
    @Body() body: { calendarYear: number; offsetNtd: number },
  ) {
    return this.accounts.setRetentionOffset(actor, id, body);
  }
}
