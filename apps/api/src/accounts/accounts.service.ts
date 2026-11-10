import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SessionAccount } from '../auth/types';
import { BankService } from '../bank/bank.service';
import {
  ValidationMessages,
  validateBankAccountDigits,
  validateDisplayName,
  validatePasswordLength,
} from '@yc/validation';

type AccountRow = {
  id: string;
  display_name: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
  zone: 'WEST' | 'SOUTH';
  big_meter: boolean;
  archived_at: string | null;
  bank_account_last4: string | null;
  payment_method: 'TRANSFER' | 'CASH';
};

@Injectable()
export class AccountsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
    private readonly bank: BankService,
  ) {}

  private db() {
    return this.supabase.getServiceClient();
  }

  async listForManagement(actor: SessionAccount) {
    if (actor.role === 'OWNER') {
      const { data } = await this.db()
        .from('accounts')
        .select(
          'id, display_name, role, zone, big_meter, archived_at, bank_account_last4',
        )
        .order('display_name');
      return { accounts: data ?? [] };
    }
    if (actor.role === 'ADMIN') {
      const { data } = await this.db()
        .from('accounts')
        .select(
          'id, display_name, role, zone, big_meter, archived_at, bank_account_last4',
        )
        .eq('role', 'USER')
        .order('display_name');
      return { accounts: data ?? [] };
    }
    throw new ForbiddenException();
  }

  /** B-096 owner creates ADMIN with Auth user. */
  async createAdmin(actor: SessionAccount, displayName: string, password: string) {
    if (actor.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    return this.createAccount(actor, {
      displayName,
      password,
      role: 'ADMIN',
      zone: 'WEST',
    });
  }

  /** B-009 admin creates USER only. */
  async createUser(
    actor: SessionAccount,
    body: {
      displayName: string;
      password: string;
      zone?: 'WEST' | 'SOUTH';
      bigMeter?: boolean;
    },
  ) {
    if (actor.role !== 'ADMIN' && actor.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    if (actor.role === 'ADMIN') {
      return this.createAccount(actor, {
        displayName: body.displayName,
        password: body.password,
        role: 'USER',
        zone: body.zone ?? 'WEST',
        bigMeter: body.bigMeter ?? false,
      });
    }
    return this.createAccount(actor, {
      displayName: body.displayName,
      password: body.password,
      role: 'USER',
      zone: body.zone ?? 'WEST',
      bigMeter: body.bigMeter ?? false,
    });
  }

  private async createAccount(
    actor: SessionAccount,
    input: {
      displayName: string;
      password: string;
      role: 'ADMIN' | 'USER';
      zone: 'WEST' | 'SOUTH';
      bigMeter?: boolean;
    },
  ) {
    const nameErr = validateDisplayName(input.displayName);
    if (nameErr) throw new BadRequestException(nameErr.message);
    const pwErr = validatePasswordLength(input.password);
    if (pwErr) throw new BadRequestException(pwErr.message);

    const trimmed = input.displayName.trim();
    const { data: dup } = await this.db()
      .from('accounts')
      .select('id')
      .eq('display_name', trimmed)
      .maybeSingle();
    if (dup) throw new BadRequestException(ValidationMessages.displayNameDuplicate);

    if (input.role === 'ADMIN' && input.bigMeter) {
      throw new BadRequestException(ValidationMessages.bigMeterBeforeAdmin);
    }

    const email = `acct-${randomUUID()}@fixture.yc-daily-report.local`;
    const admin = this.supabase.getServiceClient();
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
    });
    if (authErr || !authUser.user) {
      throw new BadRequestException(authErr?.message ?? 'auth create failed');
    }

    const { data: row, error } = await this.db()
      .from('accounts')
      .insert({
        auth_user_id: authUser.user.id,
        display_name: trimmed,
        role: input.role,
        zone: input.zone,
        big_meter: input.role === 'ADMIN' ? false : !!input.bigMeter,
      })
      .select('id, display_name, role')
      .single();
    if (error) throw new BadRequestException(error.message);

    await this.audit.write({
      actorId: actor.id,
      actorDisplayName: actor.displayName,
      actionType: 'ACCOUNT_CREATE',
      description: `建立帳戶 ${trimmed}（${input.role}）`,
    });
    return { account: row };
  }

  /** B-012 archive; owner may archive ADMIN. */
  async archiveAccount(actor: SessionAccount, targetId: string) {
    const target = await this.getAccount(targetId);
    if (target.role === 'OWNER') {
      throw new BadRequestException('owner cannot be archived');
    }
    if (target.archived_at) return { ok: true };
    if (actor.role === 'ADMIN') {
      if (actor.id === targetId) {
        throw new ForbiddenException();
      }
      if (target.role === 'ADMIN') {
        await this.audit.logAccessDenied(
          actor.id,
          actor.displayName,
          'ACCOUNT_ARCHIVE',
        );
        throw new ForbiddenException();
      }
    }

    await this.db()
      .from('accounts')
      .update({
        archived_at: new Date().toISOString(),
        archived_by: actor.id,
      })
      .eq('id', targetId);
    await this.audit.write({
      actorId: actor.id,
      actorDisplayName: actor.displayName,
      actionType: 'ACCOUNT_ARCHIVE',
      description: `封存帳戶 ${target.display_name}`,
    });
    return { ok: true };
  }

  /** B-012 restore; restoring ADMIN is owner-only. */
  async restoreAccount(actor: SessionAccount, targetId: string) {
    const target = await this.getAccount(targetId);
    if (!target.archived_at) return { ok: true };
    if (target.role === 'ADMIN' && actor.role !== 'OWNER') {
      await this.audit.logAccessDenied(
        actor.id,
        actor.displayName,
        'ACCOUNT_RESTORE',
      );
      throw new ForbiddenException();
    }
    await this.db()
      .from('accounts')
      .update({ archived_at: null, archived_by: null })
      .eq('id', targetId);
    await this.audit.write({
      actorId: actor.id,
      actorDisplayName: actor.displayName,
      actionType: 'ACCOUNT_RESTORE',
      description: `復原帳戶 ${target.display_name}`,
    });
    return { ok: true };
  }

  /** B-048 Q-057 owner switches USER<->ADMIN. */
  async switchRole(
    actor: SessionAccount,
    targetId: string,
    role: 'USER' | 'ADMIN',
  ) {
    if (actor.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    const target = await this.getAccount(targetId);
    if (target.role === 'OWNER') {
      throw new BadRequestException();
    }
    if (role === 'ADMIN' && target.big_meter) {
      throw new BadRequestException(ValidationMessages.bigMeterBeforeAdmin);
    }
    await this.db()
      .from('accounts')
      .update({
        role,
        big_meter: role === 'ADMIN' ? false : target.big_meter,
      })
      .eq('id', targetId);
    await this.audit.write({
      actorId: actor.id,
      actorDisplayName: actor.displayName,
      actionType: 'ACCOUNT_ROLE_CHANGE',
      description: `切換 ${target.display_name} 角色為 ${role}`,
    });
    return { ok: true };
  }

  /** B-008 password change with current password. */
  async changePassword(
    actor: SessionAccount,
    currentPassword: string,
    newPassword: string,
  ) {
    const pwErr = validatePasswordLength(newPassword);
    if (pwErr) throw new BadRequestException(pwErr.message);
    const { data: acct } = await this.db()
      .from('accounts')
      .select('auth_user_id, display_name')
      .eq('id', actor.id)
      .single();
    if (!acct) throw new NotFoundException();
    const anon = this.supabase.getAnonClient();
    const emailRow = await this.lookupEmail(acct.auth_user_id);
    const check = await anon.auth.signInWithPassword({
      email: emailRow,
      password: currentPassword,
    });
    if (check.error) {
      throw new BadRequestException(ValidationMessages.passwordCurrentIncorrect);
    }
    const { error } = await this.db().auth.admin.updateUserById(
      acct.auth_user_id,
      { password: newPassword },
    );
    if (error) throw new BadRequestException(error.message);
    await this.audit.write({
      actorId: actor.id,
      actorDisplayName: actor.displayName,
      actionType: 'PASSWORD_CHANGE',
      description: `變更密碼`,
    });
    return { ok: true };
  }

  async setBankAccount(
    actor: SessionAccount,
    targetId: string,
    bankAccount: string,
  ) {
    if (actor.role !== 'OWNER') {
      await this.audit.logAccessDenied(
        actor.id,
        actor.displayName,
        'ACCOUNT_UPDATE',
      );
      throw new ForbiddenException();
    }
    const err = validateBankAccountDigits(bankAccount);
    if (err) throw new BadRequestException(err.message);
    const { ciphertext, last4 } = this.bank.encryptForStorage(bankAccount);
    await this.db()
      .from('accounts')
      .update({
        bank_account_ciphertext: `\\x${ciphertext.toString('hex')}`,
        bank_account_last4: last4,
        payment_method: 'TRANSFER',
      })
      .eq('id', targetId);
    const target = await this.getAccount(targetId);
    await this.audit.write({
      actorId: actor.id,
      actorDisplayName: actor.displayName,
      actionType: 'ACCOUNT_UPDATE',
      description: `更新 ${target.display_name} 銀行帳號（後四碼 ${last4}）`,
    });
    return { last4 };
  }

  /** B-093 reveal full bank — logged BANK_REVEAL. */
  async revealBank(actor: SessionAccount, targetId: string) {
    if (actor.role !== 'OWNER' && actor.role !== 'ADMIN') {
      throw new ForbiddenException();
    }
    const { data, error } = await this.db()
      .from('accounts')
      .select('display_name, bank_account_ciphertext, bank_account_last4')
      .eq('id', targetId)
      .single();
    if (error || !data) throw new NotFoundException();
    const raw = data.bank_account_ciphertext as string | null;
    const buf =
      raw && typeof raw === 'string' && raw.startsWith('\\x')
        ? Buffer.from(raw.slice(2), 'hex')
        : raw
          ? Buffer.from(raw as string)
          : null;
    const full = this.bank.decryptFromStorage(buf);
    await this.audit.write({
      actorId: actor.id,
      actorDisplayName: actor.displayName,
      actionType: 'BANK_REVEAL',
      description: `查看完整銀行帳號：${data.display_name}`,
    });
    return { account: full, last4: data.bank_account_last4 };
  }

  private async lookupEmail(authUserId: string): Promise<string> {
    const { data, error } = await this.db().auth.admin.getUserById(authUserId);
    if (error || !data.user?.email) throw new Error('auth email missing');
    return data.user.email;
  }

  /** B-013 B-015 B-017 B-018 owner updates financial fields on USER */
  async updateUserFinancials(
    actor: SessionAccount,
    targetId: string,
    body: {
      paymentMethod?: 'TRANSFER' | 'CASH';
      insuranceDeduction?: number;
      fixedSalary?: number;
      payFixedEveryPeriod?: boolean;
      uninsuredExempt?: boolean;
      uninsuredRateOverride?: number | null;
    },
  ) {
    if (actor.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    const target = await this.getAccount(targetId);
    if (target.role === 'OWNER') throw new ForbiddenException();
    const patch: Record<string, unknown> = {};
    if (body.paymentMethod) patch.payment_method = body.paymentMethod;
    if (body.insuranceDeduction !== undefined) {
      patch.insurance_deduction = body.insuranceDeduction;
    }
    if (body.fixedSalary !== undefined) patch.fixed_salary = body.fixedSalary;
    if (body.payFixedEveryPeriod !== undefined) {
      patch.pay_fixed_every_period = body.payFixedEveryPeriod;
    }
    if (body.uninsuredExempt !== undefined) {
      patch.uninsured_exempt = body.uninsuredExempt;
    }
    if (body.uninsuredRateOverride !== undefined) {
      patch.uninsured_rate_override = body.uninsuredRateOverride;
    }
    await this.db().from('accounts').update(patch).eq('id', targetId);
    await this.audit.write({
      actorId: actor.id,
      actorDisplayName: actor.displayName,
      actionType: 'ACCOUNT_UPDATE',
      description: `更新 ${target.display_name} 財務欄位`,
    });
    return { ok: true };
  }

  /** B-019 retention offset per calendar year */
  async setRetentionOffset(
    actor: SessionAccount,
    targetId: string,
    body: { calendarYear: number; offsetNtd: number },
  ) {
    if (actor.role !== 'OWNER' && actor.role !== 'ADMIN') {
      throw new ForbiddenException();
    }
    if (targetId !== actor.id && actor.role === 'ADMIN') {
      const target = await this.getAccount(targetId);
      if (target.role !== 'USER') throw new ForbiddenException();
    }
    await this.db()
      .from('retention_offsets')
      .upsert({
        account_id: targetId,
        calendar_year: body.calendarYear,
        offset_ntd: body.offsetNtd,
        updated_by: actor.id,
      });
    await this.audit.write({
      actorId: actor.id,
      actorDisplayName: actor.displayName,
      actionType: 'RETENTION_SET',
      description: `保留金調整 ${targetId} ${body.calendarYear}=${body.offsetNtd}`,
    });
    return { ok: true };
  }

  private async getAccount(id: string): Promise<AccountRow> {
    const { data, error } = await this.db()
      .from('accounts')
      .select(
        'id, display_name, role, zone, big_meter, archived_at, bank_account_last4, payment_method',
      )
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException();
    return data as AccountRow;
  }
}
