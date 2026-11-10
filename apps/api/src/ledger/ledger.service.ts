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

@Injectable()
export class LedgerService {
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

  /** B-076 cumulative petty cash through end date (excl. voided) */
  async pettyCashBalance(endDate?: string) {
    const end = endDate ?? taipeiYmd();
    const { data, error } = await this.db()
      .from('ledger_entries')
      .select('type, amount, voided_at, entry_date')
      .lte('entry_date', end);
    if (error) throw new Error(error.message);
    let balance = 0;
    for (const row of data ?? []) {
      if (row.voided_at) continue;
      if (row.type === 'INCOME') balance += Number(row.amount);
      else balance -= Number(row.amount);
    }
    return { balance, throughDate: end };
  }

  async listEntries(
    account: SessionAccount,
    query: { from?: string; to?: string; type?: string },
  ) {
    this.assertAdminOrOwner(account);
    let q = this.db()
      .from('ledger_entries')
      .select(
        'id, entry_date, type, amount, category, description, voided_at, payer_account_id',
      )
      .order('entry_date', { ascending: false })
      .limit(20);
    if (query.from) q = q.gte('entry_date', query.from);
    if (query.to) q = q.lte('entry_date', query.to);
    if (query.type === 'INCOME' || query.type === 'EXPENSE') {
      q = q.eq('type', query.type);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const balance = await this.pettyCashBalance(query.to);
    return { entries: data ?? [], pettyCash: balance };
  }

  async createEntry(
    account: SessionAccount,
    body: {
      entryDate: string;
      type: 'INCOME' | 'EXPENSE';
      amount: number;
      category?: string;
      description: string;
      payerAccountId?: string;
    },
  ) {
    this.assertAdminOrOwner(account);
    if (body.amount < 1) {
      throw new BadRequestException('金額須為正整數');
    }
    const { data, error } = await this.db()
      .from('ledger_entries')
      .insert({
        entry_date: body.entryDate,
        type: body.type,
        amount: body.amount,
        category: body.category ?? null,
        description: body.description.trim(),
        payer_account_id:
          body.type === 'EXPENSE' ? body.payerAccountId ?? null : null,
      })
      .select('id')
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'LEDGER_CREATE',
      description: `流水帳 ${body.type} ${body.amount}`,
    });
    return { id: data.id };
  }

  /** B-098 void */
  async voidEntry(account: SessionAccount, entryId: string) {
    this.assertAdminOrOwner(account);
    await this.db()
      .from('ledger_entries')
      .update({ voided_at: new Date().toISOString() })
      .eq('id', entryId)
      .is('voided_at', null);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'LEDGER_VOID',
      description: `作廢流水帳 ${entryId}`,
    });
    return { ok: true };
  }

  /** B-098 delete only when never had evidence */
  async deleteEntry(account: SessionAccount, entryId: string) {
    this.assertAdminOrOwner(account);
    const { count } = await this.db()
      .from('ledger_evidence_files')
      .select('id', { count: 'exact', head: true })
      .eq('entry_id', entryId);
    if ((count ?? 0) > 0) {
      throw new BadRequestException('此紀錄有證據檔案，不能刪除，只能作廢');
    }
    await this.db().from('ledger_entries').delete().eq('id', entryId);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'LEDGER_DELETE',
      description: `刪除流水帳 ${entryId}`,
    });
    return { ok: true };
  }

  /** B-085 signed URL for evidence (3600s) */
  async openEvidence(account: SessionAccount, entryId: string) {
    this.assertAdminOrOwner(account);
    const { data: file, error } = await this.db()
      .from('ledger_evidence_files')
      .select('storage_bucket, storage_path')
      .eq('entry_id', entryId)
      .eq('is_current', true)
      .maybeSingle();
    if (error || !file) throw new NotFoundException('找不到證據檔');
    const client = this.supabase.getServiceClient();
    const { data: signed, error: signErr } = await client.storage
      .from(file.storage_bucket)
      .createSignedUrl(file.storage_path, 3600);
    if (signErr || !signed) {
      throw new BadRequestException('無法產生下載連結');
    }
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'FILE_DOWNLOAD',
      description: `開啟流水帳證據 ${entryId}`,
    });
    return { url: signed.signedUrl, expiresIn: 3600 };
  }
}
