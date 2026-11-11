# AGENTS.md — yc-daily-report-system

## 專案 / Project

- 類型 / Type: code
- Repo: pitaya943/yc-daily-report-system
- 目標 / Goal: YC 日報系統。Prototype v0 一律走 PR。YC daily report system. Prototype v0 work happens only through pull requests.
- 技術棧 / Stack: `apps/web` Next.js、`apps/api` NestJS、Supabase、Railway（部署 / deploy）
- 方法 / Method: SDD（spec-driven）、TDD、BDD
- 規格 / Specs: `docs/behavior-spec-final.md`（行為規格 / behaviour spec）、`docs/design/`（設計與測試計畫 / design and test plan）、`docs/verification/b088-inventory.md`（B-088 盤點表 / inventory）。這些路徑目前在 `v0/prototype`（PR #1），PR #1 合併後才會在 `main`。These paths are on `v0/prototype` (PR #1) and land on `main` when PR #1 merges.

## Milestones（每一個都要 Kuei 核可才開工 / Kuei approves each one before work starts）

1. Prototype v0｜PR #1 合併，且規格路徑 `docs/behavior-spec-final.md` 在 `main` 可讀。PR #1 is merged and `docs/behavior-spec-final.md` is readable on `main`.

## 重要決策（遇到就停下來等 Kuei / stop and wait for Kuei）

- 資料模型、API 介面、權限／RLS。Data model, API surface, permissions / RLS.
- 安全相關邏輯（驗證、銀行資料、稽核）。Security logic (validation, bank data, audit).
- 規格與「規格 / Specs」那一列不一致時，以規格為準並先問 Kuei。If work disagrees with the Specs line above, the spec wins; ask Kuei first.

## 審查深度 / Review depth

- Roles / 角色：Alex `<drafts the work plan>`，Chief `<reviews the plan>`，Vera `<verification; PASS before @claude review>`，Kuei `<approves done-when and merges>`。Alex 起草計畫，Chief 審計畫，Vera 驗證（PASS 之後才做 @claude review），Kuei 核可 done-when 並合併。
- Vera PASS 之後，每個 PR 都跑 @claude review，然後 Kuei merge。Claude 額度用完時，Kuei 可不等該次 @claude review 直接合併，須記錄。After Vera PASS, every PR gets an @claude review, then Kuei merges. When the Claude quota is exhausted, Kuei may merge without waiting for that @claude review, and it must be recorded.
- 重大變更：開工前可再跑 interrogate（選用）。Major changes: optionally run interrogate before work starts.
- `@claude review` 不會自動跑 grill-me；需要 grill-me 時走 `claude.ai/code` session。An `@claude review` does not run grill-me. Use a `claude.ai/code` session when grill-me is needed.

## 啟用的 skills（放在 .claude/skills/） / Enabled skills

- grill-me、teach：只在 `claude.ai/code` 雲端 session（或 Kuei 本機 session）載入與使用；Projects thread 與 GitHub Action 不算。Load and use them only in a `claude.ai/code` cloud session (or Kuei's local session). A Projects thread and the GitHub Action do not count.

## 固定規則 / Standing rules

- 做題者不閱卷：builder 與 reviewer 不同模型家族。Never Opus（build、fix rounds、verification 皆然）。The builder does not grade their own work: builder and reviewer are different model families. Never Opus, for build, fix rounds, and verification.
- 只開 branch 與 PR。Never push to `main`。不 force-push。Merge 只由 Kuei 執行。Open a branch and a PR only. Never push to `main`. No force-push. Only Kuei merges.
- Commit 作者為 bullet-bots。Kuei 要求時，Claude 可直接推修正 commit 到該 PR branch（唯一例外）。Commits are authored by bullet-bots. When Kuei asks, Claude may push fix commits onto that PR branch (the only exception).
- 每個 PR 附中英雙語報告：做了什麼、證據（指令與結果）、未解問題、需要 Kuei 決定的事。Each PR includes a bilingual report: what was done, evidence (commands and results), unresolved issues, and decisions Kuei must make.
- 決策記在 `docs/decisions.md`（問題｜選擇｜理由｜日期）。Record decisions in `docs/decisions.md` (problem | choice | reason | date). How to append a row: [docs/README.md](docs/README.md)「Decisions / 決策」。
- 每個 milestone 結束寫一份濃縮摘要到 `docs/milestones/`。At the end of each milestone, write a short summary under `docs/milestones/`.

## 分工計畫（一頁） / Work plan (one page)

Flow / 流程: Alex drafts → Chief reviews → Kuei approves the done-when → independent tickets run in parallel. 可並行的工單同時做。
Model / 模型: Never Opus. Fix rounds use a stronger model; if none is stronger, keep the same model and record it. 修復輪用更強的模型；沒有更強的就沿用同一模型並記錄。Verification uses a different model family. 驗證用不同的模型家族。
Source of truth / 準則: [docs/work-plan-template.md](docs/work-plan-template.md). 以 docs 檔為準 / the docs file wins.

## 開發規則 / Development rules

Kuei decisions 2026-11-11 19:57、20:10、20:22、20:51（via Chief）。規格路徑見上面「規格 / Specs」。Spec paths are the Specs line above.

1. **Spec first（SDD）**：路徑見「規格 / Specs」。規格不清楚就停，在 PR 問；不要猜。Paths: see Specs above. If the spec is unclear, stop and ask in the PR; do not guess.
2. **先寫會失敗的測試，再寫實作（TDD／BDD）。** Write the failing test first, then the implementation.
3. **每個拒絕案例的測試都要同時斷言三件事**：精確的 status code、精確的錯誤訊息、以及沒有寫入任何資料（含沒有寫到一半的資料）。Every rejection test asserts all three: the exact status code, the exact error message, and that no data was written (including no partial write).
4. **伺服器重驗每一個欄位**；不信任前端。缺值不得默默補上預設值。The server re-validates every field. Do not trust the frontend. A missing value must not silently receive a default.
5. **系統級規則先做逐項盤點表**；每一列要有規格出處、檢查位置（file:line）、測試名稱。表的位置：`docs/verification/b088-inventory.md`（見「規格 / Specs」的落地說明）。A system-wide rule starts as an item-by-item inventory. Each row has a spec source, a check location (file:line), and a test name. The table path is `docs/verification/b088-inventory.md` (see Specs above for where it lives).
6. **CI 全綠才算完成。** 指令見第 9 條。CI 檔在 `.github/workflows/ci.yml`（job：`lint-typecheck`、`unit-test`、`integration`、`e2e`），同樣見「規格 / Specs」的落地說明。CI 不得自動 commit。誰可以 commit：見「固定規則 / Standing rules」。Done only when CI is fully green. Commands: rule 9. The workflow is `.github/workflows/ci.yml` (jobs: `lint-typecheck`, `unit-test`, `integration`, `e2e`); see Specs above for where it lives. CI must not auto-commit. Who may commit: Standing rules.
7. **不 push `main`、不 force-push、不 merge。** 不碰 secrets，程式與 log 都不印 key。只改自己工單範圍內的檔案。No push to `main`, no force-push, no merge. Do not touch secrets, and do not print keys in code or logs. Change only files in your own ticket.
8. **Never Opus。** 見「固定規則 / Standing rules」。See Standing rules.
9. **PR 報告**：格式見「固定規則 / Standing rules」。指令：`pnpm lint`、`pnpm typecheck`、`pnpm test:unit`、`pnpm test:integration`、`pnpm test:e2e`（Playwright）。Report format: Standing rules. Commands: `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e` (Playwright).

## 預算備註 / Budget notes

- Claude Pro 額度緊：對齊、學習，以及 Vera PASS 之後每個 PR 的 @claude review，然後才由 Kuei merge。The Claude Pro quota is tight: use it for alignment, learning, and the @claude review after Vera PASS, then Kuei merges.
- 額度用完時會顯示重置時間（例如「5-hour limit reached - resets [time]」），不是 HTTP 429；429 屬於 API key 或容量問題。When the subscription quota is used up, the message shows a reset time (for example "5-hour limit reached - resets [time]"). That is not HTTP 429. 429 is an API key or capacity problem.
- GitHub Action 可能與 claude.ai／Claude Code web 共用同一份 Pro 額度（推論，官方未明說）。The GitHub Action may share the same Pro quota with claude.ai / Claude Code web (inference; not stated by the vendor).
- 本專案沒有另外的額度上限。This project has no extra quota cap.

## Docs / 文件

Detail / 細則: [docs/README.md](docs/README.md). If this summary and `docs/` disagree, docs wins / 以 docs 檔為準. In-repo docs are bilingual EN + 繁體中文 side by side; identifiers stay untranslated / 文件中英並列，識別名稱不翻譯。
1. Single source / 單一來源: one maintained file per fact; other files link. Work-plan source is `docs/work-plan-template.md`. `AGENTS.md` keeps only the short summary and the link. Approved plans are `docs/work-plans/<id>.md`. When the source changes, update the `AGENTS.md` summary in the same PR. 每個事實一個維護檔，其他檔只連結。分工計畫來源是 `docs/work-plan-template.md`。`AGENTS.md` 只留短摘要與連結。核准後的計畫存 `docs/work-plans/<id>.md`。來源變更時，同一 PR 更新 `AGENTS.md` 摘要。
2. Boundary / 分界: `AGENTS.md` is standing rules only. Templates and project data live under `docs/`. `README.md` is for humans. `AGENTS.md` 只放常規。範本與資料在 `docs/`。`README.md` 給人看。
3. Decisions / 決策: append a row to `docs/decisions.md` (問題｜選擇｜理由｜日期). A change is a new row that names the row it replaces. Keep this table until it grows, then switch to MADR files. 只追加列。要改就新增一列並指出被取代的列。表格先留著，變長再改 MADR 檔。
4. Same PR / 同一 PR: update the owning doc in the same PR as a change to behaviour, a public interface, or a process. This is not limited to the behaviour spec. On top of that, a spec change is made in that same PR and is checked by tests. The spec is living and is not frozen. Derived files are regenerated in that PR, not hand-edited. 行為、公開介面或流程變更時，同一 PR 更新所屬文件，不只行為規格。在這條之上，規格變更也在同一 PR，並由測試檢查。規格是活的，不凍結。衍生檔在該 PR 重新產生，不手改。
5. CI / 檢查: pull requests run markdownlint and lychee on `AGENTS.md`, `CLAUDE.md`, `README.md`, and `docs/**`. The PR template is the checklist. There is no CODEOWNERS file. A command example that the docs claim is runnable must be run in CI. PR 對這些 SOP 文件跑 markdownlint 與 lychee。PR 範本就是 checklist。沒有 CODEOWNERS。文件宣稱可執行的指令範例必須在 CI 裡跑。
6. Vera / 驗證: before PASS, Vera checks the owning file, the `AGENTS.md` summary, that no parallel source was added, that spec citations still resolve, and that inventory citations still resolve (spec source, file:line, and test name). The inventory path is development rule 5. Vera does not write a second product doc. PASS 前核對所屬檔、`AGENTS.md` 摘要、沒有平行來源、規格引用仍對得上，以及盤點表引用（規格出處、file:line、測試名稱）仍對得上。盤點表路徑見開發規則第 5 條。Vera 不另寫一份產品文件。
