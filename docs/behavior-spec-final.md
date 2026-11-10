# Behavior Specification — yc-daily-report-system (Final)
# 行為規格 — yc-daily-report-system（定稿）

| | |
|---|---|
| Document / 文件 | Behavior specification for a new system with the same user-visible purpose as the existing daily report system, after Kuei's decisions / 新系統行為規格；在 Kuei 裁決後定案的使用者可見行為 |
| Audience / 讀者 | The implementation agent, who will not see the old system / 實作代理（看不到舊系統） |
| Languages / 語言 | English + 繁體中文（zh-Hant-TW）. Technical identifiers stay untranslated. / 中英雙語；技術識別名不翻譯 |
| Status / 狀態 | **Final / 定稿**, 2026-11-11 (Asia/Taipei). Q-001–Q-029 decided at 2026-11-11 01:21; Q-030–Q-036 at 2026-11-11 01:37; Q-037–Q-039 at 2026-11-11 01:43; Q-040 at 2026-11-11 01:48; Q-041 at 2026-11-11 01:55, clarified 2026-11-11 01:58; Q-042 at 2026-11-11 02:56; B-035 corrected at 2026-11-11 03:42; B-085 corrected at 2026-11-11 03:44; Q-043–Q-051 at 2026-11-11 03:52 (Asia/Taipei). All are recorded in the decision ledger. There are no open questions; Q-052–Q-062 are provisional answers written into the rules, pending Kuei's confirmation (§9). / **定稿**。Q-001–Q-029 於 2026-11-11 01:21、Q-030–Q-036 於 01:37、Q-037–Q-039 於 01:43、Q-040 於 01:48、Q-041 於 01:55（01:58 補充）、Q-042 於 02:56 決定；B-035 於 03:42、B-085 於 03:44 修正、Q-043–Q-051 於 03:52 決定（Asia/Taipei）；皆以決策清單為準。目前沒有未決事項；Q-052–Q-062 為已寫入規則的暫定答案，待 Kuei 確認（第 9 節）。 |
| Traceability / 追溯 | Existing `B-nnn` IDs are kept. Removed rules are marked **Removed**, not renumbered. New rules are `B-088` onward. Decision origin is annotated as `(Decided in Q-nnn, 2026-11-11 01:21)`. / 既有 `B-nnn` 編號保留。刪除的規則標記 **Removed**，不重編。新規則自 `B-088` 起。裁決來源標為 `(Decided in Q-nnn, 2026-11-11 01:21)`。 |
| Source of decisions / 裁決依據 | Decision ledger completed items for this project, 2026-11-11 01:21, 2026-11-11 01:37, 2026-11-11 01:43, 2026-11-11 01:48, 2026-11-11 01:55, 2026-11-11 01:58, 2026-11-11 02:56, 2026-11-11 03:42, 2026-11-11 03:44, and 2026-11-11 03:52. Where this document and that ledger would disagree, the ledger wins and a new `Q-` item is opened. / 決策清單「已完成」中本專案 2026-11-11 01:21、01:37、01:43、01:48、01:55、01:58、02:56、03:42、03:44 與 03:52 的紀錄。若本文件與清單衝突，以清單為準並另開 `Q-` 項。 |

**Changes in this round / 本輪變更摘要 (2026-11-11 03:52).** Q-043–Q-051 are decided: one owner (Kuei), created at setup, cannot be archived, no transfer in v0; the owner can do everything an `ADMIN` can plus an Admin management page; only the owner restores admins and switches accounts between `USER` and `ADMIN`; an `ADMIN` may change their own password (with the current password) but not their own role and cannot archive themselves; all modifying operations, exports, downloads, full bank-number views, and blocked unauthorized attempts are logged, including the owner's, and only the owner can view the log; the retention cap change applies from the current year, does not recalculate past pay, is one company-wide integer ≥ 0, can be changed by the owner too, and is logged; replaced receipts stay openable, entries with evidence can only be voided, not deleted, one file per entry in v0. Where Kuei did not say, a provisional answer is written and listed as Q-052–Q-062 (§9). / Q-043–Q-051 已決定：owner 只有一位（Kuei），系統建置時建立，不能封存，v0 不做移轉；owner 能做 `ADMIN` 的所有事，另有「管理員管理」頁；只有 owner 能復原 admin 與切換 `USER`／`ADMIN`；`ADMIN` 可改自己的密碼（須輸入舊密碼），不能改自己的角色，也不能封存自己；所有修改、匯出、下載、查看完整帳號、被擋下的越權操作都留紀錄（含 owner 的操作），只有 owner 能看紀錄；保留金上限修改自當年度起套用、已算過的薪資不重算、全公司單一值、0 以上整數 NTD、owner 也能改、每次修改留紀錄；更換後舊憑證仍可點開，有證據檔的紀錄只能作廢不能刪，v0 一筆紀錄一個檔案。Kuei 未說明之處寫入暫定答案，列為 Q-052–Q-062（第 9 節）。

**Previous round / 前一輪變更摘要 (2026-11-11 02:56–03:44).** (1) Q-042: a new `OWNER` role (highest privilege) is added. Only the owner can add, archive, or modify `ADMIN` accounts; an `ADMIN` cannot archive or modify other `ADMIN` accounts; every `ADMIN` action is logged (**B-096**, **B-097**). (2) B-035: the retention annual cap defaults to 60,000 NTD and an administrator can change it. (3) B-085: receipt and ledger evidence files are kept permanently; an administrator can open them from the ledger at any time, and each open creates a new short-lived download link. Follow-up items were Q-043–Q-051, now decided. / (1) Q-042：新增 `OWNER`（最高權限）角色。只有 owner 能新增、封存或修改 `ADMIN` 帳戶；`ADMIN` 不能封存或修改其他 `ADMIN`；`ADMIN` 的操作都要留紀錄（**B-096**、**B-097**）。(2) B-035：保留金年度上限預設 60,000 NTD，管理員可以修改。(3) B-085：憑證與流水帳證據檔案永久保留；管理員隨時可從流水帳點開，每次點開都產生新的短效下載連結。後續事項 Q-043–Q-051 現已決定。

**Earlier final change / 前一輪定稿變更.** Q-041, as clarified on 2026-11-11 01:58: for periods after archiving, fixed salary is not counted by default, but an administrator can manually add it back; once added back, that period's fixed salary is counted. / Q-041（2026-11-11 01:58 補充）：封存後各期固定薪資預設不算，但管理員可以手動加回；加回後，該期固定薪資即計入。

---

## 0. How to read this document / 閱讀方式

**EN.** This document specifies *what* users and administrators can see and do, including fields, validation, calculations, exports, errors, and non-functional rules. It does not specify tables, file layout, frameworks, or libraries. Rules that Kuei has decided are written as requirements, with their origin. Q-001–Q-051 have been decided. There are no open questions. Q-052–Q-062 are **provisional** answers already written into the rules (marked `Provisional`); implement them as written until Kuei confirms or changes them (§9). The implementation agent must not invent conditions that Kuei did not state.

**ZH.** 本文件只寫使用者與管理員看得到、做得到的行為：欄位、驗證、計算、匯出、錯誤與非功能需求。不寫資料表、檔案配置、框架或函式庫。Kuei 已決定的規則寫成確定需求，並標明來源。Q-001–Q-051 均已決定，沒有未決事項。Q-052–Q-062 為已寫入規則的**暫定**答案（標為 `Provisional`）；在 Kuei 確認或修改前依所寫實作（第 9 節）。實作代理不得自行添加 Kuei 未說的條件。

**Currency / 幣別.** All money is New Taiwan Dollar (NTD). Quantity math stays exact at the 0.1-unit level. Monetary amounts are rounded to whole NTD only when payroll is calculated, not when quantities are split `(Decided in Q-003/Q-004, 2026-11-11 01:21)`. Display amounts with thousands separators. / 金額單位為新台幣（NTD）。只數運算在 0.1 只層保持精確。金額只在計薪時四捨五入到整數元，分配只數時不四捨五入金額 `(Decided in Q-003/Q-004, 2026-11-11 01:21)`。畫面以千分位顯示。

**Time zone / 時區.** All dates and timestamps that people see or enter are Taiwan time (UTC+8, Asia/Taipei). A “day”, “today”, “end of month”, “1 January 00:00”, idle timeout, and scheduled generation use this zone. / 所有使用者看到或輸入的日期與時間均為台灣時間（UTC+8, Asia/Taipei）。「日」「今天」「月底」「1 月 1 日 00:00」、閒置逾時與排程生成皆依此時區。

**Validation / 驗證.** See **B-088** and §3.7. The interface shows instant hints; the server always re-validates. Chinese error messages in the field table are the user-visible wording. / 見 **B-088** 與 §3.7。前端先即時提示，伺服端必再驗證一次。欄位表中的中文錯誤訊息為使用者可見用詞。

---

## 1. Purpose and actors / 目的與使用者

**B-001** System purpose / 系統目的

- **EN.** A construction-crew tool for daily work-item quantity reporting (gas pipeline work), administrator confirmation, automatic payroll from confirmed reports, material inventory and requests, a company cash ledger, and daily/monthly archived reports.
- **ZH.** 供工程隊使用：員工每日回報施工工項數量（瓦斯管線工程）、管理員確認、依已確認回報計算薪資、材料庫存與申請、公司收支流水帳，以及日報/月報歸檔。

**B-002** Design capacity / 設計容量 `(Decided in Q-026, 2026-11-11 01:21)`

- **EN.** There is **no headcount cap**. The old planning size (about 10 `ADMIN` and 75 `USER`) is only a reference. The new system must be designed to operate at **ten times that scale or more**.
- **ZH.** **沒有人數上限**。舊的規劃規模（約 10 個 `ADMIN`、75 個 `USER`）僅供參考。新系統須按 **10 倍或以上** 的規模來設計。

---

## 2. Roles and permission boundaries / 角色與權限邊界

**B-003** Role set / 角色集合 `(Decided in Q-042, 2026-11-11 02:56)`

- **EN.** There are three roles: `OWNER` (highest privilege), `ADMIN` (administrator), and `USER` (employee). Only the owner can add, archive, restore, or modify `ADMIN` accounts (**B-096**). There is **exactly one owner, Kuei**; the owner account is created when the system is set up, cannot be archived, and cannot be transferred in v0. The owner can do everything an `ADMIN` can `(Decided in Q-043/Q-045/Q-046, 2026-11-11 03:52)`. An account can be switched between `USER` and `ADMIN` by the owner only `(Decided in Q-048, 2026-11-11 03:52)`; switching to `ADMIN` requires the big-meter flag to be off first `(Provisional, Q-057)`. Every account also has a work zone (`西區` or `南區`, default `西區`) and a big-meter flag (大表; default off). Zone and the big-meter flag change which work items, unit prices, and retention rules apply; they are not extra roles. An `ADMIN` account is not offered the big-meter toggle in account management.
- **ZH.** 角色有三種：`OWNER`（最高權限）、`ADMIN`（管理員）與 `USER`（員工）。只有 owner 能新增、封存、復原或修改 `ADMIN` 帳戶（**B-096**）。**owner 只有一位，由 Kuei 擔任**；owner 帳戶於系統建置時建立，不能封存，v0 不能移轉。owner 能做 `ADMIN` 能做的所有事 `(Decided in Q-043/Q-045/Q-046, 2026-11-11 03:52)`。帳戶可在 `USER` 與 `ADMIN` 之間切換，僅 owner 能切換 `(Decided in Q-048, 2026-11-11 03:52)`；切換為 `ADMIN` 前須先關閉大表旗標 `(Provisional, Q-057)`。每個帳戶另有施工區域（`西區` 或 `南區`，預設 `西區`）以及是否為大表帳戶（預設否）。區域與大表旗標決定工項、單價與保留金規則，並不是另外的角色。帳戶管理畫面不會讓 `ADMIN` 被設成大表。

**B-004** Permission matrix / 權限矩陣

Who may view, create, update, or delete each kind of record. “Own” means the signed-in account. “Submitter” means the person who filed the daily report, not a collaborator named on it.

| Resource / 資源 | `USER` | `ADMIN` | `OWNER` `(Decided in Q-042, 2026-11-11 02:56)` |
|---|---|---|---|
| Sign in; sign out / 登入、登出 | Yes, if the account is not archived and not locked out `(Decided in Q-032, 2026-11-11 01:37)` / 帳戶未封存且未被鎖定即可 | Same / 同左 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Daily report — create / 日報回報（新增） | Yes, for self only, at most 3 *own submissions* per report date `(Decided in Q-001, 2026-11-11 01:21)` / 僅自己，每一回報日期最多 3 筆**自己送出**的回報 | No. Opening the report page sends the administrator to the summary page. `(Decided in Q-018, 2026-11-11 01:21)` / 否。開啟回報頁會被送到統計報表。 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Daily report — view history / 歷史回報 | Own reports and reports on which they are a collaborator / 自己提交的，以及自己是協作者的 | All non-big-meter reports. Big-meter reports are on a separate big-meter history page. / 所有非大表回報。大表回報在獨立的大表歷史頁。 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Daily report — edit / 修改回報 | Only if they are the submitter and the report is **not confirmed** (pending or rejected). Collaborator rows are view-only. Confirmed reports are preview-only. `(Decided in Q-006, 2026-11-11 01:21)` / 僅限自己提交且**尚未核准**（未確認或已駁回）。協作者列只能看。已核准僅可預覽。 | Yes, including confirmed and rejected reports. Editing a confirmed report clears its confirmed status and records that the confirmation was reset. Editing a rejected report clears the rejected status. / 可以，含已確認與已駁回。修改已確認回報會取消確認並留下紀錄；修改已駁回回報會清除駁回狀態。 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Daily report — delete / 刪除回報 | May delete a **pending** or **rejected** report they submitted. Confirmed reports cannot be deleted by a `USER`. `(Decided in Q-006, 2026-11-11 01:21; Q-030, 2026-11-11 01:37)` / 可刪除自己提交且**待審或已駁回**的回報。`USER` 不能刪已核准回報。 | Yes. Deletion cannot be undone. / 可以。刪除後無法復原。 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Export history to Excel / 匯出歷史 Excel | Yes, for the rows they can see (current filters) / 可以，限自己看得到且目前篩選的列 | Yes, for the current filters on the page they are on (ordinary or big-meter history) / 可以，依當前頁面（一般或大表歷史）的篩選 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Materials — view inventory / 查看材料庫存 | Visible, non-quarantined items only / 僅未隱藏且非暫存區的材料 | All non-quarantined items (hidden items still listed, visually muted). Also the quarantine holding area. / 所有非暫存區材料（隱藏者仍列出，但呈淡化），另可看暫存區 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Materials — request / 申請材料 | Yes, subject to server-side checks `(Decided in Q-009, 2026-11-11 01:21)` / 可以，且伺服端必須檢查 | No (the action is refused) / 否（此操作被拒絕） | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Materials — cancel a pending request / 取消待審申請 | Own pending requests only / 僅自己的待審核申請 | Not as a self-service cancel; the administrator reviews on the confirmation page / 不走自行取消；在確認頁審核 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Materials — add, adjust, reorder, hide, move tab, delete, import, export, reset, resolve quarantine / 材料管理 | No | Yes | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Audit log / 變動紀錄 `(Decided in Q-049, 2026-11-11 03:52)` | **No** (the page is not available) / **否**（無此頁） | **No** (the page is not available) / **否**（無此頁） | **Yes, only the owner.** View all rows; filter by person, action type, and date range. / **可以，僅 owner。**可看全部，可依操作者、類型、日期篩選 |
| Personal statistics and salary trial / 個人統計與薪資試算 | Own data only. The trial includes all payroll components `(Decided in Q-013, 2026-11-11 01:21)` / 僅自己。試算包含所有計薪項目 | No. Opening this page sends the administrator to the summary page. `(Decided in Q-018, 2026-11-11 01:21)` / 否。開啟此頁會被送到統計報表。 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Settings — own profile / 自己的設定 `(Decided in Q-022, 2026-11-11 01:21; Q-047, 2026-11-11 03:52)` | View own payment method, bank account **last four digits** by default (may reveal the full number; that reveal is logged), insurance/tax status, year-to-date retention, and per-item retention rates. Change own password (must enter the current password). Cannot change financial fields. / 可看自己的發薪方式、銀行帳號**預設後四碼**（可點看全碼，該操作會被記錄）、投保/稅務、年度保留金、各工項保留金費率。可改自己的密碼（須輸入目前密碼）。不能改財務欄位。 | Change own password only, and must enter the current password `(Decided in Q-047)`. Cannot change own role and cannot archive self `(Decided in Q-047)`. Other fields of their own account are changed only by the owner `(Provisional, Q-055)`. Bank numbers follow the last-four default and logged reveal. / 只能改自己的密碼，且須輸入目前密碼；不能改自己的角色，也不能封存自己（Q-047）。自己帳戶的其他欄位只由 owner 修改（暫定 Q-055）。銀行帳號預設後四碼，點看全碼會被記錄。 | Change own password after sign-in, entering the current password `(Decided in Q-046; current-password requirement provisional, Q-053)`. A forgotten owner password is reset outside the system `(Decided in Q-046)`. / 登入後可改自己的密碼，須輸入目前密碼（Q-046；輸入目前密碼為暫定 Q-053）。忘記密碼由系統外處理（Q-046）。 |
| Confirmation of ordinary reports and material requests / 一般回報與材料申請確認 | No | Yes (ordinary / non-big-meter reports only). Confirm/reject is not undone on this page `(Decided in Q-025, 2026-11-11 01:21)` / 可以（僅非大表回報）。此頁不能撤銷確認或駁回 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Big-meter confirmation, history, and summary / 大表確認、歷史、統計 | No | Yes | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Payroll calculation and payroll exports / 薪資計算與匯出 | No | Yes (includes big-meter, both zones, reports confirmed before archive, and reports submitted before archive but approved after archive, with an Archived / 「封存」 marker). For the payroll period that includes the archive date, that account's fixed salary is still counted, and the administrator may manually adjust it. Incomplete unit prices cause payroll to error out. `(Decided in Q-024, 2026-11-11 01:21; Q-038, 2026-11-11 01:43; Q-040, 2026-11-11 01:48; Q-041, 2026-11-11 01:55)`. While the account remains archived, later periods' fixed salary is **not counted by default**, but an administrator can **manually add it back**; once added back, that period's fixed salary is counted `(Decided in Q-041, clarified 2026-11-11 01:58)`. / 可以（含大表、兩區、封存前已確認的回報，以及封存前送出、封存後才核准的回報，名稱旁標示「封存」）。帳戶持續封存時，封存當期固定薪資照算；**封存後各期固定薪資預設不算，但管理員可以手動加回；加回後，該期固定薪資即計入** `(Decided in Q-041, clarified 2026-11-11 01:58)`。單價未設完整時計薪報錯。 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Cross-account summary / 統計報表 | No | Yes (ordinary and big-meter are separate pages) / 可以（一般與大表分頁） | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Company ledger / 流水帳 `(Corrected 2026-11-11 03:44; Q-051, 2026-11-11 03:52)` | No | Yes: create, update, settle, Excel export, and opening receipt and evidence files at any time, including entries older than 30 days; each open creates a new short-lived link (**B-085**). Delete only an entry that has never had an evidence file; an entry with an evidence file can only be **voided** (**B-098**). / 可以：新增、修改、沖銷、匯出 Excel；隨時可點開憑證與證據檔（含 30 天以前），每次產生新的短效連結（**B-085**）。只能刪除從未有過證據檔的紀錄；有證據檔的紀錄只能**作廢**（**B-098**）。 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Daily/monthly report archive / 日月報檔案庫 | No | Yes: list, download, manual generate, delete / 可以：列表、下載、手動生成、刪除 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Account management; unit prices; tax rates; global retention rates; retention annual cap; material tab names; year-end retention settlement / 帳戶、單價、稅率、全域保留金、保留金年度上限、材料分頁名稱、保留金年度結算 `(Decided in Q-042, 2026-11-11 02:56; corrected 2026-11-11 03:42; Q-050, 2026-11-11 03:52)` | No | Yes, for `USER` accounts; `ADMIN` accounts are managed only by the owner (rows below). Account management lists `USER` accounts only `(Provisional, Q-056)`. The retention annual cap can be changed (**B-035**). / 可以（`USER` 帳戶）；`ADMIN` 帳戶只由 owner 管理（見下方各列）。帳戶管理只列 `USER` 帳戶（暫定 Q-056）。保留金年度上限可修改（**B-035**）。 | Same as `ADMIN`, plus the Admin management page for `ADMIN` accounts (**B-096**); the owner can also change the retention annual cap `(Decided in Q-045/Q-050, 2026-11-11 03:52)` / 同 `ADMIN`，另有管理員管理頁（**B-096**）；owner 也能改保留金年度上限 |
| Deactivate / reactivate an account / 停用、復原帳戶 | No | **Removed** `(Decided in Q-032, 2026-11-11 01:37)`. There is no separate deactivate action. / **Removed**。沒有另外的停用操作。 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Archive / restore an account / 封存、復原帳戶 `(Decided in Q-019, 2026-11-11 01:21; Q-032, 2026-11-11 01:37; Q-046/Q-047, 2026-11-11 03:52)` | No | Yes, for `USER` accounts. Only archive exists (no separate deactivate). Records are kept. Archive is reversible (restore). An administrator cannot archive their own account. An `ADMIN` cannot archive other `ADMIN` accounts. / 可以（`USER` 帳戶）。只留封存（無另外的停用）。紀錄保留。封存可復原。管理員不能封存自己。`ADMIN` 不能封存其他 `ADMIN`。 | Same as `ADMIN`, and also `ADMIN` accounts (**B-096**). The owner account itself **cannot be archived** `(Decided in Q-046)`. / 同 `ADMIN`，另可封存、復原 `ADMIN` 帳戶（**B-096**）。owner 帳戶本身**不能被封存**（Q-046） |
| Permanently delete an account and its records / 永久刪除帳戶及相關紀錄 | No | **Removed** `(Decided in Q-019, 2026-11-11 01:21)`. Permanent cascade delete is not offered. / **Removed**。不再提供永久連帶刪除。 | Same as `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)` / 同 `ADMIN` |
| Add an `ADMIN` account (including giving a new account the `ADMIN` role) / 新增 `ADMIN` 帳戶 `(Decided in Q-042, 2026-11-11 02:56)` | No | **No** / **否** | **Yes (only the owner)**, on the Admin management page / **可以（僅 owner）**，於管理員管理頁 |
| Modify an `ADMIN` account (its existing fields, including password) / 修改 `ADMIN` 帳戶（既有欄位，含密碼） `(Decided in Q-042, 2026-11-11 02:56; Q-044/Q-047, 2026-11-11 03:52)` | No | **No** for other `ADMIN` accounts. For their own account: password only, with the current password; not their own role `(Decided in Q-047)`; other own fields owner-only `(Provisional, Q-055)`. There are no per-admin permission settings in v0 `(Decided in Q-044)`. / 其他 `ADMIN`：**否**。自己的帳戶：只能改密碼（須輸入舊密碼），不能改自己的角色（Q-047）；其他欄位只由 owner 改（暫定 Q-055）。v0 沒有個別 admin 權限設定（Q-044） | **Yes (only the owner)** / **可以（僅 owner）** |
| Archive an `ADMIN` account / 封存 `ADMIN` 帳戶 `(Decided in Q-042, 2026-11-11 02:56)` | No | **No** / **否** | **Yes (only the owner)** / **可以（僅 owner）** |
| Restore an archived `ADMIN` account / 復原已封存的 `ADMIN` 帳戶 `(Decided in Q-043, 2026-11-11 03:52)` | No | **No** / **否** | **Yes (only the owner)** / **可以（僅 owner）** |
| Change a role between `USER` and `ADMIN` / `USER` 與 `ADMIN` 之間改角色 `(Decided in Q-047/Q-048, 2026-11-11 03:52)` | No | **No**, including their own role / **否**（含自己的角色） | **Yes (only the owner)**. Switching to `ADMIN` requires the big-meter flag off first `(Provisional, Q-057)` / **可以（僅 owner）**。切換為 `ADMIN` 前須先關閉大表旗標（暫定 Q-057） |
| What is logged / 留紀錄的範圍 `(Decided in Q-042, 2026-11-11 02:56; Q-049, 2026-11-11 03:52)` | Same rule for everyone: all modifying operations, exports and downloads, full bank-number views, and blocked unauthorized attempts are logged; ordinary viewing is not (**B-097**) / 所有人同一規則：所有修改、匯出與下載、查看完整銀行帳號、被擋下的越權操作都留紀錄；一般查看不記錄（**B-097**） | Same / 同左 | Same; the owner's operations are logged too / 同左；owner 的操作也記錄 |

**B-005** Sidebar and landing page / 側欄與登入後落地頁

- **EN.** After a successful sign-in, `ADMIN` lands on the confirmation page and `USER` lands on the daily report page. The owner has the **same landing page and sidebar as an `ADMIN`, plus one extra page, Admin management (管理員管理)** `(Decided in Q-045, 2026-11-11 03:52)`. The sidebar always shows History, Materials, and Settings. **Audit log appears only for the owner** `(Decided in Q-049, 2026-11-11 03:52)`. A `USER` additionally sees Daily report and Personal statistics, and does not see management items. An `ADMIN` additionally sees Summary, Confirmation, Payroll, Ledger, Daily/monthly archive, and a Big-meter group (Big-meter history, Big-meter confirmation, Big-meter summary). The signed-in display name and role badge appear in the top bar. A logout control is available. The sidebar can be collapsed; the browser remembers that preference.
- **ZH.** 登入成功後，`ADMIN` 進入確認頁，`USER` 進入回報頁。owner 的**落地頁與側欄同 `ADMIN`，另多一頁「管理員管理」** `(Decided in Q-045, 2026-11-11 03:52)`。側欄一律顯示：歷史紀錄、材料庫存、設定。**變動紀錄只有 owner 看得到** `(Decided in Q-049, 2026-11-11 03:52)`。`USER` 另外有回報頁面與個人統計，看不到管理項目。`ADMIN` 另外有統計報表、確認、薪資計算、流水帳、日報/月報，以及大表管理（大表歷史、大表確認、大表統計）。頂欄顯示登入者顯示名稱與角色標記。可登出。側欄可收合，瀏覽器會記住偏好。

**B-006** Unauthenticated and forbidden access / 未登入與無權限

- **EN.** A person who is not signed in is sent to the sign-in page. A `USER` who requests an administrator-only action is refused (the user-visible result is a forbidden error, not a silent skip). An `ADMIN` who requests an owner-only action (**B-096**) is refused in the same way `(Decided in Q-042, 2026-11-11 02:56)`. Every such blocked attempt by a signed-in person is logged (**B-097**) `(Decided in Q-049, 2026-11-11 03:52)`.
- **ZH.** 未登入者被送到登入頁。`USER` 請求僅管理員可做的操作時應被拒絕（使用者看到禁止存取，而不是默默略過）。`ADMIN` 請求僅 owner 可做的操作（**B-096**）時，同樣被拒絕 `(Decided in Q-042, 2026-11-11 02:56)`。已登入者每次被擋下的越權操作都留紀錄（**B-097**）`(Decided in Q-049, 2026-11-11 03:52)`。

---

## 3. Business fields and validation / 資料欄位與驗證規則

These are business fields, not a database schema. Allowed characters, lengths, ranges, and Chinese error messages are in §3.7. / 以下是業務欄位，不是資料表結構。允許字元、長度、範圍與中文錯誤訊息見 §3.7。

### 3.1 Account / 帳戶

**B-007** Display name / 顯示名稱

- **EN.** The name shown in the product and used to pick an account on the sign-in screen. Required, unique among all accounts, maximum 50 characters.
- **ZH.** 系統中顯示、登入時選擇帳戶用的名稱。必填，全系統唯一，最多 50 個字。

**B-008** Password / 密碼 `(Decided in Q-005, 2026-11-11 01:21)`

- **EN.** Required to sign in. Length is **6 to 30** characters inclusive. Changing one's own password requires the current password, the new password, and a confirmation that must match. An administrator may reset a `USER` account's password without the current password. Resetting another `ADMIN` account's password is modifying that admin, which only the owner can do (**B-096**) `(Decided in Q-042, 2026-11-11 02:56)`. An `ADMIN` changes their own password by entering the current password `(Decided in Q-047, 2026-11-11 03:52)`. The owner changes their own password after sign-in `(Decided in Q-046, 2026-11-11 03:52)`, also by entering the current password `(Provisional, Q-053)`. A forgotten owner password is reset outside the system `(Decided in Q-046, 2026-11-11 03:52)`. There is no self-service “forgot password”; the employee must ask an administrator.
- **ZH.** 登入必填。長度為 **6 至 30** 個字（含）。自助改密碼須輸入目前密碼、新密碼，且確認密碼須相符。管理員可在帳戶管理重設 `USER` 帳戶的密碼，不必舊密碼。重設其他 `ADMIN` 的密碼屬於修改 admin，只有 owner 能做（**B-096**）`(Decided in Q-042, 2026-11-11 02:56)`。`ADMIN` 改自己的密碼須輸入目前密碼 `(Decided in Q-047, 2026-11-11 03:52)`。owner 登入後可改自己的密碼 `(Decided in Q-046, 2026-11-11 03:52)`，同樣須輸入目前密碼 `(Provisional, Q-053)`。owner 忘記密碼時於系統外重設 `(Decided in Q-046, 2026-11-11 03:52)`。沒有自助「忘記密碼」；員工須請管理員重設。

**B-009** Role / 角色

- **EN.** `OWNER`, `ADMIN`, or `USER` `(Decided in Q-042, 2026-11-11 02:56)`. Required when creating an account. Only the owner can add an `ADMIN` account. An `ADMIN` creating an account can create a `USER` account only. `OWNER` cannot be chosen in the product: the single owner account is created at system setup `(Decided in Q-046, 2026-11-11 03:52)`. Only the owner can switch an existing account between `USER` and `ADMIN` `(Decided in Q-048, 2026-11-11 03:52)`.
- **ZH.** `OWNER`、`ADMIN` 或 `USER` `(Decided in Q-042, 2026-11-11 02:56)`。新增帳戶時必填。只有 owner 能新增 `ADMIN` 帳戶；`ADMIN` 新增帳戶時只能建立 `USER`。產品內不能選 `OWNER`：唯一的 owner 帳戶於系統建置時建立 `(Decided in Q-046, 2026-11-11 03:52)`。只有 owner 能把既有帳戶在 `USER` 與 `ADMIN` 之間切換 `(Decided in Q-048, 2026-11-11 03:52)`。

**B-010** Zone / 施工區域

- **EN.** `西區` or `南區`. Default `西區`. Set when the account is created; an administrator may change it later. It selects the ordinary work-item set, unit prices, the default uninsured deduction rate, and retention rules. For a big-meter account it is still stored and used to group the account in lists, and it supplies the default uninsured rate unless a personal override is set. It is not used to choose big-meter work items.
- **ZH.** `西區` 或 `南區`，預設 `西區`。建立時指定，之後管理員可改。決定一般工項、單價、未投保扣除比例的預設值與保留金規則。大表帳戶仍保有區域，用於列表分組，並在沒有個人調整時作為未投保扣除比例的預設；大表工項本身不依區域選擇。

**B-011** Big-meter flag / 大表旗標

- **EN.** If on, the employee uses the big-meter work-item set and prices, has no retention, and their reports are confirmed and summarised on the big-meter pages. An administrator may toggle this for a `USER` account (with a confirmation prompt). An account with the flag on cannot be switched to `ADMIN` until the flag is turned off `(Provisional, Q-057)`. Collaborators on a report must share the same flag and the same zone.
- **ZH.** 開啟後，該員工使用大表工項與單價、不扣保留金，其回報在大表確認頁與大表統計頁處理。管理員可為 `USER` 帳戶切換（須確認）。大表旗標開啟的帳戶須先關閉，才能切換為 `ADMIN` `(Provisional, Q-057)`。共同作業者必須同一區域且大表旗標相同。

**B-012** Archive state / 封存狀態 `(Decided in Q-032, 2026-11-11 01:37)`

- **EN.** There is **no separate deactivate** action (**Removed**). An account is either archived or not. An archived account cannot sign in and is omitted from the sign-in name list and from the collaborator picker. Historical reports and other records **remain**. Archive is **reversible**: an administrator may restore the account; it can sign in again and reappear in the sign-in list and collaborator picker. Only the owner can archive an `ADMIN` account; an `ADMIN` cannot archive other `ADMIN` accounts `(Decided in Q-042, 2026-11-11 02:56)`. Restoring an `ADMIN` account is also owner-only `(Decided in Q-043, 2026-11-11 03:52)`. The owner account **cannot be archived** `(Decided in Q-046, 2026-11-11 03:52)`. An `ADMIN` cannot archive their own account `(Decided in Q-047, 2026-11-11 03:52)`. Permanent cascade delete remains **Removed** (**B-095**). Reports that were **already confirmed before the account was archived**, and reports that were **submitted before archiving and approved after archiving**, still enter payroll, and the name is marked Archived / 「封存」 `(Decided in Q-038, 2026-11-11 01:43; Q-040, 2026-11-11 01:48)`. For the payroll period whose date range includes the archive date (「封存當期」), that account's **fixed salary is still counted** under the usual rules, even if there are no confirmed reports in the period; the administrator may **manually adjust** the counted amount `(Decided in Q-040, 2026-11-11 01:48)`. **While the account remains archived, later periods' fixed salary is not counted by default, but an administrator can manually add it back; once added back, that period's fixed salary is counted** `(Decided in Q-041, clarified 2026-11-11 01:58)`.
- **ZH.** **沒有另外的停用**操作（該做法為 **Removed**）。帳戶只有封存或未封存。封存後不能登入，也不出現在登入名單與共同作業選單。歷史回報與其他紀錄**保留**。封存**可復原**：管理員可還原該帳戶，還原後可再登入，並重新出現在登入名單與共同作業選單。只有 owner 能封存 `ADMIN` 帳戶；`ADMIN` 不能封存其他 `ADMIN` `(Decided in Q-042, 2026-11-11 02:56)`。復原 `ADMIN` 帳戶也只有 owner 能做 `(Decided in Q-043, 2026-11-11 03:52)`。owner 帳戶**不能被封存** `(Decided in Q-046, 2026-11-11 03:52)`。`ADMIN` 不能封存自己 `(Decided in Q-047, 2026-11-11 03:52)`。永久連帶刪除仍為 **Removed**（**B-095**）。**封存前已確認**的回報，以及**封存前送出、封存後才核准**的回報，仍納入薪資，名稱旁標示「封存」`(Decided in Q-038, 2026-11-11 01:43; Q-040, 2026-11-11 01:48)`。計薪起訖含封存日的「封存當期」，該帳戶**固定薪資照算**（即使該期沒有已確認回報）；管理員可**手動調整**計入金額 `(Decided in Q-040, 2026-11-11 01:48)`。**帳戶持續封存時，封存後各期固定薪資預設不算，但管理員可以手動加回；加回後，該期固定薪資即計入** `(Decided in Q-041, clarified 2026-11-11 01:58)`。

**B-013** Payment method / 發薪方式

- **EN.** `TRANSFER` (bank transfer, default) or `CASH` (cash). Switching to `TRANSFER` requires a bank account to be already set; otherwise the system tells the administrator to set the account first.
- **ZH.** `TRANSFER`（轉帳，預設）或 `CASH`（現金）。改為轉帳時必須已有銀行帳號，否則系統提示先設定帳號。

**B-014** Bank account / 銀行帳號 `(Decided in Q-022, 2026-11-11 01:21)`

- **EN.** Optional unless payment method is `TRANSFER`. Fourteen digits: 3-digit branch plus 11-digit account. Hyphens may be typed and are ignored for validation. Stored encrypted at rest; plaintext must never be stored. By default, the account holder and administrators see only the **last four digits** (for example `**** **** **1234` or an equivalent masked form that still shows the last four). The account holder and an `ADMIN` may choose to reveal the full number; that reveal is written to the audit log (**B-093**). If the encryption key is missing, the rest of the system keeps running, bank fields show as unreadable (無法讀取), and **export and edits that need the bank number are blocked**.
- **ZH.** 發薪方式為轉帳時必填，否則可空。14 位數字：3 位分行 + 11 位帳號。輸入時可含 `-`，驗證時忽略。靜態儲存須加密，**絕不存明文**。預設本人與管理員都只看到**後四碼**。本人與 `ADMIN` 可點看完整號碼，該操作須寫入變動紀錄（**B-093**）。若加密金鑰缺失，伺服端其餘功能照常，銀行欄位顯示「無法讀取」，且**擋下需要銀行帳號的匯出與修改**。

**B-015** Insurance deduction / 勞健保扣除額

- **EN.** A non-negative integer in NTD. `0` means the person is not enrolled in company insurance. A positive amount is deducted only when payroll is run as a 10th-of-month payday (see **B-049**). The administrator UI has three choices: enrolled (enter a positive amount, minimum 1); not enrolled, with an uninsured deduction percentage (**B-016**, **B-092**); not enrolled and exempt (no uninsured deduction).
- **ZH.** 非負整數，單位 NTD。`0` 代表未由公司投保。正數只在「本次為 10 號發薪」時扣除（見 **B-049**）。管理員介面有三種選擇：已投保（輸入正整數，最小 1）；未投保，並適用未投保扣除比例（**B-016**、**B-092**）；未投保免扣該比例。

**B-016** Uninsured deduction (percentage) / 未投保扣除比例 `(Decided in Q-020/Q-021, 2026-11-11 01:21)`

- **EN.** If the person is not enrolled (`insurance deduction = 0`) and is not exempt, a **percentage** is deducted at payroll. The default percentage is the zone rate (`西區` / `南區`, default 3% each, same settings as the former tax rates). An administrator may **override the percentage on a single account** (**B-092**). If the person is enrolled, this deduction is 0. If they are marked exempt, this deduction is 0. The base is **work-item gross only, excluding fixed salary** (**B-050**).
- **ZH.** 未投保（勞健保扣除額 = 0）且非免扣時，計薪時扣一**比例**。預設比例為該區域費率（`西區` / `南區`，預設各 3%，即原先的稅率設定）。管理員可**對單一帳戶調整**此比例（**B-092**）。已投保或免扣者，此扣除為 0。基數為**工項薪資毛額，不含固定薪資**（**B-050**）。

**B-017** Fixed salary / 固定薪資 `(Decided in Q-040, 2026-11-11 01:48; Q-041, 2026-11-11 01:55, clarified 2026-11-11 01:58, for archived accounts)`

- **EN.** Non-negative integer NTD, default 0 (none). Paid on a 10th-of-month payday, unless “pay every period” is on, in which case it is paid on every payroll run. The account list shows a badge `每期` or `10號`. For an archived account, fixed salary for the period in which it was archived (the payroll period whose date range includes the archive date) is **counted** under these same rules; the administrator may **manually adjust** that archive-period amount, as in Q-040. **For periods after archiving, fixed salary is not counted by default, but an administrator can manually add it back; once added back, that period's fixed salary is counted** `(Decided in Q-041, clarified 2026-11-11 01:58)`.
- **ZH.** 非負整數 NTD，預設 0（無）。於 10 號發薪時發放；若勾選「每期發放」，則每次計薪都發放。帳戶清單以 `每期` 或 `10號` 標記。封存帳戶的「封存當期」（計薪起訖含封存日）固定薪資依上述規則**照算**；管理員可**手動調整**該期計入金額，仍依 Q-040。**封存後各期固定薪資預設不算，但管理員可以手動加回；加回後，該期固定薪資即計入** `(Decided in Q-041, clarified 2026-11-11 01:58)`。

Acceptance / 驗收:

1. **Given** an account remains archived, and the payroll period's date range includes the archive date, and the usual rules would include fixed salary (a 10th payday or “pay every period” is on), **When** an administrator calculates payroll for that period without adjusting the amount, **Then** that account's fixed salary is counted.
2. **Given** that same account remains archived, and a later payroll period's date range is after the archive period, **When** an administrator calculates payroll for that later period without adding fixed salary back, **Then** fixed salary is **not counted** (the default) `(Decided in Q-041, clarified 2026-11-11 01:58)`.
3. **Given** the later payroll period in (2), **When** the administrator **manually adds** fixed salary **back**, **Then** that period's fixed salary is counted `(Decided in Q-041, clarified 2026-11-11 01:58)`.
4. **Given** the archive-period payroll in (1), **When** the administrator manually adjusts the counted fixed salary, **Then** the adjusted amount is used for that archive period (Q-040).

**B-018** Pay fixed salary every period / 固定薪資每期發放

- **EN.** Boolean, default off. When on, fixed salary is included even if the run is not marked as a 10th-of-month payday.
- **ZH.** 布林，預設關閉。開啟後，即使本次不是 10 號發薪也計入固定薪資。

**B-019** Retention offset / 保留金調整 `(Decided in Q-012/Q-023, 2026-11-11 01:21)`

- **EN.** Integer NTD, may be negative. Recorded **separately for each calendar year**. Added to that year's calculated retention before applying the annual cap. The administrator sets a *target* year-to-date amount for a given year; the system stores the offset that makes “calculated raw + offset” equal that target (clamped by the cap when displayed). An administrator may still adjust an individual's retention. Offsets do not carry into the next calendar year.
- **ZH.** 整數 NTD，可為負。**依日曆年分開記錄**。加在該年已計算保留金之上，再套年度上限。管理員輸入的是某一年的「目標累計」；系統反推並儲存該年調整值，使「純計算 + 調整」等於目標（顯示時仍受上限約束）。管理員仍可調整個別帳戶保留金。調整值不帶到下一個日曆年。

### 3.2 Daily report / 日報回報

**B-020** Report date / 回報日期 `(Decided in Q-002, 2026-11-11 01:21)`

- **EN.** A calendar date in Taiwan time. The form **defaults to today**. The employee may choose a date up to **30 days before today**. **Future dates are not allowed.**
- **ZH.** 台灣時間的日曆日期。表單**預設今天**。員工可往前選最多 **30 天**。**不可選未來日期**。

**B-021** Work-item quantities / 工項數量 `(Decided in Q-003/Q-004, 2026-11-11 01:21)`

- **EN.** For each work item applicable to the submitter (see §4), a quantity ≥ 0. The **smallest unit is 0.1 只**. Values must be exact multiples of 0.1. For calculation and storage they are held as an **integer count of 0.1-units** (example, labelled as an example: 2.3 只 is 23 units of 0.1). The person still enters the quantity in 只 (for example 2.3), not the integer unit count. Blank is treated as 0. Only the work items for that person's zone and big-meter flag are accepted; other items on the same report stay unused.
- **ZH.** 依提交者適用的工項（見第 4 節），數量 ≥ 0。**最小單位為 0.1 只**，必須是 0.1 的整數倍。計算與保存時以 **0.1 只的整數個數** 持有（範例：2.3 只即 23 個 0.1 單位）。使用者仍以「只」輸入（例如 2.3），不是輸入那個整數個數。空白視為 0。只接受該人區域與大表旗標對應的工項；同一筆回報上其他工項不使用。

**B-022** Collaborators / 共同作業者

- **EN.** Optional. The submitter may name up to 6 additional people. Together with the submitter the group is at most 7. Each collaborator must be a not-archived `USER`, in the same zone, with the same big-meter flag, and must not be the submitter. Invalid or extra names are dropped. The picker lists only people who meet those rules, sorted by display name, excluding the submitter. The order of names on the saved collaborator list is the roster order used in **B-044**.
- **ZH.** 選填。提交者最多再選 6 人，含自己最多 7 人。協作者必須是未封存的 `USER`、同一區域、大表旗標相同，且不是提交者本人。不合格或超出人數的選擇會被丟棄。選單只列出符合條件的人，依顯示名稱排序，不含自己。儲存後的共同作業名單順序，即 **B-044** 所用的名單順序。

**B-023** Report status / 回報狀態

- **EN.** A report is in one of three user-visible states: pending (未確認 / 未核准, waiting for review), confirmed (已確認 / 已核准, included in payroll), or rejected (已駁回, excluded from payroll). Newly submitted reports are pending. Confirmed and rejected reports record who reviewed them and when. At confirmation, each person's quantity share is computed and **saved** (**B-091**).
- **ZH.** 使用者可見三種狀態：未確認／未核准（待審）、已確認／已核准（納入薪資）、已駁回（不納入薪資）。新送出為未確認。已確認與已駁回會記錄審核者與時間。核准時，每人的只數分配會計算並**保存**（**B-091**）。

**B-024** Custom work item / 自訂工項

- **EN.** An administrator may attach one custom item to a report: name (at most 100 characters), quantity (≥ 0, multiples of 0.1), and unit price (integer NTD ≥ 0). If the name is cleared, the custom item is removed. History may be filtered to reports that have a custom item. Custom-item quantity is split by the same 0.1-unit rule as other items (**B-044**).
- **ZH.** 管理員可為一筆回報附加一項自訂工項：名稱（最多 100 字）、數量（≥ 0，0.1 的整數倍）、單價（整數 NTD ≥ 0）。名稱清空即移除自訂工項。歷史可篩選「含自訂工項」的回報。自訂工項數量的分配規則與其他工項相同（**B-044**）。

**B-025** Maximum reports per person per day / 每人每日回報上限 `(Decided in Q-001, 2026-11-11 01:21; Q-039, 2026-11-11 01:43)`

- **EN.** Each person may **submit at most 3 reports per report date**. Only reports **they themselves submitted** that still exist count toward the 3. Being named as a collaborator on someone else's report does **not** count. The daily report form does **not** pre-fill an existing report; each submit from that form is a new report (until the cap). The submitter may **update a not-yet-confirmed report from history** (pending, and also rejected per **Q-006**). If the submitter **deletes** their own pending or rejected report, that date's quota is **freed** and they may submit again. A fourth *existing* own submission for the same date is refused with the Chinese error in §3.7.
- **ZH.** 每人就同一回報日期**最多送出 3 筆**。只計算**自己送出且仍存在**的回報。被別人列為共同作業者**不算**。回報表單**不預填**既有回報；在該表單送出即新增一筆（未達上限時）。提交者可**從歷史更新尚未核准的報單**（未確認；已駁回依 **Q-006** 也可改）。若提交者**刪除**自己的待審或已駁回回報，當日額度即**釋放**，可以再送。同一日期若仍有 3 筆自己送出且未刪的回報，第 4 筆會被拒絕，中文錯誤見 §3.7。

### 3.3 Materials / 材料

**B-026** Material fields / 材料欄位

- **EN.** Code (optional, at most 50 characters); name (required, at most 100); specification (optional, at most 200); unit (required, at most 20); cumulative usage; received quantity (實領量); remaining quantity (庫存量). Quantities use up to three decimal places. Tab (1–10); display order within the tab; hidden flag; quarantine flag; quarantine note (shown to administrators when an import mismatch is held).
- **ZH.** 材料編號（可空，最多 50 字）、名稱（必填，最多 100 字）、規格（可空，最多 200 字）、單位（必填，最多 20 字）、累計使用量、實領量、庫存量。數量最多三位小數。分頁（1–10）、分頁內顯示順序、隱藏、是否在暫存區、暫存說明（匯入不符時給管理員看）。

**B-027** Inventory invariant / 庫存不變式

- **EN.** At all times: received quantity = cumulative usage + remaining quantity. Direct adjustments by an administrator: they may edit remaining quantity and cumulative usage; received quantity is recalculated from the invariant. Approvals, import updates, and quarantine resolution must keep the invariant. Approval must not run if remaining would go below zero (**B-056**).
- **ZH.** 任何時候皆須滿足：實領量 = 累計使用量 + 庫存量。管理員直接調整時，可改庫存量與累計使用量，實領量由不變式重算。核准申請、匯入更新、暫存區解決都必須維持此式。若核准後庫存會低於 0，不得核准（**B-056**）。

**B-028** Material request fields / 材料申請欄位

- **EN.** Applicant, material, quantity (integer, minimum 1, maximum 99), optional note truncated to 50 characters, status (`PENDING` / `APPROVED` / `REJECTED`), reviewer and review time when decided.
- **ZH.** 申請者、材料、數量（整數，最小 1、最大 99）、選填備註（截斷至 50 字）、狀態（`PENDING` / `APPROVED` / `REJECTED`）、審核者與審核時間（已審時）。

**B-029** Material tabs / 材料分頁

- **EN.** Up to 10 tabs. Each tab has a name in system settings. A tab with an empty name is hidden. Tab 1 is recommended to keep a name (the default is 「全部材料」) so that not all tabs disappear.
- **ZH.** 最多 10 個分頁。每個分頁在系統設定裡有名稱。名稱為空的分頁不顯示。建議分頁 1 保留名稱（預設「全部材料」），以免全部分頁消失。

### 3.4 Ledger / 流水帳

**B-030** Ledger fields / 流水帳欄位

- **EN.** Entry date (required); type `INCOME` or `EXPENSE` (required); amount (required, positive integer NTD; the type, not a sign, distinguishes income from expense); description/summary (required, at most 200 characters); category (optional, one of：材料費、人工費、雜支、設備費、運費、其他); note (optional, at most 100 characters); payer (optional, only for `EXPENSE`: an account who advanced the money, or empty meaning the company); optional receipt file (PDF, JPEG, PNG, or WebP, maximum 10 MB). Receipt and evidence files are **kept permanently** (**B-085**) `(Corrected 2026-11-11 03:44)`. In v0 an entry has **one** current evidence file `(Decided in Q-051, 2026-11-11 03:52)`. **Replacing** it keeps the earlier file, which stays openable from that entry `(Decided in Q-051, 2026-11-11 03:52)`; earlier files are listed on the entry as previous versions, and a file cannot be removed from an entry, only replaced `(Provisional, Q-062)`. An entry that has, or has ever had, an evidence file **cannot be deleted; it can only be voided**, and its files stay openable (**B-098**) `(Decided in Q-051, 2026-11-11 03:52)`. The earlier wording “replacing a receipt removes the previous file; deleting an entry also removes its receipt” is **Removed**. Each time an administrator opens a file, a new short-lived download link (1 hour) is created (**B-085**). If file storage is not configured, the entry can still be saved and the user is warned that the receipt could not be stored or downloaded.
- **ZH.** 記帳日期（必填）；類型 `INCOME` 或 `EXPENSE`（必填）；金額（必填，正整數 NTD；以類型區分收支，不以正負號）；摘要（必填，最多 200 字）；分類（可選：材料費、人工費、雜支、設備費、運費、其他）；備註（可選，最多 100 字）；支出者（僅支出可選：墊付的帳戶，空白代表公司）；選填憑證（PDF / JPEG / PNG / WebP，最大 10 MB）。憑證與證據檔案**永久保留**（**B-085**）`(Corrected 2026-11-11 03:44)`。v0 每筆紀錄**一個**現行證據檔 `(Decided in Q-051, 2026-11-11 03:52)`。**更換**後舊檔保留，仍可從該筆紀錄點開 `(Decided in Q-051, 2026-11-11 03:52)`；舊檔在該筆紀錄上列為先前版本，檔案只能更換、不能移除 `(Provisional, Q-062)`。有（或曾有）證據檔的紀錄**不能刪除，只能作廢**，檔案仍可點開（**B-098**）`(Decided in Q-051, 2026-11-11 03:52)`。原「更換憑證會移除舊檔、刪除紀錄時一併移除憑證」為 **Removed**。管理員每次點開檔案都產生新的短效下載連結（1 小時）（**B-085**）。若檔案儲存未設定，紀錄仍可儲存，並警告憑證無法上傳或下載。

**B-031** Ledger settle / 沖銷

- **EN.** For an expense whose payer is an employee, “settle” means the advance has been repaid: the payer is cleared so the payer is the company again. If the payer is already the company, the system says so and makes no change. A voided entry cannot be settled (**B-098**) `(Provisional, Q-061)`.
- **ZH.** 若支出的墊付人是員工，「沖銷」表示已還款：支出者清空，改為公司。若本來就是公司，系統告知且不變更。已作廢的紀錄不能沖銷（**B-098**）`(Provisional, Q-061)`。

### 3.5 System settings people change / 系統設定欄位

**B-032** Unit prices / 工項單價 `(Decided in Q-024, 2026-11-11 01:21)`

- **EN.** Integer or decimal NTD per unit, one set each for `西區`, `南區`, and big-meter items. Administrators edit and save each set separately. Defaults are in §4. **There is no fallback** from a missing south price to the west price (**Removed**). If any applicable unit price is unset or incomplete, **payroll must stop with an error** that tells the administrator to finish the prices (**B-094**).
- **ZH.** 每只（單位）NTD，西區、南區、大表各一套。管理員分套編輯並儲存。預設值見第 4 節。**不做**南區缺價時沿用西區的退路（該退路為 **Removed**）。任何適用單價未設定或不完整時，**計薪必須中止並報錯**，提示管理員補齊單價（**B-094**）。

**B-033** Default uninsured deduction rates / 未投保扣除比例（區域預設） `(Decided in Q-020/Q-021, 2026-11-11 01:21)`

- **EN.** Separate default percentages for `西區` and `南區`. Default 3% each. An administrator may override the rate on a single account (**B-092**). The base of the deduction is work-item gross only, excluding fixed salary `(Decided in Q-033, 2026-11-11 01:37)` (**B-050**).
- **ZH.** 西區與南區各一個預設百分比，預設皆 3%。管理員可對單一帳戶覆蓋（**B-092**）。扣除基數為工項薪資毛額，不含固定薪資 `(Decided in Q-033, 2026-11-11 01:37)`（**B-050**）。

**B-034** Global retention rates / 全域保留金費率 `(Decided in Q-020, 2026-11-11 01:21)`

- **EN.** Separate rates for `西區` and `南區`, in **NTD per unit (NTD/只)**, default 20 each, integer 0–9999. A per-account, per-item rate overrides the zone global rate. `0` on an item means no retention for that item.
- **ZH.** 西區與南區各一，單位為 **NTD/只**，預設各 20，整數 0–9999。帳戶可針對單一工項覆蓋全域費率。某工項設為 `0` 表示該工項不扣保留金。

**B-035** Retention annual cap / 保留金年度上限 `(Corrected 2026-11-11 03:42; Decided in Q-050, 2026-11-11 03:52)`

- **EN.** The default is **60,000 NTD**. An administrator, and also the owner, **can change** it (the earlier “not configurable” wording is **Removed**). It is **one company-wide value** (not per zone or per account) and must be an **integer NTD ≥ 0**. A change **applies from the current calendar year**; payroll that was **already calculated is not recalculated**. Every change is logged (**B-097**). The cap applies within a single calendar year, and every retention calculation that clamps by the cap (**B-019**, **B-046**, **B-047**, **B-048**) uses the cap for that calendar year `(Decided in Q-050, 2026-11-11 03:52)`. Provisional details `(Provisional, Q-060)`: each calendar year keeps the cap that was in effect for it, so earlier years are unchanged; a payroll calculated after the change, for any period in the current year, uses the new cap, while results already calculated, exported, or archived stay as they were; there is no upper limit; a cap of 0 means no retention; if the new cap is below what a person has already had retained this year, their further period retention is 0 and the displayed year-to-date is clamped to the cap, with no automatic refund.
- **ZH.** 預設 **60,000 NTD**。管理員與 owner 都**可以修改**（原「不可設定」為 **Removed**）。為**全公司單一值**（不依區域或帳戶），須為 **0 以上整數 NTD**。修改**自當年度起套用**；**已算過的薪資不重算**。每次修改都留紀錄（**B-097**）。上限適用於單一日曆年，所有以上限夾值的保留金計算（**B-019**、**B-046**、**B-047**、**B-048**）使用該年度的上限 `(Decided in Q-050, 2026-11-11 03:52)`。暫定細節 `(Provisional, Q-060)`：每個日曆年保留當年生效的上限，往年不變；修改後才計算的薪資（當年度任何期間）用新上限，已算出、已匯出或已歸檔的結果不變；無上限值上限；上限為 0 表示不扣保留金；若新上限低於某人今年已扣金額，其後各期保留金為 0，畫面年度累計夾在上限，不自動發還。

Acceptance / 驗收:

1. **Given** no one has changed the cap, **When** retention is calculated, **Then** the cap is 60,000 NTD.
2. **Given** I am an `ADMIN` or the owner, **When** I change the cap to a whole number ≥ 0 and save, **Then** the new value is saved and an audit row is written (**B-097**).
3. **Given** I enter a negative number or a decimal, **When** I save, **Then** the save is refused with 「保留金年度上限須為 0 以上的整數」 `(Provisional, Q-060)`.
4. **Given** a payroll for an earlier period of this year was already calculated before the change, **Then** that result is not recalculated.
5. **Given** I am a `USER`, **When** I try to change the cap, **Then** the action is refused (**B-006**) and the blocked attempt is logged.

**B-036** Last successful inventory comparison label / 已對比標籤

- **EN.** After a successful inventory file import, the materials page shows 「已對比：」 plus the file name (without extension). Resetting inventory clears this label and restores a predefined default catalogue with all quantities at 0. That catalogue is kept for the new system; the official item list will be provided later by Kuei `(Decided in Q-029, 2026-11-11 01:21)`.
- **ZH.** 庫存檔成功匯入後，材料頁顯示「已對比：」加上檔名（不含副檔名）。重置庫存後此標籤消失，並恢復預設材料清單且數量歸零。新系統沿用該預設清單；正式品項清單稍後由 Kuei 提供 `(Decided in Q-029, 2026-11-11 01:21)`。

### 3.6 Audit log / 變動紀錄欄位

**B-037** Audit entry / 變動紀錄內容

- **EN.** Time (Taiwan time), actor (display name, or a system actor when the action was produced automatically and has no person), action type, and a human-readable description. Entries cannot be edited or deleted by anyone, including the owner, and are kept permanently `(Provisional, Q-059)`. Types at least include:

  `REPORT_CREATE`, `REPORT_UPDATE`, `REPORT_DELETE`, `REPORT_CONFIRM`, `REPORT_REJECT`, `REPORT_UNCONFIRM`, `ACCOUNT_CREATE`, `ACCOUNT_UPDATE`, `ACCOUNT_ARCHIVE`, `ACCOUNT_RESTORE`, `PASSWORD_CHANGE`, `MATERIAL_REQUEST`, `MATERIAL_CANCEL`, `MATERIAL_ADD`, `MATERIAL_UPDATE`, `MATERIAL_DELETE`, `MATERIAL_APPROVE`, `MATERIAL_REJECT`, `MATERIAL_IMPORT`, `MATERIAL_RESET`, `MATERIAL_KEEP_A`, `MATERIAL_SYNC_B`, `SYSTEM_CONFIG`, `RETENTION_RESET`, `RETENTION_SET`, `RETENTION_YEAR_END`, `LEDGER_CREATE`, `LEDGER_UPDATE`, `LEDGER_DELETE`, `LEDGER_SETTLE`, `BANK_REVEAL`.

  `ACCOUNT_DELETE` for permanent cascade delete is **Removed** `(Decided in Q-019, 2026-11-11 01:21)`. `ACCOUNT_DEACTIVATE` and `ACCOUNT_REACTIVATE` are **Removed** `(Decided in Q-032, 2026-11-11 01:37)`. If a report has collaborators, the create description must include the group size (共 N 人作業). Revealing a full bank number writes `BANK_REVEAL`. Year-end settlement writes `RETENTION_YEAR_END`, including each person's refunded (released) retention. Archiving an account writes `ACCOUNT_ARCHIVE`. Restoring an archived account writes `ACCOUNT_RESTORE`. In addition, under **B-097** `(Decided in Q-049, 2026-11-11 03:52)`, the log covers all modifying operations, exports and downloads, full bank-number views, and blocked unauthorized attempts, by anyone including the owner; ordinary viewing is not logged. Types added for this `(Provisional, Q-058)`: `EXPORT`, `FILE_DOWNLOAD` (including each opening of an evidence file or archive), `ACCESS_DENIED` (a blocked unauthorized attempt), `LEDGER_VOID`, `ACCOUNT_ROLE_CHANGE`, `ACCOUNT_LOCKOUT` (system actor). A change of the retention annual cap is `SYSTEM_CONFIG` with the old and new value.

- **ZH.** 時間（台灣時間）、操作者（顯示名稱；系統自動產生且無人時記為系統）、操作類型、文字說明。任何人（含 owner）都不能改或刪，且永久保留 `(Provisional, Q-059)`。類型至少包含上列識別名。永久連帶刪除用的 `ACCOUNT_DELETE` 為 **Removed** `(Decided in Q-019, 2026-11-11 01:21)`。`ACCOUNT_DEACTIVATE` 與 `ACCOUNT_REACTIVATE` 為 **Removed** `(Decided in Q-032, 2026-11-11 01:37)`。若回報含共同作業，新增回報的說明須含「共 N 人作業」。查看完整銀行帳號須寫 `BANK_REVEAL`。年度結算須寫 `RETENTION_YEAR_END`，並含每人發還（釋出）的保留金。封存帳戶須寫 `ACCOUNT_ARCHIVE`。復原封存帳戶須寫 `ACCOUNT_RESTORE`。此外，依 **B-097** `(Decided in Q-049, 2026-11-11 03:52)`，所有人（含 owner）的修改操作、匯出與下載、查看完整銀行帳號、被擋下的越權操作都要記錄；一般查看不記錄。為此新增的類型 `(Provisional, Q-058)`：`EXPORT`、`FILE_DOWNLOAD`（含每次點開證據檔或歸檔）、`ACCESS_DENIED`（被擋下的越權操作）、`LEDGER_VOID`、`ACCOUNT_ROLE_CHANGE`、`ACCOUNT_LOCKOUT`（系統操作者）。修改保留金年度上限記為 `SYSTEM_CONFIG`，含舊值與新值。

### 3.7 Field constraints / 欄位限制表 `(Decided 2026-11-11 01:21, field-constraints item)`

**B-088** Front-end hints and server re-validation / 前端提示與伺服端再驗證

- **EN.** For every input field below, the interface shows an instant hint when the value is missing or invalid. The server **always** re-validates the same rules. A request that only passed the interface but fails the server is refused, and the Chinese error message is returned. “Characters” below count as the user-visible length (one CJK character counts as one).
- **ZH.** 下表每個輸入欄位，前端在缺漏或格式不正確時須即時提示。伺服端**必須**用同一套規則再驗證一次。只通過前端、未通過伺服端的請求須拒絕，並回傳表中的中文錯誤訊息。下列「字」以使用者可見長度計（一個中文字算一個字）。

| Field / 欄位 | Allowed characters / 允許字元 | Length or range / 長度或範圍 | Decimals / 小數 | Required? / 必填 | Chinese error / 中文錯誤訊息 |
|---|---|---|---|---|---|
| Display name / 顯示名稱 | Visible text, not only whitespace / 可見文字，不得只含空白 | 1–50 | — | Yes / 是 | 「請輸入顯示名稱」；超長：「顯示名稱最多 50 個字」；重複：「此顯示名稱已被使用」 |
| Password / 密碼 | Any characters / 任意字元 | 6–30 | — | Yes / 是 | 「密碼長度須為 6 至 30 個字」 |
| Password confirmation / 確認密碼 | Same as password / 同密碼 | Must match / 須相符 | — | Yes when setting a password / 設定密碼時必填 | 「兩次輸入的密碼不一致」 |
| Current password / 目前密碼 | Any characters / 任意字元 | As stored / 依現有密碼 | — | Yes when changing one's own password / 自助改密碼時必填 | 「目前密碼不正確」 |
| Role / 角色 `(Decided in Q-042, 2026-11-11 02:56; Q-046/Q-048, 2026-11-11 03:52)` | `ADMIN` or `USER` in the product. Only the owner may choose or switch to `ADMIN`; an `ADMIN` may create `USER` only and cannot change any role, including their own. `OWNER` cannot be chosen (the single owner is created at setup). Switching to `ADMIN` requires big-meter off `(Provisional, Q-057)` / 產品內只有 `ADMIN` 或 `USER`。只有 owner 能選或切換為 `ADMIN`；`ADMIN` 只能建立 `USER`，不能改任何角色（含自己的）。不能選 `OWNER`（唯一 owner 於建置時建立）。切換為 `ADMIN` 須先關大表（暫定 Q-057） | — | — | Yes / 是 | 「請選擇角色」；`ADMIN` 選或改角色：refused as forbidden (**B-006**) and logged / 以禁止存取拒絕（**B-006**）並記錄；大表未關：「請先關閉大表旗標，再切換為管理員」 `(Provisional, Q-057)` |
| Zone / 施工區域 | `西區` or `南區` only | — | — | Yes / 是 | 「請選擇施工區域」 |
| Big-meter flag / 大表旗標 | On or off / 開或關 | — | — | Yes (default off) / 是（預設關） | 「請確認是否為大表帳戶」 |
| Payment method / 發薪方式 | `TRANSFER` or `CASH` only | — | — | Yes / 是 | 「請選擇發薪方式」；轉帳但無帳號：「請先設定銀行帳號再改為轉帳」 |
| Bank account / 銀行帳號 | Digits, optional `-` / 數字，可含 `-` | Exactly 14 digits after stripping `-` (3-digit branch + 11-digit account) / 去掉 `-` 後須為 14 位數字（3 位分行 + 11 位帳號） | — | Required if `TRANSFER`, else optional / 轉帳必填，否則可空 | 「銀行帳號須為 14 位數字（3 位分行＋11 位帳號）」；金鑰缺失而嘗試修改：「銀行帳號目前無法讀取，無法修改」 |
| Insurance deduction / 勞健保扣除額 | Digits / 數字 | Integer, 0 or ≥ 1. Enrolled minimum 1; not enrolled is 0 / 整數，已投保最小 1，未投保為 0 | 0 | Yes (default 0) / 是（預設 0） | 「勞健保扣除額須為 0 或正整數」；已投保但小於 1：「已投保時，扣除額須至少為 1」 |
| Uninsured deduction rate (zone or personal) / 未投保扣除比例（區域或個人） | Digits and one optional decimal point / 數字與至多一個小數點 | 0–100. Applied to work-item gross only, excluding fixed salary `(Decided in Q-033, 2026-11-11 01:37)` / 0–100。只套用在工項薪資毛額，不含固定薪資 | Up to 2 / 最多 2 位 | Zone rates required; personal override optional / 區域預設必填，個人調整可空（空則用區域預設） | 「未投保扣除比例須為 0 到 100 之間，最多兩位小數」 |
| Tax-exempt / uninsured-exempt flag / 未投保免扣 | On or off / 開或關 | — | — | Yes (default off) / 是（預設關） | 「請確認是否免扣未投保比例」 |
| Fixed salary / 固定薪資 | Digits / 數字 | Integer ≥ 0 | 0 | Yes (default 0) / 是（預設 0） | 「固定薪資須為 0 或正整數」 |
| Manual adjustment of archived-account fixed salary (archive-period payroll) / 封存帳戶封存當期固定薪資的手動調整 | Digits / 數字 | Integer ≥ 0; used when the administrator adjusts the counted fixed salary for the payroll period that includes the archive date `(Decided in Q-040, 2026-11-11 01:48)` / 整數 ≥ 0；管理員調整「封存當期」計入的固定薪資時使用 | 0 | No (optional adjustment) / 否（選擇性調整） | 「固定薪資須為 0 或正整數」 |
| Manually add back later-period fixed salary (while archived) / 封存後各期固定薪資手動加回 | Administrator action: add back that later period's fixed salary / 管理員操作：將該後期的固定薪資加回 | — | — | No (optional; default is not counted) / 否（選擇性；預設不算） | — `(Decided in Q-041, clarified 2026-11-11 01:58)` |
| Pay fixed salary every period / 每期發放 | On or off / 開或關 | — | — | Yes (default off) / 是（預設關） | — |
| Retention target or offset / 保留金目標或調整 | Optional leading `-`, then digits / 可有負號，其餘為數字 | Integer, may be negative / 整數，可為負 | 0 | No when not adjusting / 未調整時不填 | 「保留金調整須為整數（可為負）」 |
| Per-item retention rate / 單項保留金費率 | Digits / 數字 | Integer 0–9999, NTD/只 | 0 | No (empty = use zone global) / 否（空白則用區域全域） | 「保留金費率須為 0 到 9999 的整數（NTD/只）」 |
| Report date / 回報日期 | Calendar date / 日曆日期 | Today, or up to 30 days before today; no future / 今天或往前最多 30 天，不可未來 | — | Yes (default today) / 是（預設今天） | 「回報日期須為今天或往前 30 天內，不可選擇未來日期」 |
| Work-item quantity / 工項數量 | Digits and one optional decimal point / 數字與至多一個小數點 | 0–999.9 inclusive; must be a multiple of 0.1 / 0 至 999.9，須為 0.1 的整數倍 | 1 (step 0.1) | No (blank = 0) / 否（空白視為 0） | 「工項數量須為 0 到 999.9，最小單位 0.1」 |
| Collaborators / 共同作業者 | Selected from the allowed list / 僅能從合格名單選 | 0–6 people, excluding the submitter / 0 至 6 人，不含提交者 | — | No / 否 | 「共同作業者最多 6 人，且須為同一區域、同一類型的啟用員工」 |
| Custom item name / 自訂工項名稱 | Visible text / 可見文字 | 1–100 if used; empty clears the item / 若使用則 1–100 字；清空即移除 | — | No / 否 | 「自訂工項名稱最多 100 個字」 |
| Custom item quantity / 自訂工項數量 | Digits and one optional decimal point / 數字與至多一個小數點 | ≥ 0, multiple of 0.1, up to 999.9 / ≥ 0，0.1 的整數倍，最大 999.9 | 1 (step 0.1) | Required if name is set / 有名稱時必填 | 「自訂工項數量須為 0 到 999.9，最小單位 0.1」 |
| Custom item unit price / 自訂工項單價 | Digits / 數字 | Integer ≥ 0 | 0 | Required if name is set / 有名稱時必填 | 「自訂工項單價須為 0 或正整數」 |
| Material code / 材料編號 | Visible text / 可見文字 | 0–50 | — | No / 否 | 「材料編號最多 50 個字」 |
| Material name / 材料名稱 | Visible text, not only whitespace / 可見文字，不得只含空白 | 1–100 | — | Yes / 是 | 「請輸入材料名稱」；超長：「材料名稱最多 100 個字」 |
| Material specification / 規格 | Visible text / 可見文字 | 0–200 | — | No / 否 | 「規格最多 200 個字」 |
| Material unit / 單位 | Visible text, not only whitespace / 可見文字，不得只含空白 | 1–20 | — | Yes / 是 | 「請輸入單位」；超長：「單位最多 20 個字」 |
| Material remaining or cumulative quantity / 庫存量或累計使用量 | Digits and one optional decimal point; remaining may be 0 / 數字與至多一個小數點 | ≥ 0 | Up to 3 / 最多 3 位 | Yes when adjusting / 調整時必填 | 「數量須為 0 或正數，最多三位小數」 |
| Material tab / 分頁 | Integer 1–10 / 整數 1–10 | 1–10 | 0 | Yes (default 1) / 是（預設 1） | 「分頁須為 1 到 10」 |
| Material tab name / 分頁名稱 | Visible text / 可見文字 | 0–50; empty hides the tab / 0–50 字；空白則隱藏該分頁 | — | No / 否 | 「分頁名稱最多 50 個字」 |
| Material request quantity / 申請數量 | Digits / 數字 | Integer 1–99 | 0 | Yes / 是 | 「申請數量須為 1 到 99 的整數」；庫存不足或不可申請：「庫存不足，無法申請」或「此材料目前不可申請」 |
| Material request note / 申請備註 | Visible text / 可見文字 | 0–50 (truncated if longer) / 0–50 字（超長截斷） | — | No / 否 | 「備註最多 50 個字」 |
| Inventory import file / 庫存匯入檔 | `.xlsx` or `.csv` / 僅此兩種 | Must include header columns 「材料編號」 and 「實領量」 / 標題列須含「材料編號」與「實領量」 | — | Yes when importing / 匯入時必填 | 「請上傳 xlsx 或 csv 檔，且標題列須含「材料編號」與「實領量」」 |
| Ledger date / 記帳日期 | Calendar date / 日曆日期 | A valid date / 有效日期 | — | Yes / 是 | 「請輸入記帳日期」 |
| Ledger type / 流水帳類型 | `INCOME` or `EXPENSE` only | — | — | Yes / 是 | 「請選擇收入或支出」 |
| Ledger amount / 流水帳金額 | Digits / 數字 | Positive integer ≥ 1 / 正整數，至少 1 | 0 | Yes / 是 | 「金額必須為正整數」 |
| Ledger description / 摘要 | Visible text, not only whitespace / 可見文字，不得只含空白 | 1–200 | — | Yes / 是 | 「請輸入摘要」；超長：「摘要最多 200 個字」 |
| Ledger category / 分類 | One of：材料費、人工費、雜支、設備費、運費、其他, or empty / 上列之一或空白 | — | — | No / 否 | 「請選擇有效的分類」 |
| Ledger note / 流水帳備註 | Visible text / 可見文字 | 0–100 | — | No / 否 | 「備註最多 100 個字」 |
| Ledger payer / 支出者 | Empty (company) or an existing account; only for `EXPENSE` / 空白（公司）或既有帳戶；僅支出 | — | — | No / 否 | 「僅支出可指定支出者」 |
| Ledger receipt / 憑證 | PDF, JPEG, PNG, or WebP / 僅這些格式 | Maximum 10 MB / 最大 10 MB | — | No / 否 | 「憑證格式不支援（僅接受 PDF / JPG / PNG / WebP）」；「憑證檔案超過 10MB 上限」 |
| Delete or void a ledger entry / 刪除或作廢流水帳紀錄 `(Decided in Q-051, 2026-11-11 03:52)` | Administrator action / 管理員操作 | — | — | No (action) / 否（操作） | Deleting an entry that has or had an evidence file: 「此紀錄有證據檔案，不能刪除，只能作廢」; editing, settling, or voiding again a voided entry: 「此紀錄已作廢」 `(Provisional, Q-061)` |
| Unit price / 工項單價 | Digits and one optional decimal point / 數字與至多一個小數點 | ≥ 0 | Up to 2 / 最多 2 位 | Each item in a saved set must have a value; incomplete sets block payroll / 儲存的那一套每個工項都須有值；不完整時計薪中止 | 「單價須為 0 或正數，最多兩位小數」；計薪時：「單價尚未設定完整，無法計算薪資，請先補齊單價」 |
| Global retention rate / 全域保留金費率 | Digits / 數字 | Integer 0–9999, NTD/只 | 0 | Yes / 是 | 「全域保留金費率須為 0 到 9999 的整數（NTD/只）」 |
| Retention annual cap / 保留金年度上限 `(Corrected 2026-11-11 03:42; Decided in Q-050, 2026-11-11 03:52)` | Digits / 數字 | Integer ≥ 0, one company-wide value; default 60,000; no upper limit `(Provisional, Q-060)` / 0 以上整數，全公司單一值；預設 60,000；無上限值（暫定 Q-060） | 0 | Yes (default 60,000) / 是（預設 60,000） | 「保留金年度上限須為 0 以上的整數」 `(Provisional, Q-060)` |
| Sign-in account / 登入帳戶 | Must be chosen from the list of the selected type / 須從已選類型的名單中選擇 | — | — | Yes / 是 | 「請選擇帳戶」 |
| Sign-in password / 登入口令 | Any characters / 任意字元 | — | — | Yes / 是 | Wrong password, or unknown/archived account: 「密碼錯誤，請重試」. Locked: 「密碼錯誤次數過多，請在 15 分鐘後再試」 `(Decided in Q-032/Q-035/Q-036, 2026-11-11 01:37)` / 密碼錯誤、帳戶不存在或已封存：「密碼錯誤，請重試」。已鎖定：「密碼錯誤次數過多，請在 15 分鐘後再試」 |
| Fourth own report on the same date / 同一日第 4 筆自己的回報 | — | At most 3 existing own submissions per date; a deleted pending or rejected report no longer counts `(Decided in Q-039, 2026-11-11 01:43)` / 同一回報日期最多 3 筆仍存在的自己送出回報；已刪的待審或已駁回回報不算 | — | — | 「每日最多只能送出 3 筆回報」 |
| Payroll start and end dates / 計薪起訖日期 | Calendar dates / 日曆日期 | Start ≤ end; both required to calculate / 起始須≤結束；計算時皆必填 | — | Yes to calculate / 計算時必填 | 「請輸入正確的開始與結束日期」；「結束日期不可早於開始日期」 |
| 10th-payday flag / 10 號發薪旗標 | On or off / 開或關 | — | — | No (default off) / 否（預設關） | — |
| Filter dates, zone, account, action type / 篩選用日期、區域、帳戶、操作類型 | Valid date or an allowed list value, or empty / 有效日期或名單中的值，或空白 | — | — | No / 否 | 「請輸入有效的篩選條件」 |
| Archive type and date / 歸檔類型與日期 | Type `DAILY` or `MONTHLY`; a valid date / 類型為日報或月報；有效日期 | — | — | Yes when generating manually / 手動生成時必填 | 「請選擇報表類型與日期」 |
| Year-end settlement year / 年度結算年份 | A calendar year / 日曆年 | A year that the administrator is allowed to close / 管理員要結算的年份 | 0 | Yes when running settlement / 執行結算時必填 | 「請選擇要結算的年度」. The action records each person's refunded retention as an amount only; it does not create an in-system payment `(Decided in Q-037, 2026-11-11 01:43)` / 此操作只記錄每人發還保留金的金額，不在系統內付款 |
| Archive or restore an account / 封存或復原帳戶 | Administrator action on `USER` accounts; owner action on `ADMIN` accounts / 管理員對 `USER`、owner 對 `ADMIN` 的操作 | — | — | No (action) / 否（操作） | Cannot archive oneself: 「不能封存自己目前登入的帳戶」 `(Decided in Q-032, 2026-11-11 01:37; Q-047, 2026-11-11 03:52)`. Owner account: 「owner 帳戶不能封存」 `(Decided in Q-046, 2026-11-11 03:52)`. An `ADMIN` archiving, restoring, or modifying an `ADMIN` account: refused as forbidden (**B-006**) and logged / `ADMIN` 封存、復原或修改 `ADMIN`：以禁止存取拒絕並記錄 |
| Add, archive, restore, or modify an `ADMIN` account / 新增、封存、復原或修改 `ADMIN` 帳戶 `(Decided in Q-042, 2026-11-11 02:56; Q-043/Q-044, 2026-11-11 03:52)` | Owner action only, on the Admin management page; only the account's existing fields (no per-admin permission settings in v0) / 僅 owner，於管理員管理頁；只改帳戶既有欄位（v0 無個別權限設定） | — | — | No (action) / 否（操作） | When an `ADMIN` tries it: refused as forbidden (**B-006**) and logged / `ADMIN` 嘗試時：以禁止存取拒絕（**B-006**）並記錄 |

---

## 4. Work-item catalogues and default prices / 工項清單與預設單價

Identifiers in the first column are stable work-item codes. Display names are what people see. Prices are defaults an administrator may change, in NTD per unit.

第一欄為穩定工項代碼，顯示名稱為畫面上的名稱。單價為預設值（管理員可改），單位 NTD/只。

**B-038** West ordinary items (32) / 西區一般工項（32 項）

| Code | Display name / 顯示名稱 | Default price / 預設單價 |
|---|---|---|
| `direct_13` | 直總-13 | 120 |
| `direct_20` | 直總-20 | 120 |
| `direct_25` | 直總-25 | 120 |
| `direct_40` | 直總-40 | 170 |
| `indirect_13` | 間接-13 | 75 |
| `indirect_20` | 間接-20 | 75 |
| `indirect_25` | 間接-25 | 75 |
| `indirect_40` | 間接-40 | 125 |
| `original_change` | 原改 | 45 |
| `dsv_13` | 直總-換由令(含表)-13 | 200 |
| `dsv_20` | 直總-換由令(含表)-20 | 200 |
| `dsv_25` | 直總-換由令(含表)-25 | 200 |
| `isv_13` | 間接-換由令(含表)-13 | 150 |
| `isv_20` | 間接-換由令(含表)-20 | 150 |
| `isv_25` | 間接-換由令(含表)-25 | 150 |
| `sw_13` | 13換開關(含表) | 320 |
| `sw_20` | 20換開關(含表) | 320 |
| `sw_25` | 25換開關(含表) | 320 |
| `switch_valve_40` | 40換開關(含表) | 450 |
| `dfix_13` | 直總-13固拆(含表) | 340 |
| `dfix_20` | 直總-20固拆(含表) | 340 |
| `dfix_25` | 直總-25固拆(含表) | 340 |
| `direct_fixed_40` | 直總-40固拆(含表) | 500 |
| `ifix_13` | 間接-13固拆(含表) | 230 |
| `ifix_20` | 間接-20固拆(含表) | 230 |
| `ifix_25` | 間接-25固拆(含表) | 230 |
| `indirect_fixed_40` | 間接-40固拆(含表) | 450 |
| `pipe_repair` | 管修(提高) | 150 |
| `mobilization` | 動員 | 1200 |
| `recheck` | 複查案/9年表 | 60 |
| `soil_clearing` | 清積土 | 100 |
| `app_item` | APP | 10 |

The old user manual omitted `APP` and counted 31 west items. The live item list is 32 including `APP`. / 舊使用說明漏列 `APP`、寫成 31 項；實際清單含 `APP` 共 32 項。

**B-039** South ordinary items (37) / 南區一般工項（37 項）

Shared with the west where the code is the same; south-only codes start with `s_`. Defaults:

與西區共用代碼者名稱相近；南區專屬代碼以 `s_` 開頭。預設單價：

| Code | Display name / 顯示名稱 | Default price / 預設單價 |
|---|---|---|
| `direct_13` | 直總-13 | 140 |
| `direct_20` | 直總-20 | 140 |
| `direct_25` | 直總-25 | 140 |
| `direct_40` | 直總-40 | 190 |
| `indirect_13` | 間接-13 | 90 |
| `indirect_20` | 間接-20 | 90 |
| `indirect_25` | 間接-25 | 90 |
| `indirect_40` | 間接-40 | 140 |
| `s_orig_13` | 原改-13 | 40 |
| `s_orig_20` | 原改-20 | 40 |
| `s_orig_25` | 原改-25 | 40 |
| `s_orig_40` | 原改-40 | 50 |
| `s_dsv_13` | 直總-換由令(含表)-13 | 220 |
| `s_dsv_20` | 直總-換由令(含表)-20 | 220 |
| `s_dsv_25` | 直總-換由令(含表)-25 | 220 |
| `s_dsv_40` | 直總-換由令(含表)-40 | 220 |
| `s_isv_13` | 間接-換由令(含表)-13 | 170 |
| `s_isv_20` | 間接-換由令(含表)-20 | 170 |
| `s_isv_25` | 間接-換由令(含表)-25 | 170 |
| `s_isv_40` | 間接-換由令(含表)-40 | 170 |
| `s_sw_13` | 13換開關(含表) | 310 |
| `s_sw_20` | 20換開關(含表) | 310 |
| `s_sw_25` | 25換開關(含表) | 310 |
| `switch_valve_40` | 40換開關(含表) | 440 |
| `s_dfix_13` | 直總-13固拆(含表) | 330 |
| `s_dfix_20` | 直總-20固拆(含表) | 330 |
| `s_dfix_25` | 直總-25固拆(含表) | 330 |
| `direct_fixed_40` | 直總-40固拆(含表) | 490 |
| `s_ifix_13` | 間接-13固拆(含表) | 270 |
| `s_ifix_20` | 間接-20固拆(含表) | 270 |
| `s_ifix_25` | 間接-25固拆(含表) | 270 |
| `indirect_fixed_40` | 間接-40固拆(含表) | 440 |
| `pipe_repair` | 管修(提高) | 150 |
| `mobilization` | 動員 | 1200 |
| `recheck` | 複查案/9年表 | 70 |
| `soil_clearing` | 清積土 | 130 |
| `app_item` | APP | 10 |

The old user manual omitted `APP` and counted 36 south items. The live list is 37. / 舊使用說明漏列 `APP`、寫成 36 項；實際為 37 項。

**B-040** Big-meter items / 大表工項

The form and payroll item list contain these 25 items:

表單與計薪工項清單為以下 25 項：

| Code | Display name / 顯示名稱 | Default price / 預設單價 |
|---|---|---|
| `bm_50_down` | 50mm下 | 1100 |
| `bm_75_down` | 75mm下 | 1800 |
| `bm_100_down` | 100mm下 | 2000 |
| `bm_150_down` | 150mm下 | 2400 |
| `bm_200_down` | 200mm下 | 2800 |
| `bm_250_down` | 250mm下 | 3300 |
| `bm_300_down` | 300mm下 | 3900 |
| `bm_50_up` | 50mm上 | 1100 |
| `bm_75_up` | 75mm上 | 1700 |
| `bm_100_up` | 100mm上 | 1900 |
| `bm_150_up` | 150mm上 | 2100 |
| `bm_200_up` | 200mm上 | 2500 |
| `bm_250_up` | 250mm上 | 2700 |
| `bm_rm_screw50` | 拆表/復水-螺紋50mm | 800 |
| `bm_rm_noscrew50` | 拆表/復水-非螺紋50mm | 1100 |
| `bm_rm_75` | 拆表/復水-75mm | 1600 |
| `bm_rm_100` | 拆表/復水-100mm | 1900 |
| `bm_rm_150` | 拆表/復水-150mm | 2100 |
| `bm_rm_200` | 拆表/復水-200mm | 3000 |
| `bm_hole` | 孔片 | 500 |
| `bm_clean_big` | 清箱大 | 700 |
| `bm_truck` | 小貨車 | 700 |
| `bm_mobilization` | 動員 | 1200 |
| `bm_recheck` | 復查 | 70 |
| `bm_app` | APP | 10 |

`bm_40_fen` is **Removed** `(Decided in Q-007, 2026-11-11 01:21)`. It must not appear on the big-meter form, in unit prices, or in payroll.

`bm_40_fen` 為 **Removed** `(Decided in Q-007, 2026-11-11 01:21)`。不得出現在大表表單、單價設定或薪資計算中。

**B-041** West retention items (8) / 西區保留金工項（8 項）

- **EN.** Retention applies only to: `direct_13`, `direct_20`, `direct_25`, `direct_40`, `indirect_13`, `indirect_20`, `indirect_25`, `indirect_40`. Change-of-order, switch, fixed-removal, pipe repair, mobilization, recheck, soil clearing, original change, and `APP` do **not** attract west retention.
- **ZH.** 僅下列 8 項扣保留金：`direct_13/20/25/40`、`indirect_13/20/25/40`。換由令、換開關、固拆、管修、動員、複查、清積土、原改、`APP` **不扣**。

**B-042** South retention items (28) / 南區保留金工項（28 項）

- **EN.** The 8 items above, plus south change-of-order, switch, and fixed-removal items: `s_dsv_*`, `s_isv_*`, `s_sw_*`, `switch_valve_40`, `s_dfix_*`, `direct_fixed_40`, `s_ifix_*`, `indirect_fixed_40`. South original-change (`s_orig_*`), pipe repair, mobilization, recheck, soil clearing, and `APP` do not attract retention.
- **ZH.** 上述 8 項，加上南區換由令、換開關、固拆：`s_dsv_*`、`s_isv_*`、`s_sw_*`、`switch_valve_40`、`s_dfix_*`、`direct_fixed_40`、`s_ifix_*`、`indirect_fixed_40`。南區原改（`s_orig_*`）、管修、動員、複查、清積土、`APP` 不扣。

**B-043** Who is subject to retention / 誰要扣保留金

- **EN.** Ordinary `USER` accounts follow their zone's item list and rates. Big-meter `USER` accounts: no retention (period and year-to-date retention = 0). `ADMIN` accounts: no retention, even if they appear in payroll because of fixed salary.
- **ZH.** 一般 `USER` 依所屬區域的工項與費率。大表 `USER` 不扣保留金（本期與年度皆 0）。`ADMIN` 即使因固定薪資出現在薪資結果中，也不扣保留金。

---

## 5. Business rules and calculations / 業務規則與計算

**B-044** Collaboration split / 共同作業只數分配 `(Decided in Q-003/Q-004, 2026-11-11 01:21)`

- **EN.** Work at the **0.1 只** layer. Convert each quantity `Q` 只 into an integer number of 0.1-units `U = Q × 10`. Let `N` be the number of people (submitter + collaborators; 1 if none). Let `base = floor(U / N)` and `rem = U − base × N` (the remainder, `0 ≤ rem < N`). Give `base + 1` units to the first `rem` people, and `base` units to the others. **Order:** the submitter first, then collaborators in the saved roster order. Convert back to 只 by dividing by 10. The shares **must sum exactly to the original `Q`**. This is a ceil/floor (largest-remainder) split at the 0.1 layer. Custom-item quantity uses the same rule. Do **not** round money during this split. Each person's official share is **saved when the report is approved** (**B-091**). Until approval, any on-screen preview of the split is provisional and uses this same formula.
- **ZH.** 在 **0.1 只** 層計算。將數量 `Q` 只換算成 0.1 單位的整數 `U = Q × 10`。`N` 為人數（提交者 + 協作者；無共作則為 1）。`base = floor(U / N)`，`rem = U − base × N`（餘數，`0 ≤ rem < N`）。前 `rem` 人各得 `base + 1` 個單位，其餘人各得 `base` 個單位。**順序：** 先提交者，再依已存共同作業名單順序。再除以 10 換回「只」。各人份額**加總必須恰好等於原來的 `Q`**。此即 0.1 層的 ceil/floor（最大餘數）分配。自訂工項數量用同一規則。此步驟**不**四捨五入金額。每人的正式份額在**回報核准時保存**（**B-091**）。核准前畫面上的分配預覽為暫定，但公式相同。

Examples, labelled as examples / 範例（標明為範例）:

1. **Example / 範例 A.** `Q = 7.0` 只, `N = 3` (submitter A, then collaborators B, C). `U = 70`. `70 = 23 × 3 + 1`, so `rem = 1`. A gets 24 units = **2.4** 只; B gets **2.3**; C gets **2.3**. Sum = 7.0.
2. **Example / 範例 B.** `Q = 1.0` 只, `N = 3` (A, then B, C). `U = 10`. `10 = 3 × 3 + 1`. A gets **0.4**; B gets **0.3**; C gets **0.3**. Sum = 1.0.
3. **Example / 範例 C.** `Q = 6.0` 只, `N = 2`. `U = 60`. Exact split: each gets **3.0**. Remainder 0.
4. **Example / 範例 D.** `Q = 7.0` 只, `N = 3`, roster order A (submitter), C, B (C listed before B). Remainder 1 goes to A only. A **2.4**, C **2.3**, B **2.3**. The former “3 + 2 + 2 at whole-只” rule is **not** used.

**B-091** Persist each person's share at approval / 核准時保存每人分配 `(Decided in Q-003/Q-004, 2026-11-11 01:21)`

- **EN.** When an administrator confirms a report, the system computes **B-044** for every work item (and the custom item, if any) and **stores each person's share**. Later payroll, personal trial, summaries, and exports that need confirmed quantities must use these stored shares, not re-split from the current collaborator list. If an administrator edits a confirmed report, confirmation is cleared (**B-064**); a later re-approval computes and stores the shares again.
- **ZH.** 管理員核准回報時，系統依 **B-044** 計算每個工項（及自訂工項，若有）並**保存每人份額**。之後計薪、個人試算、統計與匯出凡需已核准只數，必須使用這份已保存的分配，不得依當時共同作業名單重算。若管理員修改已核准回報，確認會被取消（**B-064**）；再次核准時重新計算並保存。

**B-045** Work-item gross / 工項薪資毛額

- **EN.** For each person in a payroll (or trial) period:

  `gross = Σ (that person's stored or preview share of an item × unit price of that item for that person's price set) + custom-item money`

  The price set is west, south, or big-meter according to the person's zone and big-meter flag. Only confirmed reports in the inclusive date range count. For confirmed reports, use **B-091** stored shares. `ADMIN` accounts, and the owner account `(Provisional, Q-054)`, are included if they have confirmed reports or a positive fixed salary (they cannot file reports through the report page). For an **archived** account, the following still enter payroll, and the name is marked Archived / 「封存」: (1) reports **already confirmed before the account was archived** that fall in the period `(Decided in Q-038, 2026-11-11 01:43)`; (2) reports **submitted before archiving and approved after archiving** whose report date falls in the period `(Decided in Q-040, 2026-11-11 01:48)`. For the payroll period whose date range includes the archive date, that account's fixed salary is **still counted** under the usual rules (even if there are no confirmed reports); the administrator may **manually adjust** the counted amount `(Decided in Q-040, 2026-11-11 01:48)`. **While the account remains archived, later periods' fixed salary is not counted by default, but an administrator can manually add it back; once added back, that period's fixed salary is counted** `(Decided in Q-041, clarified 2026-11-11 01:58)`. Money is not rounded in this step; see **B-049**.
- **ZH.** 計薪（或試算）期間內，每人：

  `毛額 = Σ（該人該工項的已保存或預覽份額 × 該人適用單價）+ 自訂工項金額`

  單價套用依該人區域與大表旗標為西區、南區或大表。只計日期含首尾的**已確認**回報。已確認回報使用 **B-091** 已保存份額。`ADMIN`（以及 owner 帳戶 `(Provisional, Q-054)`）若有已確認回報或正的固定薪資也會納入（但不能從回報頁自行送出回報）。**封存**帳戶下列項目仍納入薪資，名稱旁標示「封存」：（1）該期內、**封存前已確認**的回報 `(Decided in Q-038, 2026-11-11 01:43)`；（2）**封存前送出、封存後才核准**、且回報日期落在該期的回報 `(Decided in Q-040, 2026-11-11 01:48)`。計薪起訖含封存日的「封存當期」，固定薪資依平常規則**照算**（即使沒有已確認回報）；管理員可**手動調整**計入金額 `(Decided in Q-040, 2026-11-11 01:48)`。**帳戶持續封存時，封存後各期固定薪資預設不算，但管理員可以手動加回；加回後，該期固定薪資即計入** `(Decided in Q-041, clarified 2026-11-11 01:58)`。此步驟不四捨五入金額；見 **B-049**。

**B-046** Year-to-date retention before the period / 本期開始前的年度保留金（ytd_before） `(Decided in Q-012/Q-023, 2026-11-11 01:21)`

- **EN.** Retention is scoped to a **calendar year** in Taiwan time. Take confirmed reports that credit this person, with report date from 1 January 00:00 of the payroll period's calendar year up to (not including) the period start date. Use stored shares (**B-091**). For each retention item, multiply the share by that person's rate for the item (personal override or zone global, NTD/只). Sum them, add **that year's** retention offset, then clamp to `[0, annual cap]` (**B-035**; default 60,000) `(Corrected 2026-11-11 03:42)`.
- **ZH.** 保留金以台灣時間的**日曆年**為範圍。取會計入該人的已確認回報，日期從計薪期間所屬年 1 月 1 日 00:00 起到本期起始日前。使用已保存份額（**B-091**）。各保留金工項：份額 × 該人該項費率（個人覆蓋或區域全域，NTD/只）。加總後加上**該年**的保留金調整，再夾在 `[0, 年度上限]`（**B-035**；預設 60,000）`(Corrected 2026-11-11 03:42)`。

**B-047** Period retention / 本期保留金

- **EN.** `period_raw = Σ (period shares of retention items × that item's rate)`. Then:

  `period_retention = max(0, min(period_raw, annual_cap - ytd_before))`, where `annual_cap` is **B-035** (default 60,000) `(Corrected 2026-11-11 03:42)`

  Big-meter, `ADMIN`, and the owner `(Provisional, Q-054)`: 0. Do not round money in this step.

- **ZH.** `本期原始 = Σ（本期保留金工項份額 × 該項費率）`，然後：

  `本期保留金 = max(0, min(本期原始, 年度上限 - ytd_before))`，年度上限見 **B-035**（預設 60,000）`(Corrected 2026-11-11 03:42)`

  大表、`ADMIN` 與 owner `(Provisional, Q-054)` 為 0。此步驟不四捨五入金額。

**B-048** Displayed year-to-date retention and New Year reset / 畫面年度累計與跨年歸零 `(Decided in Q-012/Q-023, 2026-11-11 01:21)`

- **EN.** The amount shown as this year's retention uses confirmed reports from 1 January 00:00 of the **current** calendar year (Taiwan time) through now, plus **this year's** offset, clamped to `[0, annual cap]` (**B-035**; default 60,000). At **1 January 00:00 Taiwan time**, the new year's year-to-date starts at 0 automatically. Prior-year totals and that year's offsets remain as history and do not apply to the new year. See also **B-090**.
- **ZH.** 畫面顯示的「今年度累計保留金」，以台灣時間**今年** 1 月 1 日 00:00 至今的已確認回報，加上**今年**的調整，夾在 `[0, 年度上限]`（**B-035**；預設 60,000）。於 **1 月 1 日 00:00（台灣時間）**，新一年的年度累計自動從 0 起算。往年合計與該年調整仍作歷史保留，不帶入新年。另見 **B-090**。

**B-090** Year-end settlement / 年度結算 `(Decided in Q-012/Q-023, 2026-11-11 01:21; Q-031, 2026-11-11 01:37; Q-037, 2026-11-11 01:43)`

- **EN.** An administrator has a 「年度結算」 action that formally **settles** (closes) a chosen calendar year **for all accounts at once**, and **records the refunded (released) retention as an amount only** for each person. The action writes an audit record (`RETENTION_YEAR_END`) that includes each person's closed-year retention figures and the recorded refunded amount. The administrator **transfers that amount outside the system**. The refunded retention **does not go through in-system payroll or any other in-system payment**. Automatic reset at 1 January 00:00 still happens even if this action has not been run. Administrators may still adjust an individual's retention for a year (**B-019**).
- **ZH.** 管理員有「年度結算」操作，可對所選日曆年**一次結清所有人**，並**只記錄每人發還（釋出）保留金的金額**。變動紀錄（`RETENTION_YEAR_END`）須含每人該年結算的保留金數字與已記錄的發還金額。該金額由**管理員在系統外轉帳**。發還保留金**不走系統內計薪，也不走任何其他系統內付款**。即使尚未執行此操作，1 月 1 日 00:00 仍會自動歸零起算新年。管理員仍可調整個別帳戶某一年的保留金（**B-019**）。

**B-049** Net, final pay, and when money is rounded / 淨薪資、最終薪資與金額進位 `(Decided in Q-003/Q-004, 2026-11-11 01:21)`

- **EN.**

  `net = gross - period_retention`  
  `final = net + fixed_salary_applied - insurance_applied - uninsured_deduction`

  `fixed_salary_applied` is the account's fixed salary if the run is marked as a 10th-of-month payday **or** “pay every period” is on; otherwise 0. `insurance_applied` is the account's insurance deduction if the run is marked as a 10th-of-month payday and the deduction is positive; otherwise 0. The uninsured deduction does **not** depend on the 10th-of-month flag (**B-050**). **Monetary amounts are rounded to whole NTD (half-up) only at payroll**, not when splitting quantities. The payroll result that is displayed, exported, and paid uses whole NTD.

- **ZH.**

  `淨薪資 = 毛額 - 本期保留金`  
  `最終薪資 = 淨薪資 + 計入的固定薪資 - 計入的勞健保 - 未投保扣除`

  固定薪資：本次標為 10 號發薪，或該帳戶「每期發放」開啟時計入，否則為 0。勞健保：本次標為 10 號發薪且扣除額為正時計入，否則為 0。未投保扣除**不**依 10 號旗標（**B-050**）。**金額只在計薪時四捨五入到整數元**，分配只數時不進位。畫面、匯出與實付的計薪結果使用整數元。

**B-050** Uninsured deduction / 未投保扣除 `(Decided in Q-020/Q-021, 2026-11-11 01:21; Q-033, 2026-11-11 01:37)`

- **EN.** If the person is enrolled (insurance deduction > 0) or exempt, uninsured deduction = 0. Otherwise the percentage is the personal override if set, else the zone default (**B-016**, **B-092**). The amount is that percentage applied to **work-item gross only, excluding fixed salary**, then rounded to whole NTD at payroll.
- **ZH.** 已投保（勞健保扣除額 > 0）或免扣者，未投保扣除 = 0。否則比例為個人調整（若有），否則為區域預設（**B-016**、**B-092**）。以此比例乘上**工項薪資毛額（不含固定薪資）**，於計薪時四捨五入到整數元。

**B-092** Per-account uninsured rate override / 帳戶未投保比例調整 `(Decided in Q-021, 2026-11-11 01:21)`

- **EN.** An administrator may set a personal uninsured deduction percentage on an account. If unset, the zone default is used.
- **ZH.** 管理員可為單一帳戶設定未投保扣除比例。未設定時使用區域預設。

**B-051** Rows hidden in payroll results / 薪資結果不顯示的帳戶

- **EN.** After calculation and rounding, drop an account if `gross == 0` **and** `final == 0`. An account with no reports but a positive fixed salary that is applied still appears.
- **ZH.** 計算並進位後，若 `毛額 == 0` **且** `最終薪資 == 0` 則不顯示。本期無回報但有計入正的固定薪資者仍顯示。

**B-052** Worked payroll examples (labelled as examples) / 計薪範例（標明為範例）

Assume a west ordinary `USER`, default prices, global retention 20 NTD/只, uninsured rate 3% applied to work-item gross only (excluding fixed salary) `(Decided in Q-033, 2026-11-11 01:37)`, no collaborators, all reports confirmed, `ytd_before = 0`, offset = 0, and rounding to whole NTD at payroll. / 假設西區一般 `USER`、預設單價、全域保留金 20 NTD/只、未投保 3% 且只以工項毛額為基數（不含固定薪資）`(Decided in Q-033, 2026-11-11 01:37)`、無共作、皆已確認、`ytd_before = 0`、調整 = 0，金額於計薪時進到整數元。

1. **Example / 範例 A.** Period quantities: `direct_13` = 10. Not a 10th payday, not enrolled, not exempt, fixed salary = 0.  
   Gross = 10 × 120 = 1,200. Period retention = 10 × 20 = 200. Net = 1,000. Uninsured deduction = round(1,200 × 3%) = 36. Insurance = 0. Final = 1,000 − 36 = 964 NTD.

2. **Example / 範例 B.** Same gross 1,200, but enrolled with insurance 834, and the run **is** a 10th payday, fixed salary = 5,000.  
   Retention = 200. Net = 1,000. Uninsured deduction = 0 (enrolled). Final = 1,000 + 5,000 − 834 = 5,166 NTD.

3. **Example / 範例 C.** Cap: `ytd_before = 55,000`, period raw retention = 8,000. Period retention = 5,000 (room left to the cap).

4. **Example / 範例 D.** Rounding: if the uninsured base × rate is 300.03, the deduction at payroll is 300 NTD.

5. **Example / 範例 E.** 25th payday, “pay every period” off, fixed salary 5,000, insurance 834, not exempt, gross 10,000, retention 2,000.  
   Fixed = 0, insurance = 0, uninsured deduction = 300. Final = 8,000 − 300 = 7,700 NTD. (The uninsured deduction still applies. / 未投保扣除仍會扣。)

6. **Example / 範例 F (collaboration + payroll).** 3 people, `direct_13` = 7.0, west default 120, confirmed, stored shares 2.4 / 2.3 / 2.3. Submitter gross from this item = 2.4 × 120 = 288 (not rounded until payroll). Each collaborator 2.3 × 120 = 276. Sum of gross from this item = 7.0 × 120 = 840.

**B-053** Cash denomination breakdown / 現金面額

- **EN.** For payroll, sum cash (`CASH`) final amounts that are > 0, and also show a combined bill/coin count using the greedy set 1000, 500, 100, 50, 10, 5, 1 NTD, after each person's final salary is already a whole NTD.
- **ZH.** 薪資結果加總發薪方式為現金且最終薪資 > 0 的金額，並用 1000、500、100、50、10、5、1 元面額以最少張/枚數拆開（每人最終薪資此時已是整數元）。

**B-054** Inventory import comparison (A = system, B = uploaded file) / 庫存匯入比對（A = 本系統，B = 上傳檔）

- **EN.** The file must be `.xlsx` or `.csv`. The first row is a header and must include the columns 「材料編號」 and 「實領量」. Match rows by material code.

  Step 1: `x = B.received - A.received` (new inbound quantity).

  Step 2: expected A after applying a non-negative `x`:  
  `A.received_new = A.received + x`  
  `A.remaining_new = A.remaining + x`  
  (`A.cumulative` unchanged.)

  Hold the item in the quarantine area if any of these is true: (1) `x < 0` (B received went backwards); (2) A itself violates the invariant; (3) B's three figures do not match the expected A-after-update figures. Otherwise, if `x ≥ 0` and A is consistent and B matches the expected figures, apply `received += x`, `remaining += x`.

  The quarantine note must show both sides' figures, `x`, the expected new A figures, and a likely-fault label: `A` if A is internally inconsistent, `B` if A is consistent but B does not match, otherwise `?`.

- **ZH.** 檔案須為 `.xlsx` 或 `.csv`。第一列為標題，必須含「材料編號」與「實領量」。以材料編號對應。步驟與進暫存條件同上。暫存說明須列出雙方數字、`x`、A 更新後預期值，以及可能出錯方：`A`、`B` 或 `?`。

**B-055** Resolving quarantine / 暫存區解決

- **EN.** For each selected item the administrator chooses “trust A” or “trust B”. Default pre-selection: trust B if the likely-fault label is `A`; otherwise trust A. There are shortcuts to set all rows to trust A or trust B. Trust B writes B's three figures (they are assumed to satisfy the invariant). Trust A keeps A's cumulative usage and, if `x > 0`, writes the expected new received and remaining. Then the item leaves quarantine and the note is cleared.
- **ZH.** 管理員對勾選項目選擇「信任A」或「信任B」。預選：可能出錯方為 `A` 時預選信任B，其餘預選信任A。可一次將全部列設為信任A或信任B。信任B寫入 B 的三個數字（假定符合不變式）。信任A保留 A 的累計使用量，且若 `x > 0` 則寫入預期的新實領量與庫存量。然後離開暫存區並清除說明。

**B-056** Approving a material request / 核准材料申請 `(Decided in Q-008/Q-009/Q-010, 2026-11-11 01:21)`

- **EN.** Only a `PENDING` request may be approved or rejected. This is the same for a **single** request and for a **batch**. A second attempt on a request that is no longer `PENDING` is refused and must be covered by a test (no double stock deduction). On approve, if remaining quantity is **less than** the requested amount, the approval is **refused** and the administrator sees an error (「庫存不足，無法核准」 or equivalent). Inventory is not changed. If stock is sufficient: remaining decreases by the requested amount, cumulative usage increases by the same amount, received quantity stays the same (invariant). The server must enforce all of these checks. Rejecting a request does not change inventory.
- **ZH.** 只有 `PENDING` 的申請可以被核准或駁回。**單筆與批次規則相同**。對已非 `PENDING` 的申請再審一次必須拒絕，且須有測試覆蓋（不得重複扣庫存）。核准時若庫存量**小於**申請量，**必須拒絕**並顯示錯誤（如「庫存不足，無法核准」），庫存不變。庫存足夠時：庫存量減少申請量，累計使用量增加同量，實領量不變（維持不變式）。以上檢查伺服端都必須執行。駁回不改庫存。

**B-057** Stock colour hints and request checks / 庫存顏色與申請檢查 `(Decided in Q-009, 2026-11-11 01:21)`

- **EN.** Remaining > 5: green (sufficient). 1–5: yellow (low). ≤ 0: red (empty). The request button on the employee page is disabled when remaining is 0, when the item is hidden, or when it is in quarantine. The **server also refuses** a request in those cases, with a Chinese error from §3.7.
- **ZH.** 庫存 > 5：綠（充足）。1–5：黃（偏低）。≤ 0：紅（為零）。員工頁在庫存為 0、材料已隱藏、或位於暫存區時停用申請。**伺服端也必須拒絕**這些申請，並回傳 §3.7 的中文錯誤。

**B-058** Quantity display / 數量顯示

- **EN.** Work-item quantities: exact multiples of 0.1; integers show without a decimal (e.g. `3`); non-integers show one decimal (e.g. `3.1`); zero may show as blank in tables. Material quantities drop trailing zeros. Money uses thousands separators; payroll money is whole NTD. Negative money, when shown, appears in red in payroll exports.
- **ZH.** 工項數量為 0.1 的整數倍；整數不顯示小數（如 `3`），有小數顯示一位（如 `3.1`），表格中的 0 可顯示為空白。材料數量去掉多餘的尾隨零。金額用千分位；計薪金額為整數元。薪資匯出中的負數以紅色顯示。

**B-059** 10th vs 25th payday shortcuts / 10 號與 25 號發薪快捷

- **EN.** On the payroll page, “10號發薪” fills start = the 21st of last month, end = the 5th of this month, and checks “this run is a 10th payday”. “25號發薪” fills start = the 6th of this month, end = the 20th, and unchecks that box. The administrator may still type any date range and may override the checkbox. The checkbox label: 「本次為10號發薪（含固定薪資與勞健保）」.
- **ZH.** 薪資頁按「10號發薪」會填上月 21 日至本月 5 日，並勾選「本次為10號發薪」。按「25號發薪」會填本月 6 日至 20 日，並取消勾選。管理員仍可手改日期與勾選。勾選說明為「本次為10號發薪（含固定薪資與勞健保）」。

**B-094** Incomplete unit prices block payroll / 單價不完整則計薪中止 `(Decided in Q-024, 2026-11-11 01:21)`

- **EN.** If any work item that would be needed for the payroll run (in any of the west, south, or big-meter sets that actually appear) has no unit price, payroll does not produce a result. The administrator is told to complete the prices (「單價尚未設定完整，無法計算薪資，請先補齊單價」). There is no silent fallback.
- **ZH.** 若本次計薪會用到的工項（實際出現的西區、南區或大表套別中）有任何一項沒有單價，則不產出計薪結果，並提示管理員補齊單價（「單價尚未設定完整，無法計算薪資，請先補齊單價」）。沒有默默退路。

---

## 6. Features as user stories / 功能使用者故事

Acceptance scenarios use Given / When / Then. Each story is a behaviour, not a screen implementation.

驗收情境以 Given / When / Then 撰寫。故事描述行為，不指定畫面實作細節。

### 6.1 Sign-in and session / 登入與工作階段

**B-060** Sign-in / 登入 `(Decided in Q-017, 2026-11-11 01:21; Q-032, 2026-11-11 01:37)`

- **EN.** As a person with a not-archived account, I can sign in by first choosing a group, then picking my name, then entering my password, so that I reach the landing page for my role.
- **ZH.** 作為未封存帳戶的使用者，我能先選類型、再選名字、再輸入密碼登入，並進入自己角色的落地頁。

Acceptance / 驗收:

1. **Given** I am not signed in, **When** I choose type `admin`, `west`, or `south`, **Then** I see a list of *not-archived* accounts of that type (`ADMIN` accounts and the owner for `admin` `(Provisional, Q-052)`; `USER` in `西區` / `南區` respectively), by display name, and I pick one and enter a password. This picker is kept.
2. **Given** a correct password and a not-archived, not-locked account, **When** I submit, **Then** I am signed in; `ADMIN` and the owner go to confirmation `(Decided in Q-045, 2026-11-11 03:52)`, `USER` to the daily report page.
3. **Given** a wrong password, a missing account, or an archived account, **When** I submit, **Then** I am not signed in and I see 「密碼錯誤，請重試」. Archived accounts are not in the list.
4. **Given** I am already signed in, **When** I open the sign-in page, **Then** I am sent to my landing page.

**B-089** Sign-in lockout / 登入鎖定 `(Decided in Q-017, 2026-11-11 01:21; Q-035/Q-036, 2026-11-11 01:37)`

- **EN.** The incorrect-password count is **per account**. After **5 incorrect passwords** for that account, the account cannot sign in for **15 minutes**. The user sees 「密碼錯誤次數過多，請在 15 分鐘後再試」. The count **resets to zero** when: (1) the person signs in successfully, (2) the 15-minute lock ends, or (3) **15 minutes pass with no further failure**. A correct password before the fifth failure still signs in and resets the count. This lock applies to the owner account too; a lockout writes an `ACCOUNT_LOCKOUT` row with a system actor, while ordinary sign-in and sign-out are not logged `(Provisional, Q-053/Q-058)`. The “10 sign-in attempts per client address per minute” limit is **kept as extra protection** (**B-080**); it is not replaced by this count.
- **ZH.** 密碼錯誤次數**依帳戶**計算。同一帳戶**密碼錯誤 5 次**後，該帳戶在 **15 分鐘內**不能登入。使用者看到「密碼錯誤次數過多，請在 15 分鐘後再試」。次數在以下情況**歸零**：（1）登入成功；（2）15 分鐘鎖定結束；或（3）**15 分鐘內沒有再送出錯誤密碼**。第 5 次失敗前若密碼正確，仍可登入並歸零。此鎖定也適用 owner 帳戶；鎖定時寫一筆系統操作者的 `ACCOUNT_LOCKOUT`，一般登入、登出不記錄 `(Provisional, Q-053/Q-058)`。另保留「同一用戶端位址每分鐘 10 次登入嘗試」作為額外保護（**B-080**）；此限制不被本計數取代。

**B-061** Idle timeout and sign-out / 閒置逾時與登出 `(Decided in Q-011/Q-028, 2026-11-11 01:21)`

- **EN.** As a signed-in user, I am signed out after **30 minutes** without use, and I can also sign out myself. Data already saved is not lost. After timeout I see that I must sign in again. There is **no “remember me”** that extends the session (**Removed**).
- **ZH.** 已登入者若 **30 分鐘**未操作會被登出，也可以自行登出。已儲存的資料不會遺失。逾時後須重新登入。**沒有「記住我」**可延長工作階段（該做法為 **Removed**）。

Acceptance / 驗收:

1. **Given** I am signed in, **When** I choose logout, **Then** I am no longer signed in and I see a signed-out message.
2. **Given** I was signed out for idle time, **When** I try to use a page, **Then** I must sign in again.

### 6.2 Daily reporting / 日報回報

**B-062** Fill and submit a daily report / 填寫並送出日報 `(Decided in Q-001/Q-002, 2026-11-11 01:21)`

- **EN.** As a `USER`, I can enter quantities for my work-item set on today or a date up to 30 days back, optionally name collaborators, and submit a new report. The form is not pre-filled.
- **ZH.** 作為 `USER`，我能為自己的工項組填寫今天或往前 30 天內的數量，可選共同作業者並新增一筆回報。表單不預填。

Acceptance / 驗收:

1. **Given** I am a west ordinary `USER`, **When** I open the report page, **Then** I see the 32 west items in **B-038**, not south-only or big-meter items. The date defaults to today.
2. **Given** I am a south ordinary `USER`, **Then** I see the 37 south items in **B-039**.
3. **Given** I am a big-meter `USER`, **Then** I see the 25 big-meter items in **B-040**, and I do not see `bm_40_fen`.
4. **Given** I already have 3 own submissions on that date that have not been deleted, **When** I submit another, **Then** it is refused with 「每日最多只能送出 3 筆回報」. Reports on which I am only a collaborator do not count. If I have deleted a pending or rejected own report, that slot is free again `(Decided in Q-039, 2026-11-11 01:43)`.
5. **Given** I submit valid quantities under the cap, **When** the save succeeds, **Then** I see a success message and an audit entry `REPORT_CREATE`. If there are collaborators, the description includes the group size.
6. **Given** I name collaborators, **When** the picker loads, **Then** only same-zone, same-big-meter-flag, not-archived `USER` accounts other than me appear, at most 6 can be kept, and I can remove a name I added.
7. **Given** I am an `ADMIN`, **When** I open the report page, **Then** I am sent to the summary page and I cannot submit a daily report this way `(Decided in Q-018, 2026-11-11 01:21)`.

**B-063** View history / 查看歷史

- **EN.** As a signed-in user, I can list reports I am allowed to see, filter them, and export the filtered list to Excel (`.xlsx`).
- **ZH.** 已登入者可以列出權限內的回報、篩選，並將篩選結果匯出為 Excel（`.xlsx`）。

Acceptance / 驗收:

1. **Given** I am a `USER`, **When** I open history, **Then** I see my submitted reports and reports on which I am a collaborator, newest first. Collaborator rows have a distinct highlight and a label like 「共作（提交者名稱 回報）」.
2. **Given** I am an `ADMIN` on ordinary history, **Then** I see all non-big-meter reports, and I can filter by date range, account (including as collaborator), zone, and “has custom item”. Big-meter reports are not on this page.
3. **Given** I apply filters and export, **Then** the spreadsheet contains the filtered rows and the applicable work-item columns (ordinary history: the union of west and south items plus custom item and confirmation; big-meter history: big-meter items). The export does not show a full-page loading overlay.
4. Lists are paginated; ordinary history uses 20 rows per page; big-meter history uses 25.
5. Status appears as 未確認 / 已確認 / 已駁回.

**B-064** Edit or delete a report / 修改或刪除回報 `(Decided in Q-006, 2026-11-11 01:21; Q-030, 2026-11-11 01:37; Q-039, 2026-11-11 01:43)`

Acceptance / 驗收:

1. **Given** I am the submitter and the report is pending, **When** I edit quantities from history and save, **Then** the report is updated, I see a success message, and an audit `REPORT_UPDATE` describes the changes (or “無變更”). This does not create a new report and does not count as an extra submission toward the daily cap.
2. **Given** I am the submitter and the report is pending or rejected, **When** I delete it and confirm, **Then** the report is gone, audit is `REPORT_DELETE`, deletion cannot be undone, and that date's own-submission count toward the daily cap of 3 **decreases**, so I may submit again.
3. **Given** I am the submitter and the report is rejected, **When** I edit and save, **Then** the report is updated, the rejected status is cleared (it becomes pending).
4. **Given** I am a `USER` and the report is confirmed, **When** I open it, **Then** I may only preview it. Edit and delete are unavailable, and a direct attempt is refused.
5. **Given** I am only a collaborator, **When** I view the row, **Then** edit and delete are unavailable (“共同作業回報，無法修改/刪除”).
6. **Given** I am an `ADMIN` and the report is confirmed, **When** I edit and save, **Then** quantities change, confirmation is cleared (`REPORT_UNCONFIRM` plus `REPORT_UPDATE`), stored shares are no longer official, and the report returns to pending `(Decided in Q-025, 2026-11-11 01:21)`.
7. **Given** an `ADMIN` is allowed to delete, **When** they confirm the prompt and delete, **Then** the report is gone and audit is `REPORT_DELETE`. Deletion cannot be undone.

### 6.3 Materials / 材料

**B-065** Employee inventory and requests / 員工查看庫存與申請 `(Decided in Q-009, 2026-11-11 01:21)`

Acceptance / 驗收:

1. **Given** I am a `USER`, **When** I open materials, **Then** I see named tabs and, in the current tab, non-hidden, non-quarantined items with code, name, specification, unit, remaining quantity (coloured per **B-057**), and a request action.
2. **Given** remaining is 0, or the item is hidden or quarantined, **Then** I cannot start a request from the interface, and a direct request is refused by the server.
3. **Given** I request quantity 1–99 with an optional note ≤ 50 characters for a visible item with enough remaining, **When** I submit, **Then** the request is `PENDING`, I see a waiting-for-review message, and audit is `MATERIAL_REQUEST`. Quantity 0 or > 99 is refused with an error.
4. **Given** I have requests, **Then** I can see their status (待審核 / 已核准 / 已駁回). I can cancel only `PENDING` ones; cancel removes the request and writes `MATERIAL_CANCEL`.

**B-066** Administrator inventory management / 管理員庫存管理

Acceptance / 驗收:

1. **Given** I am an `ADMIN`, **Then** I can name up to 10 tabs (empty names hide a tab), add a material (name and unit required; optional code, specification, initial remaining, tab), adjust remaining and cumulative usage (received recalculated), reorder within a tab without a full page reload, toggle hidden (hidden rows stay visible to me but muted, with an 「已隱藏」 mark; employees no longer see them), move an item to another tab, and delete an item (pending requests for it are also removed). Audit types: `MATERIAL_ADD`, `MATERIAL_UPDATE`, `MATERIAL_DELETE`, and configuration changes as appropriate.
2. **Given** I export Excel, **Then** I receive all non-quarantined materials: tab name, code, name, specification, unit, cumulative usage, received quantity, remaining quantity, hidden flag.
3. **Given** I import a valid file, **Then** **B-054** is applied and I see the comparison-label if the import ran. Mismatched items appear in the quarantine area for **B-055**. Audit: `MATERIAL_IMPORT`, and `MATERIAL_KEEP_A` / `MATERIAL_SYNC_B` when resolving.
4. **Given** I reset inventory and confirm an irreversible prompt, **Then** quantities are zeroed, items return to the predefined default catalogue, hidden and quarantine flags are cleared, items are on tab 1, and the comparison label is cleared. Audit: `MATERIAL_RESET`. The official catalogue list will be provided later by Kuei `(Decided in Q-029, 2026-11-11 01:21)`.

### 6.4 Audit log / 變動紀錄

**B-067** Read-only audit, owner only / 唯讀變動紀錄（僅 owner） `(Decided in Q-049, 2026-11-11 03:52)`

Acceptance / 驗收:

1. **Given** I am a `USER` or an `ADMIN`, **When** I try to open the audit log, **Then** there is no sidebar entry, the request is refused as forbidden (**B-006**), and the blocked attempt is logged. (Earlier rules that let a `USER` see their own rows and an `ADMIN` see all rows are **Removed**.)
2. **Given** I am the owner, **Then** I can see all rows, including my own operations, and filter by actor, type, and date range. Pagination is 20 per page.
3. **Then** nobody, including the owner, can edit or delete a row `(Provisional, Q-059)`.
4. **Given** anyone opens an ordinary page or list without changing anything, **Then** no row is written.

### 6.5 Personal statistics / 個人統計

**B-068** Item totals and salary trial / 工項合計與薪資試算 `(Decided in Q-013, 2026-11-11 01:21)`

- **EN.** As a `USER`, I can total my credited quantities for a date range and run a non-binding salary trial. Official pay is always the administrator's payroll result. The trial uses current unit prices, so it can differ if prices changed after a payroll run. **The trial includes all payroll components** that official payroll would include (work-item gross, custom items, retention, fixed salary when it would apply, insurance when it would apply, and the uninsured deduction when it would apply). The trial still cannot itself mark a 10th payday unless the employee can indicate that same choice; if the trial screen has no 10th-payday control, it must state how fixed salary and insurance are treated, or offer that control. To avoid guessing a missing control, the trial must let the user choose whether this trial is a 10th payday, so that every official component can be included.
- **ZH.** 作為 `USER`，我可以依日期範圍合計自己計入的工項數量，並做不具正式效力的薪資試算。正式薪資一律以管理員計薪結果為準。試算用當下單價，若計薪後單價有改，結果可能不同。**試算須包含正式計薪的所有項目**（工項毛額、自訂工項、保留金、會計入時的固定薪資與勞健保、以及會扣除時的未投保扣除）。試算須讓使用者選擇本次是否視為 10 號發薪，才能納入所有正式項目。

Acceptance / 驗收:

1. **Given** I set a start and end date and a confirmation filter (all / confirmed only / unconfirmed only), **When** I query totals, **Then** I see per-item totals using stored shares for confirmed reports (**B-091**) or the **B-044** preview for unconfirmed ones, including reports where I am a collaborator, and a period-retention figure (0 if I am big-meter).
2. **Given** I set a salary trial date range and the 10th-payday choice, **When** I calculate, **Then** only **confirmed** reports in range are used, all payroll components are shown, and year-to-date retention and the cap use **B-046**–**B-048**.
3. **Given** I am big-meter, **Then** I do not see year-to-date retention (it is 0 / hidden).
4. **Given** I am an `ADMIN`, **When** I open this page, **Then** I am sent to the summary page `(Decided in Q-018, 2026-11-11 01:21)`.

### 6.6 Confirmation / 確認

**B-069** Confirm or reject ordinary reports / 確認或駁回一般回報 `(Decided in Q-025, 2026-11-11 01:21)`

Acceptance / 驗收:

1. **Given** I am an `ADMIN`, **When** I open confirmation, **Then** I see pending (not confirmed, not rejected) ordinary reports in the default range of the last 30 days, grouped by `西區` / `南區`, excluding big-meter reports. I can filter by date range and zone, and reset to the 30-day default.
2. **Given** I select one or more rows (including select-all) and confirm the prompt, **When** I batch-confirm, **Then** those still-pending reports become confirmed, with me as reviewer and the current time, shares are stored per **B-091**, and audit is `REPORT_CONFIRM`. Already confirmed or rejected rows are skipped.
3. **Given** I batch-reject, **Then** those still-pending reports become rejected, are excluded from payroll, and audit is `REPORT_REJECT`. The submitter can still see them in history.
4. **Given** a collaborative report, **Then** I see a “共 N 人” mark and can open details of quantities, collaborator names, and the provisional or stored split.
5. **Given** I attach or clear a custom item on a report, **Then** **B-024** is applied.
6. Confirm and reject are not undone from this page. To change a confirmed report the administrator edits or deletes it in history (**B-064**).

**B-070** Review material requests / 審核材料申請 `(Decided in Q-008/Q-010, 2026-11-11 01:21)`

Acceptance / 驗收:

1. **Given** a `PENDING` request and remaining quantity ≥ requested amount, **When** I approve it (single or batch), **Then** **B-056** is applied and audit is `MATERIAL_APPROVE`.
2. **Given** remaining quantity < requested amount, **When** I approve, **Then** the approval is refused, inventory is unchanged, and I see 「庫存不足，無法核准」.
3. **Given** a request that is not `PENDING`, **When** I approve or reject it again, **Then** the action is refused and inventory is not changed again.
4. **Given** I reject a `PENDING` request, **Then** status becomes `REJECTED`, inventory is unchanged, audit is `MATERIAL_REJECT`. Batch and single follow the same rules.

**B-071** Big-meter confirmation / 大表確認

- **EN.** Same behaviour as **B-069**, but only big-meter reports, on a separate page, default last 30 days. Material requests are not handled here.
- **ZH.** 行為同 **B-069**，但只處理大表回報、獨立頁面、預設最近 30 天。此頁不處理材料申請。

### 6.7 Payroll / 薪資計算

**B-072** Calculate and export payroll / 計算並匯出薪資 `(Decided in Q-014/Q-024/Q-027, 2026-11-11 01:21)`

Acceptance / 驗收:

1. **Given** I am an `ADMIN` and I enter a start and end date (or use **B-059**) and optionally mark a 10th payday, **When** I calculate, **Then** results follow **B-044**–**B-053** and **B-091** for every included account. Names show zone or 「大表」. An archived account is included for reports confirmed before it was archived, and for reports submitted before archiving and approved after archiving, whose report date falls in the period; the name is marked Archived / 「封存」 `(Decided in Q-038, 2026-11-11 01:43; Q-040, 2026-11-11 01:48)`. If the period includes the archive date, that account's fixed salary is still counted under the usual rules, and I may manually adjust the counted amount; if there are no confirmed reports but fixed salary applies, the account still appears `(Decided in Q-040, 2026-11-11 01:48)`. **Given** that account remains archived and I calculate a later payroll period (the date range is after the archive period) without adding fixed salary back, **When** I calculate, **Then** fixed salary is not counted (the default). **Given** I then **manually add** that later period's fixed salary **back**, **When** I calculate, **Then** that period's fixed salary is counted `(Decided in Q-041, clarified 2026-11-11 01:58)`. Transfer accounts show the bank number under **B-014** (last four by default; full number only after a logged reveal, and export of full numbers is blocked if the key is missing). The page shows grand totals, transfer total, cash total, and cash denominations.
2. **Given** any needed unit price is missing, **When** I calculate or export, **Then** no payroll result is produced and I am told to complete the prices (**B-094**).
3. **Given** results are on screen, **When** I export Excel (`.xlsx`), **Then** there is **one file**: a **summary sheet first**, then **one detail sheet per person**, with quantities, unit prices, subtotals, gross, retention, net, fixed salary, insurance, uninsured deduction, and final pay, and a title showing the date range.
4. **When** I export PDF (`.pdf`), **Then** the content is the same kind of payroll breakdown, A4 landscape, suitable for printing Chinese text.
5. **When** I export the transfer form (Word `.docx`), **Then** only accounts with payment method `TRANSFER` and `final > 0` are included, with name, bank account (formatted for bank submission), and final pay. The form is the **板信商業銀行** salary-transfer slip. If the encryption key is missing, this export is blocked.
6. Exports do not use a full-page loading overlay.

### 6.8 Summary reports / 統計報表

**B-073** Cross-account totals / 跨帳戶合計

Acceptance / 驗收:

1. **Given** I am an `ADMIN`, **When** I query a date range, optional account, and optional zone on the ordinary summary, **Then** I see per-person credited quantities (stored shares for confirmed reports) and a grand total. Big-meter people are not on this page; they have a separate big-meter summary.
2. I can export Excel or PDF; quantity columns show one decimal place.

### 6.9 Account and system settings / 帳戶與系統設定

**B-074** Account lifecycle / 帳戶生命週期 `(Decided in Q-019, 2026-11-11 01:21)`

Acceptance / 驗收:

1. **Given** I am an `ADMIN`, **When** I create an account with unique display name, initial password (6–30 characters), role `USER` (an `ADMIN` cannot create an `ADMIN` account; only the owner can, on the Admin management page, **B-096**, `(Decided in Q-042, 2026-11-11 02:56)`), zone, optional bank account, and payment method, **Then** the account exists, audit is `ACCOUNT_CREATE`, and I may also set the big-meter flag for a `USER`.
2. I can reset a password (**B-008**), change payment method (**B-013**), set bank account (**B-014**), set insurance and uninsured rate (**B-015**, **B-016**, **B-092**), set fixed salary and every-period (**B-017**, **B-018**), set per-item retention rates (**B-034**), and set a target year-to-date retention for a given year (**B-019**). I can reset an account's item rates back to the global rate. I can run year-end settlement (**B-090**). For `ADMIN` accounts I cannot do any of these; only the owner can (**B-096**). For my own account I can only change my password, entering the current password `(Decided in Q-047, 2026-11-11 03:52)`. Audits include `ACCOUNT_UPDATE`, `PASSWORD_CHANGE`, `RETENTION_SET`, `RETENTION_RESET`, `RETENTION_YEAR_END`.
3. Separate deactivate / reactivate is **Removed** `(Decided in Q-032, 2026-11-11 01:37)`. There is no `ACCOUNT_DEACTIVATE` or `ACCOUNT_REACTIVATE` action.
4. **Given** I archive an account and confirm, **Then** records are **kept**, the person cannot sign in, they disappear from the sign-in list and collaborator picker, and audit is `ACCOUNT_ARCHIVE`. I cannot archive my own signed-in account. I cannot archive another `ADMIN` account; only the owner can (**B-096**) `(Decided in Q-042, 2026-11-11 02:56)`. Permanent cascade delete is **Removed**.
5. **Given** I restore an archived account, **Then** the person can sign in again, they reappear in the sign-in list and collaborator picker, and audit is `ACCOUNT_RESTORE`. While the account was archived, reports confirmed before the archive, and reports submitted before archiving and approved after archiving, still entered payroll with an Archived / 「封存」 marker, and fixed salary for the period that included the archive date was still counted unless I manually adjusted it `(Decided in Q-038, 2026-11-11 01:43; Q-040, 2026-11-11 01:48)`.
6. For an `ADMIN`, account management lists `USER` accounts only; `ADMIN` accounts are listed on the owner's Admin management page `(Provisional, Q-056)`. The account list shows west, then south, and marks role, zone, big-meter, payment method, bank last four digits, insurance, fixed salary badge, and archived or not.

**B-075** Save prices, tax, and global retention / 儲存單價、稅率、全域保留金

Acceptance / 驗收:

1. **Given** I change west, south, or big-meter unit prices and save that set, **Then** the next payroll and trial use the new prices (`SYSTEM_CONFIG`). A save must be visible to the next calculation without a surprising delay.
2. Zone uninsured rates and global retention rates save independently per zone (**B-033**, **B-034**).
3. **Given** I am an `ADMIN`, **When** I change the retention annual cap (default 60,000 NTD) and save, **Then** the new cap is saved and logged (**B-035**, **B-097**) `(Corrected 2026-11-11 03:42)`. It applies from the current year; already calculated pay is not recalculated; the owner can do the same `(Decided in Q-050, 2026-11-11 03:52)`.

**B-093** Revealing a full bank number / 查看完整銀行帳號 `(Decided in Q-022, 2026-11-11 01:21)`

Acceptance / 驗收:

1. **Given** I am the account holder or an `ADMIN`, **When** I view a bank account without revealing it, **Then** I see only the last four digits.
2. **Given** I choose to reveal the full number, **When** the number is shown, **Then** a `BANK_REVEAL` audit row is written (who, whose account, when).
3. **Given** the encryption key is missing, **When** I view the field, **Then** I see 「無法讀取」; **When** I try to export or edit the bank number, **Then** the action is blocked. The rest of the system still runs. Plaintext is never stored.

**B-095** Archive replaces permanent delete and deactivate / 以封存取代永久刪除與停用 `(Decided in Q-019, 2026-11-11 01:21; Q-032, 2026-11-11 01:37)`

- **EN.** The product must not offer a “delete this account and all of its records” action. It must not offer a separate deactivate action (**Removed**). Only archive exists. Archive keeps the records and is reversible (restore).
- **ZH.** 產品不得提供「刪除此帳戶及其全部紀錄」的操作。也不得另提供停用（該做法為 **Removed**）。只留封存。封存須保留紀錄，且可復原。

**B-096** Owner role and management of administrators / owner 角色與管理員管理 `(Decided in Q-042, 2026-11-11 02:56; Q-043–Q-048, 2026-11-11 03:52)`

- **EN.** There is **exactly one** `OWNER`, **Kuei**, with the highest privilege. The owner account is **created when the system is set up**, **cannot be archived**, and **cannot be transferred** in v0. The owner can do **everything an `ADMIN` can**, with the same landing page and sidebar, plus one extra page, **Admin management (管理員管理)**. **Only the owner can add, archive, restore, or modify `ADMIN` accounts**, and **only the owner can switch an account between `USER` and `ADMIN`**. “Modify” means the admin account's existing fields, including its password; there are **no per-admin permission settings** in v0. **An `ADMIN` cannot add, archive, restore, or modify other `ADMIN` accounts**; for their own account an `ADMIN` can change only their password, by entering the current password, and cannot change their own role or archive themselves. The owner changes their own password after sign-in; a forgotten owner password is reset outside the system. The server refuses forbidden requests (**B-006**, **B-087**) and logs them (**B-097**). `ADMIN` management of `USER` accounts is unchanged. `(Decided in Q-043–Q-048, 2026-11-11 03:52)` Provisional: the owner signs in under the `admin` type and lands on confirmation (Q-052); the owner's own password change needs the current password and the sign-in lock applies to the owner (Q-053); the owner's own account fields are changed only by the owner, and payroll treats the owner like an `ADMIN` (Q-054); an `ADMIN`'s other own fields are changed only by the owner (Q-055); for an `ADMIN`, account management lists `USER` accounts only, and `ADMIN` accounts are listed on Admin management (Q-056); switching to `ADMIN` requires big-meter off, does not change existing reports, and payroll uses the role at calculation time (Q-057).
- **ZH.** **只有一位** `OWNER`，由 **Kuei** 擔任，為最高權限。owner 帳戶於**系統建置時建立**、**不能封存**，v0 **不能移轉**。owner 能做 **`ADMIN` 能做的所有事**，落地頁與側欄同 `ADMIN`，另多一頁**「管理員管理」**。**只有 owner 能新增、封存、復原或修改 `ADMIN` 帳戶**，也**只有 owner 能把帳戶在 `USER` 與 `ADMIN` 之間切換**。「修改」指 admin 帳戶的既有欄位（含密碼）；v0 **沒有個別 admin 的權限設定**。**`ADMIN` 不能新增、封存、復原或修改其他 `ADMIN`**；自己的帳戶只能改密碼（須輸入目前密碼），不能改自己的角色，也不能封存自己。owner 登入後可改自己的密碼；忘記密碼時於系統外重設。伺服端須拒絕越權請求（**B-006**、**B-087**）並記錄（**B-097**）。`ADMIN` 管理 `USER` 帳戶的方式不變。`(Decided in Q-043–Q-048, 2026-11-11 03:52)` 暫定：owner 登入時列在 `admin` 類型、落地頁為確認頁（Q-052）；owner 改自己的密碼須輸入目前密碼，登入鎖定也適用 owner（Q-053）；owner 自己的帳戶欄位只由 owner 修改，計薪時 owner 比照 `ADMIN`（Q-054）；`ADMIN` 自己帳戶的其他欄位只由 owner 修改（Q-055）；`ADMIN` 的帳戶管理只列 `USER`，`ADMIN` 帳戶列在管理員管理頁（Q-056）；切換為 `ADMIN` 須先關大表、不改既有回報、計薪依計算當時的角色（Q-057）。

Acceptance / 驗收:

1. **Given** I am the owner, **When** I add an `ADMIN` account on Admin management, **Then** the account exists with role `ADMIN`, and the action is logged.
2. **Given** I am the owner, **When** I modify an `ADMIN` account's fields (for example reset its password), **Then** the change is saved; there is no per-admin permission setting to change.
3. **Given** I am the owner, **When** I archive an `ADMIN` account and confirm, **Then** it is archived under **B-012**; **When** I restore it, **Then** it can sign in again.
4. **Given** I am the owner, **When** I switch a `USER` (big-meter off) to `ADMIN`, or an `ADMIN` to `USER`, **Then** the role changes and `ACCOUNT_ROLE_CHANGE` is logged.
5. **Given** I am the owner, **When** I try to archive my own owner account, **Then** there is no such action, and a direct request is refused with 「owner 帳戶不能封存」.
6. **Given** I am an `ADMIN`, **When** I try to add, archive, restore, or modify another `ADMIN` account, or change any role, even by sending the request directly, **Then** the action is refused as forbidden, nothing changes, and an `ACCESS_DENIED` row is written.
7. **Given** I am an `ADMIN`, **When** I change my own password and enter the correct current password, **Then** it is changed; **When** the current password is wrong, **Then** I see 「目前密碼不正確」.
8. **Given** I am an `ADMIN`, **When** I try to change my own role or archive myself, **Then** the action is refused.
9. **Given** I am an `ADMIN`, **Then** I do not see the Admin management page.

**B-097** What is logged / 留紀錄的範圍 `(Decided in Q-042, 2026-11-11 02:56; Q-049, 2026-11-11 03:52)`

- **EN.** An audit row (Taiwan time, actor, action type, and a description of what changed, as in **B-037**) is written for: **all modifying operations; exports and downloads (including each opening of an evidence file); viewing a full bank-account number; and blocked unauthorized attempts.** This applies to every actor, and **the owner's operations are logged too**. **Ordinary viewing is not logged.** **Only the owner can view the log** (**B-067**). `(Decided in Q-049, 2026-11-11 03:52)` Provisional `(Provisional, Q-058)`: ordinary sign-in and sign-out are not logged; an account lockout is logged with a system actor; requests from someone not signed in are not logged (they are sent to sign-in); a blocked attempt records the actor, the attempted action, and that it was refused.
- **ZH.** 下列事項都要寫一筆變動紀錄（台灣時間、操作者、類型、改了什麼的說明，同 **B-037**）：**所有修改操作；匯出與下載（含每次點開證據檔）；查看完整銀行帳號；被擋下的越權操作。**適用所有操作者，**owner 的操作也記錄**。**一般查看不記錄。****只有 owner 能看紀錄**（**B-067**）。`(Decided in Q-049, 2026-11-11 03:52)` 暫定 `(Provisional, Q-058)`：一般登入、登出不記錄；帳戶鎖定以系統操作者記錄；未登入者的請求不記錄（直接送到登入頁）；被擋下的嘗試記錄操作者、嘗試的操作與「已拒絕」。

Acceptance / 驗收:

1. **Given** I am an `ADMIN` or the owner, **When** I complete a modifying operation, export, or download, **Then** an audit row with me as actor is written.
2. **Given** I am an `ADMIN` or the owner, **When** I change the retention annual cap, **Then** an audit row with me as actor and the old and new value is written.
3. **Given** a `USER` reveals their own full bank number, **Then** a `BANK_REVEAL` row is written.
4. **Given** a `USER` or `ADMIN` attempts an action they are not allowed to do, **Then** it is refused and an `ACCESS_DENIED` row is written.
5. **Given** anyone only opens a page or list, **Then** no row is written.

**B-098** Voiding a ledger entry / 作廢流水帳紀錄 `(Decided in Q-051, 2026-11-11 03:52)`

- **EN.** A ledger entry that has, or has ever had, an evidence file **cannot be deleted; it can only be voided**, and its evidence files stay openable from the entry. An entry that has never had an evidence file can still be deleted as before. Provisional `(Provisional, Q-061)`: a voided entry stays in the list marked 「作廢」; it is excluded from the income total, the expense total, and the 零用金餘額; it cannot be edited, settled, or un-voided in v0; it is included in the Excel export marked 「作廢」; voiding is available for any entry and writes `LEDGER_VOID`.
- **ZH.** 有（或曾有）證據檔的流水帳紀錄**不能刪除，只能作廢**，證據檔仍可從該筆紀錄點開。從未有過證據檔的紀錄仍可照舊刪除。暫定 `(Provisional, Q-061)`：作廢紀錄仍列在清單並標示「作廢」；不計入收入合計、支出合計與零用金餘額；v0 不能修改、沖銷或取消作廢；Excel 匯出包含並標示「作廢」；任何紀錄都可作廢，寫 `LEDGER_VOID`。

Acceptance / 驗收:

1. **Given** an entry with a receipt, **When** I try to delete it, **Then** the delete is refused with 「此紀錄有證據檔案，不能刪除，只能作廢」.
2. **Given** the same entry, **When** I void it and confirm, **Then** it is marked 「作廢」, its receipt still opens through a new short-lived link, and `LEDGER_VOID` is written.
3. **Given** an entry that never had a file, **When** I delete it and confirm, **Then** it is removed and `LEDGER_DELETE` is written.

### 6.10 Ledger / 流水帳

**B-076** Company ledger / 公司流水帳 `(Decided in Q-015, 2026-11-11 01:21; Q-034, 2026-11-11 01:37)`

Acceptance / 驗收:

1. **Given** I am an `ADMIN`, **When** I open the ledger, **Then** I can filter by date range, type (all / income / expense), and category. I see 20 rows per page. **Income total and expense total follow the current filter range.** The **零用金餘額** (petty-cash / running balance) is **cumulative from the beginning through the filter's end date** (inclusive). **If no date-range filter is applied, it is cumulative through today** (Taiwan time).
2. I can create and edit entries per **B-030**, with audits `LEDGER_CREATE` / `LEDGER_UPDATE`. I can delete an entry only if it has never had an evidence file (`LEDGER_DELETE`); an entry with an evidence file can only be voided (**B-098**, `LEDGER_VOID`) `(Decided in Q-051, 2026-11-11 03:52)`. Amounts must be positive integers; incomplete required fields are refused.
3. I can settle an employee advance per **B-031** (`LEDGER_SETTLE`).
4. **Given** a ledger entry with a receipt or evidence file, of any age (including entries older than 30 days), **When** I open the file from the ledger, **Then** a **new** short-lived download link is created for that open (1 hour, **B-085**) `(Corrected 2026-11-11 03:44)`. Each open is logged as a download (**B-097**) `(Decided in Q-049, 2026-11-11 03:52)`. If storage is not configured or there is no file, I see a warning.
5. **Given** I opened a file earlier and its link has expired, **When** I open the same file again from the ledger, **Then** a new link is created and the file opens; the expired link no longer works `(Corrected 2026-11-11 03:44)`.
6. I can export the filtered rows to Excel; voided entries are included and marked 「作廢」 `(Provisional, Q-061)`; the export is logged.
7. **Given** I replaced an entry's receipt, **When** I open that entry, **Then** the current file and the earlier file are both openable, each through a new short-lived link `(Decided in Q-051, 2026-11-11 03:52)`.

### 6.11 Daily and monthly archives / 日月報檔案庫

**B-077** Generate, download, delete archives / 生成、下載、刪除歸檔 `(Decided in Q-016, 2026-11-11 01:21)`

Acceptance / 驗收:

1. **Given** Taiwan time is 23:59 on a calendar day, **When** the daily job runs, **Then** a daily archive is generated from that day's **confirmed** reports, unless an automatic daily archive for that date already exists (then it is skipped). Source is marked automatic, with no person as generator.
2. **Given** Taiwan time is 23:59 on the last calendar day of a month, **When** the monthly job runs, **Then** a monthly archive is generated for the 1st through that last day, including confirmed reports (and a payroll-summary sheet in the monthly file), unless an automatic monthly archive for that date already exists.
3. **Given** I am an `ADMIN`, **When** I manually generate a daily or monthly archive for a chosen date, **Then** a new archive is stored without replacing automatic or earlier manual copies (additional manuals get a numeric suffix). I am recorded as the generator. A **manual monthly** archive covers the **1st through the chosen date**; this is **intended**.
4. Files are Excel (and PDF when produced). The daily file has three sheets (西區 / 南區 / 大表) with account names, item quantities, and amount subtotals for confirmed reports. If storage is not configured, the archive record still exists but download warns that the file is unavailable.
5. Download uses a 1-hour link and is logged (**B-097**) `(Decided in Q-049, 2026-11-11 03:52)`. Archive files are not ledger evidence files, so deleting an archive record still removes its stored files (unchanged). Pagination is 30 per page.

### 6.12 Required BDD examples / 必備 BDD 範例

These examples are labelled as examples. They must pass as specified. / 以下標明為範例，須依此驗收。

**BDD-001** Collaboration split with remainder / 共作餘數分配 `(Decided in Q-004, 2026-11-11 01:21)`

- **Given** submitter A and collaborators listed in order B then C, and a pending report with only `direct_13` = 7.0 只 (example),
- **When** an administrator approves the report,
- **Then** stored shares are A = 2.4, B = 2.3, C = 2.3, and 2.4 + 2.3 + 2.3 = 7.0.
- **Given** the same people but the saved roster order is A, C, then B,
- **When** the report is approved,
- **Then** A = 2.4, C = 2.3, B = 2.3 (the remainder of 0.1 goes to the submitter first; B and C are equal so roster order after the submitter does not change these figures in this example).
- **Given** `direct_13` = 1.0 只 and the same three people (example),
- **When** the report is approved,
- **Then** A = 0.4, B = 0.3, C = 0.3, sum = 1.0.

**BDD-002** Duplicate approval / 重複核准 `(Decided in Q-010, 2026-11-11 01:21)`

- **Given** a material request is already `APPROVED` and stock was already reduced,
- **When** an administrator approves that same request again (single or as part of a batch),
- **Then** the action is refused, remaining quantity does not change a second time, and a regression test covers this case.
- **Given** a request is already `REJECTED`,
- **When** it is approved or rejected again,
- **Then** the action is refused and inventory stays unchanged.

**BDD-003** Insufficient stock / 庫存不足 `(Decided in Q-008, 2026-11-11 01:21)`

- **Given** a `PENDING` request for 10 units and remaining quantity is 4 (example),
- **When** an administrator approves it (single or batch),
- **Then** the approval is refused, the request stays `PENDING`, remaining quantity is still 4, cumulative usage is unchanged, and the administrator sees 「庫存不足，無法核准」.
- **Given** remaining quantity is 10 and the request is 10 (example),
- **When** the administrator approves,
- **Then** the request becomes `APPROVED`, remaining becomes 0, cumulative usage increases by 10, and received quantity still equals cumulative usage + remaining.

**BDD-004** Retention year-end settlement / 保留金年度結算 `(Decided in Q-012/Q-023, 2026-11-11 01:21; Q-031, 2026-11-11 01:37)`

- **Given** Taiwan time passes 1 January 00:00 into a new calendar year, and a person had year-to-date retention 20,000 NTD and an offset of +1,000 in the previous year (example),
- **When** the new year's year-to-date is displayed before any new confirmed work,
- **Then** the new year's year-to-date is 0, and the previous year's 20,000 and +1,000 remain only as that year's history (they do not apply to the new year).
- **Given** an administrator runs 「年度結算」 for a chosen year, and a person has year-to-date retention 20,000 NTD for that year (example),
- **When** the action completes,
- **Then** all accounts are processed in that one action, a `RETENTION_YEAR_END` record is written, each person's closed-year retention figures are kept, and the refunded (released) retention (20,000 NTD in this example) is **recorded as an amount only**. The administrator transfers it outside the system. It does **not** appear in in-system payroll or any other in-system payment `(Decided in Q-037, 2026-11-11 01:43)`.
- **Given** an administrator sets a new offset for the current year only,
- **When** year-to-date is shown,
- **Then** only the current year's offset is added.

**BDD-005** Login lockout / 登入鎖定 `(Decided in Q-017, 2026-11-11 01:21; Q-035/Q-036, 2026-11-11 01:37)`

- **Given** a not-archived account and I have not yet been locked out,
- **When** I submit an incorrect password once,
- **Then** I see 「密碼錯誤，請重試」 and I am not signed in. The failure counts against that **account**.
- **Given** I have already submitted an incorrect password 4 times for that account (example), with no 15-minute gap without a failure,
- **When** I submit a fifth incorrect password,
- **Then** I am not signed in, the account is locked for 15 minutes, and I see 「密碼錯誤次數過多，請在 15 分鐘後再試」.
- **Given** the account is locked,
- **When** I submit the correct password during those 15 minutes,
- **Then** I am still not signed in, and I still see the lockout message.
- **Given** 15 minutes have passed since the lock began (the count has reset to zero),
- **When** I submit the correct password,
- **Then** I am signed in.
- **Given** the lock has ended (count is 0),
- **When** I immediately submit an incorrect password,
- **Then** I am not signed in, I see 「密碼錯誤，請重試」, and the failure counts as 1 of 5 (I am not still locked).
- **Given** I have submitted an incorrect password 3 times for that account (example), then 15 minutes pass with no further failure,
- **When** I submit another incorrect password,
- **Then** it counts as 1 of 5, and I am not locked.
- **Given** I have submitted an incorrect password 3 times for that account (example),
- **When** I then submit the correct password,
- **Then** I am signed in and the failure count is 0.

**BDD-006** User deletes a pending report / 使用者刪除待審回報 `(Decided in Q-030, 2026-11-11 01:37; Q-039, 2026-11-11 01:43)`

- **Given** I am a `USER` and I already have 3 own submissions on a date, one of which is still pending (example),
- **When** I delete that pending report and confirm,
- **Then** the report is gone, audit is `REPORT_DELETE`, I cannot recover it, that date's quota is freed, and I may submit again (I now have 2 existing own submissions on that date).
- **Given** I am a `USER` and I delete a rejected own report on a date where I had already reached 3 own submissions (example),
- **When** the delete succeeds,
- **Then** I may submit again for that date.
- **Given** I am a `USER` and the report is confirmed,
- **When** I try to delete it,
- **Then** the action is refused, the report remains, and the quota is not freed.

**BDD-007** Archive and restore / 封存與復原 `(Decided in Q-032, 2026-11-11 01:37; Q-038, 2026-11-11 01:43; Q-040, 2026-11-11 01:48; Q-041, 2026-11-11 01:55)`

- **Given** an account that is not archived,
- **When** an administrator archives it,
- **Then** records are kept, the person cannot sign in, the name is absent from the sign-in list and collaborator picker, and audit is `ACCOUNT_ARCHIVE`. There is no separate deactivate action.
- **Given** that same account is archived, and it had a report confirmed before the archive that falls in a payroll period (example),
- **When** an administrator calculates payroll for that period,
- **Then** that confirmed report is included, and the name is marked Archived / 「封存」.
- **Given** that same account is archived, and it has a report submitted before the archive but approved only after the archive, whose report date falls in the payroll period (example),
- **When** an administrator calculates payroll for that period,
- **Then** that report is also included, and the name is marked Archived / 「封存」.
- **Given** that same account was archived on a date that falls inside a payroll period, “pay every period” is on or the run is a 10th payday, and the standing fixed salary is 5,000 NTD (example),
- **When** an administrator calculates payroll for that period without adjusting the amount,
- **Then** 5,000 NTD fixed salary is counted, even if the account has no confirmed reports in the period.
- **Given** the same period and standing fixed salary 5,000 NTD (example),
- **When** the administrator manually adjusts the counted fixed salary to 2,000 NTD and calculates,
- **Then** 2,000 NTD is the fixed salary used in that payroll result.
- **Given** that same account remains archived, the standing fixed salary is 5,000 NTD, and a later payroll period's date range is after the archive period (example),
- **When** an administrator calculates payroll for that later period without adding fixed salary back,
- **Then** fixed salary is not counted (the default) `(Decided in Q-041, clarified 2026-11-11 01:58)`.
- **Given** that same later period,
- **When** the administrator manually adds fixed salary back and calculates,
- **Then** that period's fixed salary is counted `(Decided in Q-041, clarified 2026-11-11 01:58)`.
- **Given** that same account is archived,
- **When** an administrator restores it,
- **Then** the person can sign in again, the name reappears in the sign-in list and collaborator picker, and audit is `ACCOUNT_RESTORE`.

**BDD-008** Petty-cash cumulative balance / 零用金累計餘額 `(Decided in Q-034, 2026-11-11 01:37)`

- **Given** ledger entries exist on 1 Nov, 10 Nov, and 20 Nov (example), and I set a date filter ending on 10 Nov,
- **When** I view the ledger totals,
- **Then** income and expense totals follow that filter range, and 零用金餘額 is the cumulative balance from the beginning through 10 Nov (the 20 Nov entry is not included).
- **Given** no date-range filter is applied,
- **When** I view the ledger totals,
- **Then** 零用金餘額 is the cumulative balance through today (Taiwan time).
- **Given** the 10 Nov entry is an expense of 500 NTD with a receipt and is voided (example),
- **When** I view the ledger totals with the filter ending on 10 Nov,
- **Then** the 500 NTD is not in the expense total or the 零用金餘額, and the entry is still listed and marked 「作廢」 `(Provisional, Q-061)`.

**BDD-009** Owner manages administrators / owner 管理管理員 `(Decided in Q-042, 2026-11-11 02:56)`

- **Given** I am the owner and an `ADMIN` account A exists (example),
- **When** I archive A and confirm,
- **Then** A is archived, records are kept, and A cannot sign in.
- **Given** I am `ADMIN` B and `ADMIN` A exists (example),
- **When** I try to archive A, change A's fields, or reset A's password,
- **Then** each action is refused as forbidden, A is unchanged, and an `ACCESS_DENIED` row with B as actor is written `(Decided in Q-049, 2026-11-11 03:52)`.
- **Given** I am the owner and A is archived,
- **When** I restore A,
- **Then** A can sign in again and `ACCOUNT_RESTORE` is written `(Decided in Q-043, 2026-11-11 03:52)`.
- **Given** I am `ADMIN` B,
- **When** I open the audit log,
- **Then** the request is refused and logged; only the owner can view the log `(Decided in Q-049, 2026-11-11 03:52)`.
- **Given** I am `ADMIN` B,
- **When** I try to create a new account with role `ADMIN`,
- **Then** the action is refused as forbidden and no account is created.
- **Given** I am `ADMIN` B,
- **When** I update a `USER` account's payment method,
- **Then** the change is saved and an audit row with B as actor is written.

**BDD-010** Retention annual cap changed / 修改保留金年度上限 `(Corrected 2026-11-11 03:42)`

- **Given** the cap has never been changed (default 60,000 NTD), a person's year-to-date retention before the period is 59,000 NTD, and the period's raw retention is 3,000 NTD (example),
- **When** payroll is calculated,
- **Then** period retention is 1,000 NTD (60,000 − 59,000).
- **Given** in the same calendar year an administrator changes the cap to 80,000 NTD (example), and the payroll above was already calculated before the change,
- **When** nothing is recalculated,
- **Then** the earlier result still shows 1,000 NTD `(Decided in Q-050, 2026-11-11 03:52)`.
- **Given** the same change,
- **When** a payroll for this period is calculated after the change,
- **Then** period retention is 3,000 NTD (the new cap applies from the current year), and the cap change has an audit row (**B-097**) `(Decided in Q-050, 2026-11-11 03:52)`.
- **Given** the cap was 60,000 NTD in the previous year and is changed to 80,000 NTD this year (example),
- **When** a payroll for a period in the previous year is calculated,
- **Then** the previous year's cap of 60,000 NTD is used `(Provisional, Q-060)`.

**BDD-011** Opening old evidence files / 點開舊的證據檔案 `(Corrected 2026-11-11 03:44)`

- **Given** a ledger expense entry dated 120 days ago with a PDF receipt (example),
- **When** an administrator opens the receipt from the ledger,
- **Then** a new short-lived link is created and the receipt opens.
- **Given** that link was created more than 3,600 seconds ago,
- **When** anyone uses it,
- **Then** it no longer works.
- **Given** the same receipt,
- **When** the administrator opens it from the ledger again,
- **Then** another new short-lived link is created and the receipt opens, and each open writes a `FILE_DOWNLOAD` row `(Decided in Q-049, 2026-11-11 03:52)`.
- **Given** the receipt was replaced with a new file (example),
- **When** the administrator opens the entry,
- **Then** both the current file and the earlier file can be opened `(Decided in Q-051, 2026-11-11 03:52)`.

---

## 7. Non-functional requirements / 非功能需求

**B-078** Time and scheduling / 時間與排程

- **EN.** All user-facing dates, the 1 January 00:00 retention reset, idle timeout, and the jobs in **B-077** use Asia/Taipei. Automatic jobs must not generate a duplicate automatic archive for the same type and date (for example after a process restart). If more than one worker would run the same job, the new system must still produce at most one automatic archive per type and date.
- **ZH.** 所有使用者面對的日期、1 月 1 日 00:00 的保留金歸零、閒置逾時，以及 **B-077** 的排程，均用 Asia/Taipei。自動作業在行程重啟後也不得為同一類型與日期重複生成自動歸檔。若有多個執行個體，同一類型與日期最多一份自動歸檔。

**B-079** Session and transport safety / 工作階段與傳輸安全 `(Decided in Q-011/Q-028, 2026-11-11 01:21)`

- **EN.** Session cookies must not be readable by page scripts (HttpOnly), must use `SameSite=Lax` (or stricter), and must be marked Secure in production. All state-changing requests must be authenticated and protected against cross-site request forgery. After sign-in, unused sessions end after **30 minutes**. There is no remember-me cookie that outlives this idle window (**Removed**).
- **ZH.** 工作階段 cookie 不可被頁面腳本讀取（HttpOnly）、須 `SameSite=Lax`（或更嚴），正式環境須 Secure。所有會改變資料的請求必須已通過身分驗證，並防止跨站請求偽造。登入後若無操作，**30 分鐘**結束工作階段。沒有可比此閒置時間更長的「記住我」cookie（該做法為 **Removed**）。

**B-080** Sign-in rate limit / 登入速率限制 `(Kept as extra protection; not replaced by Q-035/Q-036, 2026-11-11 01:37)`

- **EN.** In addition to **B-089**, at most 10 sign-in attempts per client address per minute, consistently enforced across process restarts and multiple workers. Q-035/Q-036 decided that the 5-failure lock is per account; they did not replace this address limit, which is kept as extra protection.
- **ZH.** 除 **B-089** 外，同一用戶端位址每分鐘最多 10 次登入嘗試，且須在行程重啟與多個執行個體之間一致。Q-035/Q-036 決定 5 次鎖定依帳戶計算，並未取代此位址限制，故保留作為額外保護。

**B-081** Encryption of bank accounts / 銀行帳號加密 `(Decided in Q-022, 2026-11-11 01:21)`

- **EN.** Bank account numbers are encrypted at rest. Plaintext must never be stored, including when the encryption key is missing. If the key is missing, the server otherwise keeps running, bank fields show 「無法讀取」, and exports and edits that need the number are blocked. Key management is an operations concern, not a user feature, but the user-visible behaviour above is required.
- **ZH.** 銀行帳號靜態加密。即使金鑰缺失，也**絕不存明文**。金鑰缺失時，伺服端其餘功能照常，銀行欄位顯示「無法讀取」，並擋下需要該號碼的匯出與修改。金鑰管理屬營運事項，但上面的使用者可見行為為必要需求。

**B-082** Financial-field visibility / 財務欄位可見性 `(Decided in Q-022, 2026-11-11 01:21)`

- **EN.** A `USER` must never see another person's bank account, insurance amount, uninsured rate, retention, or payroll figures. They may see their own as in **B-004**, with the bank number masked to the last four digits unless they reveal it under **B-093**. An `ADMIN` may see all of them when performing payroll, account management, or exports, with the same last-four default and logged reveal. Ledger and archives are administrator-only. The owner has the same visibility as an `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)`.
- **ZH.** `USER` 不得看到他人的銀行帳號、勞健保金額、未投保比例、保留金或薪資數字。可以看到自己的（**B-004**）；銀行帳號預設後四碼，依 **B-093** 點看全碼。`ADMIN` 在計薪、帳戶管理或匯出時可以看到全部，同樣預設後四碼，點看全碼會被記錄。流水帳與日月報僅管理員可及。owner 可見範圍同 `ADMIN` `(Decided in Q-045, 2026-11-11 03:52)`。

**B-083** Audit completeness / 稽核完整性

- **EN.** Every successful action listed in **B-037** writes an audit row in Taiwan time, with enough description to see what changed. Automatic archive generation may have a system actor and no person. Automatic New Year retention reset should be attributable (system actor) if it writes a row; the formal close is **B-090**. The full logging scope is **B-097** `(Decided in Q-049, 2026-11-11 03:52)`.
- **ZH.** **B-037** 列出的成功操作都要寫一筆台灣時間的變動紀錄，說明須足以看出改了什麼。自動生成歸檔可以沒有操作者（系統）。跨年自動歸零若寫紀錄，操作者記為系統；正式結算見 **B-090**。完整記錄範圍見 **B-097** `(Decided in Q-049, 2026-11-11 03:52)`。

**B-084** Export formats / 匯出格式 `(Decided in Q-014/Q-027, 2026-11-11 01:21)`

- **EN.** History, materials, ledger, summary, and payroll Excel: `.xlsx`. Payroll Excel is one file with a summary sheet then one detail sheet per person. Payroll also `.pdf` and Word `.docx` (板信商業銀行 transfer slip). Inventory import: `.xlsx` or `.csv`. Receipts: PDF, JPEG, PNG, WebP, max 10 MB. Archive download: Excel and PDF when present. Ledger Excel includes voided entries marked 「作廢」 `(Provisional, Q-061)`. Character encoding and fonts must display Traditional Chinese correctly.
- **ZH.** 歷史、材料、流水帳、統計、薪資 Excel 為 `.xlsx`。薪資 Excel 為單一檔：先總表、再每人一頁明細。薪資另有 `.pdf` 與 Word `.docx`（板信商業銀行薪轉單）。庫存匯入：`.xlsx` 或 `.csv`。憑證：PDF、JPEG、PNG、WebP，最大 10 MB。歸檔下載：有檔時為 Excel 與 PDF。流水帳 Excel 含已作廢紀錄並標示「作廢」`(Provisional, Q-061)`。字元與字型須正確顯示繁體中文。

**B-085** Evidence-file retention and download-link lifetime / 證據檔案保留與下載連結有效期 `(Corrected 2026-11-11 03:44)`

- **EN.** Receipt and ledger evidence files are **kept permanently**. An administrator can open them from the ledger **at any time**, including entries older than 30 days. **Each open creates a new short-lived download link.** The link itself is still short-lived (it expires after 3,600 seconds) and must not be stored or used as a long-lived address. Files stay openable from voided entries and as earlier versions after replacement `(Decided in Q-051, 2026-11-11 03:52)`; each open is logged `(Decided in Q-049, 2026-11-11 03:52)`. Daily/monthly archive download links also expire after 3,600 seconds and must not be stored as long-lived addresses (unchanged).
- **ZH.** 憑證與流水帳證據檔案**永久保留**。管理員**隨時**可從流水帳點開，包含 30 天以前的紀錄。**每次點開都產生新的短效下載連結。**連結本身仍是短效（3,600 秒後失效），不得當成長期網址保存或使用。已作廢紀錄與更換前的舊檔仍可點開 `(Decided in Q-051, 2026-11-11 03:52)`；每次點開都留紀錄 `(Decided in Q-049, 2026-11-11 03:52)`。日報/月報歸檔的下載連結同樣 3,600 秒後失效、不得當長期網址保存（不變）。

Acceptance / 驗收:

1. **Given** a ledger entry dated more than 30 days ago with a receipt (example), **When** an administrator opens the receipt from the ledger, **Then** the file opens through a newly created short-lived link.
2. **Given** an administrator opened a receipt and received a link, **When** more than 3,600 seconds have passed and someone uses that same link, **Then** the link no longer works; opening the receipt again from the ledger creates a new link.
3. **Given** an administrator opens the same receipt twice, **Then** each open creates its own new link.

**B-086** Interface behaviour / 介面行為

- **EN.** State-changing submits may show a full-page wait indicator, except export/download actions which must not. Short success or error messages appear after actions and may fade after about 5 seconds. Instant validation hints follow **B-088**. Pagination defaults: 20 rows (history, confirmation, materials requests on confirmation, audit, ledger), 25 (big-meter history), 30 (archives).
- **ZH.** 會改資料的送出可顯示全頁等待，但匯出/下載不得使用全頁等待。操作後顯示簡短成功或錯誤訊息，約 5 秒後可淡出。即時驗證提示依 **B-088**。分頁預設：20 列（歷史、確認、確認頁材料申請、變動紀錄、流水帳），25 列（大表歷史），30 列（檔案庫）。

**B-087** Consistent authorization / 授權必須前後端一致

- **EN.** Interface disabling is not enough. Every create, update, delete, confirm, export, and download must be re-checked on the server for role, ownership, and status (for example a `USER` must not edit a confirmed report even if they send the request directly; an `ADMIN` must not add, archive, or modify an `ADMIN` account even if they send the request directly, **B-096**).
- **ZH.** 不能只靠畫面停用按鈕。所有新增、修改、刪除、確認、匯出、下載都必須在伺服端再檢查角色、歸屬與狀態（例如 `USER` 即使直接送出請求，也不能改已確認回報；`ADMIN` 即使直接送出請求，也不能新增、封存或修改 `ADMIN` 帳戶，**B-096**）。

---

## 8. Decided questions / 已決定事項

Kuei decided Q-001–Q-029 at **2026-11-11 01:21 (Asia/Taipei)**. The decision ledger is the source of truth. Each answer is restated here and already applied to the `B-` rules above.

Kuei 於 **2026-11-11 01:21（Asia/Taipei）** 決定 Q-001–Q-029。以決策清單為準。下列為裁決原文意義，並已寫入上方 `B-` 規則。

**Q-001** — Decided. At most 3 reports per person per report date, counting only own submissions (being a collaborator does not count). No prefill. A not-yet-confirmed report may be updated from history. **Q-039** later decided that deleting a pending or rejected own report frees that day's quota. / 已決定。每人每日（同一回報日期）最多 3 筆，只算自己送出的（被列為共作者不算）。不預填。可從歷史更新尚未核准的報單。其後 **Q-039** 決定：刪除待審或已駁回的自己回報後，當日額度釋放。

**Q-002** — Decided. Date defaults to today, may go back 30 days, must not be in the future. / 已決定。日期預設今天，可往前 30 天，不可往後。

**Q-003 / Q-004** — Decided. Smallest quantity unit is 0.1 只, held as an integer count of 0.1-units. Co-work split uses ceil/floor (largest remainder) at the 0.1 layer; the shares must sum to the original quantity. Remainder goes to the submitter first, then roster order. Each person's share is persisted at approval. Money is rounded to whole NTD only at payroll. / 已決定。數量最小單位 0.1 只，以 0.1 單位的整數持有。共作在 0.1 層用 ceil/floor（最大餘數）分配，加總必還原。餘數先給提交者再依名單順序。核准時保存每人分配。金額只在發薪／計薪時四捨五入到整數元。

**Q-005** — Decided. Password length is 6–30 characters. / 已決定。密碼長度 6–30 個字。

**Q-006** — Decided. A `USER` may edit only unapproved (pending) and rejected reports, and may delete a rejected report. A confirmed report is preview-only for a `USER`. **Q-030** later decided that a `USER` may also delete a still-pending report they submitted. / 已決定。`USER` 只能改未核准及被駁回的回報，可刪被駁回的。已核准僅可預覽。其後 **Q-030** 決定：`USER` 也可刪自己送出、仍待審的回報。

**Q-007** — Decided. Remove `bm_40_fen`. / 已決定。移除 `bm_40_fen`。

**Q-008 / Q-009 / Q-010** — Decided. Insufficient stock refuses approval with an error. The server must check. Only `PENDING` requests may be reviewed. Batch and single follow the same rules. Double deduction must be blocked and covered by a test. / 已決定。庫存不足拒絕核准並顯示錯誤。伺服端必須檢查。只能審 `PENDING`。批次與單筆規則相同。重複扣庫存必須擋下並有測試。

**Q-011 / Q-028** — Decided. Idle timeout is 30 minutes. No remember-me. / 已決定。閒置 30 分鐘登出。無記住我。

**Q-012 / Q-023** — Decided. Retention is per calendar year and resets at 1 January 00:00 Taiwan time. Adjustments are recorded per year. There is a new administrator 「年度結算」 action that closes all accounts at once and leaves a record. Administrators may still adjust an individual's retention. **Q-031** later decided that settlement closes the year and records the refunded retention. **Q-037** later decided that the refund is recorded as an amount only and is transferred by the administrator outside the system. / 已決定。保留金依日曆年，於 1/1 00:00 台灣時間歸零。調整值每年分開記。新增管理員「年度結算」按鈕，一次結清所有人並留紀錄。管理員仍可調個別保留金。其後 **Q-031** 決定結清並記錄發還保留金；**Q-037** 決定該金額只記錄，由管理員在系統外轉帳。

**Q-013** — Decided. The personal payroll trial includes all relevant payroll components. / 已決定。個人薪資試算包含所有相關計薪項目。

**Q-014** — Decided. Payroll Excel is one file: a summary sheet first, then one detail sheet per person. / 已決定。薪資 Excel 為單一檔：先總表，再每人一頁明細。

**Q-015** — Decided. Income and expense totals follow the filter range. The 零用金餘額 is cumulative. **Q-034** later decided that the cumulative balance is computed through the filter end date, or through today if no filter is applied. / 已決定。收支合計依篩選區間。零用金餘額為累計。其後 **Q-034** 決定：累計算到篩選結束日；無篩選則算到今天。

**Q-016** — Decided. A manual monthly archive up to the chosen date is intended. / 已決定。手動月報統計至所選日期是預期行為。

**Q-017** — Decided. Keep “choose group, then pick a name” sign-in. After 5 incorrect passwords, lock for 15 minutes. **Q-035/Q-036** later decided that the count is per account, and that it resets to zero on successful login, when the lock ends, or after 15 minutes with no further failure. / 已決定。保留「選區域／類型再選名字」登入。密碼錯 5 次鎖 15 分鐘。其後 **Q-035/Q-036** 決定：次數依帳戶計算，並在成功登入、鎖定結束、或 15 分鐘內無再錯時歸零。

**Q-018** — Decided. Administrators do not submit daily reports and do not use personal statistics. / 已決定。管理員不回報、不看個人統計。

**Q-019** — Decided. Permanent delete is removed and replaced with archive; records are kept. **Q-032** later decided that only archive exists (no separate deactivate) and that archive is reversible (restore). / 已決定。移除永久刪除，改為封存，紀錄保留。其後 **Q-032** 決定：只留封存（無另外的停用），且可復原。

**Q-020** — Decided. Retention unit is NTD/只. / 已決定。保留金單位為 NTD/只。

**Q-021** — Decided. An uninsured person has a percentage deducted from salary. The default is per zone; an administrator may override it per person. **Q-033** later decided that the base is work-item pay only, excluding fixed salary. / 已決定。未投保者薪資扣一比例，預設依區域，管理員可個人調整。其後 **Q-033** 決定：基數只算工項薪資，不含固定薪資。

**Q-022** — Decided. Bank accounts show the last four digits by default. The account holder and an administrator may reveal the full number, and that reveal is logged. If the encryption key is missing, the server otherwise keeps running, bank fields show as unreadable, export and edits are blocked, and plaintext is never stored. / 已決定。銀行帳號預設只顯示後四碼。本人與管理員可點看全碼並記錄。金鑰缺失時伺服端其餘功能照常，銀行欄位顯示無法讀取，匯出與修改擋下，絕不存明文。

**Q-024** — Decided. No unit-price fallback. If any required unit price is missing, payroll errors out and tells the administrator. / 已決定。不做單價退路。任何需用單價未設完整時計薪報錯並提示管理員。

**Q-025** — Decided. Yes: confirmation and rejection are not undone on the confirmation page; changes go through history edit or delete. / 已決定。是：確認頁不能撤銷確認或駁回；要改須走歷史修改或刪除。

**Q-026** — Decided. No headcount cap. Design for ten times the old planning size or more. / 已決定。無人數上限，以舊規劃規模的 10 倍或以上來設計。

**Q-027** — Decided. Keep the 板信商業銀行 payroll transfer file. / 已決定。沿用板信商業銀行薪轉單。

**Q-029** — Decided. Keep the default materials catalogue. Kuei will provide the official list later. / 已決定。沿用預設材料清單。正式清單稍後由 Kuei 提供。

---

**Q-030** — Decided (2026-11-11 01:37). A `USER` may delete a still-pending report they submitted. / 已決定。`USER` 可刪除自己送出、仍待審的回報。

**Q-031** — Decided (2026-11-11 01:37). Year-end settlement closes (settles) the year and records the refunded (released) retention. **Q-037** later decided that the amount is recorded only and transferred outside the system. / 已決定。年度結算須結清，並記錄發還保留金。其後 **Q-037** 決定：只記錄金額，由管理員在系統外轉帳。

**Q-032** — Decided (2026-11-11 01:37). Only archive exists; there is no separate deactivate. Archive is reversible (restore). **Q-038** later decided that reports confirmed before archive still enter payroll, with an Archived / 「封存」 marker. / 已決定。只留「封存」，無另外的停用；封存可復原。其後 **Q-038** 決定：封存前已確認的回報仍計薪，名稱旁標示「封存」。

**Q-033** — Decided (2026-11-11 01:37). The uninsured deduction base is work-item pay only, excluding fixed salary. / 已決定。未投保扣除基數只算工項薪資，不含固定薪資。

**Q-034** — Decided (2026-11-11 01:37). The petty-cash (零用金餘額) cumulative balance is computed through the filter end date; if no filter is applied, through today. / 已決定。零用金累計餘額算到篩選結束日；無篩選則算到今天。

**Q-035 / Q-036** — Decided (2026-11-11 01:37). The incorrect-password count is per account. It resets to zero on successful login, when the lock ends, or after 15 minutes with no further failure. The existing “same address, 10 attempts per minute” limit is kept as extra protection (**B-080**). / 已決定。密碼錯誤次數依帳戶計算；成功登入、鎖定結束、或 15 分鐘內無再錯即歸零。既有「同一位址每分鐘 10 次」限制保留作為額外保護（**B-080**）。

---

**Q-037** — Decided (2026-11-11 01:43). Year-end settlement refunded retention is recorded as an amount only. The administrator transfers it outside the system. It does not go through in-system payroll or any other in-system payment. / 已決定。年度結算發還的保留金只記錄金額，由管理員在系統外轉帳；不走系統內計薪或任何其他系統內付款。

**Q-038** — Decided (2026-11-11 01:43). Reports that were confirmed before an account was archived still enter payroll, and the name is marked Archived / 「封存」. **Q-040** later decided that fixed salary for the archive period is still counted (and may be adjusted), and that reports submitted before archiving and approved after archiving are also included. / 已決定。封存前已確認的回報仍計薪，名稱旁標示「封存」。其後 **Q-040** 決定：封存當期固定薪資照算（可手動調整）；封存前送出、封存後才核准的回報也計薪。

**Q-039** — Decided (2026-11-11 01:43). When a `USER` deletes their own pending or rejected report, that day's 3-report quota is freed and they can submit again. / 已決定。`USER` 刪除自己的待審或已駁回回報後，當日 3 筆額度釋放，可以再送。

---

**Q-040** — Decided (2026-11-11 01:48). For an archived account, fixed salary for the payroll period whose date range includes the archive date is still counted under the usual rules (including when there are no confirmed reports in the period). The administrator may manually adjust the counted amount. Reports submitted before archiving and approved after archiving are also included in payroll. **Q-041** (clarified 2026-11-11 01:58) later decided that, for periods after archiving, fixed salary is not counted by default, but an administrator can manually add it back; once added back, that period's fixed salary is counted. / 已決定。封存帳戶在計薪起訖含封存日的「封存當期」，固定薪資依平常規則照算（即使該期沒有已確認回報）；管理員可手動調整計入金額。封存前送出、封存後才核准的回報也計薪。其後 **Q-041**（2026-11-11 01:58 補充）決定：封存後各期固定薪資預設不算，但管理員可以手動加回；加回後，該期固定薪資即計入。

---

**Q-041** — Decided (2026-11-11 01:55; clarified 2026-11-11 01:58). While an account remains archived, fixed salary for the period in which it was archived is counted (manual adjustment stays as in Q-040). For periods after archiving, fixed salary is **not counted by default**, but an administrator can **manually add it back**; once added back, that period's fixed salary is counted. / 已決定（2026-11-11 01:58 補充）。帳戶持續封存時，封存當期固定薪資照算（手動調整仍依 Q-040）。**封存後各期固定薪資預設不算，但管理員可以手動加回；加回後，該期固定薪資即計入。**

---

**Q-042** — Decided (2026-11-11 02:56). A new `OWNER` role (highest privilege) is added. Only the owner can add, archive, or modify `ADMIN` accounts. An `ADMIN` cannot archive or modify other `ADMIN` accounts. `ADMIN` actions are all logged. Applied in **B-003**, **B-004**, **B-006**, **B-008**, **B-009**, **B-012**, **B-037**, **B-067**, **B-074**, **B-083**, **B-087**, **B-096**, **B-097**. / 已決定。新增 owner（最高權限）角色；只有 owner 能新增、封存或修改 admin；admin 不能封存或修改其他 admin；admin 的操作都要留紀錄。

**B-035 correction** — Decided (2026-11-11 03:42). The retention annual cap (default 60,000 NTD) can be changed by an administrator. Applied in **B-035**, **B-046**, **B-047**, **B-048**, **B-075**. / 已決定。保留金年度上限（預設 60,000 NTD）改成 admin 可以修改。

**B-085 correction** — Decided (2026-11-11 03:44). Receipt and ledger evidence files are kept permanently; an administrator can open them from the ledger at any time; each open creates a new short-lived download link, and the link itself stays short-lived. Applied in **B-004**, **B-030**, **B-076**, **B-085**. / 已決定。憑證與流水帳證據檔案永久保留，admin 隨時可從流水帳點開，每次產生新的短效下載連結（連結本身仍短效）。

---

Kuei decided Q-043–Q-051 at **2026-11-11 03:52 (Asia/Taipei)**. / Kuei 於 **2026-11-11 03:52（Asia/Taipei）** 決定 Q-043–Q-051。

**Q-043** — Decided. The owner is Kuei. Restoring an `ADMIN` is also owner-only. (**B-003**, **B-004**, **B-012**, **B-096**) / 已決定。owner 為 Kuei；復原 admin 也只有 owner 能做。

**Q-044** — Decided. “Including permissions” means only the admin account's existing fields; v0 has no per-admin permission settings. (**B-004**, **B-096**, **B-088**) / 已決定。「含權限」只指 admin 帳戶的既有欄位；v0 沒有個別 admin 權限設定。

**Q-045** — Decided. The owner can do everything an `ADMIN` can; landing page and sidebar are the same as an `ADMIN`, plus one extra Admin management page. (**B-004**, **B-005**, **B-060**, **B-082**, **B-096**) / 已決定。owner 能做 admin 的所有事；落地頁與側欄同 admin，另多一頁管理員管理。

**Q-046** — Decided. Exactly one owner, created at system setup, cannot be archived, no transfer in v0. The owner can change their own password after sign-in; a forgotten password is reset outside the system. (**B-003**, **B-004**, **B-008**, **B-009**, **B-012**, **B-088**, **B-096**) / 已決定。owner 只有一位，系統建置時建立，不能封存，v0 不移轉；登入後可改自己的密碼，忘記密碼於系統外重設。

**Q-047** — Decided. An `ADMIN` can change their own password (must enter the old password) but cannot change their own role or archive themselves. (**B-004**, **B-008**, **B-012**, **B-074**, **B-096**) / 已決定。admin 可改自己的密碼（須輸入舊密碼），不能改自己的角色，也不能封存自己。

**Q-048** — Decided. Accounts can switch between `USER` and `ADMIN`; only the owner can change it. (**B-003**, **B-004**, **B-009**, **B-088**, **B-096**) / 已決定。帳戶可在 USER 與 ADMIN 之間切換，只有 owner 能改。

**Q-049** — Decided. Logged: all modifying operations, exports and downloads, viewing full bank-account numbers, and blocked unauthorized attempts; the owner's operations are logged too; ordinary viewing is not logged; only the owner can view the log. (**B-004**, **B-005**, **B-006**, **B-037**, **B-067**, **B-076**, **B-077**, **B-083**, **B-085**, **B-097**) / 已決定。所有修改、匯出與下載、查看完整帳號、被擋下的越權操作都記錄；owner 的操作也記錄；一般查看不記錄；只有 owner 能看紀錄。

**Q-050** — Decided. A cap change applies from the current year; already calculated pay is not recalculated; one company-wide value; integer NTD ≥ 0; the owner can also change it; every change is logged. (**B-004**, **B-035**, **B-075**, **B-088**) / 已決定。上限修改自當年度起套用；已算過的薪資不重算；全公司單一值；0 以上整數 NTD；owner 也能改；每次修改留紀錄。

**Q-051** — Decided. After a receipt is replaced, the old file stays openable from the entry; entries with evidence files cannot be deleted, only voided, and the files stay openable; v0 has one file per entry. (**B-004**, **B-030**, **B-076**, **B-085**, **B-088**, **B-098**) / 已決定。更換後舊憑證仍可從該紀錄點開；有證據檔的紀錄不能刪、只能作廢，檔案仍可點開；v0 一筆紀錄一個檔案。

---

## 9. Open questions and provisional answers / 未決事項與暫定答案

There are **no open questions**. Q-001–Q-051 are decided (§8). The items below are **暫定，待 Kuei 確認 / Provisional, pending Kuei**: the simplest, safest answer is already written into the listed rules and is to be implemented as written until Kuei confirms or changes it. / **沒有未決事項**。Q-001–Q-051 已決定（第 8 節）。下列為**暫定，待 Kuei 確認**：最簡單、最安全的答案已寫入所列規則，Kuei 確認或修改前依此實作。

**Q-052** — 暫定，待 Kuei 確認 / Provisional, pending Kuei. On the sign-in screen the owner is listed under the `admin` type, and lands on the confirmation page like an `ADMIN`. / 登入時 owner 列在 `admin` 類型下，落地頁同 `ADMIN` 為確認頁。 Affects / 影響：**B-060**, **B-096**.

**Q-053** — 暫定，待 Kuei 確認 / Provisional, pending Kuei. The owner's own password change requires the current password; the 5-failure, 15-minute sign-in lock also applies to the owner. / owner 改自己的密碼須輸入目前密碼；密碼錯 5 次鎖 15 分鐘也適用 owner。 Affects / 影響：**B-004**, **B-008**, **B-089**, **B-096**.

**Q-054** — 暫定，待 Kuei 確認 / Provisional, pending Kuei. The owner account's fields (zone, bank, fixed salary, and so on) are changed only by the owner; payroll treats the owner like an `ADMIN` (included if confirmed reports or positive fixed salary; no retention). / owner 帳戶的欄位只由 owner 修改；計薪時 owner 比照 `ADMIN`（有已確認回報或正的固定薪資才納入；不扣保留金）。 Affects / 影響：**B-045**, **B-047**, **B-096**.

**Q-055** — 暫定，待 Kuei 確認 / Provisional, pending Kuei. Apart from their own password, an `ADMIN`'s own account fields (bank, payment method, fixed salary, insurance, and so on) are changed only by the owner. / 除了自己的密碼，`ADMIN` 自己帳戶的其他欄位只由 owner 修改。 Affects / 影響：**B-004**, **B-074**, **B-096**.

**Q-056** — 暫定，待 Kuei 確認 / Provisional, pending Kuei. For an `ADMIN`, account management lists `USER` accounts only; `ADMIN` accounts are listed and managed on the owner's Admin management page. Payroll still lists every included account. / `ADMIN` 的帳戶管理只列 `USER`；`ADMIN` 帳戶在 owner 的管理員管理頁列出與管理。計薪仍列所有納入的帳戶。 Affects / 影響：**B-004**, **B-074**, **B-096**.

**Q-057** — 暫定，待 Kuei 確認 / Provisional, pending Kuei. Switching an account to `ADMIN` requires its big-meter flag to be off first; switching does not change existing reports; payroll uses the account's role at the time of calculation, as before. / 切換為 `ADMIN` 前須先關閉大表旗標；切換不改既有回報；計薪照舊依計算當時的角色。 Affects / 影響：**B-003**, **B-004**, **B-011**, **B-088**, **B-096**.

**Q-058** — 暫定，待 Kuei 確認 / Provisional, pending Kuei. Ordinary sign-in and sign-out are not logged; an account lockout is logged with a system actor; requests from someone not signed in are not logged; a blocked attempt records the actor, the attempted action, and “refused”. New types: `EXPORT`, `FILE_DOWNLOAD`, `ACCESS_DENIED`, `LEDGER_VOID`, `ACCOUNT_ROLE_CHANGE`, `ACCOUNT_LOCKOUT`; a cap change is `SYSTEM_CONFIG` with old and new values. / 一般登入、登出不記錄；帳戶鎖定以系統操作者記錄；未登入者的請求不記錄；被擋下的嘗試記錄操作者、嘗試的操作與「已拒絕」。新增上列類型；修改上限記為 `SYSTEM_CONFIG` 並含新舊值。 Affects / 影響：**B-037**, **B-089**, **B-097**.

**Q-059** — 暫定，待 Kuei 確認 / Provisional, pending Kuei. Audit rows are kept permanently and nobody, including the owner, can edit or delete them. / 變動紀錄永久保留，任何人（含 owner）都不能修改或刪除。 Affects / 影響：**B-037**, **B-067**.

**Q-060** — 暫定，待 Kuei 確認 / Provisional, pending Kuei. Each calendar year keeps the cap in effect for it (earlier years unchanged); any payroll calculated after the change for a current-year period uses the new cap, while results already calculated, exported, or archived stay as they were; no upper limit; 0 means no retention; if the new cap is below what someone already had retained this year, their later period retention is 0 and the shown year-to-date is clamped, with no automatic refund. Error text: 「保留金年度上限須為 0 以上的整數」. / 每個日曆年保留當年生效的上限（往年不變）；修改後才計算的當年度薪資用新上限，已算出、匯出或歸檔的結果不變；無上限值上限；0 表示不扣；新上限低於某人今年已扣金額時，其後各期為 0、畫面累計夾在上限、不自動發還。錯誤訊息如左。 Affects / 影響：**B-035**, **B-046**, **B-047**, **B-048**, **B-088**, **B-090**.

**Q-061** — 暫定，待 Kuei 確認 / Provisional, pending Kuei. A voided ledger entry stays listed and marked 「作廢」; it is excluded from the income and expense totals and the 零用金餘額; it cannot be edited, settled, or un-voided in v0; it is in the Excel export marked 「作廢」; any entry can be voided. / 作廢紀錄仍列出並標示「作廢」；不計入收支合計與零用金餘額；v0 不能修改、沖銷或取消作廢；Excel 匯出包含並標示；任何紀錄都可作廢。 Affects / 影響：**B-031**, **B-076**, **B-084**, **B-088**, **B-098**, **BDD-008**.

**Q-062** — 暫定，待 Kuei 確認 / Provisional, pending Kuei. An entry has one current evidence file; earlier files are listed on the entry as previous versions; a file can be replaced but not removed; an entry that has ever had a file counts as having evidence (so it can only be voided). / 每筆紀錄一個現行證據檔；舊檔列為先前版本；檔案只能更換、不能移除；曾有過檔案的紀錄即視為有證據檔（只能作廢）。 Affects / 影響：**B-030**, **B-085**, **B-098**.

---

## 10. Out of scope for this specification / 本規格不寫的內容

**EN.** Storage engines, table or column design, API routes, framework and library names, hosting, and source-file layout are intentionally absent. Identity-provider or access-policy architecture is covered in a separate architecture report and is not restated here, except for the user-visible rules in §7.

**ZH.** 儲存引擎、資料表或欄位設計、API 路由、框架與函式庫名稱、託管方式、原始檔配置，本規格有意不寫。身分提供者或存取政策架構見另一份架構報告，此處只保留第 7 節使用者可見的規則。

---

*Final (定稿) applied Kuei's decisions of 2026-11-11 01:21, 01:37, 01:43, 01:48, 01:55, the Q-041 clarification of 01:58, Q-042 of 02:56, the B-035 and B-085 corrections of 03:42 and 03:44, and Q-043–Q-051 of 03:52 (Asia/Taipei). No open questions; Q-052–Q-062 are provisional.*  
*定稿已套用 Kuei 於 2026-11-11 01:21、01:37、01:43、01:48、01:55、01:58（Q-041 補充）、02:56（Q-042）、03:42（B-035 修正）與 03:44（B-085 修正）與 03:52（Q-043–Q-051）（Asia/Taipei）的裁決。沒有未決事項；Q-052–Q-062 為暫定。*
