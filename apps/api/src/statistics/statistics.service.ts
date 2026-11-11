import { ForbiddenException, Injectable } from '@nestjs/common';
import { unitsToQty } from '@yc/allocation';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SessionAccount } from '../auth/types';
import { ExportService } from '../export/export.service';
import { ValidationMessages, validatePayrollDateRange } from '@yc/validation';
import { throwFieldBadRequest } from '../common/field-error';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
    private readonly exports: ExportService,
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
    const rangeErr = validatePayrollDateRange(body.startDate, body.endDate);
    if (rangeErr) throwFieldBadRequest(rangeErr);
    const { data: shares } = await this.db()
      .from('report_shares')
      .select('item_code, share_units, report_id')
      .eq('account_id', account.id);
    const reportIds = [...new Set((shares ?? []).map((s) => s.report_id))];
    if (!reportIds.length) {
      return {
        items: [],
        grossEstimate: 0,
        is10thPaydayTrial: Boolean(body.is10thPayday),
        retentionEstimate: 0,
        uninsuredEstimate: 0,
        fixedSalaryEstimate: 0,
        insuranceEstimate: 0,
      };
    }
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
    const is10th = Boolean(body.is10thPayday);
    const { data: fin } = await this.db()
      .from('accounts')
      .select(
        'insurance_deduction, fixed_salary, pay_fixed_every_period, uninsured_rate_override, uninsured_exempt, big_meter',
      )
      .eq('id', account.id)
      .single();
    const uninsuredPct =
      fin?.uninsured_rate_override != null
        ? Number(fin.uninsured_rate_override)
        : 3;
    const uninsuredEstimate =
      fin?.uninsured_exempt || fin?.big_meter
        ? 0
        : Math.round(gross * (uninsuredPct / 100));
    const fixedSalaryEstimate =
      is10th || fin?.pay_fixed_every_period
        ? Number(fin?.fixed_salary ?? 0)
        : 0;
    const insuranceEstimate =
      is10th && Number(fin?.insurance_deduction) > 0
        ? Number(fin?.insurance_deduction)
        : 0;
    return {
      items: [...totals.entries()].map(([code, qty]) => ({ code, qty })),
      grossEstimate: gross,
      is10thPaydayTrial: is10th,
      retentionEstimate: fin?.big_meter ? 0 : Math.round(gross * 0.2),
      uninsuredEstimate,
      fixedSalaryEstimate,
      insuranceEstimate,
    };
  }

  /** B-073 summary export metadata (logged) */
  async summaryExport(
    account: SessionAccount,
    body: { startDate: string; endDate: string },
  ) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
    const rangeErr = validatePayrollDateRange(body.startDate, body.endDate);
    if (rangeErr) throwFieldBadRequest(rangeErr);
    const { data: shares } = await this.db()
      .from('report_shares')
      .select('account_id, share_units, item_code, report_id');
    const { data: reports } = await this.db()
      .from('daily_reports')
      .select('id, report_date, status')
      .eq('status', 'CONFIRMED')
      .gte('report_date', body.startDate)
      .lte('report_date', body.endDate);
    const allowed = new Set((reports ?? []).map((r) => r.id));
    const totals = new Map<string, number>();
    for (const s of shares ?? []) {
      if (!allowed.has(s.report_id as string)) continue;
      const id = s.account_id as string;
      totals.set(id, (totals.get(id) ?? 0) + Number(s.share_units));
    }
    const { data: accounts } = await this.db()
      .from('accounts')
      .select('id, display_name');
    const rows =
      accounts?.map((a) => ({
        displayName: a.display_name,
        qty: (totals.get(a.id as string) ?? 0) / 10,
        amount: 0,
      })) ?? [];
    const buffer = await this.exports.buildSummaryXlsx(rows);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'EXPORT',
      description: `統計匯出 ${body.startDate}～${body.endDate}`,
    });
    return {
      format: 'xlsx',
      base64: buffer.toString('base64'),
    };
  }
}
