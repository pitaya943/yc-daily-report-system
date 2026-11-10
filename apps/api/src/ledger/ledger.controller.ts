import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CurrentAccount } from '../common/current-account.decorator';
import { SessionAccount } from '../auth/types';
import { LedgerService } from './ledger.service';

@Controller('ledger')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'OWNER')
export class LedgerController {
  constructor(private readonly ledger: LedgerService) {}

  @Get('entries')
  list(
    @CurrentAccount() account: SessionAccount,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: string,
  ) {
    return this.ledger.listEntries(account, { from, to, type });
  }

  @Post('entries')
  create(
    @CurrentAccount() account: SessionAccount,
    @Body()
    body: {
      entryDate: string;
      type: 'INCOME' | 'EXPENSE';
      amount: number;
      category?: string;
      description: string;
      payerAccountId?: string;
    },
  ) {
    return this.ledger.createEntry(account, body);
  }

  @Post('entries/:id/void')
  voidEntry(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.ledger.voidEntry(account, id);
  }

  @Delete('entries/:id')
  remove(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.ledger.deleteEntry(account, id);
  }

  @Get('entries/:id/evidence-url')
  evidenceUrl(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.ledger.openEvidence(account, id);
  }

  @Post('entries/:id/evidence')
  @UseInterceptors(FileInterceptor('file'))
  uploadEvidence(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('請上傳檔案');
    return this.ledger.uploadEvidence(account, id, file);
  }

  @Post('entries/:id/settle')
  settle(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.ledger.settleEntry(account, id);
  }
}
