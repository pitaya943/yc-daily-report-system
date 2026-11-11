import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
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
  validateFixedSalary,
  validateInsuranceDeduction,
  validatePasswordLength,
  validatePaymentMethod,
  validatePerItemRetentionRate,
  validateRetentionOffset,
  validateUninsuredRate,
  validateZone,
  validateZoneRequired,
  validateSwitchRole,
  validateBigMeterFlag,
  validateUninsuredExemptFlag,
} from '@yc/validation';
import { throwFieldBadRequest } from '../common/field-error';

type AccountRow = {
  id: string;
  display_name: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
  zone: 'WEST' | 'SOUTH';
  big_meter: boolean;
  archived_at: string | null;
  bank_account_last4: string | null;
  bank_account_ciphertext: string | null;
  payment_method: 'TRANSFER' | 'CASH';
  insurance_deduction: number;
  uninsured_exempt: boolean;
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
          'id, display_name, role, zone, big_meter, archived_at, bank_account_last4, fixed_salary',
        )
        .order('display_name');
      return {
        accounts: (data ?? []).map((a) => ({
          ...a,
          bank_account_last4: this.bank.formatBankLast4(
            a.bank_account_last4 as string | null,
          ),
        })),
      };
    }
    if (actor.role === 'ADMIN') {
      const { data } = await this.db()
        .from('accounts')
        .select(
          'id, display_name, role, zone, big_meter, archived_at, bank_account_last4',
        )
        .eq('role', 'USER')
        .order('display_name');
      return {
        accounts: (data ?? []).map((a) => ({
          ...a,
          bank_account_last4: this.bank.formatBankLast4(
            a.bank_account_last4 as string | null,
          ),
        })),
      };
    }
    throw new ForbiddenException(ValidationMessages.accessDenied);
  }

  /** B-096 — ADMIN may not modify another ADMIN or OWNER. */
  private async rejectAdminModifyingPrivilegedTarget(
    actor: SessionAccount,
    targetId: string,
    auditAction: string,
  ) {
    if (actor.role !== 'ADMIN' || targetId === actor.id) return;
    const target = await this.getAccount(targetId);
    if (target.role !== 'USER') {
      await this.audit.logAccessDenied(
        actor.id,
        actor.displayName,
        auditAction,
      );
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
  }

  /** B-096 owner creates ADMIN with Auth user. */
  async createAdmin(actor: SessionAccount, displayName: string, password: string) {
    if (actor.role !== 'OWNER') {
      throw new ForbiddenException(ValidationMessages.accessDenied);
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
      confirmBigMeter?: boolean;
    },
  ) {
    if (actor.role !== 'ADMIN' && actor.role !== 'OWNER') {
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
    const zoneErr = validateZoneRequired(body.zone);
    if (zoneErr) throwFieldBadRequest(zoneErr);
    const bmErr = validateBigMeterFlag(body.bigMeter, body.confirmBigMeter);
    if (bmErr) throwFieldBadRequest(bmErr);
    return this.createAccount(actor, {
      displayName: body.displayName,
      password: body.password,
      role: 'USER',
      zone: body.zone as 'WEST' | 'SOUTH',
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
    if (nameErr) throwFieldBadRequest(nameErr);
    const pwErr = validatePasswordLength(input.password);
    if (pwErr) throwFieldBadRequest(pwErr);
    const zoneErr = validateZone(input.zone);
    if (zoneErr) throwFieldBadRequest(zoneErr);

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
      throw new BadRequestException(ValidationMessages.accountCreateFailed);
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
    if (error) {
      if (String(error.message).includes('duplicate')) {
        throw new BadRequestException(ValidationMessages.displayNameDuplicate);
      }
      throw new BadRequestException(ValidationMessages.accountCreateFailed);
    }

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
      throw new BadRequestException(ValidationMessages.cannotArchiveOwner);
    }
    if (target.archived_at) return { ok: true };
    if (actor.role === 'ADMIN') {
      if (actor.id === targetId) {
        throw new ForbiddenException(ValidationMessages.cannotArchiveSelf);
      }
      if (target.role === 'ADMIN') {
        await this.audit.logAccessDenied(
          actor.id,
          actor.displayName,
          'ACCOUNT_ARCHIVE',
        );
        throw new ForbiddenException('禁止存取');
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
      throw new ForbiddenException('禁止存取');
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
  async switchRole(actor: SessionAccount, targetId: string, role: unknown) {
    const roleErr = validateSwitchRole(role);
    if (roleErr) throwFieldBadRequest(roleErr);
    const nextRole = role as 'USER' | 'ADMIN';
    if (actor.role !== 'OWNER') {
      await this.audit.logAccessDenied(
        actor.id,
        actor.displayName,
        'ACCOUNT_ROLE',
      );
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
    const target = await this.getAccount(targetId);
    if (target.role === 'OWNER') {
      throw new BadRequestException(ValidationMessages.cannotArchiveOwner);
    }
    if (nextRole === 'ADMIN' && target.big_meter) {
      throw new BadRequestException(ValidationMessages.bigMeterBeforeAdmin);
    }
    await this.db()
      .from('accounts')
      .update({
        role: nextRole,
        big_meter: nextRole === 'ADMIN' ? false : target.big_meter,
      })
      .eq('id', targetId);
    await this.audit.write({
      actorId: actor.id,
      actorDisplayName: actor.displayName,
      actionType: 'ACCOUNT_ROLE_CHANGE',
      description: `切換 ${target.display_name} 角色為 ${nextRole}`,
    });
    return { ok: true };
  }

  /** B-008 password change with current password. */
  async changePassword(
    actor: SessionAccount,
    currentPassword: string,
    newPassword: string,
    newPasswordConfirm?: string,
  ) {
    if (
      newPasswordConfirm === undefined ||
      newPassword !== newPasswordConfirm
    ) {
      throw new BadRequestException(ValidationMessages.passwordMismatch);
    }
    const pwErr = validatePasswordLength(newPassword);
    if (pwErr) throwFieldBadRequest(pwErr);
    const { data: acct } = await this.db()
      .from('accounts')
      .select('auth_user_id, display_name')
      .eq('id', actor.id)
      .single();
    if (!acct) throw new NotFoundException(ValidationMessages.accountNotFound);
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
    if (error) {
      throw new BadRequestException(ValidationMessages.passwordCurrentIncorrect);
    }
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
        'ACCOUNT_BANK',
      );
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
    const err = validateBankAccountDigits(bankAccount);
    if (err) {
      const validationMsg = err.message;
      throw new BadRequestException(validationMsg);
    }
    let ciphertext: Buffer;
    let last4: string;
    try {
      ({ ciphertext, last4 } = this.bank.encryptForStorage(bankAccount));
    } catch (e) {
      if (e instanceof ServiceUnavailableException) {
        throw new BadRequestException(ValidationMessages.bankEncryptionUnavailable);
      }
      throw e;
    }
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
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
    const { data, error } = await this.db()
      .from('accounts')
      .select('display_name, bank_account_ciphertext, bank_account_last4')
      .eq('id', targetId)
      .single();
    if (error || !data) {
      throw new NotFoundException(ValidationMessages.accountNotFound);
    }
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
    return {
      account: full,
      last4: this.bank.formatBankLast4(data.bank_account_last4),
    };
  }

  private async lookupEmail(authUserId: string): Promise<string> {
    const { data, error } = await this.db().auth.admin.getUserById(authUserId);
    if (error || !data.user?.email) throw new Error('auth email missing');
    return data.user.email;
  }

  /** B-013 B-015 B-017 B-018 financial fields on USER (ADMIN); ADMIN/OWNER on ADMIN is owner-only for some fields. */
  async updateUserFinancials(
    actor: SessionAccount,
    targetId: string,
    body: {
      paymentMethod?: 'TRANSFER' | 'CASH';
      insuranceDeduction?: number;
      insuranceEnrollment?: 'ENROLLED' | 'NOT_ENROLLED' | 'EXEMPT';
      fixedSalary?: number;
      payFixedEveryPeriod?: boolean;
      uninsuredExempt?: boolean;
      uninsuredRateOverride?: number | null;
    },
  ) {
    if (actor.role !== 'ADMIN' && actor.role !== 'OWNER') {
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
    const target = await this.getAccount(targetId);
    if (target.role === 'OWNER') {
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
    if (target.role !== 'USER' && actor.role !== 'OWNER') {
      await this.audit.logAccessDenied(
        actor.id,
        actor.displayName,
        'ACCOUNT_FINANCIALS',
      );
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
    await this.rejectAdminModifyingPrivilegedTarget(
      actor,
      targetId,
      'ACCOUNT_FINANCIALS',
    );
    const patch: Record<string, unknown> = {};
    if (body.paymentMethod !== undefined) {
      const pmErr = validatePaymentMethod(body.paymentMethod);
      if (pmErr) throwFieldBadRequest(pmErr);
      if (body.paymentMethod === 'TRANSFER') {
        const hasBank =
          !!target.bank_account_ciphertext || !!target.bank_account_last4;
        if (!hasBank) {
          throw new BadRequestException(ValidationMessages.transferNeedsBank);
        }
      }
      patch.payment_method = body.paymentMethod;
    }
    if (body.insuranceEnrollment !== undefined) {
      if (body.insuranceEnrollment === 'ENROLLED') {
        const ded =
          body.insuranceDeduction !== undefined
            ? body.insuranceDeduction
            : target.insurance_deduction;
        const err = validateInsuranceDeduction(ded, true);
        if (err) throwFieldBadRequest(err);
        patch.insurance_deduction = ded;
        patch.uninsured_exempt = false;
      } else if (body.insuranceEnrollment === 'NOT_ENROLLED') {
        const ded = body.insuranceDeduction ?? 0;
        const err = validateInsuranceDeduction(ded, false);
        if (err) throwFieldBadRequest(err);
        patch.insurance_deduction = 0;
        patch.uninsured_exempt = false;
      } else if (body.insuranceEnrollment === 'EXEMPT') {
        patch.insurance_deduction = 0;
        patch.uninsured_exempt = true;
      } else {
        throw new BadRequestException(ValidationMessages.insuranceDeductionInteger);
      }
    } else if (body.insuranceDeduction !== undefined) {
      const enrolled = body.insuranceDeduction > 0;
      const err = validateInsuranceDeduction(body.insuranceDeduction, enrolled);
      if (err) throwFieldBadRequest(err);
      patch.insurance_deduction = body.insuranceDeduction;
      if (body.insuranceDeduction === 0) {
        patch.uninsured_exempt = target.uninsured_exempt;
      }
    }
    if (body.fixedSalary !== undefined) {
      const err = validateFixedSalary(body.fixedSalary);
      if (err) throwFieldBadRequest(err);
      patch.fixed_salary = body.fixedSalary;
    }
    if (body.payFixedEveryPeriod !== undefined) {
      patch.pay_fixed_every_period = body.payFixedEveryPeriod;
    }
    if (body.uninsuredExempt !== undefined) {
      const exErr = validateUninsuredExemptFlag(body.uninsuredExempt);
      if (exErr) throwFieldBadRequest(exErr);
      patch.uninsured_exempt = body.uninsuredExempt;
    }
    if (body.uninsuredRateOverride !== undefined && body.uninsuredRateOverride !== null) {
      const err = validateUninsuredRate(body.uninsuredRateOverride);
      if (err) throwFieldBadRequest(err);
      patch.uninsured_rate_override = body.uninsuredRateOverride;
    }
    if (body.uninsuredRateOverride === null) {
      patch.uninsured_rate_override = null;
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

  /** B-034 per-item retention rate override. */
  async setItemRetentionRate(
    actor: SessionAccount,
    targetId: string,
    itemCode: string,
    rateNtd: number,
  ) {
    if (actor.role !== 'ADMIN' && actor.role !== 'OWNER') {
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
    await this.rejectAdminModifyingPrivilegedTarget(
      actor,
      targetId,
      'RETENTION_SET',
    );
    const target = await this.getAccount(targetId);
    if (target.role !== 'USER') {
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
    const err = validatePerItemRetentionRate(rateNtd);
    if (err) throwFieldBadRequest(err);
    const { error } = await this.db()
      .from('account_item_retention_rates')
      .upsert({
        account_id: targetId,
        item_code: itemCode,
        rate_ntd: rateNtd,
      });
    if (error) {
      throw new BadRequestException(ValidationMessages.perItemRetentionRate);
    }
    await this.audit.write({
      actorId: actor.id,
      actorDisplayName: actor.displayName,
      actionType: 'RETENTION_SET',
      description: `工項 ${itemCode} 保留金費率 ${rateNtd}`,
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
      throw new ForbiddenException(ValidationMessages.accessDenied);
    }
    await this.rejectAdminModifyingPrivilegedTarget(
      actor,
      targetId,
      'RETENTION_SET',
    );
    const offErr = validateRetentionOffset(body.offsetNtd);
    if (offErr) throwFieldBadRequest(offErr);
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
        'id, display_name, role, zone, big_meter, archived_at, bank_account_last4, bank_account_ciphertext, payment_method, insurance_deduction, uninsured_exempt',
      )
      .eq('id', id)
      .single();
    if (error || !data) {
      throw new NotFoundException(ValidationMessages.accountNotFound);
    }
    return data as AccountRow;
  }
}
