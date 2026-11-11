# AGENTS.md — yc-daily-report-system

## 專案
- 類型：code
- Repo：pitaya943/yc-daily-report-system
- 目標：YC 日報系統（prototype v0 一律走 PR）
- 技術棧：`apps/web` Next.js、`apps/api` NestJS、Supabase、Railway（部署）
- 方法：SDD（spec-driven）、TDD、BDD
- 規格：`docs/behavior-spec-final.md`（行為規格）、`docs/design/`（設計與測試計畫）。這兩個路徑目前在 `v0/prototype`（PR #1），PR #1 合併後才會在 `main`。

## Milestones（每一個都要 Kuei 核可才開工）
1. Prototype v0｜PR #1 合併，且規格路徑 `docs/behavior-spec-final.md` 在 `main` 可讀

## 重要決策（遇到就停下來等 Kuei）
- 資料模型、API 介面、權限／RLS
- 安全相關邏輯（驗證、銀行資料、稽核）
- 規格與 `docs/behavior-spec-final.md` 不一致時，以規格為準並先問 Kuei

## 審查深度
- Roles / 角色：Alex `<drafts the work plan>`，Chief `<reviews the plan>`，Vera `<verification; PASS before @claude review>`，Kuei `<approves done-when and merges>`。
- Vera PASS 之後，每個 PR 都跑 @claude review，然後 Kuei merge。Claude 額度用完時，Kuei 可不等該次 @claude review 直接合併，須記錄。When the Claude quota is exhausted, Kuei may merge without waiting for that @claude review, and it must be recorded.
- 重大變更：開工前再跑一次 interrogate（選用）
- `@claude review` 只是審查，不會自動跑 grill-me；需要 grill-me 時走 `claude.ai/code` session

## 啟用的 skills（放在 .claude/skills/）
- grill-me、teach：只在 `claude.ai/code` 雲端 session（或 Kuei 本機 session）載入與使用；Projects thread 與 GitHub Action（`@claude`）不算

## 固定規則
- 做題者不閱卷：builder 與 reviewer 不同模型家族。Never Opus（build、fix rounds、verification 皆然）
- 只開 branch 與 PR。Never push to `main`。不 force-push。Merge 只由 Kuei 執行
- Commit 作者為 bullet-bots。Kuei 要求時，Claude 可直接推修正 commit 到該 PR branch（唯一例外）
- 每個 PR 附中英雙語報告：做了什麼、證據（指令與結果）、未解問題、需要 Kuei 決定的事
- 決策記在 docs/decisions.md（問題｜選擇｜理由｜日期）
- 每個 milestone 結束寫一份濃縮摘要到 docs/milestones/

## 分工計畫（一頁） / Work plan (one page)

Flow / 流程: Alex drafts → Chief reviews → Kuei approves the done-when → independent tickets run in parallel. 可並行的工單同時做。
Model / 模型: Never Opus. Fix rounds use a stronger model; if none is stronger, keep the same model and record it. 修復輪用更強的模型；沒有更強的就沿用同一模型並記錄。Verification uses a different model family. 驗證用不同的模型家族。
Source of truth / 準則: [docs/work-plan-template.md](docs/work-plan-template.md). 以 docs 檔為準 / the docs file wins.

## 開發規則 / Development rules

Kuei decisions 2026-11-11 19:57、20:10、20:22、20:51（via Chief）。規格、盤點表與測試指令目前在 `v0/prototype`（PR #1），PR #1 合併後才會在 `main`。

1. **Spec first（SDD）**：規格在 `docs/behavior-spec-final.md`，設計與測試計畫在 `docs/design/`。規格不清楚就停，在 PR 問；不要猜。
2. **先寫會失敗的測試，再寫實作**（TDD/BDD）。
3. **每個拒絕案例**都斷言三件事：精確的 status code、精確的錯誤訊息、沒有寫入任何資料（含沒有寫到一半的資料）。
4. **伺服器重驗每一個欄位**；不信任前端。缺值不得悄悄補預設值。
5. **系統級規則先做逐項盤點表**；每一列都有 spec source、檢查位置（file:line）、test name。表的位置：`docs/verification/b088-inventory.md`。
6. **CI 全綠才算完成。** CI 在 `.github/workflows/ci.yml`（job：`lint-typecheck`、`unit-test`、`integration`、`e2e`）。CI 不得自動 commit。只有 bullet-bots commit；唯一例外是 @claude review：Kuei 要求時，Claude 可直接推修正 commit。When Kuei asks, Claude may push fix commits directly to the PR branch.
7. **不 push main、不 force-push、不 merge。** 不碰 secrets；程式與 log 都不印 key。只改自己這張工單範圍內的檔案。
8. **Never Opus。**
9. **PR 報告中英並列**：做了什麼、證據（指令與結果）、未解問題、需要 Kuei 決定的事。指令：`pnpm lint`、`pnpm typecheck`、`pnpm test:unit`、`pnpm test:integration`、`pnpm test:e2e`（Playwright）。

## 預算備註
- Claude Pro 額度緊：對齊、學習，以及 Vera PASS 之後每個 PR 的 @claude review
- 訂閱額度用完時會顯示重置時間（例如「5-hour limit reached - resets [time]」），不是 HTTP 429；429 屬於 API key 或容量問題
- GitHub Action（`@claude`）可能與 claude.ai／Claude Code web 共用同一份 Pro 額度（推論，官方未明說）
- 本專案沒有另外的額度上限
