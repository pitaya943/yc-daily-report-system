# Data model / 資料模型

Source / 來源：`behavior-spec-final.md` (B-001–B-098). Stack / 技術棧：Supabase Postgres + Storage + Auth; NestJS is the first line of authorization; RLS is the second (`done-when` item 2). Identifiers stay untranslated. / 識別名不翻譯。

Provisional answers are tagged `PROVISIONAL(Q-0xx)` and implemented as written until Kuei confirms. / 暫定答案已標註，Kuei 確認前依所寫實作。

No entire `B-nnn` rule is marked **Removed**. Removed *behaviours* (deactivate, permanent account delete, south-price fallback, `bm_40_fen`, remember-me, old audit visibility, old receipt-replace-deletes-file) are not modelled as first-class actions. / 沒有整條 B 規則被標為 Removed。已移除的行為不建模為正式操作。

---

## 1. Conventions / 慣例

**EN.** All user-facing dates and timestamps are Asia/Taipei (B-078). Store `timestamptz` in UTC; convert at the API boundary. Money is integer NTD except unit prices (numeric, ≤ 2 decimals) and material quantities (numeric, ≤ 3 decimals). Work-item quantities are stored as an integer count of 0.1-units (B-021): display `qty_units / 10`. Soft-delete of accounts is forbidden; only `archived_at` exists (B-012, B-095).

**ZH.** 使用者面對的日期與時間皆為 Asia/Taipei（B-078）。資料庫存 UTC 的 `timestamptz`，在 API 邊界轉換。金額為整數 NTD；工項單價最多兩位小數，材料數量最多三位小數。工項數量以 0.1 只的整數個數保存（B-021）：畫面顯示 `qty_units / 10`。帳戶禁止硬刪，只留 `archived_at`（B-012、B-095）。

---

## 2. Enums / 列舉

| Name | Values | Rules |
|---|---|---|
| `account_role` | `OWNER`, `ADMIN`, `USER` | Exactly one `OWNER`, created at setup; not choosable in the product (B-003, B-009, B-096). |
| `zone` | `WEST` (`西區`), `SOUTH` (`南區`) | Default `WEST` (B-010). |
| `payment_method` | `TRANSFER`, `CASH` | Default `TRANSFER` (B-013). |
| `report_status` | `PENDING`, `CONFIRMED`, `REJECTED` | New reports are `PENDING` (B-023). |
| `material_request_status` | `PENDING`, `APPROVED`, `REJECTED` | B-028. |
| `ledger_type` | `INCOME`, `EXPENSE` | Type, not a sign, distinguishes income from expense (B-030). |
| `ledger_category` | `材料費`, `人工費`, `雜支`, `設備費`, `運費`, `其他` | Optional (B-030). |
| `price_set` | `WEST`, `SOUTH`, `BIG_METER` | B-032. No south→west fallback (**Removed**). |
| `archive_type` | `DAILY`, `MONTHLY` | B-077. |
| `archive_source` | `AUTOMATIC`, `MANUAL` | B-077, B-078. |
| `audit_action` | See §10 | B-037, B-097. `ACCOUNT_DELETE`, `ACCOUNT_DEACTIVATE`, `ACCOUNT_REACTIVATE` are **Removed** and must not exist. |

**ZH.** 上表為資料庫列舉。`OWNER` 不可在產品內選取。南區單價不得退回西區。已移除的稽核類型不得出現。

---

## 3. Tables / 資料表

### 3.1 `accounts` — B-007–B-019, B-003, B-009, B-012, B-074, B-081, B-089, B-092, B-095, B-096

**EN.** One row per person. Password is stored only in Supabase Auth (`auth.users`), never in this table (B-008). Display name is unique among *all* rows, including archived (B-007).

**ZH.** 一人一列。密碼只存在 Supabase Auth，不進本表（B-008）。顯示名稱在全部列（含已封存）唯一（B-007）。

| Column | Type | Constraints | Notes / 說明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `auth_user_id` | `uuid` | UNIQUE, NOT NULL, FK `auth.users(id)` | Sign-in subject. / 登入主體。 |
| `display_name` | `varchar(50)` | UNIQUE, NOT NULL, not blank | B-007, B-088. |
| `role` | `account_role` | NOT NULL | B-009. CHECK: count(`role='OWNER'`) = 1. |
| `zone` | `zone` | NOT NULL DEFAULT `'WEST'` | B-010. Still stored for big-meter (grouping + default uninsured rate). |
| `big_meter` | `boolean` | NOT NULL DEFAULT `false` | B-011. `ADMIN`/`OWNER` are not offered the toggle. Switching to `ADMIN` requires `big_meter=false` first. `PROVISIONAL(Q-057)`. |
| `archived_at` | `timestamptz` | NULL = active | B-012. Owner: CHECK `role='OWNER' ⇒ archived_at IS NULL`. |
| `archived_by` | `uuid` | FK `accounts(id)` | |
| `payment_method` | `payment_method` | NOT NULL DEFAULT `'TRANSFER'` | B-013. `TRANSFER` requires a bank number. |
| `bank_account_ciphertext` | `bytea` | NULL | **Secret.** Encrypted at rest; plaintext never stored (B-014, B-081). |
| `bank_account_last4` | `char(4)` | NULL | Masked display only (B-014, B-082, B-093). Digits, not a full number. |
| `insurance_deduction` | `integer` | NOT NULL DEFAULT 0, `>= 0` | B-015. `0` = not enrolled. Enrolled minimum 1. |
| `uninsured_exempt` | `boolean` | NOT NULL DEFAULT `false` | B-015, B-016. |
| `uninsured_rate_override` | `numeric(5,2)` | NULL, `0–100`, ≤ 2 decimals | B-016, B-092. NULL = use zone default (B-033). |
| `fixed_salary` | `integer` | NOT NULL DEFAULT 0, `>= 0` | B-017. |
| `pay_fixed_every_period` | `boolean` | NOT NULL DEFAULT `false` | B-018. |
| `failed_signin_count` | `integer` | NOT NULL DEFAULT 0, `>= 0` | B-089. Per-account. `PROVISIONAL(Q-053)` also applies to owner. |
| `lockout_until` | `timestamptz` | NULL | B-089. 15 minutes after the 5th failure. |
| `last_failed_signin_at` | `timestamptz` | NULL | Count resets after 15 minutes with no further failure (B-089). |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | |

**Secret / encrypted columns / 機密與加密欄位（B-014, B-081）**

| Column | Policy / 政策 |
|---|---|
| `bank_account_ciphertext` | The only encrypted business field. Algorithm is an operations choice (recommended AES-256-GCM); the key is not in the database or source tree. **Fail closed:** if the key is missing, other features keep running, bank fields show 「無法讀取」, and exports/edits that need the number are blocked. Plaintext is never written, including when the key is missing. Last-four is stored separately so the default view does not require decryption. / 唯一加密的業務欄位。金鑰不進資料庫與原始碼。金鑰缺失時 fail closed：其餘功能照常，銀行欄顯示「無法讀取」，擋下需要全碼的匯出與修改。即使金鑰缺失也絕不存明文。後四碼分開存放，預設顯示不必解密。 |

Indexes / 索引：`display_name` (unique), `auth_user_id` (unique), `(role)`, `(zone, archived_at)`, `(archived_at)` WHERE `archived_at IS NULL`.

---

### 3.2 `retention_offsets` — B-019, B-046, B-048, B-090

**EN / ZH.** One offset per account per calendar year (Taiwan). Offsets do not carry into the next year.

| Column | Type | Constraints |
|---|---|---|
| `account_id` | `uuid` | PK, FK `accounts` (no cascade delete) |
| `calendar_year` | `integer` | PK |
| `offset_ntd` | `integer` | NOT NULL (may be negative) |
| `updated_at` / `updated_by` | `timestamptz` / `uuid` | |

---

### 3.3 `account_item_retention_rates` — B-034

**EN / ZH.** Per-account, per-item override of the zone global rate. Empty / missing row = use global. `0` means no retention for that item.

| Column | Type | Constraints |
|---|---|---|
| `account_id` | `uuid` | PK, FK `accounts` |
| `item_code` | `varchar(64)` | PK, FK `work_items(code)` |
| `rate_ntd` | `integer` | NOT NULL, `0–9999` |

---

### 3.4 `work_items` — B-038–B-042, B-032

**EN.** Seeded catalogue. 32 west ordinary, 37 south ordinary, 25 big-meter. `bm_40_fen` must not appear (Removed, Q-007). Codes and default prices are those in spec §4; this doc does not reprint the price lists.

**ZH.** 種子目錄：西區一般 32、南區一般 37、大表 25。不得出現 `bm_40_fen`。代碼與預設單價以規格第 4 節為準，本文不重列價表。

| Column | Type | Constraints |
|---|---|---|
| `code` | `varchar(64)` | PK |
| `catalogue` | `price_set` | PK (same code may exist in WEST and SOUTH with different names/prices) |
| `display_name` | `text` | NOT NULL |
| `default_price` | `numeric(12,2)` | NOT NULL, `>= 0` |
| `attracts_retention` | `boolean` | NOT NULL | WEST: 8 items (B-041). SOUTH: 28 items (B-042). BIG_METER: always false (B-043). |
| `sort_order` | `integer` | NOT NULL |

CHECK: no row with `code = 'bm_40_fen'`.

---

### 3.5 `unit_prices` — B-032, B-075, B-094

| Column | Type | Constraints |
|---|---|---|
| `price_set` | `price_set` | PK |
| `item_code` | `varchar(64)` | PK |
| `price` | `numeric(12,2)` | NOT NULL, `>= 0`, ≤ 2 decimals |
| `updated_at` / `updated_by` | | |

**EN.** Administrators save each set separately. A missing price in a set that a payroll run actually needs blocks payroll (B-094). No fallback from SOUTH to WEST.

**ZH.** 管理員分套儲存。本次計薪實際會用到的套別若有缺價，計薪中止（B-094）。南區不得沿用西區。

---

### 3.6 `system_settings` — B-029, B-033, B-034, B-036

**EN.** Singleton row (`id = 1`). Tab names and comparison label live here. Zone rates live here. The retention cap is *not* only a current value; see `retention_annual_caps`.

**ZH.** 單例列。分頁名稱、已對比標籤、區域費率在此。保留金上限另見年度表。

| Column | Type | Constraints / default |
|---|---|---|
| `id` | `smallint` | PK, CHECK `id = 1` |
| `tab_name_1` … `tab_name_10` | `varchar(50)` | `tab_name_1` default `全部材料`. Empty name hides the tab (B-029). |
| `inventory_comparison_label` | `text` | NULL. Set to filename without extension after a successful import (B-036). Cleared on reset. |
| `uninsured_rate_west` / `uninsured_rate_south` | `numeric(5,2)` | NOT NULL DEFAULT 3, `0–100`, ≤ 2 decimals (B-033). |
| `global_retention_west` / `global_retention_south` | `integer` | NOT NULL DEFAULT 20, `0–9999` (B-034). |

---

### 3.7 `retention_annual_caps` — B-035, B-046–B-048, B-090; `PROVISIONAL(Q-060)`

**EN.** One company-wide integer ≥ 0 per calendar year. Default 60,000. No upper limit (`PROVISIONAL(Q-060)`). A change updates (or inserts) the *current* year only; earlier years stay as stored. Payroll already calculated / exported / archived is not recalculated (snapshots in `payroll_runs`). Cap `0` means no retention.

**ZH.** 每一日曆年一個全公司整數 ≥ 0。預設 60,000。無上限值（暫定 Q-060）。修改只寫入當年；往年不變。已算出、匯出或歸檔的計薪不重算。上限 0 表示不扣保留金。

| Column | Type | Constraints |
|---|---|---|
| `calendar_year` | `integer` | PK |
| `cap_ntd` | `integer` | NOT NULL, `>= 0`, default 60000 |
| `updated_at` / `updated_by` | | |

---

### 3.8 `daily_reports` — B-020–B-025, B-062–B-064, B-069, B-071

| Column | Type | Constraints | Notes / 說明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `submitter_id` | `uuid` | NOT NULL, FK `accounts` | B-022. |
| `report_date` | `date` | NOT NULL | Taiwan calendar date. Today or up to 30 days before; no future (B-020, B-088). |
| `status` | `report_status` | NOT NULL DEFAULT `'PENDING'` | B-023. |
| `reviewer_id` | `uuid` | FK `accounts` | Set on confirm/reject. |
| `reviewed_at` | `timestamptz` | | |
| `custom_item_name` | `varchar(100)` | NULL | B-024. NULL/empty = no custom item. |
| `custom_item_qty_units` | `integer` | NULL, `>= 0` | 0.1-units. Required if name set. Max 999.9 只 = 9999 units. |
| `custom_item_unit_price` | `integer` | NULL, `>= 0` | Integer NTD. Required if name set. |
| `created_at` / `updated_at` | `timestamptz` | | |

**Daily cap / 每日上限 (B-025):** at most 3 *existing* rows with the same `(submitter_id, report_date)`. Collaborator-only rows do not count. Deleting a pending/rejected (or any) existing own row frees the slot. Enforced by a count check in NestJS (first line) plus a partial unique constraint is not enough (cap is 3, not 1); use an exclusion / trigger or a deferred advisory lock in the API transaction. Recommended: `UNIQUE` is wrong; add a trigger `CHECK (count(*) <= 3)` on `(submitter_id, report_date)` or enforce only in the API transaction with `SELECT … FOR UPDATE`. Documented here as an API-enforced invariant plus a DB trigger.

Indexes: `(submitter_id, report_date)`, `(report_date, status)`, `(status)`, `(submitter_id, status)`.

---

### 3.9 `report_item_quantities` — B-021, B-038–B-040

| Column | Type | Constraints |
|---|---|---|
| `report_id` | `uuid` | PK, FK `daily_reports` ON DELETE CASCADE |
| `item_code` | `varchar(64)` | PK |
| `qty_units` | `integer` | NOT NULL DEFAULT 0, `>= 0`, max 9999 (999.9 只) |

**EN.** Only items valid for the submitter's zone and big-meter flag are accepted; others are unused (B-021). Blank = 0 (row may be omitted).

**ZH.** 只接受提交者區域與大表旗標對應的工項；其他不使用。空白視為 0（可省略列）。

---

### 3.10 `report_collaborators` — B-022, B-044

| Column | Type | Constraints |
|---|---|---|
| `report_id` | `uuid` | PK, FK `daily_reports` ON DELETE CASCADE |
| `account_id` | `uuid` | PK, FK `accounts` |
| `sort_order` | `integer` | NOT NULL, `0–5` | Saved roster order after the submitter (B-044). |

**EN.** 0–6 collaborators; group size including submitter ≤ 7. Each must be a not-archived `USER`, same zone, same `big_meter`, not the submitter. The submitter is *not* a row here. Order of this list is the B-044 roster after the submitter.

**ZH.** 協作者 0–6 人，含提交者最多 7 人。須為未封存 `USER`、同區、同大表旗標、非提交者。提交者不在此表。本表順序即 B-044 在提交者之後的名單順序。

---

### 3.11 `report_shares` — B-044, B-091, B-064

**EN.** Official per-person shares, written only when a report becomes `CONFIRMED` (B-091). Deleted (or marked unofficial) when confirmation is cleared (`REPORT_UNCONFIRM`, B-064). Later payroll, trial, summaries, and exports of confirmed quantities must read this table and must not re-split from the current collaborator list.

**ZH.** 正式每人份額，只在回報改為 `CONFIRMED` 時寫入（B-091）。取消確認時刪除或失效（B-064）。之後凡需已核准只數，必須讀此表，不得依當時共同作業名單重算。

| Column | Type | Constraints |
|---|---|---|
| `report_id` | `uuid` | PK, FK `daily_reports` ON DELETE CASCADE |
| `account_id` | `uuid` | PK, FK `accounts` |
| `item_code` | `varchar(64)` | PK | Use the sentinel `__custom__` for the custom item. |
| `share_units` | `integer` | NOT NULL, `>= 0` |

Invariant: for each `(report_id, item_code)`, `sum(share_units)` equals the report's quantity in 0.1-units (B-044).

---

### 3.12 `materials` — B-026, B-027, B-029, B-036, B-054–B-057, B-066

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `code` | `varchar(50)` | NULL | Optional (B-026). Used as the import match key (B-054). |
| `name` | `varchar(100)` | NOT NULL, not blank |
| `specification` | `varchar(200)` | NULL |
| `unit` | `varchar(20)` | NOT NULL, not blank |
| `cumulative_usage` | `numeric(14,3)` | NOT NULL DEFAULT 0, `>= 0` |
| `received_qty` | `numeric(14,3)` | NOT NULL DEFAULT 0, `>= 0` |
| `remaining_qty` | `numeric(14,3)` | NOT NULL DEFAULT 0, `>= 0` |
| `tab` | `integer` | NOT NULL DEFAULT 1, `1–10` |
| `display_order` | `integer` | NOT NULL |
| `hidden` | `boolean` | NOT NULL DEFAULT `false` |
| `quarantined` | `boolean` | NOT NULL DEFAULT `false` |
| `quarantine_note` | `text` | NULL | Both sides' figures, `x`, expected A, likely-fault `A`/`B`/`?` (B-054). |

CHECK invariant (B-027): `received_qty = cumulative_usage + remaining_qty` at all times.

Index: `(tab, display_order)`, `(code)` WHERE `code IS NOT NULL`, `(quarantined)`.

**EN.** The official default catalogue after reset will be provided later by Kuei (B-036 / Q-029). Until then, seed a placeholder catalogue and tag it `PROVISIONAL` in seed comments. Reset zeroes quantities, restores that catalogue, clears hidden/quarantine flags, moves items to tab 1, and clears the comparison label.

**ZH.** 重置後的正式預設清單稍後由 Kuei 提供（B-036 / Q-029）。在此之前種子放佔位清單，並在種子註解標暫定。重置後數量歸零、恢復該清單、清除隱藏與暫存、移到分頁 1、清除已對比標籤。

---

### 3.13 `material_requests` — B-028, B-056, B-057, B-065, B-070

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `applicant_id` | `uuid` | NOT NULL, FK `accounts` |
| `material_id` | `uuid` | NOT NULL, FK `materials` |
| `quantity` | `integer` | NOT NULL, `1–99` |
| `note` | `varchar(50)` | NULL | Truncated to 50 (B-028). |
| `status` | `material_request_status` | NOT NULL DEFAULT `'PENDING'` |
| `reviewer_id` | `uuid` | FK `accounts` |
| `reviewed_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |

**No double deduction / 不得重複扣庫存 (B-056, BDD-002):** approve/reject is allowed only while `status = 'PENDING'`. The update must be `UPDATE … WHERE id = $1 AND status = 'PENDING'` (optimistic guard) inside a transaction that also checks `materials.remaining_qty >= quantity` with `SELECT … FOR UPDATE` on the material row. A second attempt must refuse and leave inventory unchanged.

ON DELETE of a material: remove its `PENDING` requests (B-066). Approved/rejected request history: spec says pending requests are removed on item delete; it does not say what happens to decided requests. **Ambiguity, not invented:** see README. Until decided, decided rows keep a nullable `material_id` or restrict delete when non-pending requests exist — flagged as open, not implemented as a silent rule in this stage beyond “pending requests are also removed”.

Indexes: `(status, created_at)`, `(applicant_id)`, `(material_id, status)`.

---

### 3.14 `ledger_entries` — B-030, B-031, B-076, B-098; `PROVISIONAL(Q-061, Q-062)`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `entry_date` | `date` | NOT NULL |
| `type` | `ledger_type` | NOT NULL |
| `amount` | `integer` | NOT NULL, `>= 1` | Positive integer; type distinguishes income/expense. |
| `description` | `varchar(200)` | NOT NULL, not blank |
| `category` | `ledger_category` | NULL |
| `note` | `varchar(100)` | NULL |
| `payer_account_id` | `uuid` | NULL, FK `accounts` | Only for `EXPENSE`; NULL = company (B-030, B-031). |
| `voided_at` | `timestamptz` | NULL | `PROVISIONAL(Q-061)`: stays listed, marked 「作廢」; excluded from totals and 零用金餘額; cannot be edited, settled, or un-voided in v0. |
| `voided_by` | `uuid` | FK `accounts` | |
| `has_ever_had_evidence` | `boolean` | NOT NULL DEFAULT `false` | Once true, row can only be voided, never deleted (B-098, Q-051, `PROVISIONAL(Q-062)`). |
| `created_at` / `updated_at` | | |

CHECK: `payer_account_id IS NULL OR type = 'EXPENSE'`. CHECK: `voided_at IS NULL OR (cannot be required here for settle)` — settle rejected in API if voided (B-031).

Delete is a hard delete and is allowed only when `has_ever_had_evidence = false` and not voided. Indexes: `(entry_date)`, `(type, category)`, `(payer_account_id)`, `(voided_at)`.

**Petty cash / 零用金餘額 (B-076, BDD-008):** computed, not stored. Income − expense of non-voided rows from the beginning through the filter end date (inclusive); if no date filter, through today (Taiwan). Filter-range income/expense totals follow the current filter.

---

### 3.15 `ledger_evidence_files` — B-030, B-085, B-098; `PROVISIONAL(Q-062)`

**EN.** Permanent retention (B-085). v0: one *current* file per entry; replacing keeps earlier files as previous versions; a file cannot be removed, only replaced (`PROVISIONAL(Q-062)`). An entry that has ever had a file sets `has_ever_had_evidence`.

**ZH.** 永久保留（B-085）。v0 每筆一個現行檔；更換後舊檔列為先前版本；只能更換不能移除（暫定 Q-062）。曾有過檔即視為有證據檔。

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `entry_id` | `uuid` | NOT NULL, FK `ledger_entries` (NO DELETE cascade that would drop files; entries with files cannot be deleted) |
| `storage_bucket` | `text` | NOT NULL | `ledger-evidence` |
| `storage_path` | `text` | NOT NULL UNIQUE |
| `original_filename` | `text` | NOT NULL |
| `mime_type` | `text` | NOT NULL | `application/pdf`, `image/jpeg`, `image/png`, `image/webp` |
| `size_bytes` | `bigint` | NOT NULL, `<= 10 * 1024 * 1024` |
| `version` | `integer` | NOT NULL | Increasing. |
| `is_current` | `boolean` | NOT NULL | Exactly one current file per entry that has files. |
| `created_at` / `created_by` | | |

Partial unique: one `is_current = true` per `entry_id`. No DELETE of file rows in v0 (except if the never-had-file path never created a row).

**Signed URLs / 短效連結 (B-085):** not stored. Each open asks NestJS, which creates a new Supabase signed URL (3,600 seconds) and writes `FILE_DOWNLOAD`. Expired links must not work; a later open creates a new URL.

---

### 3.16 `payroll_runs` and `payroll_run_rows` — B-045–B-053, B-059, B-072, B-035, B-094; `PROVISIONAL(Q-054, Q-060)`

**EN.** Needed so that “already calculated pay is not recalculated” (B-035, Q-050) has a durable snapshot. A new calculation for the same period creates a new run; earlier runs stay. This is a design structure, not an extra business rule.

**ZH.** 為落實「已算過的薪資不重算」而保存快照。同一期間再計算會新增一筆 run，舊的保留。此為結構設計，不是額外業務規則。

| `payroll_runs` | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `start_date` / `end_date` | `date` | Inclusive. Start ≤ end (B-088). |
| `is_10th_payday` | `boolean` | B-049, B-059. |
| `cap_year` / `cap_ntd_used` | `integer` | Cap that applied (B-035, `PROVISIONAL(Q-060)`). |
| `calculated_at` / `calculated_by` | | |
| `status` | `text` | `COMPLETE` or not stored if B-094 aborted (no result row). |

| `payroll_run_rows` | Type | Notes |
|---|---|---|
| `run_id` + `account_id` | PK | |
| `display_name_snapshot` | `text` | Plus 「封存」 marker when applicable (B-045). |
| `role_at_calc` / `zone` / `big_meter` | | Payroll uses the role at calculation time (`PROVISIONAL(Q-057)`). Owner treated like `ADMIN` (`PROVISIONAL(Q-054)`). |
| `gross`, `period_retention`, `ytd_before`, `net` | numeric / int | Rounding to whole NTD only at payroll (B-049). Store integers for displayed money. |
| `fixed_salary_applied`, `insurance_applied`, `uninsured_deduction`, `final_pay` | `integer` | B-049, B-050. |
| `fixed_salary_manual_amount` | `integer` NULL | Archive-period manual adjust (B-017, Q-040). |
| `fixed_salary_added_back` | `boolean` | Later-period add-back while still archived (B-017, Q-041). Input that produced this row. |
| `payment_method` / `bank_last4` | | Full bank number is never stored on the snapshot. Export of the transfer form decrypts live and is blocked if the key is missing (B-014, B-081). |

Hidden rows (B-051): after rounding, omit accounts with `gross == 0` AND `final == 0` from the *displayed* result; they may be omitted from this table or stored with a `hidden` flag. Prefer omit, matching the user-visible result.

---

### 3.17 `retention_year_end_settlements` — B-090, BDD-004

**EN.** Formal close of a calendar year for all accounts at once. Records refunded retention as an amount only; no in-system payment.

**ZH.** 一次結清所選日曆年所有人。只記錄發還金額，不在系統內付款。

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `calendar_year` | `integer` | NOT NULL |
| `settled_at` / `settled_by` | | |
| Plus child `retention_year_end_rows(settlement_id, account_id, ytd_retention, refunded_amount)` | | Figures also appear in the `RETENTION_YEAR_END` audit description (B-090). |

Automatic 1 January 00:00 reset does not require a row here (B-048). If an audit row is written for the automatic reset, the actor is system (B-083).

---

### 3.18 `archives` — B-077, B-078, B-085

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `type` | `archive_type` | NOT NULL |
| `archive_date` | `date` | NOT NULL | Daily: that calendar day. Monthly automatic: last day of the month (range 1st–last). Manual monthly: 1st through the chosen date (B-077, intended). |
| `source` | `archive_source` | NOT NULL |
| `manual_suffix` | `integer` | NULL | Additional manuals get a numeric suffix; must not replace earlier copies. |
| `generator_id` | `uuid` | NULL, FK `accounts` | NULL for automatic (system actor). |
| `xlsx_path` / `pdf_path` | `text` | NULL | Bucket `archives`. If storage is not configured, the record still exists; download warns. |
| `created_at` | `timestamptz` | |

Unique: at most one `AUTOMATIC` row per `(type, archive_date)` (B-078), including after restarts and across workers (advisory lock or unique index). Manual rows are never unique-constrained against automatic ones.

Deleting an archive record **does** remove its stored files (B-077: archive files are not ledger evidence). Download links are short-lived (3,600 s) and not stored.

---

### 3.19 `audit_log` — B-037, B-067, B-083, B-097; `PROVISIONAL(Q-058, Q-059)`

**EN.** Append-only. Nobody, including the owner, can UPDATE or DELETE (`PROVISIONAL(Q-059)`). Kept permanently. Ordinary viewing is not logged. Ordinary sign-in/sign-out are not logged (`PROVISIONAL(Q-058)`). Unauthenticated requests are not logged (redirect to sign-in). Owner operations are logged too. Only the owner can SELECT (B-067).

**ZH.** 只可新增。任何人（含 owner）不能改或刪（暫定 Q-059），永久保留。一般查看不記錄。一般登入、登出不記錄（暫定 Q-058）。未登入者不記錄。owner 的操作也記錄。只有 owner 能讀（B-067）。

| Column | Type | Constraints |
|---|---|---|
| `id` | `bigint` / `uuid` | PK, ordered |
| `occurred_at` | `timestamptz` | NOT NULL | Displayed in Taiwan time (B-037). |
| `actor_id` | `uuid` | NULL, FK `accounts` | NULL = system (lockout, automatic archive, optional New Year reset). |
| `actor_display_name` | `text` | NOT NULL | Snapshot of the name at write time (or 「系統」). |
| `action_type` | `audit_action` | NOT NULL | See §10. |
| `description` | `text` | NOT NULL | Enough to see what changed (B-083). Collaborator creates include 「共 N 人作業」. Cap change includes old and new values. `ACCESS_DENIED` includes the attempted action and 「已拒絕」 (`PROVISIONAL(Q-058)`). |

Indexes: `(occurred_at DESC)`, `(actor_id, occurred_at DESC)`, `(action_type, occurred_at DESC)`.

---

### 3.20 `signin_rate_limits` — B-080

**EN.** Extra protection: at most 10 sign-in attempts per client address per minute, consistent across restarts and workers. A Postgres table (or equivalent shared store) keyed by address + minute window. This does not replace B-089.

**ZH.** 額外保護：同一用戶端位址每分鐘最多 10 次登入嘗試，跨重啟與多執行個體一致。以位址 + 分鐘窗為鍵。不取代 B-089。

| Column | Type | Constraints |
|---|---|---|
| `client_address_hash` | `text` | PK (store a hash of the address, not a marketing profile) |
| `window_start` | `timestamptz` | PK |
| `attempt_count` | `integer` | NOT NULL |

---

## 4. Storage buckets / 儲存桶

| Bucket | Public | Contents | Lifetime / 保留 |
|---|---|---|---|
| `ledger-evidence` | No | Receipt/evidence files (PDF, JPEG, PNG, WebP, ≤ 10 MB) (B-030, B-085) | Permanent. No delete on replace or void. |
| `archives` | No | Daily/monthly Excel and PDF (B-077) | Removed when the archive *record* is deleted. |

**EN.** Access only via NestJS-minted signed URLs (3,600 seconds). URLs are not stored as long-lived addresses (B-085). If storage is not configured: ledger entries can still be saved with a warning; archive records can still be created with a download warning (B-030, B-077).

**ZH.** 只經 NestJS 簽發的短效 URL（3,600 秒）存取。不得當長期網址保存（B-085）。儲存未設定時：流水帳仍可存並警告；歸檔紀錄仍可建立，下載時警告。

---

## 5. Auth linkage / 與 Auth 的對應 (B-008, B-060, B-089)

**EN.** Sign-in is “choose type → pick display name → enter password” (B-060), not an email form. Each `accounts` row is linked to one `auth.users` row. The Auth identifier may be a system-generated unique username/email reserved for Auth; that identifier is not a user-facing field. Password length 6–30 is enforced by NestJS (B-088) in addition to Auth. There is no self-service forgot-password; owner forgotten password is reset outside the system (B-008, B-096). Sessions: 30-minute idle; no remember-me (**Removed**, B-061, B-079).

**ZH.** 登入是「選類型 → 選顯示名稱 → 輸入密碼」（B-060），不是 email 表單。每個帳戶對應一個 `auth.users`。Auth 識別名可為系統產生，不是使用者欄位。密碼 6–30 字由 NestJS 再驗證（B-088）。無自助忘記密碼；owner 忘記密碼於系統外重設。工作階段 30 分鐘閒置；沒有「記住我」。

---

## 6. RLS sketch (second line) / RLS 草稿（第二道防線）

**EN.** NestJS authorizes every create/update/delete/confirm/export/download first (B-006, B-087). RLS denies by default and is a backstop if a request reaches Postgres with a user JWT. The API may use the service role only for operations already authorized in NestJS; default user-scoped queries should still pass RLS.

**ZH.** 所有新增、修改、刪除、確認、匯出、下載先由 NestJS 授權（B-006、B-087）。RLS 預設拒絕，作為 JWT 直打資料庫時的後盾。API 僅在 NestJS 已授權的操作使用 service role；預設使用者查詢仍應通過 RLS。

Claim used in policies: `app.account_id`, `app.role` from a signed JWT (or equivalent `request.jwt.claims`).

| Table | SELECT | INSERT / UPDATE / DELETE |
|---|---|---|
| `accounts` | `USER`: own row only (B-082). `ADMIN`: `USER` rows + own row; not other `ADMIN`? Account management lists `USER` only (`PROVISIONAL(Q-056)`), but payroll lists every included account — `ADMIN` needs to read `ADMIN`/`OWNER` names and pay fields when running payroll (B-004, B-072). RLS SELECT for `ADMIN`/`OWNER`: all rows. Financial ciphertext: see note. | `USER`: UPDATE own password only (via Auth), no financial columns. `ADMIN`: INSERT/UPDATE `USER` rows; cannot UPDATE own financial fields (`PROVISIONAL(Q-055)`); cannot INSERT/UPDATE `ADMIN`/`OWNER` (B-096). `OWNER`: all except cannot archive/update `role` of the owner row to non-OWNER, and cannot set `archived_at` on owner (B-096). DELETE: denied for everyone (B-095). |
| `bank_account_ciphertext` | Prefer a column privilege / view: ordinary SELECT on `accounts` returns `bank_account_last4` only. Ciphertext selected only through a NestJS reveal/export path (B-093, B-081). | UPDATE only when the key is present and the caller may edit that bank number; otherwise fail closed. |
| `retention_offsets`, `account_item_retention_rates` | `USER`: own. `ADMIN`/`OWNER`: all. | `ADMIN`: `USER` accounts only. `OWNER`: all including `ADMIN`/`OWNER` own fields (`PROVISIONAL(Q-054, Q-055)`). |
| `work_items`, `unit_prices`, `system_settings`, `retention_annual_caps` | Signed-in: read (prices needed for trial, B-068). | UPDATE: `ADMIN`/`OWNER` only (B-004, B-035, B-075). |
| `daily_reports` + children | `USER`: `submitter_id = me` OR collaborator. `ADMIN`/`OWNER`: all (ordinary vs big-meter is an API filter, not RLS). | `USER`: INSERT self; UPDATE/DELETE own and `status IN ('PENDING','REJECTED')` (B-064). `ADMIN`/`OWNER`: UPDATE/DELETE all; no INSERT as a self-submitted report via the report page (B-004, B-062) — API refuses. |
| `report_shares` | Same visibility as the parent report. | INSERT/DELETE only by `ADMIN`/`OWNER` on confirm / unconfirm (B-091, B-064). Users never write this table. |
| `materials` | `USER`: `hidden = false AND quarantined = false`. `ADMIN`/`OWNER`: all, including hidden and quarantine. | `ADMIN`/`OWNER` only (B-066). |
| `material_requests` | `USER`: own. `ADMIN`/`OWNER`: all. | `USER`: INSERT own; DELETE (cancel) own `PENDING` only. `ADMIN`/`OWNER`: UPDATE status (approve/reject) only; no self-service cancel path (B-004). |
| `ledger_entries`, `ledger_evidence_files` | `ADMIN`/`OWNER` only (B-004, B-082). | `ADMIN`/`OWNER`. DELETE entries only if `has_ever_had_evidence = false`. No DELETE of evidence file rows. |
| `payroll_runs`, `payroll_run_rows` | `ADMIN`/`OWNER`: all. `USER`: none (own trial is computed, not read from official runs, B-068). | `ADMIN`/`OWNER` INSERT. No UPDATE of completed money figures (new run instead) so B-035 “not recalculated” holds. |
| `retention_year_end_*` | `ADMIN`/`OWNER`. | `ADMIN`/`OWNER` INSERT. |
| `archives` | `ADMIN`/`OWNER`. | `ADMIN`/`OWNER` INSERT/DELETE. |
| `audit_log` | **`OWNER` only** (B-067). `USER`/`ADMIN`: denied (and the API also logs `ACCESS_DENIED`, B-006, B-097). | INSERT: allowed for the service that writes audits (all roles' actions, plus system). UPDATE/DELETE: **denied for everyone**, including owner (`PROVISIONAL(Q-059)`). |
| `signin_rate_limits` | Service only. | Service only. |

Default policy: `REVOKE ALL FROM public, anon, authenticated` then grant the above. `anon` has no table access (B-006: unauthenticated users are sent to sign-in).

---

## 7. Coverage of B-rules in this document / 本文件涵蓋的 B 規則

B-003, B-004, B-006, B-007, B-008, B-009, B-010, B-011, B-012, B-013, B-014, B-015, B-016, B-017, B-018, B-019, B-020, B-021, B-022, B-023, B-024, B-025, B-026, B-027, B-028, B-029, B-030, B-031, B-032, B-033, B-034, B-035, B-036, B-037, B-038, B-039, B-040, B-041, B-042, B-043, B-044, B-045, B-046, B-047, B-048, B-049, B-050, B-051, B-053, B-054, B-055, B-056, B-057, B-059, B-060, B-061, B-062, B-064, B-065, B-066, B-067, B-068, B-069, B-070, B-071, B-072, B-074, B-075, B-076, B-077, B-078, B-079, B-080, B-081, B-082, B-083, B-085, B-087, B-088, B-089, B-090, B-091, B-092, B-093, B-094, B-095, B-096, B-097, B-098.

(B-001, B-002, B-005, B-052, B-058, B-063, B-073, B-084, B-086 are behavioural / NFR / example / UI and are covered in data-flow, permission-matrix, non-functional, or test-plan.)

