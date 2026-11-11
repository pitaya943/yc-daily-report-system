'use client';

import { useEffect, useState } from 'react';
import { AppNav } from '../../components/AppNav';
import { apiGet, apiSend } from '../../lib/api';

type PendingReport = {
  id: string;
  report_date: string;
  submitter?: { display_name: string; archived_at?: string | null };
  archived?: boolean;
};

/** B-069 filters + batch confirm UI */
export default function ConfirmationPage() {
  const [rows, setRows] = useState<PendingReport[]>([]);
  const [zone, setZone] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');

  async function reload() {
    const q = new URLSearchParams();
    if (zone) q.set('zone', zone);
    const path = q.toString()
      ? `/confirmation/pending?${q}`
      : '/confirmation/pending';
    setRows(await apiGet<PendingReport[]>(path));
    setSelected(new Set());
  }

  useEffect(() => {
    void reload();
  }, [zone]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function batchConfirm() {
    const ids = [...selected];
    if (!ids.length) return;
    await apiSend('/confirmation/batch/confirm', 'POST', { reportIds: ids });
    setMessage(`B-069 批次核准 ${ids.length} 筆`);
    await reload();
  }

  return (
    <main>
      <AppNav />
      <h1>回報確認（B-069）</h1>
      <label>
        區域
        <select value={zone} onChange={(e) => setZone(e.target.value)}>
          <option value="">西區+南區</option>
          <option value="WEST">西區</option>
          <option value="SOUTH">南區</option>
        </select>
      </label>
      <button type="button" onClick={() => void batchConfirm()}>
        批次核准勾選
      </button>
      <ul>
        {rows.map((r) => (
          <li key={r.id}>
            <label>
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggle(r.id)}
              />
              {r.report_date} — {r.submitter?.display_name}
              {r.archived ? '（封存）' : ''}
            </label>
          </li>
        ))}
      </ul>
      {message && <p role="status">{message}</p>}
    </main>
  );
}
