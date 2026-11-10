export const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

export type SessionInfo =
  | { signedIn: false }
  | {
      signedIn: true;
      account: { displayName: string; role: string };
    };

export async function fetchSession(): Promise<SessionInfo> {
  const res = await fetch(`${apiBase}/auth/session`, { credentials: 'include' });
  return res.json() as Promise<SessionInfo>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function apiSend<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export function landingPath(role: string): string {
  if (role === 'USER') return '/report';
  return '/confirmation';
}
