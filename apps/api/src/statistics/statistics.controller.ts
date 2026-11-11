import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CurrentAccount } from '../common/current-account.decorator';
import { SessionAccount } from '../auth/types';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
@UseGuards(AuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statistics: StatisticsService) {}

  @Post('personal-trial')
  @Roles('USER')
  personal(
    @CurrentAccount() account: SessionAccount,
    @Body() body: { startDate: string; endDate: string; is10thPayday?: boolean },
  ) {
    return this.statistics.personalTrial(account, body);
  }

  @Post('summary-export')
  @Roles('ADMIN', 'OWNER')
  export(
    @CurrentAccount() account: SessionAccount,
    @Body() body: { startDate: string; endDate: string },
  ) {
    return this.statistics.summaryExport(account, body);
  }
}
