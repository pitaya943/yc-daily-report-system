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

  /** B-077 B-078 manual generate placeholder paths */
  async generateDaily(account: SessionAccount, archiveDate?: string) {
    this.assertAdminOrOwner(account);
    const date = archiveDate ?? taipeiYmd();
    const { data, error } = await this.db()
      .from('archives')
      .insert({
        type: 'DAILY',
        archive_date: date,
        source: 'MANUAL',
        manual_suffix: 1,
        generator_id: account.id,
        xlsx_path: `archives/daily/${date}-manual-1.xlsx`,
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
