'use client';

import { useEffect, useState } from 'react';
import { AppNav } from '../../components/AppNav';
import { apiGet, apiSend } from '../../lib/api';

type Row = { id: string; report_date: string; status: string };

export default function AdminHistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void apiGet<Row[]>('/reports/history/admin').then(setRows);
  }, []);

  async function remove(id: string) {
    if (!window.confirm('確定刪除？')) return;
    await apiSend(`/reports/${id}`, 'DELETE');
    setRows(await apiGet<Row[]>('/reports/history/admin'));
  }

  return (
    <main>
      <AppNav />
      <h1>回報歷史（管理員）</h1>
      <ul>
        {rows.map((r) => (
          <li key={r.id}>
            {r.report_date} — {r.status}
            <button type="button" onClick={() => void remove(r.id)}>
              刪除
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
