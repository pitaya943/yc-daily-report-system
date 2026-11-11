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
import {
  validateLedgerAmount,
  validateLedgerCategory,
  validateLedgerDate,
  validateLedgerDescription,
  validateLedgerPayerOnIncome,
  validateLedgerType,
  ValidationMessages,
} from '@yc/validation';

@Injectable()
export class LedgerService {
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
    for (const err of [
      validateLedgerDate(body.entryDate),
      validateLedgerType(body.type),
      validateLedgerAmount(body.amount),
      validateLedgerDescription(body.description),
      validateLedgerCategory(body.category),
      validateLedgerPayerOnIncome(body.type, body.payerAccountId),
    ]) {
      if (err) throw new BadRequestException(err.message);
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
    if (error) {
      throw new BadRequestException(ValidationMessages.ledgerDescriptionRequired);
    }
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
    const { data: row } = await this.db()
      .from('ledger_entries')
      .select('has_ever_had_evidence, voided_at')
      .eq('id', entryId)
      .single();
    if (row?.has_ever_had_evidence) {
      throw new BadRequestException('此紀錄有證據檔案，不能刪除，只能作廢');
    }
    if (row?.voided_at) {
      throw new BadRequestException(ValidationMessages.ledgerRecordVoided);
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

  /** B-085 upload evidence — permanent storage, one current file per entry. */
  async uploadEvidence(
    account: SessionAccount,
    entryId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  ) {
    this.assertAdminOrOwner(account);
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(ValidationMessages.evidenceFormatInvalid);
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException(ValidationMessages.evidenceSizeExceeded);
    }
    const path = `${entryId}/${Date.now()}-${file.originalname}`;
    const client = this.supabase.getServiceClient();
    const { error: upErr } = await client.storage
      .from('ledger-evidence')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (upErr) {
      throw new BadRequestException(ValidationMessages.evidenceFormatInvalid);
    }

    await this.db()
      .from('ledger_evidence_files')
      .update({ is_current: false })
      .eq('entry_id', entryId)
      .eq('is_current', true);

    const { count } = await this.db()
      .from('ledger_evidence_files')
      .select('id', { count: 'exact', head: true })
      .eq('entry_id', entryId);
    const version = (count ?? 0) + 1;

    await this.db()
      .from('ledger_entries')
      .update({ has_ever_had_evidence: true })
      .eq('id', entryId);

    await this.db().from('ledger_evidence_files').insert({
      entry_id: entryId,
      storage_bucket: 'ledger-evidence',
      storage_path: path,
      original_filename: file.originalname,
      mime_type: file.mimetype,
      size_bytes: file.size,
      version,
      is_current: true,
      created_by: account.id,
    });

    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'LEDGER_UPDATE',
      description: `上傳流水帳證據 ${entryId} v${version}`,
    });
    return { ok: true, version };
  }

  /** B-031 settle employee advance expense */
  async settleEntry(account: SessionAccount, entryId: string) {
    this.assertAdminOrOwner(account);
    const { data: row } = await this.db()
      .from('ledger_entries')
      .select('id, type, payer_account_id, voided_at')
      .eq('id', entryId)
      .single();
    if (!row) throw new NotFoundException();
    if (row.voided_at) {
      throw new BadRequestException(ValidationMessages.ledgerRecordVoided);
    }
    if (row.type !== 'EXPENSE') {
      throw new BadRequestException('僅支出可沖銷');
    }
    if (!row.payer_account_id) {
      return { ok: true, message: '支出者已是公司' };
    }
    await this.db()
      .from('ledger_entries')
      .update({ payer_account_id: null })
      .eq('id', entryId);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'LEDGER_SETTLE',
      description: `沖銷流水帳 ${entryId}`,
    });
    return { ok: true };
  }

  /** B-084 ledger Excel with void marks PROVISIONAL(Q-061). */
  async exportEntries(account: SessionAccount, to?: string) {
    this.assertAdminOrOwner(account);
    const end = to ?? taipeiYmd();
    const { data, error } = await this.db()
      .from('ledger_entries')
      .select('entry_date, type, amount, description, voided_at')
      .lte('entry_date', end)
      .order('entry_date', { ascending: true });
    if (error) throw new Error(error.message);
    const buffer = await this.exports.buildLedgerXlsx(data ?? []);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'EXPORT',
      description: `匯出流水帳 Excel`,
    });
    return {
      fileName: `ledger-${end}.xlsx`,
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64: buffer.toString('base64'),
    };
  }
}
