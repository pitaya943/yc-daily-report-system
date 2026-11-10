import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { buildReportShareRows } from '@yc/allocation';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SessionAccount } from '../auth/types';
import { taipeiYmd } from '../common/taipei-time';

@Injectable()
export class ConfirmationService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  private db() {
    return this.supabase.getServiceClient();
  }

  private assertAdminOrOwner(account: SessionAccount) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
  }

  async listPendingBigMeter(account: SessionAccount) {
    this.assertAdminOrOwner(account);
    const today = taipeiYmd();
    const start = this.addDays(today, -30);
    const { data: reports, error } = await this.db()
      .from('daily_reports')
      .select('id, report_date, status, submitter_id')
      .eq('status', 'PENDING')
      .gte('report_date', start)
      .lte('report_date', today)
      .order('report_date', { ascending: false });
    if (error) throw new Error(error.message);
    const list = reports ?? [];
    if (!list.length) return [];
    const submitterIds = [...new Set(list.map((r) => r.submitter_id))];
    const { data: accounts } = await this.db()
      .from('accounts')
      .select('id, display_name, big_meter, archived_at')
      .in('id', submitterIds);
    const byId = new Map((accounts ?? []).map((a) => [a.id, a]));
    return list
      .filter((r) => byId.get(r.submitter_id)?.big_meter)
      .map((r) => ({
        ...r,
        submitter: byId.get(r.submitter_id),
        archived: Boolean(byId.get(r.submitter_id)?.archived_at),
      }));
  }

  async listPendingOrdinary(
    account: SessionAccount,
    query?: { from?: string; to?: string; zone?: string },
  ) {
    this.assertAdminOrOwner(account);
    const today = taipeiYmd();
    const start = query?.from ?? this.addDays(today, -30);
    const end = query?.to ?? today;
    const { data: reports, error } = await this.db()
      .from('daily_reports')
      .select('id, report_date, status, submitter_id')
      .eq('status', 'PENDING')
      .gte('report_date', start)
      .lte('report_date', end)
      .order('report_date', { ascending: false });
    if (error) throw new Error(error.message);
    const list = reports ?? [];
    if (!list.length) return [];
    const submitterIds = [...new Set(list.map((r) => r.submitter_id))];
    const { data: accounts } = await this.db()
      .from('accounts')
      .select('id, display_name, big_meter, archived_at, zone')
      .in('id', submitterIds);
    const byId = new Map((accounts ?? []).map((a) => [a.id, a]));
    return list
      .filter((r) => !byId.get(r.submitter_id)?.big_meter)
      .filter((r) => {
        if (!query?.zone) return true;
        const z = byId.get(r.submitter_id);
        return z && (query.zone === 'SOUTH' ? z.zone === 'SOUTH' : z.zone === 'WEST');
      })
      .map((r) => ({
        ...r,
        submitter: byId.get(r.submitter_id),
        archived: Boolean(byId.get(r.submitter_id)?.archived_at),
      }));
  }

  /** B-069 B-091 Q-038/Q-040: approves include archived submitters marked 封存 */
  async confirmReport(account: SessionAccount, reportId: string) {
    this.assertAdminOrOwner(account);
    const { data: report, error } = await this.db()
      .from('daily_reports')
      .select(
        'id, submitter_id, status, custom_item_qty_units, report_date',
      )
      .eq('id', reportId)
      .single();
    if (error || !report) throw new NotFoundException();
    if (report.status !== 'PENDING') {
      return { skipped: true };
    }

    const { data: items } = await this.db()
      .from('report_item_quantities')
      .select('item_code, qty_units')
      .eq('report_id', reportId);
    const { data: collab } = await this.db()
      .from('report_collaborators')
      .select('account_id, sort_order')
      .eq('report_id', reportId)
      .order('sort_order');

    const collaboratorIds = (collab ?? []).map((c) => c.account_id as string);
    const shareRows = buildReportShareRows({
      reportId,
      submitterId: report.submitter_id,
      collaboratorIdsInOrder: collaboratorIds,
      quantities: (items ?? []).map((i) => ({
        itemCode: i.item_code as string,
        qtyUnits: i.qty_units as number,
      })),
      customQtyUnits: report.custom_item_qty_units ?? undefined,
    });

    if (shareRows.length) {
      await this.db().from('report_shares').insert(
        shareRows.map((s) => ({
          report_id: reportId,
          account_id: s.accountId,
          item_code: s.itemCode,
          share_units: s.shareUnits,
        })),
      );
    }

    const { data: submitter } = await this.db()
      .from('accounts')
      .select('display_name, archived_at')
      .eq('id', report.submitter_id)
      .single();

    const archivedMark = submitter?.archived_at ? '（封存）' : '';
    await this.db()
      .from('daily_reports')
      .update({
        status: 'CONFIRMED',
        reviewer_id: account.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'REPORT_CONFIRM',
      description: `核准日報 ${report.report_date} — ${submitter?.display_name ?? ''}${archivedMark}`,
    });

    return { ok: true, shares: shareRows.length };
  }

  async rejectReport(account: SessionAccount, reportId: string) {
    this.assertAdminOrOwner(account);
    const { data: report } = await this.db()
      .from('daily_reports')
      .select('id, status, report_date')
      .eq('id', reportId)
      .single();
    if (!report) throw new NotFoundException();
    if (report.status !== 'PENDING') return { skipped: true };

    await this.db()
      .from('daily_reports')
      .update({
        status: 'REJECTED',
        reviewer_id: account.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'REPORT_REJECT',
      description: `駁回日報 ${report.report_date}`,
    });
    return { ok: true };
  }

  private addDays(ymd: string, delta: number): string {
    const d = new Date(`${ymd}T12:00:00+08:00`);
    d.setUTCDate(d.getUTCDate() + delta);
    return d.toISOString().slice(0, 10);
  }
}
