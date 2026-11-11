import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SessionAccount } from '../auth/types';
import { taipeiYmd } from '../common/taipei-time';
import { ExportService } from '../export/export.service';
import { ValidationMessages } from '@yc/validation';

@Injectable()
export class ArchivesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
    private readonly exports: ExportService,
  ) {}

  private db() {
    return this.supabase.getServiceClient();
  }

  private assertAdminOrOwner(account: SessionAccount) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
  }

  async list(account: SessionAccount, page = 1) {
    this.assertAdminOrOwner(account);
    const pageSize = 30;
    const from = (page - 1) * pageSize;
    const { data, error } = await this.db()
      .from('archives')
      .select('id, type, archive_date, source, manual_suffix, created_at, pdf_path')
      .order('archive_date', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: data ?? [], page, pageSize };
  }

  private async confirmedCountsByZone(date: string) {
    const { data: reports } = await this.db()
      .from('daily_reports')
      .select('submitter_id')
      .eq('status', 'CONFIRMED')
      .eq('report_date', date);
    const ids = [...new Set((reports ?? []).map((r) => r.submitter_id))];
    if (!ids.length) return { west: 0, south: 0, bigMeter: 0 };
    const { data: accounts } = await this.db()
      .from('accounts')
      .select('id, zone, big_meter')
      .in('id', ids);
    let west = 0;
    let south = 0;
    let bigMeter = 0;
    const byId = new Map((accounts ?? []).map((a) => [a.id, a]));
    for (const r of reports ?? []) {
      const a = byId.get(r.submitter_id);
      if (!a) continue;
      if (a.big_meter) bigMeter++;
      else if (a.zone === 'SOUTH') south++;
      else west++;
    }
    return { west, south, bigMeter };
  }

  /** B-077 B-078 generate xlsx + pdf sidecar into Storage. */
  async generateDaily(
    account: SessionAccount,
    archiveDate?: string,
    source: 'MANUAL' | 'AUTOMATIC' = 'MANUAL',
  ) {
    this.assertAdminOrOwner(account);
    if (archiveDate && !/^\d{4}-\d{2}-\d{2}$/.test(archiveDate)) {
      throw new BadRequestException('請選擇報表類型與日期');
    }
    const date = archiveDate ?? taipeiYmd();
    if (source === 'AUTOMATIC') {
      const { data: dup } = await this.db()
        .from('archives')
        .select('id')
        .eq('type', 'DAILY')
        .eq('archive_date', date)
        .eq('source', 'AUTOMATIC')
        .maybeSingle();
      if (dup) {
        return { id: dup.id, duplicate: true };
      }
    }
    const suffix =
      source === 'MANUAL'
        ? (
            await this.db()
              .from('archives')
              .select('id', { count: 'exact', head: true })
              .eq('type', 'DAILY')
              .eq('archive_date', date)
              .eq('source', 'MANUAL')
          ).count ?? 0
        : 0;
    const zones = await this.confirmedCountsByZone(date);
    const xlsx = await this.exports.buildArchiveWorkbook(date, zones);
    const pdf = await this.exports.buildArchivePdf(date, '日報歸檔檔案庫');
    const base = `daily/${date}-${source.toLowerCase()}-${Number(suffix) + 1}`;
    const xlsxPath = `${base}.xlsx`;
    const pdfPath = `${base}.pdf`;
    const client = this.supabase.getServiceClient();
    await client.storage.from('archives').upload(xlsxPath, xlsx, {
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: false,
    });
    await client.storage.from('archives').upload(pdfPath, pdf, {
      contentType: 'application/pdf',
      upsert: false,
    });
    const { data, error } = await this.db()
      .from('archives')
      .insert({
        type: 'DAILY',
        archive_date: date,
        source,
        manual_suffix: source === 'MANUAL' ? Number(suffix) + 1 : null,
        generator_id: account.id,
        xlsx_path: xlsxPath,
        pdf_path: pdfPath,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'EXPORT',
      description: `手動日報歸檔 ${date}`,
    });
    return { id: data.id };
  }

  /** B-077 download — fresh 3600s signed URLs (B-085 pattern for archives). */
  async download(account: SessionAccount, archiveId: string) {
    this.assertAdminOrOwner(account);
    const { data: row } = await this.db()
      .from('archives')
      .select('id, xlsx_path, pdf_path, archive_date')
      .eq('id', archiveId)
      .single();
    if (!row) {
      throw new NotFoundException(ValidationMessages.archiveNotFound);
    }
    const client = this.supabase.getServiceClient();
    const links: Record<string, string> = {};
    const expiresIn = 3600;
    if (row.xlsx_path) {
      const { data: signed } = await client.storage
        .from('archives')
        .createSignedUrl(row.xlsx_path as string, expiresIn);
      if (signed?.signedUrl) links.xlsx = signed.signedUrl;
    }
    if (row.pdf_path) {
      const { data: signed } = await client.storage
        .from('archives')
        .createSignedUrl(row.pdf_path as string, expiresIn);
      if (signed?.signedUrl) links.pdf = signed.signedUrl;
    }
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'FILE_DOWNLOAD',
      description: `下載歸檔 ${archiveId}`,
    });
    return { expiresIn, links };
  }

  /** B-077 delete removes storage files and DB row. */
  async remove(account: SessionAccount, archiveId: string) {
    this.assertAdminOrOwner(account);
    const { data: row } = await this.db()
      .from('archives')
      .select('id, xlsx_path, pdf_path')
      .eq('id', archiveId)
      .single();
    if (!row) {
      throw new NotFoundException(ValidationMessages.archiveNotFound);
    }
    const client = this.supabase.getServiceClient();
    const paths = [row.xlsx_path, row.pdf_path].filter(Boolean) as string[];
    if (paths.length) {
      await client.storage.from('archives').remove(paths);
    }
    await this.db().from('archives').delete().eq('id', archiveId);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'EXPORT',
      description: `刪除歸檔 ${archiveId}`,
    });
    return { ok: true };
  }
}
