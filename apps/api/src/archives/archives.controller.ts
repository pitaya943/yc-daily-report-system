import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { ArchivesService } from './archives.service';

@Controller('archives')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'OWNER')
export class ArchivesController {
  constructor(private readonly archives: ArchivesService) {}

  @Get()
  list(
    @CurrentAccount() account: SessionAccount,
    @Query('page') page?: string,
  ) {
    return this.archives.list(account, page ? Number(page) : 1);
  }

  @Get(':id/download')
  download(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.archives.download(account, id);
  }

  @Delete(':id')
  remove(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.archives.remove(account, id);
  }

  @Post('daily')
  generateDaily(
    @CurrentAccount() account: SessionAccount,
    @Body()
    body: {
      archiveDate?: string;
      type?: string;
      source?: string;
    },
  ) {
    const type = body.type;
    const source = body.source ?? 'MANUAL';
    if (type !== 'DAILY' && type !== 'MONTHLY') {
      throw new BadRequestException(ValidationMessages.archiveTypeAndDate);
    }
    if (!body.archiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.archiveDate)) {
      throw new BadRequestException(ValidationMessages.archiveTypeAndDate);
    }
    if (source !== 'MANUAL' && source !== 'AUTOMATIC') {
      throw new BadRequestException(ValidationMessages.archiveTypeAndDate);
    }
    return this.archives.generateDaily(account, body.archiveDate, source, type);
  }
}
