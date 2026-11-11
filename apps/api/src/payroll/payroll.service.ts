import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  buildPayrollRow,
  greedyCashBreakdown,
  ytdWithOffset,
} from '@yc/payroll';
import { unitsToQty } from '@yc/allocation';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SessionAccount } from '../auth/types';
import { throwFieldBadRequest } from '../common/field-error';
import { ExportService } from '../export/export.service';
import { BankService } from '../bank/bank.service';
import { validatePayrollDateRange, ValidationMessages } from '@yc/validation';

const PAYROLL_BLOCK_MSG = '單價尚未設定完整，無法計算薪資，請先補齊單價';

type PriceSet = 'WEST' | 'SOUTH' | 'BIG_METER';

@Injectable()
export class PayrollService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
    private readonly exports: ExportService,
    private readonly bank: BankService,
  ) {}

  private db() {
    return this.supabase.getServiceClient();
  }

  private assertAdminOrOwner(account: SessionAccount) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
  }

  /** B-072 B-049 B-050 B-046 B-035 Q-054 PROVISIONAL */
  async calculate(
    account: SessionAccount,
    body: {
      startDate: string;
      endDate: string;
      is10thPayday?: boolean;
      fixedSalaryAddBack?: Record<string, boolean>;
      fixedSalaryManual?: Record<string, number>;
    },
  ) {
    this.assertAdminOrOwner(account);
    const { startDate, endDate } = body;
    const dateErr = validatePayrollDateRange(startDate, endDate);
    if (dateErr) throwFieldBadRequest(dateErr);
    const capYear = new Date(`${endDate}T12:00:00+08:00`).getUTCFullYear();
    const { data: capRow } = await this.db()
      .from('retention_annual_caps')
      .select('cap_ntd')
      .eq('calendar_year', capYear)
      .maybeSingle();
    const annualCap = capRow?.cap_ntd ?? 60000;

    const { data: settings } = await this.db()
      .from('system_settings')
      .select('global_retention_west, global_retention_south, uninsured_rate_west, uninsured_rate_south')
      .eq('id', 1)
      .single();

    const { data: prices, error: priceErr } = await this.db()
      .from('unit_prices')
      .select('price_set, item_code, price');
    if (priceErr) throw new Error(priceErr.message);
    const priceMap = new Map<string, number>();
    for (const p of prices ?? []) {
      priceMap.set(`${p.price_set}:${p.item_code}`, Number(p.price));
    }

    const { data: items } = await this.db()
      .from('work_items')
      .select('code, catalogue, attracts_retention');
    const retentionItems = new Set(
      (items ?? []).filter((i) => i.attracts_retention).map((i) => `${i.catalogue}:${i.code}`),
    );

    const { data: accounts } = await this.db()
      .from('accounts')
      .select(
        'id, display_name, role, zone, big_meter, archived_at, insurance_deduction, uninsured_exempt, uninsured_rate_override, fixed_salary, pay_fixed_every_period, payment_method, bank_account_last4',
      );
    const yearStart = `${capYear}-01-01`;

    const { data: reportsConfirmed } = await this.db()
      .from('daily_reports')
      .select('id, report_date')
      .eq('status', 'CONFIRMED')
      .gte('report_date', yearStart)
      .lte('report_date', endDate);
    const reportDates = new Map(
      (reportsConfirmed ?? []).map((r) => [r.id as string, r.report_date as string]),
    );
    const reportIds = [...reportDates.keys()];
    let sharesAll: Array<{
      account_id: string;
      item_code: string;
      share_units: number;
      report_id: string;
    }> = [];
    if (reportIds.length) {
      const { data: shares } = await this.db()
        .from('report_shares')
        .select('account_id, item_code, share_units, report_id')
        .in('report_id', reportIds);
      sharesAll = (shares ?? []) as typeof sharesAll;
    }
    const inRange = (reportId: string, from: string, to: string, ltEnd?: boolean) => {
      const d = reportDates.get(reportId);
      if (!d) return false;
      if (ltEnd) return d >= from && d < to;
      return d >= from && d <= to;
    };
    const sharesPeriod = sharesAll.filter((s) =>
      inRange(s.report_id, startDate, endDate),
    );
    const sharesYtd = sharesAll.filter((s) =>
      inRange(s.report_id, yearStart, startDate, true),
    );

    const { data: run, error: runErr } = await this.db()
      .from('payroll_runs')
      .insert({
        start_date: startDate,
        end_date: endDate,
        is_10th_payday: Boolean(body.is10thPayday),
        cap_year: capYear,
        cap_ntd_used: annualCap,
        calculated_at: new Date().toISOString(),
        calculated_by: account.id,
        status: 'COMPLETED',
      })
      .select('id')
      .single();
    if (runErr) {
      throw new BadRequestException(ValidationMessages.payrollDatesRequired);
    }

    const rows: unknown[] = [];
    for (const acc of accounts ?? []) {
      const priceSet: PriceSet = acc.big_meter
        ? 'BIG_METER'
        : acc.zone === 'SOUTH'
          ? 'SOUTH'
          : 'WEST';

      const isPayrollRole =
        acc.role === 'USER' ||
        acc.role === 'ADMIN' ||
        acc.role === 'OWNER'; /* PROVISIONAL(Q-054) */

      if (!isPayrollRole) continue;

      let gross = 0;
      let workItemGross = 0;
      let periodRawRetention = 0;

      const periodShares = sharesPeriod.filter((s) => s.account_id === acc.id);
      const ytdShares = sharesYtd.filter((s) => s.account_id === acc.id);

      const processShare = (
        itemCode: string,
        shareUnits: number,
        target: { gross: number; workGross: number; retention: number },
      ) => {
        const key = `${priceSet}:${itemCode}`;
        const price = priceMap.get(key);
        if (price === undefined) {
          throw new BadRequestException(PAYROLL_BLOCK_MSG);
        }
        const qty = unitsToQty(shareUnits as number);
        const money = qty * price;
        target.gross += money;
        if (acc.role === 'USER' && !acc.big_meter) {
          target.workGross += money;
        } else if (acc.role === 'USER') {
          target.workGross += money;
        }
        if (retentionItems.has(key) && acc.role === 'USER' && !acc.big_meter) {
          const rate =
            settings?.[
              acc.zone === 'SOUTH'
                ? 'global_retention_south'
                : 'global_retention_west'
            ] ?? 20;
          target.retention += qty * Number(rate);
        }
      };

      const agg = { gross: 0, workGross: 0, retention: 0 };
      for (const s of periodShares) {
        processShare(s.item_code as string, s.share_units as number, agg);
      }
      gross = agg.gross;
      workItemGross = agg.workGross;
      periodRawRetention = agg.retention;

      let ytdBefore = 0;
      const ytdAgg = { gross: 0, workGross: 0, retention: 0 };
      for (const s of ytdShares) {
        processShare(s.item_code as string, s.share_units as number, ytdAgg);
      }
      const { data: offsetRow } = await this.db()
        .from('retention_offsets')
        .select('offset_ntd')
        .eq('account_id', acc.id)
        .eq('calendar_year', capYear)
        .maybeSingle();
      const offsetNtd = (offsetRow?.offset_ntd as number) ?? 0;
      ytdBefore = ytdWithOffset(
        ytdAgg.retention,
        offsetNtd,
        annualCap,
      );

      const enrolled = (acc.insurance_deduction as number) > 0;
      const uninsuredRate =
        acc.uninsured_rate_override != null
          ? Number(acc.uninsured_rate_override)
          : acc.zone === 'SOUTH'
            ? Number(settings?.uninsured_rate_south ?? 3)
            : Number(settings?.uninsured_rate_west ?? 3);

      let fixedSalaryApplied = 0;
      const payEvery = acc.pay_fixed_every_period as boolean;
      const is10th = Boolean(body.is10thPayday);
      const archived = Boolean(acc.archived_at);
      const addBack = body.fixedSalaryAddBack?.[acc.id as string];
      const manualFixed = body.fixedSalaryManual?.[acc.id as string];

      if (!archived || addBack || manualFixed != null) {
        if (manualFixed != null) {
          fixedSalaryApplied = manualFixed;
        } else if (is10th || payEvery) {
          fixedSalaryApplied = acc.fixed_salary as number;
        }
      }

      const insuranceApplied =
        is10th && enrolled ? (acc.insurance_deduction as number) : 0;

      const built = buildPayrollRow({
        gross,
        workItemGross,
        periodRawRetention,
        ytdBefore,
        annualCap,
        fixedSalaryApplied,
        insuranceApplied,
        uninsuredRatePercent: uninsuredRate,
        enrolled,
        uninsuredExempt: acc.uninsured_exempt as boolean,
      });

      const includeOwnerAdmin =
        acc.role === 'OWNER' || acc.role === 'ADMIN'
          ? gross > 0 || fixedSalaryApplied > 0
          : true;

      if (!includeOwnerAdmin) continue;
      if (
        built.finalPay === 0 &&
        gross === 0 &&
        fixedSalaryApplied === 0
      ) {
        continue; /* B-051 */
      }

      const archivedMark = archived ? '（封存）' : '';
      const ownerMark = acc.role === 'OWNER' ? '（Owner）' /* PROVISIONAL(Q-054) */ : '';

      rows.push({
        run_id: run.id,
        account_id: acc.id,
        display_name_snapshot: `${acc.display_name}${archivedMark}${ownerMark}`,
        role_at_calc: acc.role,
        zone: acc.zone,
        big_meter: acc.big_meter,
        gross: Math.round(gross),
        period_retention: built.periodRetention,
        ytd_before: ytdBefore,
        net: built.net,
        fixed_salary_applied: fixedSalaryApplied,
        insurance_applied: insuranceApplied,
        uninsured_deduction: built.uninsured,
        final_pay: built.finalPay,
        fixed_salary_manual_amount: manualFixed ?? null,
        fixed_salary_added_back: Boolean(addBack),
        payment_method: acc.payment_method,
        bank_last4: acc.bank_account_last4,
      });
    }

    if (rows.length) {
      await this.db().from('payroll_run_rows').insert(rows);
    }

    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'EXPORT',
      description: `計薪 ${startDate}～${endDate}，${rows.length} 人`,
    });

    let cashTotal = 0;
    let transferTotal = 0;
    for (const r of rows as Array<{
      final_pay: number;
      payment_method: string;
    }>) {
      const fp = Number(r.final_pay ?? 0);
      if (fp <= 0) continue;
      if (r.payment_method === 'CASH') cashTotal += fp;
      else if (r.payment_method === 'TRANSFER') transferTotal += fp;
    }
    const denominations = greedyCashBreakdown(cashTotal);
    return {
      runId: run.id,
      rowCount: rows.length,
      capNtdUsed: annualCap,
      totals: { cashTotal, transferTotal, denominations },
    };
  }

  async listRuns(account: SessionAccount) {
    this.assertAdminOrOwner(account);
    const { data, error } = await this.db()
      .from('payroll_runs')
      .select('id, start_date, end_date, is_10th_payday, calculated_at, cap_ntd_used')
      .order('calculated_at', { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getRun(account: SessionAccount, runId: string) {
    this.assertAdminOrOwner(account);
    const { data: run, error } = await this.db()
      .from('payroll_runs')
      .select('*')
      .eq('id', runId)
      .single();
    if (error || !run) throw new BadRequestException('找不到計薪紀錄');
    const { data: rows } = await this.db()
      .from('payroll_run_rows')
      .select('*')
      .eq('run_id', runId)
      .order('display_name_snapshot');
    const masked = (rows ?? []).map((r) => ({
      ...r,
      bank_last4: this.bank.formatBankLast4(r.bank_last4 as string | null),
    }));
    return { run, rows: masked };
  }

  /** B-072 B-084 xlsx export for calculated run. */
  async exportRun(
    account: SessionAccount,
    runId: string,
    format: 'xlsx' | 'pdf' | 'docx' = 'xlsx',
  ) {
    const detail = await this.getRun(account, runId);
    const rowList = detail.rows as Array<Record<string, unknown>>;
    const base = {
      startDate: detail.run.start_date as string,
      endDate: detail.run.end_date as string,
      rows: rowList,
    };
    let buffer: Buffer;
    let fileName: string;
    let mimeType: string;
    if (format === 'pdf') {
      buffer = await this.exports.buildPayrollPdf(base);
      fileName = `payroll-${runId}.pdf`;
      mimeType = 'application/pdf';
    } else if (format === 'docx') {
      const accountIds = [
        ...new Set(rowList.map((r) => r.account_id as string)),
      ];
      const { data: accts } = await this.db()
        .from('accounts')
        .select('id, bank_account_ciphertext')
        .in('id', accountIds);
      const cipherMap = new Map(
        (accts ?? []).map((a) => [a.id as string, a.bank_account_ciphertext]),
      );
      const withBank = rowList.map((r) => {
        let bank_account_full: string | null = null;
        if (
          r.payment_method === 'TRANSFER' &&
          Number(r.final_pay ?? 0) > 0
        ) {
          try {
            const ct = cipherMap.get(r.account_id as string);
            bank_account_full = this.bank.decryptFromStorage(
              ct as Buffer | null,
            );
          } catch {
            throw new BadRequestException(
              '無法讀取銀行帳號，薪轉單匯出已中止',
            );
          }
        }
        return { ...r, bank_account_full };
      });
      buffer = await this.exports.buildTransferDocx(withBank);
      fileName = `payroll-transfer-${runId}.docx`;
      mimeType =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else {
      buffer = await this.exports.buildPayrollXlsx(base);
      fileName = `payroll-${runId}.xlsx`;
      mimeType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'EXPORT',
      description: `匯出薪資 ${format} run=${runId}`,
    });
    return { fileName, mimeType, base64: buffer.toString('base64') };
  }
}
