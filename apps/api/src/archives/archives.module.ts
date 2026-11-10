import { Module } from '@nestjs/common';
import { ArchivesController } from './archives.controller';
import { ArchivesService } from './archives.service';
import { AuditModule } from '../audit/audit.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [AuditModule, ExportModule],
  controllers: [ArchivesController],
  providers: [ArchivesService],
})
export class ArchivesModule {}
