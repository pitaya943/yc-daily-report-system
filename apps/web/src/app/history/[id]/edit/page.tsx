'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppNav } from '../../../../components/AppNav';
import { apiGet, apiSend } from '../../../../lib/api';

type QtyRow = { item_code: string; qty_units: number };

export default function EditReportPage() {
  const params = useParams();
  const id = params.id as string;
  const [message, setMessage] = useState('');
  const [qty, setQty] = useState<Record<string, string>>({});

  useEffect(() => {
    void apiGet<{ quantities: QtyRow[] }>(`/reports/${id}`).then((d) => {
      const map: Record<string, string> = {};
      for (const row of d.quantities ?? []) {
        map[row.item_code] = String(row.qty_units / 10);
      }
      setQty(map);
    });
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const quantities = Object.entries(qty)
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([itemCode, v]) => ({ itemCode, qty: parseFloat(v) }));
    try {
      await apiSend(`/reports/${id}`, 'PATCH', { quantities });
      setMessage('已儲存');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '儲存失敗');
    }
  }

  return (
    <main>
      <AppNav />
      <h1>編輯回報</h1>
      <form onSubmit={onSubmit}>
        {Object.entries(qty).map(([code, val]) => (
          <label key={code}>
            {code}
            <input
              value={val}
              onChange={(e) =>
                setQty((prev) => ({ ...prev, [code]: e.target.value }))
              }
            />
          </label>
        ))}
        <button type="submit">儲存</button>
      </form>
      {message && <p role="status">{message}</p>}
    </main>
  );
}
