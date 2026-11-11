import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
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

  @Get('system')
  getSystem(@CurrentAccount() account: SessionAccount) {
    return this.settings.getSystem(account);
  }

  @Patch('system')
  patchSystem(
    @CurrentAccount() account: SessionAccount,
    @Body() body: Record<string, unknown>,
  ) {
    return this.settings.patchSystem(account, body as never);
  }

  @Get('unit-prices/:priceSet')
  getPrices(
    @CurrentAccount() account: SessionAccount,
    @Param('priceSet') priceSet: string,
  ) {
    return this.settings.getUnitPrices(account, priceSet);
  }

  @Patch('unit-prices/:priceSet/:itemCode')
  setPrice(
    @CurrentAccount() account: SessionAccount,
    @Param('priceSet') priceSet: string,
    @Param('itemCode') itemCode: string,
    @Body() body: { price: number },
  ) {
    return this.settings.patchUnitPrice(
      account,
      priceSet,
      itemCode,
      body.price,
    );
  }
}
