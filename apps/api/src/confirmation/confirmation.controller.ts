import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ValidationMessages } from '@yc/validation';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CurrentAccount } from '../common/current-account.decorator';
import { SessionAccount } from '../auth/types';
import { ConfirmationService } from './confirmation.service';

@Controller('confirmation')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'OWNER')
export class ConfirmationController {
  constructor(private readonly confirmation: ConfirmationService) {}

  @Get('pending')
  listPending(
    @CurrentAccount() account: SessionAccount,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('zone') zone?: string,
  ) {
    return this.confirmation.listPendingOrdinary(account, { from, to, zone });
  }

  @Get('pending/big-meter')
  listPendingBm(@CurrentAccount() account: SessionAccount) {
    return this.confirmation.listPendingBigMeter(account);
  }

  @Post('batch/reject')
  batchReject(
    @CurrentAccount() account: SessionAccount,
    @Body() body: { reportIds: string[] },
  ) {
    if (!body.reportIds?.length) {
      throw new BadRequestException(ValidationMessages.accountRequired);
    }
    return Promise.all(
      (body.reportIds ?? []).map((id) =>
        this.confirmation.rejectReport(account, id),
      ),
    );
  }

  @Post('batch/confirm')
  batchConfirm(
    @CurrentAccount() account: SessionAccount,
    @Body() body: { reportIds: string[] },
  ) {
    if (!body.reportIds?.length) {
      throw new BadRequestException(ValidationMessages.accountRequired);
    }
    return Promise.all(
      (body.reportIds ?? []).map((id) =>
        this.confirmation.confirmReport(account, id),
      ),
    );
  }

  @Post(':id/confirm')
  confirm(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.confirmation.confirmReport(account, id);
  }

  @Post(':id/reject')
  reject(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.confirmation.rejectReport(account, id);
  }
}
