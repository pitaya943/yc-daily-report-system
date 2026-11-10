'use client';

import { FormEvent, useState } from 'react';
import { AppNav } from '../../components/AppNav';
import { apiSend } from '../../lib/api';

export default function TrialPage() {
  const [result, setResult] = useState<string>('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const start = (e.target as HTMLFormElement).startDate.value;
    const end = (e.target as HTMLFormElement).endDate.value;
    const res = await apiSend<{ grossEstimate: number }>(
      '/statistics/personal-trial',
      'POST',
      { startDate: start, endDate: end },
    );
    setResult(`工項毛額試算約 ${res.grossEstimate} NTD（未含保留金）`);
  }

  return (
    <main>
      <AppNav />
      <h1>個人試算</h1>
      <form onSubmit={onSubmit}>
        <input name="startDate" type="date" required />
        <input name="endDate" type="date" required />
        <button type="submit">試算</button>
      </form>
      {result && <p>{result}</p>}
    </main>
  );
}
