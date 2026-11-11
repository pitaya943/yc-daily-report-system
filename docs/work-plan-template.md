# 分工計畫（一頁） / Work plan (one page)

Kuei decision 2026-11-11 19:47. Copy this page per task. Fill every blank before work starts. Source of truth for the work plan: this file. `AGENTS.md` must match it.

Roles / 角色：Alex `<drafts the work plan>`，Chief `<reviews the plan>`，Vera `<verification; PASS before @claude review>`，Kuei `<approves done-when and merges>`。

Flow / 流程: Alex drafts → Chief reviews → Kuei approves the done-when → work starts. Independent tickets run in parallel. Never give a whole task to one agent to do in sequence.

## 1. Tickets / 工單（dependencies + parallel）

| ID | Ticket | Depends on | Parallel group | Owner role |
|----|--------|------------|----------------|------------|
| T1 | <one outcome> | — | <A, or — if blocked> | build |
| T2 | <one outcome> | <T1 / —> | <A if no shared files with T1, else after T1> | build |

Parallel / 可並行: tickets in the same group, with no dependency on each other, run at the same time. A ticket that depends on another waits.

## 2. Done-when / 完成條件（each ticket）

| ID | Done-when（observable） |
|----|-------------------------|
| T1 | <command or check, and the result that counts as done> |
| T2 | <command or check, and the result that counts as done> |

Kuei approves this table before any ticket starts.

## 3. Model per role / 角色用哪個模型

Never Opus. This covers every role: build, fix rounds, and verification.

| Role | Model | Rule |
|------|-------|------|
| build / 實作 | <model> | Writes the ticket. |
| fix rounds / 修復輪 | <stronger model than build> | Stronger than the builder. If no stronger non-Opus model exists, reuse the same model and record which model was used. 找不到更強且非 Opus 的模型時，可沿用同一模型，須記錄用了哪個模型。 |
| verification / 驗證 | <model> | Different model family from the builder. When only one family is available, use it and record that model in the verdict. |

Verdict / 驗證結論（fill after the check）: builder `<model>`, verifier `<model>`, family `<same / different>`, note `<if only one family: say so>`.

## 4. Usage estimate / 用量估計 and stop threshold / 停止門檻

| ID | Estimate | Notes |
|----|----------|-------|
| T1 | <e.g. N agent-turns or $X> | |
| T2 | <e.g. N agent-turns or $X> | |
| **Total** | <sum> | |

Stop threshold / 停止門檻: <number>. Stop and ask Kuei when a ticket or the total reaches this. Do not keep spending past it.

## 5. Inventory / 系統級規則盤點（own ticket）

Own ticket / 獨立工單: `<Tid>` — system-wide rules, item by item (each field, each route, each role/permission is one row). The ticket is done only when every item has its own row with spec line, file:line and test name.

| Rule | Item (field / route) | Spec source (doc + line) | Where checked (file:line) | Test name |
|------|----------------------|--------------------------|---------------------------|-----------|
| server-side validation of every field | email | <docs/spec.md:12> | <api/user.ts:40> | <rejects invalid email> |
| server-side validation of every field | display name | <docs/spec.md:13> | <api/user.ts:44> | <rejects empty display name> |
| permissions | POST /api/orders | <docs/spec.md:30> | <api/orders.ts:18> | <member cannot create order> |
| permissions | DELETE /api/orders/:id | <docs/spec.md:31> | <api/orders.ts:55> | <member cannot delete order> |

## 6. Flow reminder / 流程（do not skip）

1. Alex drafts this page.
2. Chief reviews tickets, dependencies, parallel groups, models, and the stop threshold.
3. Kuei approves the done-when column.
4. Work starts. Independent tickets run in parallel. Never hand the whole task to one agent to run in sequence.
