import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CurrentAccount } from '../common/current-account.decorator';
import { SessionAccount } from '../auth/types';
import { PayrollService } from './payroll.service';

@Controller('payroll')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'OWNER')
export class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  @Post('calculate')
  calculate(
    @CurrentAccount() account: SessionAccount,
    @Body()
    body: {
      startDate: string;
      endDate: string;
      is10thPayday?: boolean;
      fixedSalaryAddBack?: Record<string, boolean>;
      fixedSalaryManual?: Record<string, number>;
    },
  ) {
    return this.payroll.calculate(account, body);
  }

  @Get('runs')
  listRuns(@CurrentAccount() account: SessionAccount) {
    return this.payroll.listRuns(account);
  }

  @Get('runs/:id')
  getRun(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.payroll.getRun(account, id);
  }

  @Get('runs/:id/export')
  exportRun(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.payroll.exportRun(account, id);
  }
}
