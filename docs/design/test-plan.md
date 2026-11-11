# Test plan / 測試計畫

Done-when items 3–4 require a traceability table from every non-Removed B-rule and every §6.12 BDD example to at least one automated test, and explicit coverage of money/quantity rules (B-091 allocation, payroll, retention cap, petty cash) and permission rules (B-004, B-006, B-087, B-096, B-097), including double-deduction and admin-managing-admin. / 完成條件第 3–4 條要求每條非 Removed 的 B 規則與第 6.12 節每個 BDD 範例都有自動化測試，且金額、數量與權限規則（含重複扣庫存、admin 管 admin）有明確測試。

**Removed B-rules / 被標為 Removed 的 B 規則：** none. Every ID from B-001 to B-098 is an active rule. Behaviours *inside* rules that are marked Removed are listed in §5 and are tested as absences (the product must not offer them). / **沒有整條 B 規則被標為 Removed。** B-001 至 B-098 皆為有效規則。規則內標記 Removed 的舊行為見第 5 節，以「產品不得提供」的反向測試覆蓋。

Provisional answers are implemented as written and tagged `PROVISIONAL(Q-0xx)` in test names or describes so they are easy to change. / 暫定答案照寫實作，並在測試名稱標註，方便之後修改。

---

## 1. Test layers / 測試層級

| Layer / 層級 | Where / 位置 | What it proves / 驗證內容 | Runner |
|---|---|---|---|
| Unit / 單元 | `apps/api/src/**/*.spec.ts` (NestJS), `apps/web/**/*.test.ts` when a pure UI helper exists | Pure functions: B-044 split, B-049 rounding, B-050 uninsured, B-046–B-048 cap clamp, B-053 denominations, B-027 invariant, B-054 import math, B-088 field validators (Chinese messages), password length, bank-digit normalisation | Jest |
| Integration / 整合 | `apps/api/test/integration/*.spec.ts` | Against **local** Supabase via `supabase start` (Auth + Postgres + Storage + RLS). Transactions, unique constraints, B-056 approve guard, B-091 persist/clear shares, B-081 fail-closed bank key, B-089 lockout, B-080 rate limit across workers (two API processes, one DB), audit append-only, archive uniqueness (B-078) | Jest + `supabase start` |
| BDD / e2e | `e2e/*.spec.ts` | Playwright against a local or CI stack (`apps/web` + `apps/api` + local Supabase). Every §6.12 example and the main story acceptances. Seeded users (see §3). No production hosts, no real secrets | Playwright |

**EN.** Unit tests do not boot Supabase. Integration tests may not call Railway, Vercel, or the hosted Supabase project. E2E uses the seed accounts only. Chinese error strings are asserted verbatim from §3.7 / `non-functional.md`.

**ZH.** 單元測試不啟動 Supabase。整合測試不得連到 Railway、Vercel 或託管的 Supabase 專案。E2E 只用種子帳戶。中文錯誤字串須與 §3.7 原文一致。

---

## 2. CI plan / CI 計畫 (GitHub Actions)

**EN.** On every PR to the repo (never a direct push to `main`):

**ZH.** 每支 PR 執行（絕不直接推 `main`）：

1. `lint` + typecheck for `apps/web` and `apps/api`.
2. Unit tests.
3. Start local Supabase (`supabase start` in `supabase/`), run migrations and seed, run integration tests, then `supabase stop`.
4. Playwright e2e against that same local stack (or a CI service container of it).
5. Coverage gate: the traceability table in this file is also generated as a checklist in CI (`scripts/check-b-rule-coverage.mjs` or the design `check-coverage.py` extended to scan `apps/` and `e2e/` once those files exist). v0 design stage only checks that this plan *names* a test for every non-Removed B-rule.

GitHub identity on the workflow is the repo's default; opening the PR itself is always as `bullet-bots` (team rule; not part of the test runner). No secrets in logs. The bank encryption key used in CI is a **test-only** key injected as a GitHub Actions secret / env, never printed.

CI 用的銀行加密金鑰為測試專用，由 Actions 環境注入，絕不印出。

Suggested workflow path / 建議工作流程路徑：`.github/workflows/ci.yml`.

---

## 3. Seed data / 種子資料

**EN.** Loaded by `supabase/seed.sql` (and a repeatable `pnpm seed` for local/e2e). Passwords meet B-008 (6–30) and live only in local/CI env, not in this document as real secrets. Display names below are stable fixtures.

**ZH.** 由 `supabase/seed.sql` 載入。密碼符合 B-008，只存在本機／CI 環境，本文不寫真實密鑰。下列顯示名稱為穩定測試夾具。

| Fixture id | Role | Zone | Big-meter | Notes / 說明 |
|---|---|---|---|---|
| `seed-owner` | `OWNER` | `WEST` | off | Display name `Kuei`. Created at setup. Cannot be archived (B-096). Listed under sign-in type `admin` `PROVISIONAL(Q-052)`. |
| `seed-admin` | `ADMIN` | `WEST` | off | One administrator. Used for admin-managing-admin *negative* tests against a second admin created in-test by the owner. |
| `seed-user-west` | `USER` | `WEST` | off | Ordinary west; 32-item form (B-038). |
| `seed-user-south` | `USER` | `SOUTH` | off | Ordinary south; 37-item form (B-039). |
| `seed-user-west-bm` | `USER` | `WEST` | on | Big-meter; 25 items, no `bm_40_fen` (B-040); no retention (B-043). |
| `seed-user-west-2` | `USER` | `WEST` | off | Collaborator for B-044 / BDD-001. |
| `seed-user-west-3` | `USER` | `WEST` | off | Third collaborator. |

Also seed: default `work_items` and `unit_prices` from spec §4; `system_settings` tab 1 = 「全部材料」; uninsured 3% / retention 20 both zones; `retention_annual_caps` for the current year = 60,000; a small default material catalogue tagged as placeholder until Kuei provides the official list (B-036 / Q-029); no ledger evidence files in the base seed (tests attach files themselves).

另種子：第 4 節工項與預設單價、系統設定、當年保留金上限 60,000、佔位材料清單（正式清單待 Kuei）。基礎種子不含證據檔。

---

## 4. Explicit high-risk cases (done-when item 4) / 高風險必測

| Case / 情境 | Test file / name | Rules |
|---|---|---|
| Collaboration split persisted at approval, later payroll uses stored shares not a re-split | `apps/api/src/payroll/split.spec.ts` `persistsSharesAtApproval_B044_B091`; `e2e/bdd-001-collaboration-split.spec.ts` | B-044, B-091, BDD-001 |
| Double stock deduction refused | `apps/api/test/integration/material-approve.spec.ts` `refusesSecondApprove_noDoubleDeduction_B056`; `e2e/bdd-002-duplicate-approval.spec.ts` | B-056, B-070, BDD-002 |
| Insufficient stock leaves inventory unchanged | `e2e/bdd-003-insufficient-stock.spec.ts` | B-056, BDD-003 |
| Retention cap change: current year, no recalc of past run, previous year keeps old cap | `e2e/bdd-010-retention-cap.spec.ts` | B-035, B-046, B-047, B-097, BDD-010, `PROVISIONAL(Q-060)` |
| Petty-cash cumulative balance and void excluded | `e2e/bdd-008-petty-cash.spec.ts` | B-076, B-098, BDD-008, `PROVISIONAL(Q-061)` |
| Payroll worked examples A–F | `apps/api/src/payroll/examples.spec.ts` `workedExamplesAtoF_B052` | B-049, B-050, B-052, B-091 |
| `ADMIN` cannot manage another `ADMIN` or change roles; attempt logged | `e2e/bdd-009-owner-manages-admins.spec.ts` | B-004, B-006, B-087, B-096, B-097, BDD-009 |
| `USER`/`ADMIN` cannot open audit log; attempt logged | same file + `e2e/audit-owner-only.spec.ts` | B-006, B-067, B-097 |
| Server re-check when UI would be disabled | `apps/api/test/integration/authz-direct.spec.ts` `directRequestRejected_B087` | B-087, B-006, B-064, B-096 |

---

## 5. Removed behaviours (not removed B-ids) / 已移除行為（不是整條 B 規則）

Test that the product does **not** offer these. / 測試產品**不得**提供：

| Removed behaviour / 已移除行為 | Origin | Test name |
|---|---|---|
| Separate deactivate / reactivate; `ACCOUNT_DEACTIVATE` / `ACCOUNT_REACTIVATE` | Q-032, B-012, B-074, B-095 | `e2e/removed-behaviours.spec.ts` `noDeactivateAction_B095` |
| Permanent cascade delete of an account and its records; `ACCOUNT_DELETE` | Q-019, B-095, B-037 | `noPermanentAccountDelete_B095` |
| South unit-price fallback to west | B-032, B-094 | `apps/api/src/payroll/prices.spec.ts` `noSouthFallback_B032_B094` |
| Work item `bm_40_fen` on form, prices, or payroll | Q-007, B-040 | `e2e/report-form.spec.ts` `noBm40Fen_B040` |
| Remember-me cookie / session longer than 30-minute idle | B-061, B-079 | `e2e/session.spec.ts` `noRememberMe_B061_B079` |
| `USER` sees own audit rows / `ADMIN` sees all audit rows (old B-067) | B-067 | `e2e/audit-owner-only.spec.ts` `adminAndUserForbidden_B067` |
| Replacing a receipt deletes the previous file; deleting an evidence entry deletes its file | old B-030, now B-085 / B-098 | `e2e/bdd-011-evidence.spec.ts` `replaceKeepsPrevious_B085_Q062` |

---

## 6. Traceability: B-rules / 追溯：B 規則

Every non-Removed B-rule (all of B-001–B-098) maps to at least one planned test. / 每條非 Removed 規則至少對應一個預定測試。

| ID | Planned test file / name | Layer |
|---|---|---|
| B-001 | `e2e/smoke-purpose.spec.ts` `signedInUserReachesReportAndAdminReachesConfirm` | e2e |
| B-002 | `apps/api/test/integration/capacity-indexes.spec.ts` `schemaIndexesExistForTenXLists_B002` (index/constraint presence; no invented SLA) | integration |
| B-003 | `e2e/roles.spec.ts` `threeRoles_onlyOneOwner_B003`; `e2e/bdd-009-owner-manages-admins.spec.ts` | e2e |
| B-004 | `e2e/permission-matrix.spec.ts` `matrixActions_B004` (table in permission-matrix.md, one describe per resource row) | e2e |
| B-005 | `e2e/sidebar-landing.spec.ts` `landingAndSidebarByRole_B005` | e2e |
| B-006 | `e2e/forbidden.spec.ts` `unauthenticatedRedirects_B006`; `userForbiddenLogged_B006`; `adminOwnerOnlyForbiddenLogged_B006` | e2e |
| B-007 | `apps/api/src/accounts/display-name.spec.ts` `uniqueDisplayName_B007_B088` | unit + integration |
| B-008 | `e2e/password.spec.ts` `length6to30_selfChangeNeedsCurrent_adminResetsUser_B008` | e2e |
| B-009 | `e2e/roles.spec.ts` `cannotChooseOwner_adminCreatesUserOnly_B009` | e2e |
| B-010 | `e2e/report-form.spec.ts` `zoneSelectsItemSet_B010` | e2e |
| B-011 | `e2e/report-form.spec.ts` `bigMeterFlag_B011`; `e2e/role-switch.spec.ts` `switchToAdminRequiresBigMeterOff_B011_Q057` `PROVISIONAL(Q-057)` | e2e |
| B-012 | `e2e/bdd-007-archive-restore.spec.ts` | e2e |
| B-013 | `apps/api/src/accounts/payment-method.spec.ts` `transferRequiresBank_B013` | unit + e2e |
| B-014 | `e2e/bank.spec.ts` `lastFourDefault_B014` | e2e |
| B-015 | `apps/api/src/payroll/insurance.spec.ts` `enrolledDeductedOnlyOn10th_B015` | unit |
| B-016 | `apps/api/src/payroll/uninsured.spec.ts` `zoneDefaultPercentage_B016` | unit |
| B-017 | `e2e/bdd-007-archive-restore.spec.ts` `archivePeriodFixedSalary_B017`; `laterPeriodAddBack_B017` | e2e |
| B-018 | `apps/api/src/payroll/fixed-salary.spec.ts` `payEveryPeriod_B018` | unit |
| B-019 | `apps/api/src/payroll/retention-offset.spec.ts` `offsetPerYearThenClamp_B019` | unit |
| B-020 | `apps/api/src/reports/date.spec.ts` `todayOr30DaysBackNoFuture_B020` | unit + e2e |
| B-021 | `apps/api/src/reports/quantity.spec.ts` `storedAsTenthUnits_B021` | unit |
| B-022 | `e2e/collaborators.spec.ts` `pickerRulesMax6_B022` | e2e |
| B-023 | `e2e/report-status.spec.ts` `pendingConfirmedRejected_B023` | e2e |
| B-024 | `e2e/custom-item.spec.ts` `adminCustomItemSplit_B024` | e2e |
| B-025 | `e2e/report-cap.spec.ts` `maxThreeOwnSubmissions_B025` | e2e |
| B-026 | `apps/api/src/materials/fields.spec.ts` `materialFieldLimits_B026` | unit |
| B-027 | `apps/api/src/materials/invariant.spec.ts` `receivedEqualsUsagePlusRemaining_B027` | unit + integration |
| B-028 | `apps/api/src/materials/request-fields.spec.ts` `quantity1to99_B028` | unit |
| B-029 | `e2e/material-tabs.spec.ts` `tenTabsEmptyNameHides_B029` | e2e |
| B-030 | `e2e/ledger.spec.ts` `ledgerFieldsAndReplaceKeepsFile_B030` `PROVISIONAL(Q-062)` | e2e |
| B-031 | `e2e/ledger.spec.ts` `settleClearsPayer_voidCannotSettle_B031` `PROVISIONAL(Q-061)` | e2e |
| B-032 | `apps/api/src/payroll/prices.spec.ts` `threePriceSetsNoFallback_B032` | unit |
| B-033 | `apps/api/src/payroll/uninsured.spec.ts` `zoneDefaultRates_B033` | unit |
| B-034 | `e2e/settings-retention.spec.ts` `globalRatesAndOverrides_B034` | e2e |
| B-035 | `e2e/bdd-010-retention-cap.spec.ts` `PROVISIONAL(Q-060)` | e2e |
| B-036 | `e2e/material-import.spec.ts` `comparisonLabelAndResetClears_B036` | e2e |
| B-037 | `apps/api/test/integration/audit.spec.ts` `typesAndImmutable_B037` `PROVISIONAL(Q-058,Q-059)` | integration |
| B-038 | `e2e/report-form.spec.ts` `westSees32Items_B038` | e2e |
| B-039 | `e2e/report-form.spec.ts` `southSees37Items_B039` | e2e |
| B-040 | `e2e/report-form.spec.ts` `bigMeterSees25NotBm40Fen_B040` | e2e |
| B-041 | `apps/api/src/payroll/retention-items.spec.ts` `westEightItems_B041` | unit |
| B-042 | `apps/api/src/payroll/retention-items.spec.ts` `southTwentyEightItems_B042` | unit |
| B-043 | `apps/api/src/payroll/retention-who.spec.ts` `bigMeterAdminOwnerZero_B043` `PROVISIONAL(Q-054)` | unit |
| B-044 | `apps/api/src/payroll/split.spec.ts` `largestRemainderExamples_B044`; `e2e/bdd-001-collaboration-split.spec.ts` | unit + e2e |
| B-045 | `apps/api/src/payroll/gross.spec.ts` `storedSharesTimesPrice_B045` | unit |
| B-046 | `apps/api/src/payroll/retention.spec.ts` `ytdBeforeClamp_B046` | unit |
| B-047 | `apps/api/src/payroll/retention.spec.ts` `periodRetentionRoomToCap_B047` | unit |
| B-048 | `e2e/bdd-004-year-end.spec.ts` `newYearYtdStartsAtZero_B048` | e2e |
| B-049 | `apps/api/src/payroll/examples.spec.ts` `netFinalRoundAtPayroll_B049` | unit |
| B-050 | `apps/api/src/payroll/uninsured.spec.ts` `baseIsGrossExcludingFixed_B050` | unit |
| B-051 | `apps/api/src/payroll/hide-rows.spec.ts` `dropZeroGrossAndZeroFinal_B051` | unit |
| B-052 | `apps/api/src/payroll/examples.spec.ts` `workedExamplesAtoF_B052` | unit |
| B-053 | `apps/api/src/payroll/cash-denomination.spec.ts` `greedyBills_B053` | unit |
| B-054 | `apps/api/src/materials/import.spec.ts` `compareAandB_B054` | unit |
| B-055 | `e2e/material-quarantine.spec.ts` `trustAorB_B055` | e2e |
| B-056 | `apps/api/test/integration/material-approve.spec.ts`; `e2e/bdd-002-duplicate-approval.spec.ts`; `e2e/bdd-003-insufficient-stock.spec.ts` | integration + e2e |
| B-057 | `e2e/material-request.spec.ts` `coloursAndServerRefuse_B057` | e2e |
| B-058 | `apps/web/lib/format.spec.ts` `quantityAndMoneyDisplay_B058` | unit |
| B-059 | `e2e/payroll-shortcuts.spec.ts` `tenthAndTwentyFifth_B059` | e2e |
| B-060 | `e2e/sign-in.spec.ts` `typeThenNameThenPassword_B060` `PROVISIONAL(Q-052)` | e2e |
| B-061 | `e2e/session.spec.ts` `idle30MinutesAndLogout_B061` | e2e |
| B-062 | `e2e/report-submit.spec.ts` `fillAndSubmit_B062` (acceptance 1–7) | e2e |
| B-063 | `e2e/history.spec.ts` `listFilterExport_B063` | e2e |
| B-064 | `e2e/report-edit-delete.spec.ts` `editDeleteRules_B064`; `e2e/bdd-006-user-deletes-pending.spec.ts` | e2e |
| B-065 | `e2e/material-request.spec.ts` `employeeInventoryAndRequest_B065` | e2e |
| B-066 | `e2e/material-admin.spec.ts` `adminInventoryManagement_B066` | e2e |
| B-067 | `e2e/audit-owner-only.spec.ts` `ownerOnlyReadOnly_B067` `PROVISIONAL(Q-059)` | e2e |
| B-068 | `e2e/personal-stats.spec.ts` `totalsAndTrialAllComponents_B068` | e2e |
| B-069 | `e2e/confirm-ordinary.spec.ts` `batchConfirmReject_B069` | e2e |
| B-070 | `e2e/confirm-materials.spec.ts` `reviewRequests_B070` | e2e |
| B-071 | `e2e/confirm-big-meter.spec.ts` `sameAsB069BigMeterOnly_B071` | e2e |
| B-072 | `e2e/payroll-export.spec.ts` `calculateAndExportXlsxPdfDocx_B072` | e2e |
| B-073 | `e2e/summary.spec.ts` `crossAccountTotals_B073` | e2e |
| B-074 | `e2e/account-lifecycle.spec.ts` `createArchiveRestoreUser_B074` | e2e |
| B-075 | `e2e/settings-prices.spec.ts` `savePricesTaxRetention_B075` | e2e |
| B-076 | `e2e/bdd-008-petty-cash.spec.ts`; `e2e/ledger.spec.ts` | e2e |
| B-077 | `apps/api/test/integration/archives.spec.ts` `autoAndManualGenerate_B077`; `e2e/archives.spec.ts` | integration + e2e |
| B-078 | `apps/api/test/integration/archives.spec.ts` `noDuplicateAutomatic_B078` | integration |
| B-079 | `e2e/session.spec.ts` `httpOnlySameSiteSecureCsrf_B079` | e2e |
| B-080 | `apps/api/test/integration/signin-rate-limit.spec.ts` `tenPerAddressPerMinute_B080` | integration |
| B-081 | `apps/api/test/integration/bank-crypto.spec.ts` `failClosedNoPlaintext_B081` | integration |
| B-082 | `e2e/visibility.spec.ts` `userCannotSeeOthersFinancials_B082` | e2e |
| B-083 | `apps/api/test/integration/audit.spec.ts` `completeness_B083` | integration |
| B-084 | `e2e/exports.spec.ts` `formatsAndTraditionalChinese_B084` `PROVISIONAL(Q-061)` | e2e |
| B-085 | `e2e/bdd-011-evidence.spec.ts` | e2e |
| B-086 | `e2e/ui-behaviour.spec.ts` `noFullPageWaitOnExport_pagination_B086` | e2e |
| B-087 | `apps/api/test/integration/authz-direct.spec.ts` `directRequestRejected_B087` | integration |
| B-088 | `apps/api/src/validation/messages.spec.ts` `chineseErrors_B088`; `e2e/validation.spec.ts` `serverRevalidates_B088` | unit + e2e |
| B-089 | `e2e/bdd-005-login-lockout.spec.ts` `PROVISIONAL(Q-053)` | e2e |
| B-090 | `e2e/bdd-004-year-end.spec.ts` | e2e |
| B-091 | `apps/api/src/payroll/split.spec.ts` `persistsSharesAtApproval_B044_B091`; `e2e/bdd-001-collaboration-split.spec.ts` | unit + e2e |
| B-092 | `apps/api/src/payroll/uninsured.spec.ts` `personalOverride_B092` | unit |
| B-093 | `e2e/bank.spec.ts` `revealLogsBankReveal_missingKey_B093` | e2e |
| B-094 | `e2e/payroll-export.spec.ts` `incompletePricesBlock_B094` | e2e |
| B-095 | `e2e/removed-behaviours.spec.ts` `archiveReplacesDeleteAndDeactivate_B095` | e2e |
| B-096 | `e2e/bdd-009-owner-manages-admins.spec.ts` `PROVISIONAL(Q-052–Q-057)` | e2e |
| B-097 | `e2e/audit-scope.spec.ts` `whatIsLogged_B097` `PROVISIONAL(Q-058)` | e2e |
| B-098 | `e2e/ledger-void.spec.ts` `voidNotDeleteWhenEvidence_B098` `PROVISIONAL(Q-061)` | e2e |

---

## 7. Traceability: §6.12 BDD examples / 追溯：第 6.12 節 BDD 範例

| Example | Planned test file / name | Also covers / 同時覆蓋 |
|---|---|---|
| BDD-001 Collaboration split with remainder / 共作餘數分配 | `e2e/bdd-001-collaboration-split.spec.ts` `remainderGoesToSubmitter_7_and_1` | B-044, B-091 |
| BDD-002 Duplicate approval / 重複核准 | `e2e/bdd-002-duplicate-approval.spec.ts` `secondApproveRefused_inventoryUnchanged` | B-056, B-070 |
| BDD-003 Insufficient stock / 庫存不足 | `e2e/bdd-003-insufficient-stock.spec.ts` `approve10Against4Refused`; `approveExact10Succeeds` | B-056, B-027 |
| BDD-004 Retention year-end settlement / 保留金年度結算 | `e2e/bdd-004-year-end.spec.ts` `newYearResets`; `settlementRecordsAmountOnly`; `currentYearOffsetOnly` | B-048, B-090, B-019 |
| BDD-005 Login lockout / 登入鎖定 | `e2e/bdd-005-login-lockout.spec.ts` (all seven Given/When/Then beats) | B-089, B-060, `PROVISIONAL(Q-053)` |
| BDD-006 User deletes a pending report / 使用者刪除待審回報 | `e2e/bdd-006-user-deletes-pending.spec.ts` `deletingPendingFreesCap`; `deletingRejectedFreesCap`; `confirmedRefused` | B-025, B-064 |
| BDD-007 Archive and restore / 封存與復原 | `e2e/bdd-007-archive-restore.spec.ts` (archive, pre-confirmed pay, submitted-then-approved, archive-period fixed, manual adjust, later-period default off, add-back, restore) | B-012, B-017, B-045, B-074, B-095 |
| BDD-008 Petty-cash cumulative balance / 零用金累計餘額 | `e2e/bdd-008-petty-cash.spec.ts` `balanceThroughFilterEnd`; `noFilterThroughToday`; `voidExcluded_Q061` `PROVISIONAL(Q-061)` | B-076, B-098 |
| BDD-009 Owner manages administrators / owner 管理管理員 | `e2e/bdd-009-owner-manages-admins.spec.ts` `ownerArchivesAdmin`; `adminCannotManageAdmin_ACCESS_DENIED`; `ownerRestores`; `adminCannotViewAudit`; `adminCannotCreateAdmin`; `adminCanUpdateUser` | B-004, B-006, B-087, B-096, B-097 |
| BDD-010 Retention annual cap changed / 修改保留金年度上限 | `e2e/bdd-010-retention-cap.spec.ts` `defaultCap`; `alreadyCalculatedNotRecalc`; `newCalcUsesNewCap`; `previousYearKeepsOldCap_Q060` `PROVISIONAL(Q-060)` | B-035, B-046, B-047, B-097 |
| BDD-011 Opening old evidence files / 點開舊的證據檔案 | `e2e/bdd-011-evidence.spec.ts` `open120DayReceipt`; `linkExpiresAfter3600s`; `secondOpenNewLink_FILE_DOWNLOAD`; `replacedKeepsPrevious` | B-085, B-097, B-030, `PROVISIONAL(Q-062)` |

Other Given/When/Then blocks in the spec (B-017 acceptance, B-035 acceptance, story acceptances under §6.1–6.11) are covered by the B-rule tests in §6 of this plan; they are not additional §6.12 IDs. / 規格其他章節的驗收情境由第 6 節對應的 B 規則測試覆蓋，不是第 6.12 節的額外編號。

---

## 8. B-rules covered in this document / 本文件涵蓋的 B 規則

B-001, B-002, B-003, B-004, B-005, B-006, B-007, B-008, B-009, B-010, B-011, B-012, B-013, B-014, B-015, B-016, B-017, B-018, B-019, B-020, B-021, B-022, B-023, B-024, B-025, B-026, B-027, B-028, B-029, B-030, B-031, B-032, B-033, B-034, B-035, B-036, B-037, B-038, B-039, B-040, B-041, B-042, B-043, B-044, B-045, B-046, B-047, B-048, B-049, B-050, B-051, B-052, B-053, B-054, B-055, B-056, B-057, B-058, B-059, B-060, B-061, B-062, B-063, B-064, B-065, B-066, B-067, B-068, B-069, B-070, B-071, B-072, B-073, B-074, B-075, B-076, B-077, B-078, B-079, B-080, B-081, B-082, B-083, B-084, B-085, B-086, B-087, B-088, B-089, B-090, B-091, B-092, B-093, B-094, B-095, B-096, B-097, B-098.
