import { Module } from '@nestjs/common';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { AuditModule } from '../audit/audit.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [AuditModule, ExportModule],
  controllers: [LedgerController],
  providers: [LedgerService],
})
export class LedgerModule {}
