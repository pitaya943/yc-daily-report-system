import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

test('BDD-008 petty cash void excluded', async ({ request }) => {
  const login = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const cookie =
    login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value.split(';')[0] ?? '';
  const headers = { Cookie: cookie };

  const beforeList = await request.get(`${API}/ledger/entries`, { headers });
  const beforeBal = ((await beforeList.json()) as { pettyCash: { balance: number } }).pettyCash
    .balance;

  const marker = `bdd008-${Date.now()}`;
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  const inc = await request.post(`${API}/ledger/entries`, {
    headers,
    data: { entryDate: today, type: 'INCOME', amount: 123, description: marker },
  });
  expect(inc.ok()).toBeTruthy();
  const { id } = (await inc.json()) as { id: string };

  await request.post(`${API}/ledger/entries/${id}/void`, { headers });

  const list = await request.get(`${API}/ledger/entries`, { headers });
  const body = (await list.json()) as {
    pettyCash: { balance: number };
    entries: Array<{ id: string; description: string; voided_at: string | null }>;
  };
  expect(body.pettyCash.balance).toBe(beforeBal);
  const row = body.entries.find((e) => e.id === id);
  expect(row?.voided_at).toBeTruthy();
  expect(row?.description).toBe(marker);
});
