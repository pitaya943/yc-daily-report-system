import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CurrentAccount } from '../common/current-account.decorator';
import { SessionAccount } from '../auth/types';
import { RetentionService } from './retention.service';

@Controller('retention')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'OWNER')
export class RetentionController {
  constructor(private readonly retention: RetentionService) {}

  @Post('year-end')
  yearEnd(
    @CurrentAccount() account: SessionAccount,
    @Body() body: { calendarYear: number },
  ) {
    return this.retention.settleYear(account, body.calendarYear);
  }
}
