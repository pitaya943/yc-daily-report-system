import { ForbiddenException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SessionAccount } from '../auth/types';
import { taipeiYmd } from '../common/taipei-time';

@Injectable()
export class ArchivesService {
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

  async list(account: SessionAccount) {
    this.assertAdminOrOwner(account);
    const { data, error } = await this.db()
      .from('archives')
      .select('id, type, archive_date, source, manual_suffix, created_at')
      .order('archive_date', { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /** B-077 B-078 generate xlsx into Storage; one automatic per date. */
  async generateDaily(
    account: SessionAccount,
    archiveDate?: string,
    source: 'MANUAL' | 'AUTOMATIC' = 'MANUAL',
  ) {
    this.assertAdminOrOwner(account);
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
    const path = `daily/${date}-${source.toLowerCase()}-${Number(suffix) + 1}.xlsx`;
    const client = this.supabase.getServiceClient();
    await client.storage
      .from('archives')
      .upload(path, Buffer.from(`archive,${date}`), {
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
        xlsx_path: path,
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
}
