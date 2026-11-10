import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CurrentAccount } from '../common/current-account.decorator';
import { SessionAccount } from '../auth/types';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(AuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('work-items')
  @Roles('USER', 'ADMIN', 'OWNER')
  workItems(@CurrentAccount() account: SessionAccount) {
    return this.reports.listWorkItemsForAccount(account.id);
  }

  @Get('collaborators')
  @Roles('USER')
  collaborators(@CurrentAccount() account: SessionAccount) {
    return this.reports.listEligibleCollaborators(account);
  }

  @Get('mine')
  @Roles('USER')
  mine(@CurrentAccount() account: SessionAccount) {
    return this.reports.listOwnReports(account);
  }

  @Post()
  @Roles('USER')
  create(
    @CurrentAccount() account: SessionAccount,
    @Body()
    body: {
      reportDate: string;
      quantities: Array<{ itemCode: string; qty: number }>;
      collaboratorIds?: string[];
    },
  ) {
    return this.reports.createReport(account, body);
  }

  @Get(':id')
  @Roles('USER', 'ADMIN', 'OWNER')
  detail(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.reports.getReportDetail(account, id);
  }

  @Patch(':id')
  @Roles('USER', 'ADMIN', 'OWNER')
  update(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
    @Body()
    body: {
      quantities: Array<{ itemCode: string; qty: number }>;
      collaboratorIds?: string[];
    },
  ) {
    return this.reports.updateReport(account, id, body);
  }

  @Delete(':id')
  @Roles('USER', 'ADMIN', 'OWNER')
  remove(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.reports.deleteReport(account, id);
  }
}
