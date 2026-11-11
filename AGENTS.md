# AGENTS.md — yc-daily-report-system

## 專案
- 類型：code
- Repo：pitaya943/yc-daily-report-system
- 目標：YC 日報系統（prototype v0 一律走 PR）
- 技術棧：`apps/web` Next.js、`apps/api` NestJS、Supabase、Railway（部署）
- 方法：SDD（spec-driven）、TDD、BDD
- 規格：`main` 尚無 `docs/`。規格在 `v0/prototype` 的 `docs/`，會隨 PR #1 落地。以路徑為準，例如 `docs/behavior-spec-final.md`（行為規格）、`docs/design/`（設計與測試計畫）。

## Milestones（每一個都要 Kuei 核可才開工）
1. Prototype v0｜PR #1 合併，且規格路徑 `docs/behavior-spec-final.md` 在 `main` 可讀

## 重要決策（遇到就停下來等 Kuei）
- 資料模型、API 介面、權限／RLS
- 安全相關邏輯（驗證、銀行資料、稽核）
- 規格與 `docs/behavior-spec-final.md` 不一致時，以規格為準並先問 Kuei

## 審查深度
- 一般 PR：Kuei 自己看報告
- 重要 PR：跨模型審查（builder 與 reviewer 不同模型家族）
- 重大變更：開工前可再跑 interrogate
- `@claude review` 只是審查，不會自動跑 grill-me；需要 grill-me 時走 `claude.ai/code` session

## 啟用的 skills（放在 .claude/skills/）
- grill-me、teach：只在 `claude.ai/code` 雲端 session（或 Kuei 本機 session）載入與使用；Projects thread 與 GitHub Action（`@claude`）不算

## 固定規則
- 做題者不閱卷：builder 與 reviewer 不同模型家族。Never Opus（build、fix rounds、verification 皆然）
- 只開 branch 與 PR。Never push to `main`。Merge 只由 Kuei 執行
- Commit 作者為 bullet-bots。例外：`@claude review` 時 Claude 可以 commit（見流程最後一步；workflow 為 `contents: write`）
- 每個 PR 附報告：做了什麼、證據（指令與結果）、未解問題、需要 Kuei 決定的事
- 決策記在 `docs/decisions.md`（問題｜選擇｜理由｜日期）；每個 milestone 結束寫濃縮摘要到 `docs/milestones/`

## 流程
Alex 起草分工計畫 → Chief 審 → Kuei 核可 done-when → 開工（可並行的工單並行，不把整件事交給單一 agent 依序做）→ Vera（verifier）PASS → 在 Kuei merge 之前於該 PR 跑一次 `@claude review`（Claude 可在此審查中 commit；這是 bullet-bots-only commit 的唯一例外）。

## 分工計畫（一頁） / Work plan (one page)

尚未抄入範本內容。待 [kuei-sop-template#6](https://github.com/pitaya943/kuei-sop-template/pull/6) 合併後，再同步該 PR 的 `docs/work-plan-template.md`（repo：[pitaya943/kuei-sop-template](https://github.com/pitaya943/kuei-sop-template)）。

## 預算備註
- Claude Pro 額度緊：對齊、學習、以及每個 PR 在 Vera PASS 之後的 `@claude review`
- 額度用完時會顯示重置時間（例如「5-hour limit reached - resets [time]」），不是 HTTP 429；429 屬於 API key 或容量問題
- GitHub Action（`@claude`）可能與 claude.ai／Claude Code web 共用同一份 Pro 額度（推論，官方未明說）
