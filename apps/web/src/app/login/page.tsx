'use client';

import { FormEvent, useEffect, useState } from 'react';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

export default function LoginPage() {
  const [names, setNames] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void fetch(`${apiBase}/auth/sign-in-names?type=admin`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((d: { names: string[] }) => setNames(d.names ?? []))
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
    setMessage('登入成功');
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
