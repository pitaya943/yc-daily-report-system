'use client';

import { FormEvent, useState } from 'react';
import { AppNav } from '../../components/AppNav';
import { apiSend } from '../../lib/api';

function taipeiToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
}

/** B-059 10th vs 25th payday shortcuts */
function fillPayday10(
  setStart: (v: string) => void,
  setEnd: (v: string) => void,
  setIs10th: (v: boolean) => void,
) {
  const today = taipeiToday();
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  const lastMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  setStart(`${lastMonth}-21`);
  setEnd(`${today.slice(0, 7)}-05`);
  setIs10th(true);
}

function fillPayday25(
  setStart: (v: string) => void,
  setEnd: (v: string) => void,
  setIs10th: (v: boolean) => void,
) {
  const today = taipeiToday();
  setStart(`${today.slice(0, 7)}-06`);
  setEnd(`${today.slice(0, 7)}-20`);
  setIs10th(false);
}

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
    <main data-export-mode="inline" data-b086="no-fullpage-overlay">
      <AppNav />
      <h1>計薪</h1>
      <div>
        <button type="button" onClick={() => fillPayday10(setStart, setEnd, setIs10th)}>
          B-059 10號發薪
        </button>
        <button type="button" onClick={() => fillPayday25(setStart, setEnd, setIs10th)}>
          B-059 25號發薪
        </button>
      </div>
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
