import { test, expect } from '@playwright/test';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';

const REPO = path.join(__dirname, '..');
const EVIDENCE = path.join(REPO, 'docs/evidence/walkthrough');
const ART = process.env.WALKTHROUGH_ART ?? '/opt/cursor/artifacts/yc-v0-walkthrough';

mkdirSync(ART, { recursive: true });
mkdirSync(EVIDENCE, { recursive: true });

async function shot(page: import('@playwright/test').Page, name: string) {
  const out = `${ART}/${name}.png`;
  await page.screenshot({ path: out, fullPage: true });
  copyFileSync(out, `${EVIDENCE}/${name}.png`);
}

async function login(page: import('@playwright/test').Page, type: RegExp, user: string) {
  await page.context().clearCookies();
  await page.goto('/login', { waitUntil: 'networkidle' });
  const reset = page.getByRole('button', { name: '重選' });
  if (await reset.isVisible().catch(() => false)) {
    await reset.click();
  }
  await page.getByRole('button', { name: type }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: type }).click();
  await page.selectOption('select', { label: user });
  await page.fill('input[type="password"]', SEED_PASSWORD);
  await page.getByRole('button', { name: '登入' }).click();
}

test.describe.configure({ mode: 'serial', timeout: 180_000 });

const transcript: string[] = [];

test('walkthrough owner', async ({ page }) => {
  await login(page, /管理員/, 'Kuei');
  await page.waitForURL('**/confirmation');
  await shot(page, '01-owner-confirmation');
  await page.goto('/owner/audit');
  await shot(page, '02-owner-audit');
  transcript.push('owner: confirmation, audit');
});

test('walkthrough admin', async ({ page }) => {
  await login(page, /管理員/, '種子管理員');
  await page.waitForURL('**/confirmation');
  await shot(page, '03-admin-confirmation');
  await page.goto('/payroll');
  await shot(page, '04-admin-payroll');
  await page.goto('/ledger');
  await shot(page, '05-admin-ledger');
  transcript.push('admin: confirmation, payroll, ledger');
});

test('walkthrough west user', async ({ page }) => {
  await login(page, /西區/, '種子西區');
  await page.waitForURL('**/report');
  await shot(page, '06-user-west-report');
  await page.goto('/history');
  await shot(page, '07-user-west-history');
  await page.goto('/materials');
  await shot(page, '08-user-materials');
  transcript.push('west user: report, history, materials');
});

test('walkthrough south user', async ({ page }) => {
  await login(page, /南區/, '種子南區');
  await page.waitForURL('**/report');
  await shot(page, '09-user-south-report');
  transcript.push('south user: report');
  writeFileSync(`${ART}/transcript.txt`, transcript.join('\n'));
  writeFileSync(`${EVIDENCE}/transcript.txt`, transcript.join('\n'));
  expect(transcript.length).toBe(4);
});
