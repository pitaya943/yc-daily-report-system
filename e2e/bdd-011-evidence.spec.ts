import { test, expect } from '@playwright/test';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'seedpass01';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

test('BDD-011 evidence signed URL on each open', async ({ request }) => {
  const admin = await request.post(`${API}/auth/sign-in`, {
    data: { displayName: '種子管理員', password: SEED_PASSWORD },
  });
  const cookie = admin.headersArray().find((h) => h.name === 'set-cookie')?.value.split(';')[0]!;
  const entry = await request.post(`${API}/ledger/entries`, {
    headers: { Cookie: cookie },
    data: {
      entryDate: '2026-11-04',
      type: 'EXPENSE',
      amount: 100,
      description: 'evidence test',
    },
  });
  const { id } = (await entry.json()) as { id: string };
  const form = new FormData();
  form.append(
    'file',
    new Blob([Buffer.from('%PDF-1.4')], { type: 'application/pdf' }),
    'a.pdf',
  );
  await request.post(`${API}/ledger/entries/${id}/evidence`, {
    headers: { Cookie: cookie },
    multipart: {
      file: {
        name: 'a.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4'),
      },
    },
  });
  const open1 = await request.get(`${API}/ledger/entries/${id}/evidence-url`, {
    headers: { Cookie: cookie },
  });
  const open2 = await request.get(`${API}/ledger/entries/${id}/evidence-url`, {
    headers: { Cookie: cookie },
  });
  expect(open1.ok() && open2.ok()).toBeTruthy();
  const u1 = ((await open1.json()) as { url: string }).url;
  const u2 = ((await open2.json()) as { url: string }).url;
  expect(u1).toBeTruthy();
  expect(u2).toBeTruthy();
});
