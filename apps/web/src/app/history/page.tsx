'use client';

import { useEffect, useState } from 'react';
import { AppNav } from '../../components/AppNav';
import { apiGet } from '../../lib/api';

type Row = {
  id: string;
  report_date: string;
  status: string;
  canEdit?: boolean;
  role?: string;
};

type HistoryResponse = {
  page: number;
  pageSize: number;
  total: number;
  rows: Row[];
};

const statusLabel: Record<string, string> = {
  PENDING: '未確認',
  CONFIRMED: '已確認',
  REJECTED: '已駁回',
};

/** B-063 pagination, filter, export */
export default function HistoryPage() {
  const [data, setData] = useState<HistoryResponse>({
    page: 1,
    pageSize: 20,
    total: 0,
    rows: [],
  });
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  async function reload(page = data.page) {
    const q = status ? `?status=${status}&page=${page}` : `?page=${page}`;
    const res = await apiGet<HistoryResponse>(`/reports/history${q}`);
    setData(res);
  }

  useEffect(() => {
    void reload(1);
  }, [status]);

  async function exportXlsx() {
    const q = status ? `?status=${status}` : '';
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001'}/reports/history/export${q}`,
      { credentials: 'include' },
    );
    if (!res.ok) {
      setMessage('匯出失敗');
      return;
    }
    const body = (await res.json()) as { base64: string; fileName: string };
    const a = document.createElement('a');
    a.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${body.base64}`;
    a.download = body.fileName;
    a.click();
    setMessage('已匯出歷史 Excel（B-063）');
  }

  return (
    <main data-b086="no-fullpage-overlay">
      <AppNav />
      <h1>我的回報（B-063）</h1>
      <label>
        狀態篩選
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">全部</option>
          <option value="PENDING">未確認</option>
          <option value="CONFIRMED">已確認</option>
          <option value="REJECTED">已駁回</option>
        </select>
      </label>
      <button type="button" onClick={() => void exportXlsx()}>
        匯出 Excel
      </button>
      <p>
        第 {data.page} 頁，共 {data.total} 筆（每頁 {data.pageSize}）
      </p>
      <table>
        <thead>
          <tr>
            <th>日期</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.id}>
              <td>{r.report_date}</td>
              <td>{statusLabel[r.status] ?? r.status}</td>
              <td>
                {r.role === 'collaborator' && <span>共同作業</span>}
                {r.canEdit && (
                  <a href={`/history/${r.id}/edit`}>編輯</a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        disabled={data.page <= 1}
        onClick={() => void reload(data.page - 1)}
      >
        上一頁
      </button>
      <button
        type="button"
        disabled={data.page * data.pageSize >= data.total}
        onClick={() => void reload(data.page + 1)}
      >
        下一頁
      </button>
      {message && <p role="status">{message}</p>}
    </main>
  );
}
