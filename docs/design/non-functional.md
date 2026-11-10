# Non-functional requirements / 非功能需求

Source / 來源：spec §7 (B-078–B-087) plus design-capacity and validation rules that apply to v0 (B-002, B-088, B-079 session already in §7). Region and backups are stated only as far as the spec and the approved stack allow; nothing beyond that is invented.

來源為規格第 7 節，並加上適用於 v0 的設計容量與驗證。地區與備份只寫規格與已定技術棧有依據的部分，不另行發明規則。

---

## 1. Security / 安全

### 1.1 Session and transport / 工作階段與傳輸 (**B-079**)

**EN.** Session cookies must not be readable by page scripts (HttpOnly), must use `SameSite=Lax` (or stricter), and must be marked Secure in production. All state-changing requests must be authenticated and protected against CSRF. After sign-in, unused sessions end after **30 minutes**. There is no remember-me cookie that outlives this idle window (**Removed**).

**ZH.** 工作階段 cookie 不可被頁面腳本讀取（HttpOnly）、須 `SameSite=Lax`（或更嚴），正式環境須 Secure。所有會改變資料的請求必須已通過身分驗證，並防止跨站請求偽造。登入後若無操作，**30 分鐘**結束工作階段。沒有可比此閒置時間更長的「記住我」cookie（已 Removed）。

### 1.2 Sign-in lockout and rate limit / 登入鎖定與速率限制 (**B-089**, **B-080**)

**EN.** Per-account: 5 incorrect passwords → 15-minute lock (also the owner, `PROVISIONAL(Q-053)`). Count resets on success, when the lock ends, or after 15 minutes with no further failure. Extra protection, not a replacement: at most 10 sign-in attempts per client address per minute, enforced consistently across process restarts and multiple workers (shared store, see `data-model.md` `signin_rate_limits`).

**ZH.** 依帳戶：密碼錯誤 5 次鎖 15 分鐘（也適用 owner，暫定 Q-053）。成功、鎖定結束、或 15 分鐘內沒有再失敗則歸零。額外保護：同一用戶端位址每分鐘最多 10 次登入嘗試，跨重啟與多執行個體一致。

### 1.3 Bank-account encryption, fail closed / 銀行帳號加密，fail closed (**B-081**, **B-014**, **B-093**)

**EN.** Bank account numbers are encrypted at rest. Plaintext must never be stored, including when the encryption key is missing. If the key is missing: the rest of the system keeps running; bank fields show 「無法讀取」; exports and edits that need the number are blocked. Default display is last four digits only. Key management is an operations concern; the user-visible behaviour above is required. The key is not in the repo, in PRs, or in reports.

**ZH.** 銀行帳號靜態加密。即使金鑰缺失也絕不存明文。金鑰缺失時其餘功能照常，銀行欄顯示「無法讀取」，並擋下需要該號碼的匯出與修改。預設只顯示後四碼。金鑰管理屬營運事項，但上述使用者可見行為為必要需求。金鑰不進倉庫、PR 或報告。

### 1.4 Financial-field visibility / 財務欄位可見性 (**B-082**)

**EN.** A `USER` must never see another person's bank account, insurance amount, uninsured rate, retention, or payroll figures. They may see their own as in B-004, with the bank number masked to the last four unless they reveal it under B-093 (logged). An `ADMIN` (and the owner, same visibility) may see all of them when performing payroll, account management, or exports, with the same last-four default and logged reveal. Ledger and archives are administrator-only.

**ZH.** `USER` 不得看到他人的銀行帳號、勞健保、未投保比例、保留金或薪資。可以看自己的；銀行預設後四碼，依 B-093 點看全碼並留紀錄。`ADMIN`（與 owner 可見範圍相同）在計薪、帳戶管理或匯出時可見全部，仍預設後四碼。流水帳與日月報僅管理員可及。

### 1.5 Consistent authorization / 授權必須前後端一致 (**B-087**, **B-006**, **B-096**)

**EN.** Interface disabling is not enough. Every create, update, delete, confirm, export, and download must be re-checked on the server for role, ownership, and status (for example a `USER` must not edit a confirmed report even if they send the request directly; an `ADMIN` must not add, archive, or modify an `ADMIN` account even if they send the request directly). NestJS is the first line; RLS is the second (see `data-model.md`).

**ZH.** 不能只靠畫面停用按鈕。所有新增、修改、刪除、確認、匯出、下載都必須在伺服端再檢查角色、歸屬與狀態。NestJS 為第一道防線，RLS 為第二道。

### 1.6 Evidence and archive links / 證據檔與歸檔連結 (**B-085**)

**EN.** Ledger evidence is kept permanently. Each open creates a new signed URL that expires after 3,600 seconds and must not be stored as a long-lived address. Archive download links use the same lifetime. Opens are logged (B-097).

**ZH.** 流水帳證據檔永久保留。每次點開都產生新的短效連結（3,600 秒後失效），不得當長期網址保存。歸檔下載連結同樣。點開須留紀錄。

### 1.7 Audit completeness / 稽核完整性 (**B-083**, **B-037**, **B-097**)

**EN.** Every successful action listed in B-037 writes an audit row in Taiwan time, with enough description to see what changed. Automatic archive generation may have a system actor. Automatic New Year reset, if it writes a row, uses a system actor; the formal close is B-090. Full scope is B-097: all modifying operations, exports/downloads, full bank-number views, and blocked attempts, including the owner's; ordinary viewing is not logged. Rows are permanent and immutable (`PROVISIONAL(Q-059)`).

**ZH.** B-037 列出的成功操作都要寫一筆台灣時間的變動紀錄，說明須足以看出改了什麼。自動歸檔可以是系統操作者。完整範圍見 B-097。紀錄永久且不可改（暫定 Q-059）。

---

## 2. Validation and Chinese error messages / 驗證與中文錯誤訊息 (**B-088**)

**EN.** For every field in spec §3.7, the interface shows an instant hint when the value is missing or invalid. The server **always** re-validates the same rules. A request that only passed the interface but fails the server is refused, and the **Chinese error message from the field table** is returned. “Characters” count as user-visible length (one CJK character = one). Money is NTD; quantity math stays exact at the 0.1-unit layer; monetary amounts are rounded to whole NTD only at payroll (spec §0, B-049).

**ZH.** 規格 §3.7 每個欄位，前端在缺漏或格式不正確時須即時提示。伺服端必須用同一套規則再驗證一次。只通過前端、未通過伺服端的請求須拒絕，並回傳欄位表中的中文錯誤訊息。「字」以使用者可見長度計。金額單位為 NTD；只數運算在 0.1 只層保持精確；金額只在計薪時四捨五入到整數元。

The canonical user-visible strings (do not paraphrase in the product) / 產品內不得改寫的使用者可見字串：

| Context / 情境 | Message / 訊息 |
|---|---|
| Display name missing / long / duplicate | 「請輸入顯示名稱」；「顯示名稱最多 50 個字」；「此顯示名稱已被使用」 |
| Password length / confirm / current | 「密碼長度須為 6 至 30 個字」；「兩次輸入的密碼不一致」；「目前密碼不正確」 |
| Role / zone / payment / bank | 「請選擇角色」；「請先關閉大表旗標，再切換為管理員」 `PROVISIONAL(Q-057)`；「請選擇施工區域」；「請選擇發薪方式」；「請先設定銀行帳號再改為轉帳」；「銀行帳號須為 14 位數字（3 位分行＋11 位帳號）」；「銀行帳號目前無法讀取，無法修改」 |
| Insurance / uninsured / fixed / retention | 「勞健保扣除額須為 0 或正整數」；「已投保時，扣除額須至少為 1」；「未投保扣除比例須為 0 到 100 之間，最多兩位小數」；「固定薪資須為 0 或正整數」；「保留金調整須為整數（可為負）」；「保留金費率須為 0 到 9999 的整數（NTD/只）」；「全域保留金費率須為 0 到 9999 的整數（NTD/只）」；「保留金年度上限須為 0 以上的整數」 `PROVISIONAL(Q-060)` |
| Report date / qty / collaborators / custom / cap | 「回報日期須為今天或往前 30 天內，不可選擇未來日期」；「工項數量須為 0 到 999.9，最小單位 0.1」；「共同作業者最多 6 人，且須為同一區域、同一類型的啟用員工」；「自訂工項名稱最多 100 個字」；「自訂工項數量須為 0 到 999.9，最小單位 0.1」；「自訂工項單價須為 0 或正整數」；「每日最多只能送出 3 筆回報」 |
| Materials | 「請輸入材料名稱」；「材料名稱最多 100 個字」；「材料編號最多 50 個字」；「規格最多 200 個字」；「請輸入單位」；「單位最多 20 個字」；「數量須為 0 或正數，最多三位小數」；「分頁須為 1 到 10」；「分頁名稱最多 50 個字」；「申請數量須為 1 到 99 的整數」；「庫存不足，無法申請」；「此材料目前不可申請」；「備註最多 50 個字」；「請上傳 xlsx 或 csv 檔，且標題列須含「材料編號」與「實領量」」；「庫存不足，無法核准」 |
| Ledger | 「請輸入記帳日期」；「請選擇收入或支出」；「金額必須為正整數」；「請輸入摘要」；「摘要最多 200 個字」；「請選擇有效的分類」；「備註最多 100 個字」；「僅支出可指定支出者」；「憑證格式不支援（僅接受 PDF / JPG / PNG / WebP）」；「憑證檔案超過 10MB 上限」；「此紀錄有證據檔案，不能刪除，只能作廢」；「此紀錄已作廢」 `PROVISIONAL(Q-061)` |
| Prices / payroll dates | 「單價須為 0 或正數，最多兩位小數」；「單價尚未設定完整，無法計算薪資，請先補齊單價」；「請輸入正確的開始與結束日期」；「結束日期不可早於開始日期」 |
| Sign-in | 「請選擇帳戶」；「密碼錯誤，請重試」；「密碼錯誤次數過多，請在 15 分鐘後再試」 |
| Archive | 「不能封存自己目前登入的帳戶」；「owner 帳戶不能封存」 |
| Other | 「請選擇報表類型與日期」；「請選擇要結算的年度」；「請輸入有效的篩選條件」；「請確認是否為大表帳戶」；「請確認是否免扣未投保比例」 |

Forbidden role breaches use a forbidden error (not a silent skip) and are logged (**B-006**, **B-097**).

越權以禁止存取拒絕（非默默略過）並留紀錄。

---

## 3. Time, region, and scheduling / 時間、地區與排程 (**B-078**)

**EN.** All user-facing dates, the 1 January 00:00 retention reset, idle timeout, and B-077 jobs use **Asia/Taipei**. The approved stack (done-when item 2) places Supabase and Railway in **Asia** (`asia-southeast1-eqsg3a` for Railway, as given to engineering). Automatic jobs must not generate a duplicate automatic archive for the same type and date after a process restart. If more than one worker would run the same job, at most one automatic archive per type and date is produced (unique constraint + lock; see `data-model.md`).

**ZH.** 所有使用者面對的日期、1 月 1 日 00:00 的保留金歸零、閒置逾時，以及 B-077 的排程，均用 **Asia/Taipei**。已定技術棧將 Supabase 與 Railway 放在**亞洲**。自動作業在行程重啟後也不得為同一類型與日期重複生成自動歸檔；多執行個體時同一類型與日期最多一份自動歸檔。

---

## 4. Performance and capacity / 效能與容量 (**B-002**, **B-086**)

**EN.** There is no headcount cap. The old planning size (~10 `ADMIN` and ~75 `USER`) is only a reference; the system must be designed to operate at **ten times that scale or more** (B-002). v0 implications, without inventing numeric SLAs the spec does not state: list endpoints are paginated (defaults below); payroll, exports, and inventory import run on the server and must remain correct at that scale; indexes in `data-model.md` support the main filters (date, account, status, actor, type).

**ZH.** 沒有人數上限。舊規劃規模僅供參考；新系統須按 **10 倍或以上** 設計（B-002）。規格未寫數值 SLA，v0 只要求：列表要分頁；計薪、匯出、庫存匯入在該規模下仍正確；資料模型索引支援主要篩選。

Pagination defaults (**B-086**): 20 rows (history, confirmation, material requests on confirmation, audit, ledger); 25 (big-meter history); 30 (archives).

State-changing submits may show a full-page wait indicator, **except export/download actions, which must not**. Short success or error messages appear after actions and may fade after about 5 seconds. Instant validation hints follow B-088. Quantities and money display follow B-058 (0.1-unit formatting, thousands separators, negative payroll money in red in exports).

會改資料的送出可顯示全頁等待，但匯出/下載不得使用。操作後顯示簡短成功或錯誤訊息，約 5 秒後可淡出。數量與金額顯示依 B-058。

---

## 5. Logging / 紀錄 (**B-037**, **B-083**, **B-097**)

Covered in §1.7 and in `data-flow.md` §8. v0 application logs (request traces, errors) must not contain bank-account plaintext, session cookies, Auth tokens, or encryption keys. Audit rows are the user-visible log; they contain last-four or “revealed” events, not a second plaintext copy of the bank number unless the description must show that a reveal occurred (who, whose account, when — B-093). Do not put secrets in those descriptions.

應用程式日誌不得含銀行帳號明文、session cookie、Auth token 或加密金鑰。變動紀錄為使用者可見紀錄；B-093 記錄誰、看了誰、何時，描述中不得再寫一份帳號明文。

---

## 6. Backups, as applicable to v0 / 備份（僅 v0 適用範圍）

**EN.** The spec does not define a backup RPO/RTO. v0 uses managed Supabase Postgres + Storage in Asia; point-in-time / automated backups are an operations property of that service, not a user feature. Product rules that interact with durability: ledger evidence is kept permanently (B-085); audit rows are kept permanently (`PROVISIONAL(Q-059)`); “already calculated” payroll snapshots must not be overwritten (B-035); automatic archives must not be duplicated (B-078). Restoring from a backup is an operations action and, like other irreversible operations, needs Kuei's approval before it is done in a shared environment. This document does not add a custom backup product.

**ZH.** 規格未定義備份 RPO/RTO。v0 使用亞洲區的託管 Supabase Postgres 與 Storage，自動備份屬該服務的營運性質，不是產品功能。與持久性有關的產品規則：證據檔永久保留（B-085）；變動紀錄永久保留（暫定 Q-059）；已計算薪資快照不得覆寫（B-035）；自動歸檔不得重複（B-078）。在共用環境還原備份屬不可逆操作，須先經 Kuei 核准。本文不另加自訂備份產品。

---

## 7. Interface behaviour and exports / 介面行為與匯出 (**B-086**, **B-084**)

**EN.** Export formats: history, materials, ledger, summary, and payroll Excel as `.xlsx`. Payroll Excel is one file with a summary sheet then one detail sheet per person. Payroll also `.pdf` (A4 landscape, printable Traditional Chinese) and Word `.docx` (板信商業銀行 salary-transfer slip). Inventory import: `.xlsx` or `.csv`. Receipts: PDF, JPEG, PNG, WebP, max 10 MB. Archive download: Excel and PDF when present. Ledger Excel includes voided entries marked 「作廢」 (`PROVISIONAL(Q-061)`). Character encoding and fonts must display Traditional Chinese correctly.

**ZH.** 匯出格式見上。字元與字型須正確顯示繁體中文。流水帳 Excel 含已作廢紀錄並標示「作廢」（暫定 Q-061）。

---

## 8. B-rules covered in this document / 本文件涵蓋的 B 規則

B-002, B-006, B-014, B-037, B-049, B-058, B-078, B-079, B-080, B-081, B-082, B-083, B-084, B-085, B-086, B-087, B-088, B-089, B-093, B-096, B-097.

