import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

test('BDD-008 petty cash void excluded', async ({ request }) => {
  const login = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  const cookie = login.headersArray().find((h) => h.name === 'set-cookie')?.value.split(';')[0]!;
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  const inc = await request.post(`${API}/ledger/entries`, {
    headers: { Cookie: cookie },
    data: { entryDate: today, type: 'INCOME', amount: 500, description: 'e2e收入' },
  });
  const { id } = (await inc.json()) as { id: string };
  await request.post(`${API}/ledger/entries/${id}/void`, { headers: { Cookie: cookie } });
  const list = await request.get(`${API}/ledger/entries`, { headers: { Cookie: cookie } });
  const body = (await list.json()) as { pettyCash: { balance: number } };
  expect(body.pettyCash.balance).toBe(0);
});
