import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CurrentAccount } from '../common/current-account.decorator';
import { SessionAccount } from '../auth/types';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'OWNER')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('retention-cap')
  getCap(@CurrentAccount() account: SessionAccount) {
    return this.settings.getRetentionCap(account);
  }

  @Patch('retention-cap')
  setCap(
    @CurrentAccount() account: SessionAccount,
    @Body() body: { capNtd: number },
  ) {
    return this.settings.setRetentionCap(account, body.capNtd);
  }
}
