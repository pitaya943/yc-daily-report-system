import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AuditModule } from '../audit/audit.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [AuditModule, ExportModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
