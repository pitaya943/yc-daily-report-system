'use client';

import { useState } from 'react';
import { apiBase } from '../../../lib/api';

export default function OwnerAdminsPage() {
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${apiBase}/owner/admins`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, password }),
    });
    const body = await res.json();
    setMessage(res.ok ? `已建立 ${body.account?.displayName}` : JSON.stringify(body));
  }

  return (
    <main>
      <h1>管理員管理（B-096）</h1>
      <form onSubmit={createAdmin}>
        <input
          placeholder="顯示名稱"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <input
          type="password"
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">建立管理員</button>
      </form>
      <p>{message}</p>
    </main>
  );
}
