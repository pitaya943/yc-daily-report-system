'use client';

import { useEffect, useState } from 'react';
import { apiBase } from '../../../lib/api';

type AuditRow = {
  id: number;
  action_type: string;
  description: string;
  occurred_at: string;
};

export default function OwnerAuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);

  useEffect(() => {
    void fetch(`${apiBase}/audit/log`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []));
  }, []);

  return (
    <main>
      <h1>稽核日誌（B-067）</h1>
      <ul>
        {rows.map((r) => (
          <li key={r.id}>
            {r.occurred_at} [{r.action_type}] {r.description}
          </li>
        ))}
      </ul>
    </main>
  );
}
