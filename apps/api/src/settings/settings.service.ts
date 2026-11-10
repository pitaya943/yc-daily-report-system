import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SessionAccount } from '../auth/types';
import { taipeiYmd } from '../common/taipei-time';

@Injectable()
export class SettingsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  private db() {
    return this.supabase.getServiceClient();
  }

  async getRetentionCap(account: SessionAccount) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    const year = new Date(`${taipeiYmd()}T12:00:00+08:00`).getUTCFullYear();
    const { data } = await this.db()
      .from('retention_annual_caps')
      .select('calendar_year, cap_ntd')
      .eq('calendar_year', year)
      .maybeSingle();
    return { calendarYear: year, capNtd: data?.cap_ntd ?? 60000 };
  }

  /** B-035 B-097 — applies current year only; no recalc of past runs */
  async setRetentionCap(account: SessionAccount, capNtd: number) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    if (!Number.isInteger(capNtd) || capNtd < 0) {
      throw new BadRequestException('保留金年度上限須為 0 以上的整數');
    }
    const year = new Date(`${taipeiYmd()}T12:00:00+08:00`).getUTCFullYear();
    const { data: old } = await this.db()
      .from('retention_annual_caps')
      .select('cap_ntd')
      .eq('calendar_year', year)
      .maybeSingle();
    await this.db()
      .from('retention_annual_caps')
      .upsert({ calendar_year: year, cap_ntd: capNtd });
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'SYSTEM_CONFIG',
      description: `保留金年度上限 ${old?.cap_ntd ?? 60000} → ${capNtd}`,
    });
    return { calendarYear: year, capNtd };
  }
}
