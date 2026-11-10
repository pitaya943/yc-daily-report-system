import { loadConfig } from '../../src/config';

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
