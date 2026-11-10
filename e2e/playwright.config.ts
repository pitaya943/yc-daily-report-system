import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
  testDir: '.',
  globalSetup: './global-setup.ts',
  timeout: 120_000,
  workers: 1,
  use: {
    baseURL: process.env.WEB_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: `node ${path.join(__dirname, '../apps/api/dist/main.js')}`,
      cwd: path.join(__dirname, '..'),
      url: 'http://127.0.0.1:3001/health',
      reuseExistingServer: true,
      env: {
        ...process.env,
        API_PORT: '3001',
        E2E_TESTS: '1',
      },
    },
    {
      command: 'pnpm --filter @yc/web run start',
      url: 'http://127.0.0.1:3000/login',
      reuseExistingServer: true,
    },
  ],
});
