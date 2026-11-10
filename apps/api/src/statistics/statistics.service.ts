import { ForbiddenException, Injectable } from '@nestjs/common';
import { unitsToQty } from '@yc/allocation';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SessionAccount } from '../auth/types';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  private db() {
    return this.supabase.getServiceClient();
  }

  /** B-068 personal trial — own confirmed shares in range */
  async personalTrial(
    account: SessionAccount,
    body: { startDate: string; endDate: string; is10thPayday?: boolean },
  ) {
    if (account.role !== 'USER') {
      throw new ForbiddenException('管理員請使用薪資或統計頁');
    }
    const { data: shares } = await this.db()
      .from('report_shares')
      .select('item_code, share_units, report_id')
      .eq('account_id', account.id);
    const reportIds = [...new Set((shares ?? []).map((s) => s.report_id))];
    if (!reportIds.length) return { items: [], grossEstimate: 0 };
    const { data: reports } = await this.db()
      .from('daily_reports')
      .select('id, report_date, status')
      .in('id', reportIds)
      .eq('status', 'CONFIRMED')
      .gte('report_date', body.startDate)
      .lte('report_date', body.endDate);
    const allowed = new Set((reports ?? []).map((r) => r.id));
    const profile = await this.db()
      .from('accounts')
      .select('zone, big_meter')
      .eq('id', account.id)
      .single();
    const priceSet = profile.data?.big_meter
      ? 'BIG_METER'
      : profile.data?.zone === 'SOUTH'
        ? 'SOUTH'
        : 'WEST';
    const { data: prices } = await this.db()
      .from('unit_prices')
      .select('item_code, price')
      .eq('price_set', priceSet);
    const priceMap = new Map(
      (prices ?? []).map((p) => [p.item_code, Number(p.price)]),
    );
    const totals = new Map<string, number>();
    let gross = 0;
    for (const s of shares ?? []) {
      if (!allowed.has(s.report_id)) continue;
      const qty = unitsToQty(s.share_units as number);
      totals.set(
        s.item_code as string,
        (totals.get(s.item_code as string) ?? 0) + qty,
      );
      gross += qty * (priceMap.get(s.item_code as string) ?? 0);
    }
    return {
      items: [...totals.entries()].map(([code, qty]) => ({ code, qty })),
      grossEstimate: gross,
      is10thPaydayTrial: Boolean(body.is10thPayday),
    };
  }

  /** B-073 summary export metadata (logged) */
  async summaryExport(
    account: SessionAccount,
    body: { startDate: string; endDate: string },
  ) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'EXPORT',
      description: `統計匯出 ${body.startDate}～${body.endDate}`,
    });
    return {
      format: 'xlsx',
      startDate: body.startDate,
      endDate: body.endDate,
      message: '匯出已記錄（S4 占位檔案）',
    };
  }
}
