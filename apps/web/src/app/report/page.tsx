'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppNav } from '../../components/AppNav';
import { apiGet, apiSend } from '../../lib/api';

type WorkItem = { code: string; display_name: string };

export default function ReportPage() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [collaborators, setCollaborators] = useState<
    Array<{ id: string; display_name: string }>
  >([]);
  const [qtyByCode, setQtyByCode] = useState<Record<string, string>>({});
  const [selectedCollab, setSelectedCollab] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const today = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'Asia/Taipei',
  });

  useEffect(() => {
    void apiGet<{ items: WorkItem[] }>('/reports/work-items').then((d) =>
      setItems(d.items ?? []),
    );
    void apiGet<Array<{ id: string; display_name: string }>>(
      '/reports/collaborators',
    ).then(setCollaborators);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    const quantities = items
      .map((it) => ({
        itemCode: it.code,
        qty: parseFloat(qtyByCode[it.code] || '0'),
      }))
      .filter((r) => r.qty > 0);
    try {
      await apiSend('/reports', 'POST', {
        reportDate: today,
        quantities,
        collaboratorIds: selectedCollab,
      });
      setMessage('送出成功');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '送出失敗');
    }
  }

  return (
    <main>
      <AppNav />
      <h1>填寫日報</h1>
      <p>回報日期：{today}</p>
      <form onSubmit={onSubmit}>
        <fieldset>
          <legend>工項數量</legend>
          {items.map((it) => (
            <label key={it.code}>
              {it.display_name}
              <input
                type="number"
                step="0.1"
                min="0"
                value={qtyByCode[it.code] ?? ''}
                onChange={(ev) =>
                  setQtyByCode((prev) => ({
                    ...prev,
                    [it.code]: ev.target.value,
                  }))
                }
              />
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>共同作業者</legend>
          {collaborators.map((c) => (
            <label key={c.id}>
              <input
                type="checkbox"
                checked={selectedCollab.includes(c.id)}
                onChange={(ev) => {
                  setSelectedCollab((prev) =>
                    ev.target.checked
                      ? [...prev, c.id]
                      : prev.filter((id) => id !== c.id),
                  );
                }}
              />
              {c.display_name}
            </label>
          ))}
        </fieldset>
        <button type="submit">送出回報</button>
      </form>
      {message && <p role="status">{message}</p>}
    </main>
  );
}
