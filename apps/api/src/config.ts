export type AppConfig = {
  port: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  sessionSecret: string;
  sessionIdleMinutes: number;
  webOrigin: string;
};

export function loadConfig(): AppConfig {
  const requireEnv = (name: string, fallback?: string): string => {
    const v = process.env[name] ?? fallback;
    if (!v) {
      throw new Error(`Missing environment variable ${name}`);
    }
    return v;
  };

  return {
    port: parseInt(process.env.API_PORT ?? '3001', 10),
    supabaseUrl: requireEnv('SUPABASE_URL'),
    supabaseAnonKey: requireEnv('SUPABASE_ANON_KEY'),
    supabaseServiceKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    sessionSecret: requireEnv(
      'SESSION_SECRET',
      'local-dev-session-secret-change-me-32chars',
    ),
    sessionIdleMinutes: parseInt(process.env.SESSION_IDLE_MINUTES ?? '30', 10),
    webOrigin: process.env.WEB_ORIGIN ?? 'http://127.0.0.1:3000',
  };
}
