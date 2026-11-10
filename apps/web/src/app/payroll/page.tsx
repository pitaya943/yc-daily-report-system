'use client';

import { FormEvent, useState } from 'react';
import { AppNav } from '../../components/AppNav';
import { apiSend } from '../../lib/api';

export default function PayrollPage() {
  const [startDate, setStart] = useState('');
  const [endDate, setEnd] = useState('');
  const [is10th, setIs10th] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await apiSend<{ runId: string; rowCount: number }>(
        '/payroll/calculate',
        'POST',
        { startDate, endDate, is10thPayday: is10th },
      );
      setMessage(`計薪完成，${res.rowCount} 人（run ${res.runId}）`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '計薪失敗');
    }
  }

  return (
    <main>
      <AppNav />
      <h1>計薪</h1>
      <form onSubmit={onSubmit}>
        <label>
          起始
          <input type="date" value={startDate} onChange={(e) => setStart(e.target.value)} required />
        </label>
        <label>
          結束
          <input type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} required />
        </label>
        <label>
          <input type="checkbox" checked={is10th} onChange={(e) => setIs10th(e.target.checked)} />
          本次為10號發薪（含固定薪資與勞健保）
        </label>
        <button type="submit">計算</button>
      </form>
      {message && <p role="status">{message}</p>}
    </main>
  );
}
