# Run locally (v0 prototype)

English instructions first; 繁體中文見下。

## Prerequisites

- Node.js 22, pnpm 10 (`corepack enable`)
- [Supabase CLI](https://supabase.com/docs/guides/cli) for local Postgres/Auth/Storage
- Copy `.env.example` values into `apps/api/.env` after `supabase start` (`supabase status -o env`)

## Commands (done-when walkthrough)

```bash
cd /path/to/yc-daily-report-system
pnpm install --frozen-lockfile
cd supabase && supabase start && supabase db reset && cd ..
eval "$(cd supabase && supabase status -o env)"
export SUPABASE_URL="$API_URL" SUPABASE_ANON_KEY="$ANON_KEY" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export SESSION_SECRET=local-dev-session-secret-change-me-32chars
export SEED_PASSWORD=seedpass01
pnpm --filter @yc/validation run build
pnpm --filter @yc/payroll run build
pnpm --filter @yc/allocation run build
pnpm --filter @yc/bank-crypto run build
pnpm --filter @yc/api run build
pnpm --filter @yc/web run build
pnpm --filter @yc/api run start &   # port 3001
pnpm --filter @yc/web run start &   # port 3000
RUN_INTEGRATION_TESTS=1 pnpm --filter @yc/api run test:integration
E2E_TESTS=1 pnpm --filter @yc/e2e run test
node scripts/check-b-rule-coverage.mjs
```

Playwright walkthrough (screenshots):

```bash
mkdir -p /opt/cursor/artifacts/yc-v0-walkthrough docs/evidence/walkthrough
E2E_TESTS=1 pnpm --filter @yc/e2e exec playwright test walkthrough-v0.spec.ts
```

## 本機執行（繁體中文）

1. 安裝依賴：`pnpm install --frozen-lockfile`
2. 啟動 Supabase：`cd supabase && supabase start && supabase db reset`
3. 匯出環境變數（見上 `supabase status -o env`）
4. 建置並啟動 API（3001）與 Web（3000）
5. 執行整合測試、E2E、覆蓋率腳本

種子帳戶密碼：`SEED_PASSWORD`（CI 預設 `seedpass01`）。Owner：`Kuei`；管理員：`種子管理員`；西區：`種子西區`；南區：`種子南區`。
