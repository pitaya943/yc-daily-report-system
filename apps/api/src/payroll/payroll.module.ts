import { Module } from '@nestjs/common';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { AuditModule } from '../audit/audit.module';
import { ExportModule } from '../export/export.module';
import { BankModule } from '../bank/bank.module';

@Module({
  imports: [AuditModule, ExportModule, BankModule],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
