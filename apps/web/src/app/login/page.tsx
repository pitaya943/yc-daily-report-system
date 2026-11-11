'use client';

import { FormEvent, useEffect, useState } from 'react';

import { apiBase, fetchSession, landingPath } from '../../lib/api';

type SignInType = 'admin' | 'west' | 'south';

const TYPE_LABELS: Record<SignInType, string> = {
  admin: '管理員',
  west: '西區',
  south: '南區',
};

/** B-060 type-first sign-in; PROVISIONAL(Q-052) owner under admin type. */
export default function LoginPage() {
  const [step, setStep] = useState<'type' | 'credentials'>('type');
  const [signInType, setSignInType] = useState<SignInType | ''>('');
  const [names, setNames] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void fetchSession().then((s) => {
      if (s.signedIn) {
        window.location.href = landingPath(s.account.role);
      }
    });
  }, []);

  useEffect(() => {
    if (step !== 'credentials' || !signInType) return;
    void fetch(`${apiBase}/auth/sign-in-names?type=${signInType}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((d: { names: string[] }) => {
        setNames(d.names ?? []);
        setDisplayName('');
      })
      .catch(() => setMessage('無法載入帳戶清單'));
  }, [step, signInType]);

  function chooseType(t: SignInType) {
    setSignInType(t);
    setStep('credentials');
    setMessage('');
  }

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
      {step === 'type' ? (
        <section aria-label="選擇類型">
          <p>請先選擇類型（B-060）</p>
          <ul>
            {(['admin', 'west', 'south'] as SignInType[]).map((t) => (
              <li key={t}>
                <button type="button" onClick={() => chooseType(t)}>
                  {TYPE_LABELS[t]}
                  {t === 'admin' ? '（含 Owner，PROVISIONAL Q-052）' : ''}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <form onSubmit={onSubmit}>
          <p>
            類型：{signInType ? TYPE_LABELS[signInType] : ''}{' '}
            <button
              type="button"
              onClick={() => {
                setStep('type');
                setSignInType('');
              }}
            >
              重選
            </button>
          </p>
          <label>
            帳戶
            <select
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
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
              required
            />
          </label>
          <button type="submit">登入</button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </main>
  );
}
