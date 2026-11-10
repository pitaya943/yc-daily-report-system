'use client';

import { useEffect, useState } from 'react';
import { AppNav } from '../../components/AppNav';
import { apiGet } from '../../lib/api';

export default function LedgerPage() {
  const [entries, setEntries] = useState<unknown[]>([]);
  const [pettyCash, setPettyCash] = useState<{ balance: number } | null>(null);

  useEffect(() => {
    void apiGet<{ entries: unknown[]; pettyCash: { balance: number } }>(
      '/ledger/entries',
    ).then((d) => {
      setEntries(d.entries);
      setPettyCash(d.pettyCash);
    });
  }, []);

  return (
    <main>
      <AppNav />
      <h1>流水帳</h1>
      <p>零用金餘額：{pettyCash?.balance ?? '—'} NTD</p>
      <ul>
        {entries.map((e, i) => (
          <li key={i}>{JSON.stringify(e)}</li>
        ))}
      </ul>
    </main>
  );
}
