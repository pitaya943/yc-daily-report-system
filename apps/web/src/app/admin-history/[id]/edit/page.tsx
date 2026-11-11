'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiBase } from '../../../../lib/api';

export default function AdminEditReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [qty, setQty] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    void fetch(`${apiBase}/reports/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setStatus(d.status);
        const row = (d.quantities ?? []).find(
          (q: { item_code: string }) => q.item_code === 'direct_13',
        );
        setQty(row ? row.qty_units / 10 : 0);
      });
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`${apiBase}/reports/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantities: [{ itemCode: 'direct_13', qty }] }),
    });
    router.push('/admin-history');
  }

  return (
    <main>
      <h1>管理員編輯回報（B-064）</h1>
      <p>狀態：{status}</p>
      <form onSubmit={save}>
        <label>
          direct_13 數量
          <input
            type="number"
            step="0.1"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </label>
        <button type="submit">儲存（已核准將取消確認）</button>
      </form>
    </main>
  );
}
