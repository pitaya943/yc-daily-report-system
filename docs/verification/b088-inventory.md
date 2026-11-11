# B-088 field inventory (Round 6)

Source: `docs/behavior-spec-final.md` §3.7 table (L304–L321, L346–L355) plus every field accepted on a registered write route (`apps/api/src/write-route-registry.ts`).

Rejection test bar: **(a)** HTTP 4xx, **(b)** exact spec Chinese message, **(c)** no DB write (read-back unchanged).

| spec line | field | rule | spec Chinese message (verbatim) | server-side check file:line | rejection test name (file:test) | status |
|---|---|---|---|---|---|---|
| L304 | displayName | 1–50, not whitespace | 「請輸入顯示名稱」；超長：「顯示名稱最多 50 個字」；重複：「此顯示名稱已被使用」 | `packages/validation/src/validators.ts:12` | `write_validation_B088.spec.ts` auth-sign-in; `vera-round6-b088.spec.ts` [R6 L304] | FIXED-R6 |
| L305 | password | 6–30 | 「密碼長度須為 6 至 30 個字」 | `packages/validation/src/validators.ts:24` | `vera-round6-b088.spec.ts` [R6 L305]; `validators.spec.ts` | FIXED-R6 |
| L306 | passwordConfirm | must match | 「兩次輸入的密碼不一致」 | `apps/api/src/accounts/accounts.service.ts` (password change) | `write_validation_B088.spec.ts` password-change; `vera-round6-b088.spec.ts` [R6 L307] | FIXED-R6 |
| L307 | currentPassword | correct when self-change | 「目前密碼不正確」 | `apps/api/src/accounts/accounts.service.ts` | `vera-round4.spec.ts` [R4-5] | OK |
| L308 | role | ADMIN/USER; switch rules | 「請選擇角色」；… | `packages/validation/src/financial-field-validators.ts` (switch/role) | `vera-round5-f5a.spec.ts` [F-5a L308] | OK |
| L309 | zone | WEST/SOUTH required | 「請選擇施工區域」 | `packages/validation/src/financial-field-validators.ts:44` `validateZoneRequired` | `vera-round6-b088.spec.ts` [R6 L309]; `write_validation_B088.spec.ts` account-create-user | FIXED-R6 |
| L310 | bigMeter | confirm when on | 「請確認是否為大表帳戶」 | `packages/validation/src/financial-field-validators.ts` | `vera-round5-f5a.spec.ts` [F-5a L310] | OK |
| L311 | paymentMethod | TRANSFER/CASH | 「請選擇發薪方式」；轉帳但無帳號：「請先設定銀行帳號再改為轉帳」 | `packages/validation/src/financial-field-validators.ts` | `vera-round6-b088.spec.ts` [R6 L311]; `vera-round4.spec.ts` TRANSFER | FIXED-R6 |
| L312 | bankAccount | 14 digits | 「銀行帳號須為 14 位數字（3 位分行＋11 位帳號）」；金鑰缺失… | `packages/validation/src/bank-validators.ts` | `vera-round6-b088.spec.ts` [R6 L312]; `bank_missing_key_F6.spec.ts` | FIXED-R6 |
| L313 | insuranceDeduction | int ≥0; enrolled min 1 | 「勞健保扣除額須為 0 或正整數」；已投保但小於 1：「已投保時，扣除額須至少為 1」 | `packages/validation/src/financial-field-validators.ts` | `vera-round6-b088.spec.ts` [R6 L313]; `vera-round4.spec.ts` enrolled+0 | FIXED-R6 |
| L314 | uninsuredRate | 0–100, 2dp | 「未投保扣除比例須為 0 到 100 之間，最多兩位小數」 | `packages/validation/src/financial-field-validators.ts` | `vera-round5-f5a.spec.ts` [F-5a L314] | OK |
| L315 | uninsuredExempt | boolean confirm | 「請確認是否免扣未投保比例」 | `packages/validation/src/financial-field-validators.ts` | `vera-round5-f5a.spec.ts` [F-5a L315] | OK |
| L316 | fixedSalary | int ≥0 | 「固定薪資須為 0 或正整數」 | `packages/validation/src/financial-field-validators.ts:105` | `vera-round5-f5a.spec.ts` [F-5a L316] | OK |
| L317 | fixedSalaryManual | int ≥0 (payroll body) | 「固定薪資須為 0 或正整數」 | `apps/api/src/payroll/payroll.service.ts:62` | `vera-round6-b088.spec.ts` [R6 L317] ×2 | FIXED-R6 |
| L318 | fixedSalaryAddBack | optional action | — | `apps/api/src/payroll/payroll.service.ts` | — (no invalid-value rejection) | GAP-FOUND-R6 |
| L319 | payFixedEveryPeriod | boolean | — | `apps/api/src/accounts/accounts.service.ts` | — | GAP-FOUND-R6 |
| L320 | retentionOffset | int (may be negative) | 「保留金調整須為整數（可為負）」 | `packages/validation/src/financial-field-validators.ts` | `vera-round6-b088.spec.ts` [R6 L320]; `write_validation_B088.spec.ts` retention-offset | FIXED-R6 |
| L321 | perItemRetentionRate | 0–9999 int | 「保留金費率須為 0 到 9999 的整數（NTD/只）」 | `packages/validation/src/financial-field-validators.ts` | `vera-round6-b088.spec.ts` [R6 L321]; `write_validation_B088.spec.ts` account-item-retention | FIXED-R6 |
| L322 | reportDate | today..-30d | 「回報日期須為今天或往前 30 天內，不可選擇未來日期」 | `packages/validation/src/report-validators.ts` | `write_validation_B088.spec.ts` report-create | OK |
| L323 | workItemQty | 0–999.9 step 0.1 | 「工項數量須為 0 到 999.9，最小單位 0.1」 | `packages/validation/src/report-validators.ts` | `write_validation_B088.spec.ts` report-update | OK |
| L324 | collaborators | 0–6 same zone | 「共同作業者最多 6 人，且須為同一區域、同一類型的啟用員工」 | `apps/api/src/reports/reports.service.ts` | `s6a_B022_B037.spec.ts` | OK |
| L325–L327 | custom item fields | name/qty/price rules | (per spec) | `packages/validation/src/custom-item-validators.ts` | `validators.spec.ts` / report integration | OK |
| L328–L337 | material admin fields | codes, names, tabs, qty | (per spec) | `packages/validation/src/material-field-validators.ts` | `write_validation_B088.spec.ts` material-* | OK |
| L338 | import file | xlsx/csv headers | 「請上傳 xlsx 或 csv 檔…」 | `packages/validation/src/import-b054.ts` | `write_validation_B088.spec.ts` material-import | OK |
| L339–L345 | ledger fields | date, type, amount, … | (per spec) | `packages/validation/src/ledger-validators.ts` | `ledger_B076.spec.ts`; `write_validation_B088.spec.ts` ledger-create | OK |
| L346 | unitPrice | ≥0, 2dp; payroll completeness | 「單價須為 0 或正數，最多兩位小數」；計薪時：「單價尚未設定完整，無法計算薪資，請先補齊單價」 | `packages/validation/src/financial-field-validators.ts`; `payroll.service.ts:166` | `vera-round6-b088.spec.ts` [R6 L346], [R6 L347]; `write_validation_B088.spec.ts` unit-price | FIXED-R6 |
| L348 | globalRetentionRate | 0–9999 int | 「全域保留金費率須為 0 到 9999 的整數（NTD/只）」 | `packages/validation/src/financial-field-validators.ts` | `vera-round5-f5a.spec.ts` [F-5a L348] | OK |
| L349 | retentionAnnualCap | int ≥0 | 「保留金年度上限須為 0 以上的整數」 | `packages/validation/src/financial-field-validators.ts` | `vera-round6-b088.spec.ts` [R6 L350]; `retention-cap_B035.spec.ts` | FIXED-R6 |
| L350 | sign-in account | required | 「請選擇帳戶」 | `apps/api/src/auth/auth.service.ts` | `write_validation_B088.spec.ts` auth-sign-in (displayName empty) | OK |
| L351 | sign-in password | lockout messages | 「密碼錯誤，請重試」；「密碼錯誤次數過多…」 | `apps/api/src/auth/auth.service.ts` | `auth-lockout_B080.spec.ts`; `signin-rate-limit_B080.spec.ts` | OK |
| L352 | daily report cap | max 3/day | 「每日最多只能送出 3 筆回報」 | `apps/api/src/reports/reports.service.ts` | `daily-cap_B025_BDD006.spec.ts` | OK |
| L353 | payroll dates | start ≤ end | 「請輸入正確的開始與結束日期」；「結束日期不可早於開始日期」 | `packages/validation/src/payroll-date-validators.ts` | `vera-round6-b088.spec.ts` [R6 L353]; `write_validation_B088.spec.ts` payroll-calculate | FIXED-R6 |
| L354 | is10thPayday | optional flag | — | `apps/api/src/payroll/payroll.service.ts` | — | GAP-FOUND-R6 |
| L355 | filter fields | valid or empty | 「請輸入有效的篩選條件」 | statistics validators | `write_validation_B088.spec.ts` statistics-* (date bad) | OK |
| L356 | archive type/date | DAILY/MONTHLY + date | 「請選擇報表類型與日期」 | `apps/api/src/archives/archives.service.ts` | `write_validation_B088.spec.ts` archive-daily | OK |
| L357 | year-end year | valid year | 「請選擇要結算的年度」 | `apps/api/src/retention/retention.service.ts` | `write_validation_B088.spec.ts` retention-year-end | OK |
| L358–L359 | account archive actions | B-006 messages | (per spec) | `apps/api/src/accounts/accounts.service.ts` | `authz-admin_B096.spec.ts`; `accounts_B074.spec.ts` | OK |

## Write-route-only validators (no dedicated spec row)

| spec line | field | rule | spec Chinese message (verbatim) | server-side check file:line | rejection test name (file:test) | status |
|---|---|---|---|---|---|---|
| — | ledger evidence upload | format/size | 「憑證格式不支援…」；「憑證檔案超過 10MB 上限」 | `apps/api/src/ledger/ledger.service.ts` | `ledger_B076.spec.ts` (partial) | GAP-FOUND-R6 |
| — | confirmation batch ids | non-empty ids | (workflow messages) | confirmation service | `write_validation_B088.spec.ts` (404/400 only) | GAP-FOUND-R6 |
| — | material remainingQty | stock rules | 「數量須為 0 或正數，最多三位小數」 | `material-field-validators` | `write_validation_B088.spec.ts` material-admin-update | OK |

## Round 6 code changes (FIXED-R6)

| item | change |
|---|---|
| L309 | `validateZoneRequired`; `createUser` no longer defaults `zone` to WEST |
| L317 | `validateFixedSalary` on each `fixedSalaryManual` value before payroll writes |
| L347 | Preflight `neededPriceKeys` before `payroll_runs` insert; message via `ValidationMessages.unitPriceIncompletePayroll` |
