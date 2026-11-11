import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { ValidationMessages } from '@yc/validation';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** B-067 owner-only audit log read. */
@Controller('audit')
@UseGuards(AuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get('log')
  @Roles('OWNER')
  async listLog(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (from !== undefined && !DATE_RE.test(from)) {
      throw new BadRequestException(ValidationMessages.filterInvalid);
    }
    if (to !== undefined && !DATE_RE.test(to)) {
      throw new BadRequestException(ValidationMessages.filterInvalid);
    }
    const db = this.supabase.getServiceClient();
    let q = db
      .from('audit_log')
      .select('id, action_type, description, occurred_at')
      .order('occurred_at', { ascending: false })
      .limit(20);
    if (from) {
      q = q.gte('occurred_at', `${from}T00:00:00+08:00`);
    }
    if (to) {
      q = q.lte('occurred_at', `${to}T23:59:59+08:00`);
    }
    const { data, error } = await q;
    if (error) {
      throw new BadRequestException(ValidationMessages.filterInvalid);
    }
    return { rows: data ?? [] };
  }
}
