import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 120_000,
  use: {
    baseURL: process.env.WEB_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm --filter @yc/api exec nest start',
      url: 'http://127.0.0.1:3001/health',
      reuseExistingServer: true,
      env: {
        ...process.env,
        API_PORT: '3001',
      },
    },
    {
      command: 'pnpm --filter @yc/web run start',
      url: 'http://127.0.0.1:3000/login',
      reuseExistingServer: true,
    },
  ],
});
