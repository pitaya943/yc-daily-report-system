# 分工計畫（一頁） / Work plan (one page)

Kuei decision 2026-11-11 19:47. Copy this page per task. Fill every blank before work starts. This file is the single source for the work plan. `AGENTS.md` only links here.
Kuei 決定 2026-11-11 19:47。每個任務複製這一頁。開工前填完每一個空格。分工計畫以本檔為唯一來源。`AGENTS.md` 只連結到這裡。

Roles / 角色：見 [`AGENTS.md`](../AGENTS.md)「審查深度 / Review depth」。見該節，不要在這裡再寫一次。See that section. Do not copy the sentence here.

Flow / 流程: Alex drafts → Chief reviews → Kuei approves the done-when → work starts. Independent tickets run in parallel. Never give a whole task to one agent to do in sequence.
Alex 起草 → Chief 審 → Kuei 核可 done-when → 開工。各自獨立的工單並行。不要把整件事交給一個 agent 依序做完。

## 1. Tickets / 工單（dependencies + parallel）

| ID | Ticket | Depends on | Parallel group | Owner role |
|----|--------|------------|----------------|------------|
| T1 | <one outcome> | — | <A, or — if blocked> | build |
| T2 | <one outcome> | <T1 / —> | <A if no shared files with T1, else after T1> | build |

Parallel / 可並行: tickets in the same group, with no dependency on each other, run at the same time. A ticket that depends on another waits.
同一組、彼此沒有依賴的工單同時做。有依賴的工單要等。

## 2. Done-when / 完成條件（each ticket）

| ID | Done-when（observable） |
|----|-------------------------|
| T1 | <command or check, and the result that counts as done> |
| T2 | <command or check, and the result that counts as done> |

Kuei approves this table before any ticket starts.
任何工單開始前，Kuei 先核可這張表。

## 3. Model per role / 角色用哪個模型

Never Opus（build、fix rounds、verification）：[`AGENTS.md`](../AGENTS.md)「固定規則 / Standing rules」。That section is the standing wording. 常規原文在該節。

| Role | Model | Rule |
|------|-------|------|
| build / 實作 | <model> | Writes the ticket. 撰寫該工單。 |
| fix rounds / 修復輪 | <stronger model than build> | Stronger than the builder. If no stronger non-Opus model exists, reuse the same model and record which model was used. 比實作者更強。找不到更強且非 Opus 的模型時，沿用同一模型，並記錄用了哪個模型。 |
| verification / 驗證 | <model> | Different model family from the builder. When only one family is available, use it and record that model in the verdict. 與實作者不同模型家族。若只有一個家族，就用它，並在結論裡記錄該模型。 |

Verdict / 驗證結論（fill after the check / 檢查後填）: builder `<model>`, verifier `<model>`, family `<same / different>`, note `<if only one family: say so>`.
實作者 `<model>`、驗證者 `<model>`、家族 `<相同 / 不同>`、備註 `<若只有一個家族就寫明>`。

## 4. Usage estimate / 用量估計 and stop threshold / 停止門檻

| ID | Estimate | Notes |
|----|----------|-------|
| T1 | <e.g. N agent-turns or $X> | |
| T2 | <e.g. N agent-turns or $X> | |
| **Total** | <sum> | |

Stop threshold / 停止門檻: <number>. Stop and ask Kuei when a ticket or the total reaches this. Do not keep spending past it.
某一張工單或合計到達這個數字就停下來問 Kuei。不要繼續花下去。

## 5. Inventory / 系統級規則盤點（own ticket）

Own ticket / 獨立工單: `<Tid>` — system-wide rules, item by item (each field, each route, each role/permission is one row). The ticket is done only when every item has its own row with spec line, file:line and test name.
系統級規則逐項一列（每個欄位、每條路由、每個角色或權限各一列）。每一項都有自己的規格行、file:line 與測試名稱，這張工單才算完成。
Inventory path on this repo / 本 repo 的盤點表路徑: [`AGENTS.md`](../AGENTS.md) 開發規則第 5 條。Development rule 5.

| Rule | Item (field / route) | Spec source (doc + line) | Where checked (file:line) | Test name |
|------|----------------------|--------------------------|---------------------------|-----------|
| server-side validation of every field | email | <docs/spec.md:12> | <api/user.ts:40> | <rejects invalid email> |
| server-side validation of every field | display name | <docs/spec.md:13> | <api/user.ts:44> | <rejects empty display name> |
| permissions | POST /api/orders | <docs/spec.md:30> | <api/orders.ts:18> | <member cannot create order> |
| permissions | DELETE /api/orders/:id | <docs/spec.md:31> | <api/orders.ts:55> | <member cannot delete order> |

## 6. Flow reminder / 流程（do not skip）

1. Alex drafts this page. Alex 起草這一頁。
2. Chief reviews tickets, dependencies, parallel groups, models, and the stop threshold. Chief 審工單、依賴、並行組、模型與停止門檻。
3. Kuei approves the done-when column. Kuei 核可 done-when 那一欄。
4. Work starts. Independent tickets run in parallel. Never hand the whole task to one agent to run in sequence. 開工。獨立工單並行。不要把整件事交給一個 agent 依序做完。
