# yc-daily-report-system

Prototype v0 work happens in pull requests. / Prototype v0 開發一律走 PR。

## Stack (S2)

- `apps/web` — Next.js (TypeScript)
- `apps/api` — NestJS (TypeScript), first-line authZ + B-088 validation
- `supabase/` — local Postgres + Auth + RLS
- `packages/validation` — shared B-088 Chinese messages

Local: `supabase start`, `supabase db reset`, copy `.env.example` → `.env` (fill keys from `supabase status`).
