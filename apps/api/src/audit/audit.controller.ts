import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseService } from '../supabase/supabase.service';
import {
  validateOptionalFilterAction,
  validateOptionalFilterDate,
  ValidationMessages,
} from '@yc/validation';
import { throwFieldBadRequest } from '../common/field-error';

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
    @Query('account') account?: string,
    @Query('actionType') actionType?: string,
  ) {
    for (const err of [
      validateOptionalFilterDate(from, 'from'),
      validateOptionalFilterDate(to, 'to'),
      validateOptionalFilterAction(actionType),
    ]) {
      if (err) throwFieldBadRequest(err);
    }
    const db = this.supabase.getServiceClient();
    let actorId: string | undefined;
    if (account != null && account !== '') {
      const { data: actor } = await db
        .from('accounts')
        .select('id')
        .eq('display_name', account)
        .maybeSingle();
      if (!actor) {
        throw new BadRequestException(ValidationMessages.filterInvalid);
      }
      actorId = actor.id as string;
    }
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
    if (actorId) {
      q = q.eq('actor_id', actorId);
    }
    if (actionType) {
      q = q.eq('action_type', actionType);
    }
    const { data, error } = await q;
    if (error) {
      throw new BadRequestException(ValidationMessages.filterInvalid);
    }
    return { rows: data ?? [] };
  }
}
