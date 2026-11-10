import 'express-session';

export type AccountRole = 'OWNER' | 'ADMIN' | 'USER';

export type SessionAccount = {
  id: string;
  displayName: string;
  role: AccountRole;
  authUserId: string;
};

declare module 'express-session' {
  interface SessionData {
    account?: SessionAccount;
    lastActivityMs?: number;
  }
}
