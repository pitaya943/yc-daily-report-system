import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseService } from '../supabase/supabase.service';

/** B-067 owner-only audit log read. */
@Controller('audit')
@UseGuards(AuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get('log')
  @Roles('OWNER')
  async listLog() {
    const db = this.supabase.getServiceClient();
    const { data, error } = await db
      .from('audit_log')
      .select('id, action_type, description, occurred_at')
      .order('occurred_at', { ascending: false })
      .limit(20);
    if (error) {
      throw new Error(error.message);
    }
    return { rows: data ?? [] };
  }
}
