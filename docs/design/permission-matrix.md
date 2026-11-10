# Permission matrix / 權限矩陣

Primary rules / 主要規則：**B-004**, **B-006**, **B-087**, **B-096**, **B-097** (cited explicitly as required). Also B-003, B-005, B-008, B-009, B-012, B-014, B-035, B-060, B-064, B-067, B-074, B-082, B-093, B-095, B-098. Provisional tags: `PROVISIONAL(Q-052–Q-058)`.

**EN.** “Yes” means the interface offers the action *and* NestJS allows it. Interface disabling is not enough (**B-087**): every create, update, delete, confirm, export, and download is re-checked on the server for role, ownership, and status. A signed-in person who is refused sees a forbidden error, not a silent skip (**B-006**), and the blocked attempt is logged as `ACCESS_DENIED` (**B-097**). Unauthenticated requests are sent to the sign-in page and are not logged (`PROVISIONAL(Q-058)`).

**ZH.** 「Yes」表示畫面提供且 NestJS 允許。不能只靠畫面停用（**B-087**）：所有新增、修改、刪除、確認、匯出、下載都須在伺服端再檢查角色、歸屬與狀態。已登入者被拒時看到禁止存取，而非默默略過（**B-006**），並寫 `ACCESS_DENIED`（**B-097**）。未登入者送到登入頁，不留紀錄（暫定 Q-058）。

Legend / 圖例：`Yes` allowed / 允許；`No` refused + logged if a signed-in user sends it / 拒絕，已登入者會被記錄；`Removed` the product must not offer the action / 產品不得提供。

---

## 1. Owner-only admin management / 僅 owner 的管理員管理 (**B-096**)

**EN.** There is exactly one `OWNER` (Kuei), created at system setup, not choosable in the product, **cannot be archived**, and **cannot be transferred** in v0 (**B-003**, **B-096**). The owner can do everything an `ADMIN` can, with the same landing page and sidebar, plus **Admin management (管理員管理)**. Only the owner can add, archive, restore, or modify `ADMIN` accounts (existing fields, including password; no per-admin permission settings in v0), and only the owner can switch `USER` ↔ `ADMIN`. Switching to `ADMIN` requires the big-meter flag off first (`PROVISIONAL(Q-057)`).

**ZH.** `OWNER` 只有一位（Kuei），系統建置時建立，產品內不能選，**不能封存**，v0 **不能移轉**。owner 能做 `ADMIN` 的所有事，落地頁與側欄相同，另多「管理員管理」。只有 owner 能新增、封存、復原或修改 `ADMIN`，也只有 owner 能切換 `USER`／`ADMIN`。切換為 `ADMIN` 前須先關大表（暫定 Q-057）。

**An `ADMIN` cannot:** add / archive / restore / modify other `ADMIN` accounts; change any role including their own; archive themselves. An `ADMIN` may change only their own password, and must enter the current password. Other own fields are owner-only (`PROVISIONAL(Q-055)`). An `ADMIN` does not see the Admin management page. Account management for an `ADMIN` lists `USER` accounts only (`PROVISIONAL(Q-056)`).

**`ADMIN` 不能：** 新增／封存／復原／修改其他 `ADMIN`；更改任何角色（含自己的）；封存自己。自己的帳戶只能改密碼（須輸入目前密碼）。其他自身欄位只由 owner 改（暫定 Q-055）。看不到管理員管理頁。帳戶管理只列 `USER`（暫定 Q-056）。

---

## 2. Matrix / 矩陣 (**B-004**)

| Action / 操作 | `USER` | `ADMIN` | `OWNER` |
|---|---|---|---|
| Sign in if not archived and not locked / 未封存且未鎖定時登入 (B-060, B-089). Owner listed under `admin` type `PROVISIONAL(Q-052)` | Yes | Yes | Yes, same lockout `PROVISIONAL(Q-053)` |
| Sign out / 登出 (B-061) | Yes | Yes | Yes |
| Open landing page / 落地頁 (B-005) | Daily report / 回報頁 | Confirmation / 確認頁 | Same as `ADMIN` |
| See History, Materials, Settings in sidebar / 側欄：歷史、材料、設定 (B-005) | Yes | Yes | Yes |
| See Daily report + Personal statistics / 回報頁與個人統計 (B-005) | Yes | No (redirect to summary) | No (same) |
| See Summary, Confirmation, Payroll, Ledger, Archives, Big-meter group / 統計、確認、薪資、流水帳、檔案庫、大表 (B-005) | No | Yes | Yes |
| See Audit log in sidebar / 側欄變動紀錄 (B-005, B-067) | No | No | **Yes, only the owner** |
| See Admin management / 管理員管理 (B-096) | No | **No** | **Yes, only the owner** |
| Daily report — create (self, ≤ 3 own submissions per date) / 新增日報 (B-062, B-025) | Yes | No (redirect + refuse) | No (same) |
| Daily report — view history / 歷史 (B-063) | Own submitted + collaborator | All non-big-meter; big-meter on its own page | Same as `ADMIN` |
| Daily report — edit / 修改 (B-064) | Submitter and not confirmed only | Yes, including confirmed (clears confirmation) and rejected (clears rejected) | Same as `ADMIN` |
| Daily report — delete / 刪除 (B-064) | Own pending or rejected only | Yes (cannot be undone) | Same as `ADMIN` |
| Export history Excel / 匯出歷史 (B-063, B-084) | Rows they can see | Current page filters | Same as `ADMIN` |
| Materials — view inventory / 查看庫存 (B-065) | Visible, non-quarantined | All non-quarantined (hidden muted) + quarantine | Same as `ADMIN` |
| Materials — request / 申請 (B-065) | Yes, server-checked (B-057) | No | No |
| Materials — cancel pending request / 取消待審申請 | Own pending only | No (review on confirmation page) | No (same) |
| Materials — add, adjust, reorder, hide, move, delete, import, export, reset, resolve quarantine / 材料管理 (B-066) | No | Yes | Yes |
| Personal statistics and salary trial / 個人統計與試算 (B-068) | Own data only, all payroll components | No (redirect to summary) | No (same) |
| Settings — view own payment, bank last four, insurance/tax, YTD retention, item rates / 看自己的財務設定 (B-014, B-082) | Yes (own only; never another person's) | Last-four default; may reveal (logged) | Same as `ADMIN` for visibility |
| Settings — change own password (current password required) / 改自己的密碼 (B-008) | Yes | Yes (**B-096**, Q-047) | Yes; current password `PROVISIONAL(Q-053)`; forgotten owner password reset outside the system |
| Settings — change own financial fields or own role / 改自己的財務欄位或角色 | No | No for role; other own fields owner-only `PROVISIONAL(Q-055)` | Own fields owner-only `PROVISIONAL(Q-054)` |
| Reveal full bank number / 查看完整銀行帳號 (B-093, B-014) | Own only; logged `BANK_REVEAL` | Any account they may manage/view in payroll or account pages; logged | Same as `ADMIN` |
| Confirm/reject ordinary reports and review material requests / 確認一般回報與材料申請 (B-069, B-070) | No | Yes (not undone on this page) | Yes |
| Big-meter confirmation, history, summary / 大表確認、歷史、統計 (B-071, B-073) | No | Yes | Yes |
| Payroll calculate and export / 計薪與匯出 (B-072, B-094) | No | Yes (includes archived-account rules) | Yes |
| Cross-account summary / 統計報表 (B-073) | No | Yes (ordinary and big-meter separate) | Yes |
| Company ledger CRUD, settle, void, export, open evidence / 流水帳 (B-076, B-098, B-085) | No | Yes: create, update, settle, export, open files at any time. Delete only if never had evidence; else void only | Yes |
| Daily/monthly archives list, download, manual generate, delete / 檔案庫 (B-077) | No | Yes | Yes |
| Account management of `USER` / 管理 `USER` 帳戶 (B-074) | No | Yes (list is `USER` only, `PROVISIONAL(Q-056)`) | Yes |
| Reset a `USER` password without the current password / 重設 `USER` 密碼 (B-008) | No | Yes | Yes |
| Set `USER` zone, big-meter, payment, bank, insurance, uninsured override, fixed salary, item rates, retention target / 設定 `USER` 欄位 | No | Yes | Yes |
| Year-end retention settlement / 保留金年度結算 (B-090) | No | Yes | Yes |
| Save unit prices, zone uninsured rates, global retention rates / 單價、稅率、全域保留金 (B-075) | No | Yes | Yes |
| Change retention annual cap / 改保留金年度上限 (B-035) | No | Yes | Yes |
| Deactivate / reactivate (separate action) / 另行停用、復原 | **Removed** | **Removed** | **Removed** |
| Archive / restore a `USER` / 封存、復原 `USER` (B-012, B-074) | No | Yes. Cannot archive the signed-in self. 「不能封存自己目前登入的帳戶」 | Yes |
| Permanently delete an account and its records / 永久刪除帳戶及紀錄 (B-095) | **Removed** | **Removed** | **Removed** |
| Add an `ADMIN` account / 新增 `ADMIN` (**B-096**) | No | **No** | **Yes (only the owner)**, on Admin management |
| Modify an `ADMIN` (existing fields, including password) / 修改 `ADMIN` (**B-096**) | No | **No** for other admins. Own: password only | **Yes (only the owner)** |
| Archive an `ADMIN` / 封存 `ADMIN` (**B-096**) | No | **No** | **Yes (only the owner)** |
| Restore an archived `ADMIN` / 復原 `ADMIN` (**B-096**) | No | **No** | **Yes (only the owner)** |
| Change role `USER` ↔ `ADMIN` / 切換角色 (**B-096**) | No | **No**, including own role | **Yes (only the owner)**. To `ADMIN` requires big-meter off `PROVISIONAL(Q-057)` |
| Archive the owner account / 封存 owner | No | No | **No.** No such action; direct request refused with 「owner 帳戶不能封存」 |
| Transfer the owner role / 移轉 owner | No | No | **No** in v0 |
| View audit log / 查看變動紀錄 (**B-067**, **B-097**) | **No** | **No** | **Yes, only the owner** (all rows, including the owner's) |
| Edit or delete an audit row / 改或刪變動紀錄 `PROVISIONAL(Q-059)` | No | No | **No** |
| Be logged for modifying ops, exports, downloads, bank reveals, blocked attempts / 操作留紀錄 (**B-097**) | Same rule for everyone | Same | Same; the owner's operations are logged too |
| Ordinary viewing (open a page or list) / 一般查看 | Not logged | Not logged | Not logged |

---

## 3. Blocked privilege attempts / 被擋下的越權操作 (**B-006**, **B-087**, **B-097**)

**EN.** Every blocked attempt by a *signed-in* person writes `ACCESS_DENIED` with the actor, the attempted action, and 「已拒絕」 (`PROVISIONAL(Q-058)`). Required cases include, at least:

**ZH.** 已登入者每次被擋下的越權操作都寫 `ACCESS_DENIED`（操作者、嘗試的操作、「已拒絕」）。至少包含：

| Attempt / 嘗試 | Result / 結果 |
|---|---|
| `USER` requests any administrator-only action (confirm, payroll, ledger, archives, account management, cap change, audit, admin management, …) | Forbidden, logged |
| `USER` edits or deletes a confirmed report, or a collaborator tries to edit/delete | Forbidden, logged (B-064, B-087) |
| `USER` requests materials that are hidden, quarantined, remaining 0, or over remaining | Refused with the §3.7 Chinese error (not necessarily `ACCESS_DENIED` unless it is a role breach) |
| `ADMIN` opens or queries the audit log | No sidebar entry; forbidden (**B-006**); logged (**B-097**, B-067, BDD-009) |
| `ADMIN` adds, archives, restores, or modifies another `ADMIN`, or resets that admin's password | Forbidden, nothing changes, `ACCESS_DENIED` (**B-096**, BDD-009) |
| `ADMIN` creates an account with role `ADMIN` or switches any role, including their own | Forbidden, logged |
| `ADMIN` archives themselves | Forbidden, logged (Q-047 / B-096) |
| `ADMIN` tries to change their own non-password fields | Forbidden `PROVISIONAL(Q-055)` |
| Anyone tries to archive the owner | Refused, 「owner 帳戶不能封存」 |
| Anyone tries to UPDATE/DELETE `audit_log` | Denied `PROVISIONAL(Q-059)` |
| Direct API calls that skip a disabled button | Same refusal as the UI (**B-087**) |

---

## 4. Financial-field visibility / 財務欄位可見性 (B-082, B-014, B-093)

**EN.** A `USER` must never see another person's bank account, insurance amount, uninsured rate, retention, or payroll figures. They may see their own; bank is last four by default. `ADMIN` and owner may see all when performing payroll, account management, or exports, still last-four by default; a reveal is logged. Ledger and archives are administrator-only (and owner). Missing encryption key: 「無法讀取」; export/edit of the number blocked; rest of the system runs (B-081).

**ZH.** `USER` 不得看到他人銀行帳號、勞健保、未投保比例、保留金或薪資。可以看自己的，銀行預設後四碼。`ADMIN` 與 owner 在計薪、帳戶管理或匯出時可見全部，仍預設後四碼，點看全碼會被記錄。流水帳與檔案庫僅管理員（及 owner）。金鑰缺失顯示「無法讀取」，並擋下需要全碼的匯出與修改。

---

## 5. B-rules covered in this document / 本文件涵蓋的 B 規則

B-003, B-004, B-005, B-006, B-008, B-009, B-012, B-014, B-025, B-035, B-057, B-060, B-061, B-062, B-063, B-064, B-065, B-066, B-067, B-068, B-069, B-070, B-071, B-072, B-073, B-074, B-075, B-076, B-077, B-081, B-082, B-084, B-085, B-087, B-089, B-090, B-093, B-094, B-095, B-096, B-097, B-098.

