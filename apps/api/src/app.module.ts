import { Module } from '@nestjs/common';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { OwnerModule } from './owner/owner.module';
import { HealthController } from './health.controller';
import { PgModule } from './database/pg.module';
import { ReportsModule } from './reports/reports.module';
import { MaterialsModule } from './materials/materials.module';
import { ConfirmationModule } from './confirmation/confirmation.module';
import { PayrollModule } from './payroll/payroll.module';
import { LedgerModule } from './ledger/ledger.module';
import { SettingsModule } from './settings/settings.module';
import { ArchivesModule } from './archives/archives.module';
import { StatisticsModule } from './statistics/statistics.module';
import { BankModule } from './bank/bank.module';
import { AccountsModule } from './accounts/accounts.module';
import { ExportModule } from './export/export.module';
import { RetentionModule } from './retention/retention.module';

@Module({
  imports: [
    SupabaseModule,
    PgModule,
    BankModule,
    AuditModule,
    AuthModule,
    OwnerModule,
    ReportsModule,
    MaterialsModule,
    ConfirmationModule,
    PayrollModule,
    LedgerModule,
    SettingsModule,
    ArchivesModule,
    StatisticsModule,
    AccountsModule,
    ExportModule,
    RetentionModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
