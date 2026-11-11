import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SessionAccount } from '../auth/types';
import { ValidationMessages } from '@yc/validation';

/** B-090 year-end settlement — releases YTD retention per account. */
@Injectable()
export class RetentionService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  private db() {
    return this.supabase.getServiceClient();
  }

  async settleYear(account: SessionAccount, calendarYear: number) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
    if (!Number.isInteger(calendarYear) || calendarYear < 2000) {
      throw new BadRequestException('請選擇要結算的年度');
    }
    const { data: existing } = await this.db()
      .from('retention_year_end_settlements')
      .select('id')
      .eq('calendar_year', calendarYear)
      .maybeSingle();
    if (existing) {
      throw new BadRequestException('該年度已結算');
    }
    const { data: runs } = await this.db()
      .from('payroll_runs')
      .select('id, end_date')
      .gte('end_date', `${calendarYear}-01-01`)
      .lte('end_date', `${calendarYear}-12-31`);
    const runIds = (runs ?? []).map((r) => r.id);
    const byAccount = new Map<string, number>();
    if (runIds.length) {
      const { data: ytdRows } = await this.db()
        .from('payroll_run_rows')
        .select('account_id, ytd_before, period_retention')
        .in('run_id', runIds);
      for (const r of ytdRows ?? []) {
        const ytdAfter =
          Number(r.ytd_before ?? 0) + Number(r.period_retention ?? 0);
        const prev = byAccount.get(r.account_id as string) ?? 0;
        byAccount.set(r.account_id as string, Math.max(prev, ytdAfter));
      }
    }
    const { data: settlement, error } = await this.db()
      .from('retention_year_end_settlements')
      .insert({
        calendar_year: calendarYear,
        settled_by: account.id,
      })
      .select('id')
      .single();
    if (error) {
      throw new BadRequestException('保留金年度結算失敗');
    }
    const lineRows = [...byAccount.entries()].map(([accountId, ytd]) => ({
      settlement_id: settlement.id,
      account_id: accountId,
      ytd_retention: ytd,
      refunded_amount: ytd,
    }));
    if (lineRows.length) {
      await this.db().from('retention_year_end_rows').insert(lineRows);
    }
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'RETENTION_YEAR_END',
      description: `年度保留金結算 ${calendarYear}（${lineRows.length} 人）`,
    });
    return { settlementId: settlement.id, rows: lineRows.length };
  }
}
