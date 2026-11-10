'use client';

import { FormEvent, useEffect, useState } from 'react';

import { apiBase, landingPath } from '../../lib/api';

export default function LoginPage() {
  const [names, setNames] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void Promise.all([
      fetch(`${apiBase}/auth/sign-in-names?type=admin`, {
        credentials: 'include',
      }).then((r) => r.json() as Promise<{ names: string[] }>),
      fetch(`${apiBase}/auth/sign-in-names?type=employee`, {
        credentials: 'include',
      }).then((r) => r.json() as Promise<{ names: string[] }>),
    ])
      .then(([admin, employee]) => {
        const merged = [
          ...new Set([...(admin.names ?? []), ...(employee.names ?? [])]),
        ].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
        setNames(merged);
      })
      .catch(() => setMessage('無法載入帳戶清單'));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    const res = await fetch(`${apiBase}/auth/sign-in`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, password }),
    });
    if (!res.ok) {
      const text = await res.text();
      setMessage(text || '登入失敗');
      return;
    }
    const data = (await res.json()) as {
      account: { role: string };
    };
    window.location.href = landingPath(data.account.role);
  }

  return (
    <main>
      <h1>登入</h1>
      <form onSubmit={onSubmit}>
        <label>
          帳戶
          <select
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          >
            <option value="">請選擇帳戶</option>
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          密碼
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit">登入</button>
      </form>
      {message && <p role="status">{message}</p>}
    </main>
  );
}
