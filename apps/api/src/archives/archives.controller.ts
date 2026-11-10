import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CurrentAccount } from '../common/current-account.decorator';
import { SessionAccount } from '../auth/types';
import { ArchivesService } from './archives.service';

@Controller('archives')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'OWNER')
export class ArchivesController {
  constructor(private readonly archives: ArchivesService) {}

  @Get()
  list(@CurrentAccount() account: SessionAccount) {
    return this.archives.list(account);
  }

  @Post('daily')
  generateDaily(
    @CurrentAccount() account: SessionAccount,
    @Body() body: { archiveDate?: string; source?: 'MANUAL' | 'AUTOMATIC' },
  ) {
    return this.archives.generateDaily(
      account,
      body.archiveDate,
      body.source ?? 'MANUAL',
    );
  }
}
