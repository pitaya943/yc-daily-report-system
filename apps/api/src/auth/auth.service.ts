import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ValidationMessages, validatePasswordLength } from '@yc/validation';
import { AuditService } from '../audit/audit.service';
import { SessionAccount } from './types';
import { createHash } from 'crypto';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 15;
const RATE_LIMIT_PER_MINUTE =
  process.env.E2E_TESTS === '1' ? 1000 : 10;

type AccountRow = {
  id: string;
  auth_user_id: string;
  display_name: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
  archived_at: string | null;
  failed_signin_count: number;
  lockout_until: string | null;
  last_failed_signin_at: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async listSignInNames(signInType: 'admin' | 'employee'): Promise<string[]> {
    const db = this.supabase.getServiceClient();
    let query = db
      .from('accounts')
      .select('display_name, role, archived_at, big_meter')
      .is('archived_at', null)
      .order('display_name');
    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    const rows = data ?? [];
    if (signInType === 'admin') {
      // PROVISIONAL(Q-052): owner listed under admin type
      return rows
        .filter((r) => r.role === 'ADMIN' || r.role === 'OWNER')
        .map((r) => r.display_name as string);
    }
    return rows
      .filter((r) => r.role === 'USER' && !r.big_meter)
      .map((r) => r.display_name as string);
  }

  /** B-089 lockout + B-080 rate limit + B-088 password validation. */
  async signIn(input: {
    displayName: string;
    password: string;
    clientAddress: string;
  }): Promise<SessionAccount> {
    if (!input.displayName?.trim()) {
      throw new BadRequestException(ValidationMessages.accountRequired);
    }
    const passwordErr = validatePasswordLength(input.password);
    if (passwordErr) {
      throw new BadRequestException(passwordErr.message);
    }

    await this.enforceRateLimit(input.clientAddress);

    const account = await this.findAccountByDisplayName(input.displayName.trim());
    if (!account || account.archived_at) {
      throw new UnauthorizedException(ValidationMessages.passwordWrong);
    }

    await this.refreshLockoutState(account);

    if (account.lockout_until && new Date(account.lockout_until) > new Date()) {
      throw new UnauthorizedException(ValidationMessages.lockout);
    }

    const authEmail = await this.lookupAuthEmail(account.auth_user_id);
    const anon = this.supabase.getAnonClient();
    const { error: authError } = await anon.auth.signInWithPassword({
      email: authEmail,
      password: input.password,
    });

    if (authError) {
      await this.recordFailedSignIn(account);
      throw new UnauthorizedException(
        account.failed_signin_count + 1 >= LOCKOUT_THRESHOLD
          ? ValidationMessages.lockout
          : ValidationMessages.passwordWrong,
      );
    }

    await this.resetFailedSignIn(account.id);
    return {
      id: account.id,
      displayName: account.display_name,
      role: account.role,
      authUserId: account.auth_user_id,
    };
  }

  private hashClientAddress(addr: string): string {
    return createHash('sha256').update(addr).digest('hex');
  }

  /** B-080 */
  private async enforceRateLimit(clientAddress: string): Promise<void> {
    const db = this.supabase.getServiceClient();
    const hash = this.hashClientAddress(clientAddress || 'unknown');
    const windowStart = new Date();
    windowStart.setUTCSeconds(0, 0);
    const { data: existing } = await db
      .from('signin_rate_limits')
      .select('attempt_count')
      .eq('client_address_hash', hash)
      .eq('window_start', windowStart.toISOString())
      .maybeSingle();

    const nextCount = (existing?.attempt_count ?? 0) + 1;
    if (nextCount > RATE_LIMIT_PER_MINUTE) {
      throw new UnauthorizedException(ValidationMessages.passwordWrong);
    }

    await db.from('signin_rate_limits').upsert({
      client_address_hash: hash,
      window_start: windowStart.toISOString(),
      attempt_count: nextCount,
    });
  }

  private async findAccountByDisplayName(
    displayName: string,
  ): Promise<AccountRow | null> {
    const db = this.supabase.getServiceClient();
    const { data, error } = await db
      .from('accounts')
      .select(
        'id, auth_user_id, display_name, role, archived_at, failed_signin_count, lockout_until, last_failed_signin_at',
      )
      .eq('display_name', displayName)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data as AccountRow | null;
  }

  private async lookupAuthEmail(authUserId: string): Promise<string> {
    const db = this.supabase.getServiceClient();
    const { data, error } = await db.auth.admin.getUserById(authUserId);
    if (error || !data.user?.email) {
      throw new Error('auth user not found for account');
    }
    return data.user.email;
  }

  private async refreshLockoutState(account: AccountRow): Promise<void> {
    const now = new Date();
    if (
      account.last_failed_signin_at &&
      now.getTime() - new Date(account.last_failed_signin_at).getTime() >
        LOCKOUT_MINUTES * 60 * 1000 &&
      account.failed_signin_count > 0 &&
      (!account.lockout_until || new Date(account.lockout_until) <= now)
    ) {
      await this.resetFailedSignIn(account.id);
      account.failed_signin_count = 0;
      account.lockout_until = null;
    }
    if (account.lockout_until && new Date(account.lockout_until) <= now) {
      await this.resetFailedSignIn(account.id);
      account.failed_signin_count = 0;
      account.lockout_until = null;
    }
  }

  private async recordFailedSignIn(account: AccountRow): Promise<void> {
    const db = this.supabase.getServiceClient();
    const now = new Date();
    const next = account.failed_signin_count + 1;
    let lockoutUntil: string | null = account.lockout_until;
    if (next >= LOCKOUT_THRESHOLD) {
      lockoutUntil = new Date(
        now.getTime() + LOCKOUT_MINUTES * 60 * 1000,
      ).toISOString();
      await this.audit.write({
        actorId: null,
        actorDisplayName: '系統',
        actionType: 'ACCOUNT_LOCKOUT',
        description: `帳戶 ${account.display_name} 因密碼錯誤 5 次鎖定 15 分鐘`, // PROVISIONAL(Q-053/Q-058)
      });
    }
    await db
      .from('accounts')
      .update({
        failed_signin_count: next,
        lockout_until: lockoutUntil,
        last_failed_signin_at: now.toISOString(),
      })
      .eq('id', account.id);
  }

  private async resetFailedSignIn(accountId: string): Promise<void> {
    const db = this.supabase.getServiceClient();
    await db
      .from('accounts')
      .update({
        failed_signin_count: 0,
        lockout_until: null,
        last_failed_signin_at: null,
      })
      .eq('id', accountId);
  }
}
