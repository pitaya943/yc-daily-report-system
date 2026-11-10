import { loadConfig } from '../../src/config';
import { SupabaseService } from '../../src/supabase/supabase.service';

export function integrationEnabled(): boolean {
  return process.env.RUN_INTEGRATION_TESTS === '1';
}

export function requireIntegration(): void {
  if (!integrationEnabled()) {
    throw new Error(
      'Set RUN_INTEGRATION_TESTS=1 with local Supabase (supabase start + db reset)',
    );
  }
  loadConfig();
}

export const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';

/** Reset lockout counters between integration suites (B-089). */
const WEST_USER_ID = 'b0000001-0001-4000-8000-000000000003';

export async function clearWestUserReportsOnDate(
  supabase: SupabaseService,
  reportDate: string,
): Promise<void> {
  const db = supabase.getServiceClient();
  await db
    .from('daily_reports')
    .delete()
    .eq('submitter_id', WEST_USER_ID)
    .eq('report_date', reportDate);
}

export async function resetSeedLockouts(supabase: SupabaseService): Promise<void> {
  const db = supabase.getServiceClient();
  await db
    .from('accounts')
    .update({
      failed_signin_count: 0,
      lockout_until: null,
      last_failed_signin_at: null,
    })
    .in('display_name', ['Kuei', '種子管理員', '種子西區']);
}

export async function resetOwnerLockout(supabase: SupabaseService): Promise<void> {
  const db = supabase.getServiceClient();
  await db
    .from('accounts')
    .update({
      failed_signin_count: 0,
      lockout_until: null,
      last_failed_signin_at: null,
    })
    .eq('display_name', 'Kuei');
}
