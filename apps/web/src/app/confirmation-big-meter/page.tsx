'use client';

import { useEffect, useState } from 'react';
import { AppNav } from '../../components/AppNav';
import { apiGet, apiSend } from '../../lib/api';

type PendingReport = {
  id: string;
  report_date: string;
  submitter?: { display_name: string };
};

/** B-071 big-meter confirmation page */
export default function BigMeterConfirmationPage() {
  const [rows, setRows] = useState<PendingReport[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    void apiGet<PendingReport[]>('/confirmation/pending/big-meter').then(setRows);
  }, []);

  async function batchConfirm() {
    await apiSend('/confirmation/batch/confirm', 'POST', {
      reportIds: [...selected],
    });
    setRows(await apiGet('/confirmation/pending/big-meter'));
    setSelected(new Set());
  }

  return (
    <main>
      <AppNav />
      <h1>大表回報確認（B-071）</h1>
      <button type="button" onClick={() => void batchConfirm()}>
        批次核准
      </button>
      <ul>
        {rows.map((r) => (
          <li key={r.id}>
            <label>
              <input
                type="checkbox"
                onChange={(e) => {
                  setSelected((prev) => {
                    const n = new Set(prev);
                    if (e.target.checked) n.add(r.id);
                    else n.delete(r.id);
                    return n;
                  });
                }}
              />
              {r.report_date} — {r.submitter?.display_name}
            </label>
          </li>
        ))}
      </ul>
    </main>
  );
}
