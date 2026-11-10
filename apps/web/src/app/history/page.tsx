'use client';

import { useEffect, useState } from 'react';
import { AppNav } from '../../components/AppNav';
import { apiGet, apiSend } from '../../lib/api';

type Row = {
  id: string;
  report_date: string;
  status: string;
  canEdit?: boolean;
  role?: string;
};

const statusLabel: Record<string, string> = {
  PENDING: '未確認',
  CONFIRMED: '已確認',
  REJECTED: '已駁回',
};

export default function HistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState('');

  async function reload() {
    const data = await apiGet<Row[]>('/reports/history');
    setRows(data);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function remove(id: string, status: string) {
    if (status === 'CONFIRMED') {
      setMessage('已核准回報僅可預覽');
      return;
    }
    if (!window.confirm('確定刪除此回報？')) return;
    try {
      await apiSend(`/reports/${id}`, 'DELETE');
      setMessage('已刪除');
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '刪除失敗');
    }
  }

  return (
    <main>
      <AppNav />
      <h1>我的回報</h1>
      <table>
        <thead>
          <tr>
            <th>日期</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.report_date}</td>
              <td>{statusLabel[r.status] ?? r.status}</td>
              <td>
                {r.role === 'collaborator' && <span>共同作業，無法修改</span>}
                {r.canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/history/${r.id}/edit`;
                    }}
                  >
                    編輯
                  </button>
                )}
                {r.canEdit && (
                  <button type="button" onClick={() => void remove(r.id, r.status)}>
                    刪除
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {message && <p role="status">{message}</p>}
    </main>
  );
}
