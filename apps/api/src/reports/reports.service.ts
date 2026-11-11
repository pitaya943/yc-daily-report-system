import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SessionAccount } from '../auth/types';
import {
  ValidationMessages,
  validateCustomItem,
  validateDailyCapCount,
  validateQtyUnits,
  validateReportDate,
} from '@yc/validation';
import { taipeiYmd } from '../common/taipei-time';
import { ExportService } from '../export/export.service';

type PriceSet = 'WEST' | 'SOUTH' | 'BIG_METER';

@Injectable()
export class ReportsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
    private readonly exports: ExportService,
  ) {}

  private db() {
    return this.supabase.getServiceClient();
  }

  async getAccountProfile(accountId: string) {
    const { data, error } = await this.db()
      .from('accounts')
      .select('id, zone, big_meter, role, archived_at, display_name')
      .eq('id', accountId)
      .single();
    if (error || !data) throw new NotFoundException();
    return data;
  }

  priceSetFor(profile: { zone: string; big_meter: boolean }): PriceSet {
    if (profile.big_meter) return 'BIG_METER';
    return profile.zone === 'SOUTH' ? 'SOUTH' : 'WEST';
  }

  async listWorkItemsForAccount(accountId: string) {
    const profile = await this.getAccountProfile(accountId);
    const catalogue = this.priceSetFor(profile);
    const { data, error } = await this.db()
      .from('work_items')
      .select('code, display_name, default_price, sort_order')
      .eq('catalogue', catalogue)
      .order('sort_order');
    if (error) throw new Error(error.message);
    return { items: data ?? [], catalogue };
  }

  private qtyToUnits(qty: number): number {
    const units = Math.round(qty * 10);
    if (Math.abs(units / 10 - qty) > 0.0001) {
      throw new BadRequestException(ValidationMessages.qtyInvalid);
    }
    return units;
  }

  private async resolveCollaborators(
    submitter: SessionAccount,
    collaboratorIds: string[],
  ): Promise<string[]> {
    if (collaboratorIds.length > 6) {
      throw new BadRequestException(ValidationMessages.collaboratorLimit);
    }
    const profile = await this.getAccountProfile(submitter.id);
    const unique = [...new Set(collaboratorIds.filter((id) => id !== submitter.id))];
    if (unique.length === 0) return [];

    const { data, error } = await this.db()
      .from('accounts')
      .select('id, role, zone, big_meter, archived_at')
      .in('id', unique);
    if (error) throw new Error(error.message);

    const valid = (data ?? []).filter(
      (a) =>
        a.role === 'USER' &&
        !a.archived_at &&
        a.zone === profile.zone &&
        a.big_meter === profile.big_meter,
    );
    if (valid.length !== unique.length) {
      throw new BadRequestException(ValidationMessages.collaboratorLimit);
    }
    return unique;
  }

  private async countOwnReportsOnDate(
    submitterId: string,
    reportDate: string,
  ): Promise<number> {
    const { count, error } = await this.db()
      .from('daily_reports')
      .select('id', { count: 'exact', head: true })
      .eq('submitter_id', submitterId)
      .eq('report_date', reportDate);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /** B-062 B-025 USER submit only */
  async createReport(
    account: SessionAccount,
    body: {
      reportDate: string;
      quantities: Array<{ itemCode: string; qty: number }>;
      collaboratorIds?: string[];
      customItemName?: string;
      customItemQty?: number;
      customItemUnitPrice?: number;
    },
  ) {
    if (account.role !== 'USER') {
      throw new ForbiddenException();
    }
    const today = taipeiYmd();
    const dateErr = validateReportDate(body.reportDate, today);
    if (dateErr) throw new BadRequestException(dateErr.message);

    const cap = await this.countOwnReportsOnDate(account.id, body.reportDate);
    const capErr = validateDailyCapCount(cap);
    if (capErr) throw new BadRequestException(capErr.message);

    const profile = await this.getAccountProfile(account.id);
    const catalogue = this.priceSetFor(profile);
    const { data: allowed } = await this.db()
      .from('work_items')
      .select('code')
      .eq('catalogue', catalogue);
    const allowedSet = new Set((allowed ?? []).map((r) => r.code));

    const items: Array<{ item_code: string; qty_units: number }> = [];
    for (const row of body.quantities ?? []) {
      if (!allowedSet.has(row.itemCode)) continue;
      const units = this.qtyToUnits(row.qty ?? 0);
      const err = validateQtyUnits(units);
      if (err) throw new BadRequestException(err.message);
      if (units > 0) items.push({ item_code: row.itemCode, qty_units: units });
    }

    const customErr = validateCustomItem({
      name: body.customItemName,
      qty: body.customItemQty,
      unitPrice: body.customItemUnitPrice,
    });
    if (customErr) throw new BadRequestException(customErr.message);

    const collaboratorIds = await this.resolveCollaborators(
      account,
      body.collaboratorIds ?? [],
    );

    const { data: report, error } = await this.db()
      .from('daily_reports')
      .insert({
        submitter_id: account.id,
        report_date: body.reportDate,
        status: 'PENDING',
        custom_item_name: body.customItemName || null,
        custom_item_qty_units: body.customItemQty
          ? this.qtyToUnits(body.customItemQty)
          : null,
        custom_item_unit_price: body.customItemUnitPrice ?? null,
      })
      .select('id')
      .single();
    if (error) throw new BadRequestException(error.message);

    if (items.length) {
      await this.db().from('report_item_quantities').insert(
        items.map((i) => ({ report_id: report.id, ...i })),
      );
    }
    for (let i = 0; i < collaboratorIds.length; i++) {
      await this.db().from('report_collaborators').insert({
        report_id: report.id,
        account_id: collaboratorIds[i],
        sort_order: i,
      });
    }

    const groupN = 1 + collaboratorIds.length;
    const desc =
      groupN > 1
        ? `新增日報 ${body.reportDate}，共 ${groupN} 人作業`
        : `新增日報 ${body.reportDate}`;
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'REPORT_CREATE',
      description: desc,
    });

    return { id: report.id };
  }

  /** B-064 BDD-006 delete pending/rejected own */
  async deleteReport(account: SessionAccount, reportId: string) {
    const { data: report, error } = await this.db()
      .from('daily_reports')
      .select('id, submitter_id, status')
      .eq('id', reportId)
      .single();
    if (error || !report) throw new NotFoundException();

    if (account.role === 'USER') {
      if (report.submitter_id !== account.id) {
        await this.audit.logAccessDenied(
          account.id,
          account.displayName,
          'REPORT_DELETE',
        );
        throw new ForbiddenException('共同作業回報，無法修改/刪除');
      }
      if (report.status === 'CONFIRMED') {
        throw new ForbiddenException(ValidationMessages.confirmedReportNoEdit);
      }
      if (report.status !== 'PENDING' && report.status !== 'REJECTED') {
        throw new ForbiddenException();
      }
    }

    await this.db().from('daily_reports').delete().eq('id', reportId);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'REPORT_DELETE',
      description: `刪除日報 ${reportId}`,
    });
    return { ok: true };
  }

  private async applyQuantitiesToReport(
    reportId: string,
    accountId: string,
    quantities: Array<{ itemCode: string; qty: number }>,
  ) {
    const profile = await this.getAccountProfile(accountId);
    const catalogue = this.priceSetFor(profile);
    const { data: allowed } = await this.db()
      .from('work_items')
      .select('code')
      .eq('catalogue', catalogue);
    const allowedSet = new Set((allowed ?? []).map((r) => r.code));

    const items: Array<{ item_code: string; qty_units: number }> = [];
    for (const row of quantities ?? []) {
      if (!allowedSet.has(row.itemCode)) continue;
      const units = this.qtyToUnits(row.qty ?? 0);
      const err = validateQtyUnits(units);
      if (err) throw new BadRequestException(err.message);
      if (units > 0) items.push({ item_code: row.itemCode, qty_units: units });
    }

    await this.db()
      .from('report_item_quantities')
      .delete()
      .eq('report_id', reportId);
    if (items.length) {
      await this.db().from('report_item_quantities').insert(
        items.map((i) => ({ report_id: reportId, ...i })),
      );
    }
    return items;
  }

  /** B-064 user pending/rejected edit; admin may unconfirm confirmed */
  async updateReport(
    account: SessionAccount,
    reportId: string,
    body: {
      quantities: Array<{ itemCode: string; qty: number }>;
      collaboratorIds?: string[];
      customItemName?: string | null;
      customItemQty?: number | null;
      customItemUnitPrice?: number | null;
    },
  ) {
    const { data: report, error } = await this.db()
      .from('daily_reports')
      .select('id, submitter_id, status')
      .eq('id', reportId)
      .single();
    if (error || !report) throw new NotFoundException();

    const isSubmitter = report.submitter_id === account.id;
    const isAdmin =
      account.role === 'ADMIN' || account.role === 'OWNER';

    const { data: beforeItems } = await this.db()
      .from('report_item_quantities')
      .select('item_code, qty_units')
      .eq('report_id', reportId);

    if (account.role === 'USER') {
      if (!isSubmitter) {
        await this.audit.logAccessDenied(
          account.id,
          account.displayName,
          'REPORT_UPDATE',
        );
        throw new ForbiddenException('共同作業回報，無法修改/刪除');
      }
      if (report.status === 'CONFIRMED') {
        throw new ForbiddenException(ValidationMessages.confirmedReportNoEdit);
      }
    } else if (!isAdmin) {
      throw new ForbiddenException();
    }

    const wasConfirmed = report.status === 'CONFIRMED';
    const wasRejected = report.status === 'REJECTED';
    const editorId = isSubmitter ? account.id : report.submitter_id;

    await this.applyQuantitiesToReport(reportId, editorId, body.quantities);

    if (
      body.customItemName !== undefined &&
      (account.role === 'ADMIN' || account.role === 'OWNER')
    ) {
      const customErr = validateCustomItem({
        name: body.customItemName,
        qty: body.customItemQty,
        unitPrice: body.customItemUnitPrice,
      });
      if (customErr) throw new BadRequestException(customErr.message);
      const name = body.customItemName?.trim() ?? '';
      if (!name) {
        await this.db()
          .from('daily_reports')
          .update({
            custom_item_name: null,
            custom_item_qty_units: null,
            custom_item_unit_price: null,
          })
          .eq('id', reportId);
      } else {
        await this.db()
          .from('daily_reports')
          .update({
            custom_item_name: name,
            custom_item_qty_units: this.qtyToUnits(body.customItemQty ?? 0),
            custom_item_unit_price: body.customItemUnitPrice ?? 0,
          })
          .eq('id', reportId);
      }
    }

    if (body.collaboratorIds !== undefined) {
      const submitter = await this.getAccountProfile(report.submitter_id);
      const submitterSession: SessionAccount = {
        id: report.submitter_id,
        displayName: submitter.display_name,
        role: 'USER',
        authUserId: '',
      };
      const collaboratorIds = await this.resolveCollaborators(
        submitterSession,
        body.collaboratorIds,
      );
      await this.db()
        .from('report_collaborators')
        .delete()
        .eq('report_id', reportId);
      for (let i = 0; i < collaboratorIds.length; i++) {
        await this.db().from('report_collaborators').insert({
          report_id: reportId,
          account_id: collaboratorIds[i],
          sort_order: i,
        });
      }
    }

    if (wasConfirmed && isAdmin) {
      await this.db().from('report_shares').delete().eq('report_id', reportId);
      await this.db()
        .from('daily_reports')
        .update({
          status: 'PENDING',
          reviewer_id: null,
          reviewed_at: null,
        })
        .eq('id', reportId);
      await this.audit.write({
        actorId: account.id,
        actorDisplayName: account.displayName,
        actionType: 'REPORT_UNCONFIRM',
        description: `取消確認日報 ${reportId}`,
      });
    } else if (wasRejected && account.role === 'USER') {
      await this.db()
        .from('daily_reports')
        .update({ status: 'PENDING', reviewer_id: null, reviewed_at: null })
        .eq('id', reportId);
    }

    const afterItems = body.quantities ?? [];
    let diffDesc = this.describeQtyDiff(
      (beforeItems ?? []).map((i) => ({
        itemCode: i.item_code as string,
        qtyUnits: i.qty_units as number,
      })),
      afterItems,
    );
    if (body.customItemName !== undefined && isAdmin) {
      diffDesc += `；自訂工項=${body.customItemName?.trim() || '（清除）'}`;
    }
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'REPORT_UPDATE',
      description: diffDesc,
    });

    return { id: reportId, unconfirmed: wasConfirmed && isAdmin };
  }

  private describeQtyDiff(
    before: Array<{ itemCode: string; qtyUnits: number }>,
    after: Array<{ itemCode: string; qty: number }>,
  ): string {
    const afterMap = new Map(
      after.map((a) => [a.itemCode, Math.round(a.qty * 10)]),
    );
    const parts: string[] = [];
    for (const b of before) {
      const next = afterMap.get(b.itemCode) ?? 0;
      if (next !== b.qtyUnits) {
        parts.push(`${b.itemCode} ${b.qtyUnits / 10}→${next / 10}`);
      }
    }
    for (const a of after) {
      if (!before.find((b) => b.itemCode === a.itemCode)) {
        parts.push(`${a.itemCode} 新增 ${a.qty}`);
      }
    }
    return parts.length ? parts.join('；') : '無變更';
  }

  async getReportDetail(account: SessionAccount, reportId: string) {
    const { data: report, error } = await this.db()
      .from('daily_reports')
      .select(
        'id, report_date, status, submitter_id, reviewer_id, reviewed_at',
      )
      .eq('id', reportId)
      .single();
    if (error || !report) throw new NotFoundException();

    const isSubmitter = report.submitter_id === account.id;
    const isAdmin =
      account.role === 'ADMIN' || account.role === 'OWNER';
    if (account.role === 'USER' && !isSubmitter) {
      const { data: collab } = await this.db()
        .from('report_collaborators')
        .select('account_id')
        .eq('report_id', reportId)
        .eq('account_id', account.id)
        .maybeSingle();
      if (!collab) throw new ForbiddenException();
    } else if (!isSubmitter && !isAdmin) {
      throw new ForbiddenException();
    }

    const { data: items } = await this.db()
      .from('report_item_quantities')
      .select('item_code, qty_units')
      .eq('report_id', reportId);
    const { data: shares } = await this.db()
      .from('report_shares')
      .select('account_id, item_code, share_units')
      .eq('report_id', reportId);
    return { ...report, quantities: items ?? [], shares: shares ?? [] };
  }

  async listOwnReports(account: SessionAccount) {
    const { data, error } = await this.db()
      .from('daily_reports')
      .select(
        'id, report_date, status, created_at, submitter_id',
      )
      .eq('submitter_id', account.id)
      .order('report_date', { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /** B-063 history for submitter or collaborator */
  async listHistory(
    account: SessionAccount,
    query?: { status?: string; page?: number; pageSize?: number },
  ) {
    const pageSize = query?.pageSize ?? 20;
    const page = query?.page ?? 1;
    const { data: own } = await this.db()
      .from('daily_reports')
      .select('id, report_date, status, created_at, submitter_id')
      .eq('submitter_id', account.id);
    const { data: collab } = await this.db()
      .from('report_collaborators')
      .select('report_id')
      .eq('account_id', account.id);
    const collabIds = (collab ?? []).map((c) => c.report_id);
    let shared: typeof own = [];
    if (collabIds.length) {
      const { data } = await this.db()
        .from('daily_reports')
        .select('id, report_date, status, created_at, submitter_id')
        .in('id', collabIds);
      shared = data ?? [];
    }
    const merged = [...(own ?? []), ...shared];
    const uniq = new Map(merged.map((r) => [r.id, r]));
    let rows = [...uniq.values()];
    if (query?.status) {
      rows = rows.filter((r) => r.status === query.status);
    }
    rows.sort((a, b) => (a.report_date < b.report_date ? 1 : -1));
    const filtered = rows;
    const slice = filtered.slice((page - 1) * pageSize, page * pageSize);
    return {
      page,
      pageSize,
      total: filtered.length,
      rows: slice.map((r) => ({
        ...r,
        role: r.submitter_id === account.id ? 'submitter' : 'collaborator',
        canEdit:
          r.submitter_id === account.id &&
          r.status !== 'CONFIRMED' &&
          account.role === 'USER',
      })),
    };
  }

  /** B-063 admin history */
  async listAdminHistory(account: SessionAccount, query?: { status?: string }) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    let q = this.db()
      .from('daily_reports')
      .select('id, report_date, status, submitter_id, created_at')
      .order('report_date', { ascending: false })
      .limit(20);
    if (query?.status) q = q.eq('status', query.status);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async listEligibleCollaborators(account: SessionAccount) {
    const profile = await this.getAccountProfile(account.id);
    const { data, error } = await this.db()
      .from('accounts')
      .select('id, display_name')
      .eq('role', 'USER')
      .is('archived_at', null)
      .eq('zone', profile.zone)
      .eq('big_meter', profile.big_meter)
      .neq('id', account.id)
      .order('display_name');
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /** B-063 history Excel export */
  async exportHistory(account: SessionAccount, query?: { status?: string }) {
    const list =
      account.role === 'USER'
        ? await this.listHistory(account, query)
        : { rows: await this.listAdminHistory(account, query) };
    const rows = list.rows;
    const { data: names } = await this.db()
      .from('accounts')
      .select('id, display_name');
    const nameMap = new Map(
      (names ?? []).map((n) => [n.id as string, n.display_name as string]),
    );
    const exportRows = rows.map((r: { report_date: string; submitter_id: string; status: string }) => ({
      reportDate: r.report_date,
      submitter: nameMap.get(r.submitter_id) ?? r.submitter_id,
      status: r.status,
    }));
    const buffer = await this.exports.buildHistoryXlsx(exportRows);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'EXPORT',
      description: '匯出歷史 Excel',
    });
    return {
      fileName: 'history.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64: buffer.toString('base64'),
    };
  }
}
