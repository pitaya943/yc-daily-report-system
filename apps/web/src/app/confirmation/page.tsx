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

export default function ConfirmationPage() {
  const [rows, setRows] = useState<PendingReport[]>([]);
  const [message, setMessage] = useState('');

  async function reload() {
    setRows(await apiGet<PendingReport[]>('/confirmation/pending'));
  }

  useEffect(() => {
    void reload();
  }, []);

  async function batchConfirm() {
    if (!rows.length) return;
    await apiSend('/confirmation/batch/confirm', 'POST', {
      reportIds: rows.map((r) => r.id),
    });
    setMessage('批次核准完成');
    await reload();
  }

  async function confirm(id: string) {
    try {
      await apiSend(`/confirmation/${id}/confirm`, 'POST');
      setMessage('已核准');
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '核准失敗');
    }
  }

  async function reject(id: string) {
    try {
      await apiSend(`/confirmation/${id}/reject`, 'POST');
      setMessage('已駁回');
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '駁回失敗');
    }
  }

  return (
    <main>
      <AppNav />
      <h1>回報確認</h1>
      <button type="button" onClick={() => void batchConfirm()}>
        批次核准
      </button>
      <ul>
        {rows.map((r) => (
          <li key={r.id}>
            {r.report_date} — {r.submitter?.display_name}
            {r.archived ? '（封存）' : ''}
            <button type="button" onClick={() => void confirm(r.id)}>
              核准
            </button>
            <button type="button" onClick={() => void reject(r.id)}>
              駁回
            </button>
          </li>
        ))}
      </ul>
      {message && <p role="status">{message}</p>}
    </main>
  );
}
