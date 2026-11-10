'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiBase, fetchSession, type SessionInfo } from '../lib/api';

export function AppNav() {
  const [session, setSession] = useState<SessionInfo>({ signedIn: false });

  useEffect(() => {
    void fetchSession().then(setSession);
  }, []);

  if (!session.signedIn) return null;

  const role = session.account.role;
  return (
    <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      {role === 'USER' && (
        <>
          <Link href="/report">日報</Link>
          <Link href="/history">我的回報</Link>
          <Link href="/materials">材料</Link>
        </>
      )}
      {(role === 'ADMIN' || role === 'OWNER') && (
        <>
          <Link href="/confirmation">回報確認</Link>
          <Link href="/materials">材料審核</Link>
        </>
      )}
      <button
        type="button"
        onClick={() =>
          void fetch(`${apiBase}/auth/sign-out`, {
            method: 'POST',
            credentials: 'include',
          }).then(() => {
            window.location.href = '/login';
          })
        }
      >
        登出（{session.account.displayName}）
      </button>
    </nav>
  );
}
