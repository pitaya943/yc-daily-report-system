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

@Module({
  imports: [
    SupabaseModule,
    PgModule,
    AuditModule,
    AuthModule,
    OwnerModule,
    ReportsModule,
    MaterialsModule,
    ConfirmationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
