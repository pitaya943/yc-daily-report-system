import { Module } from '@nestjs/common';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { OwnerModule } from './owner/owner.module';
import { HealthController } from './health.controller';

@Module({
  imports: [SupabaseModule, AuditModule, AuthModule, OwnerModule],
  controllers: [HealthController],
})
export class AppModule {}
