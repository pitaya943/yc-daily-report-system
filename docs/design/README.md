# yc-daily-report-system — v0 design docs / v0 設計文件

Stage / 階段：S1 (report-writing only). These files will later become `docs/` in `pitaya943/yc-daily-report-system`. / 本階段只寫文件；之後會進 repo 的 `docs/`。

Sources (read-only) / 唯讀來源：
- Behaviour spec / 行為規格：`docs/behavior-spec-final.md` (Q-001–Q-051 decided; Q-052–Q-062 provisional)
- Done-when / 完成條件：prototype v0 stage acceptance (see project README)

Stack (decided, not re-opened) / 已定技術棧：Next.js (`apps/web`), NestJS (`apps/api`), Supabase Auth + Postgres + Storage (RLS = second line of defense; NestJS = first), Asia region. Suggested monorepo: `apps/web`, `apps/api`, `supabase/` (migrations, seed), `docs/`.

Language / 語言：each design file is bilingual (English, then Traditional Chinese zh-Hant-TW per section). Identifiers stay untranslated. / 各文件中英雙語；識別名不翻譯。

Provisional items are tagged `PROVISIONAL(Q-0xx)` throughout. / 暫定事項全文標註。

---

## 1. Index / 目錄

| File / 文件 | What it is / 內容 | Serves done-when / 對應完成條件 |
|---|---|---|
| [data-model.md](./data-model.md) | Tables, columns, types, constraints, enums, indexes, FKs, storage buckets, secret/encrypted columns, RLS sketch / 資料表、欄位、型別、約束、列舉、索引、外鍵、儲存桶、機密欄、RLS 草稿 | Item 1, 2, 5 (fail closed) |
| [data-flow.md](./data-flow.md) | Main flows with Mermaid diagrams / 主要流程與 Mermaid 圖 | Item 1 |
| [permission-matrix.md](./permission-matrix.md) | `OWNER` / `ADMIN` / `USER` × every action; owner-only admin management; blocked attempts logged / 權限矩陣；越權必記 | Item 1; B-004, B-006, B-087, B-096, B-097 |
| [non-functional.md](./non-functional.md) | Spec §7: security, B-088 Chinese errors, performance/capacity, region, logging, backups as applicable to v0 / 非功能需求 | Item 1, 5 |
| [test-plan.md](./test-plan.md) | Unit, integration (`supabase start`), BDD/e2e (Playwright), CI, seed, traceability / 測試層級、CI、種子、追溯表 | Items 1, 3, 4 |
| [coverage-check.txt](./coverage-check.txt) | Command and full output of the B-id coverage script / 覆蓋檢查指令與完整輸出 | Confirms no B-id is missing |
| [check-coverage.py](./check-coverage.py) | The script that produced that file / 產生上列輸出的腳本 | — |

---

## 2. Coverage confirmation / 覆蓋確認

**Removed whole-rule B-ids / 整條標為 Removed 的 B 規則：** none / 無. B-001–B-098 are all active. Removed *behaviours* (deactivate, permanent account delete, south-price fallback, `bm_40_fen`, remember-me, old audit visibility, old receipt-replace-deletes-file) are listed in `test-plan.md` §5 and tested as absences. / 皆為有效規則。已移除行為見測試計畫第 5 節，以反向測試覆蓋。

Command and result (also saved in `coverage-check.txt`) / 指令與結果（完整輸出亦見該檔）：

# Coverage check / 覆蓋檢查

Command / 指令：

```
python3 docs/design/check-coverage.py
```

Working directory / 工作目錄：repository root (run 2026-11-11, Asia/Taipei).

Result / 結果：

```
=== Coverage check for yc-v0 design docs ===
Spec: docs/behavior-spec-final.md
Unique B-ids in spec: 98
Spec IDs: B-001, B-002, B-003, B-004, B-005, B-006, B-007, B-008, B-009, B-010, B-011, B-012, B-013, B-014, B-015, B-016, B-017, B-018, B-019, B-020, B-021, B-022, B-023, B-024, B-025, B-026, B-027, B-028, B-029, B-030, B-031, B-032, B-033, B-034, B-035, B-036, B-037, B-038, B-039, B-040, B-041, B-042, B-043, B-044, B-045, B-046, B-047, B-048, B-049, B-050, B-051, B-052, B-053, B-054, B-055, B-056, B-057, B-058, B-059, B-060, B-061, B-062, B-063, B-064, B-065, B-066, B-067, B-068, B-069, B-070, B-071, B-072, B-073, B-074, B-075, B-076, B-077, B-078, B-079, B-080, B-081, B-082, B-083, B-084, B-085, B-086, B-087, B-088, B-089, B-090, B-091, B-092, B-093, B-094, B-095, B-096, B-097, B-098

B-rules marked Removed as a whole rule: none
  permission-matrix.md: 42 unique B-ids
  data-model.md: 98 unique B-ids
  data-flow.md: 88 unique B-ids
  test-plan.md: 98 unique B-ids

Union of permission/data/test docs: 98
  permission-matrix.md: 42
  data-model.md + data-flow.md: 98
  test-plan.md: 98

--- Check 1: every spec B-id appears in permission/data/test docs ---
PASS: every spec B-id appears in at least one of permission/data/test docs.

--- Check 2: test-plan.md contains every non-Removed B-id ---
PASS: test-plan.md contains all 98 non-Removed B-ids (Removed whole-rule IDs: none).

--- Per-ID location (permission / data / test) ---
ID       perm   data   test  
B-001    -      Y      Y     
B-002    -      Y      Y     
B-003    Y      Y      Y     
B-004    Y      Y      Y     
B-005    Y      Y      Y     
B-006    Y      Y      Y     
B-007    -      Y      Y     
B-008    Y      Y      Y     
B-009    Y      Y      Y     
B-010    -      Y      Y     
B-011    -      Y      Y     
B-012    Y      Y      Y     
B-013    -      Y      Y     
B-014    Y      Y      Y     
B-015    -      Y      Y     
B-016    -      Y      Y     
B-017    -      Y      Y     
B-018    -      Y      Y     
B-019    -      Y      Y     
B-020    -      Y      Y     
B-021    -      Y      Y     
B-022    -      Y      Y     
B-023    -      Y      Y     
B-024    -      Y      Y     
B-025    Y      Y      Y     
B-026    -      Y      Y     
B-027    -      Y      Y     
B-028    -      Y      Y     
B-029    -      Y      Y     
B-030    -      Y      Y     
B-031    -      Y      Y     
B-032    -      Y      Y     
B-033    -      Y      Y     
B-034    -      Y      Y     
B-035    Y      Y      Y     
B-036    -      Y      Y     
B-037    -      Y      Y     
B-038    -      Y      Y     
B-039    -      Y      Y     
B-040    -      Y      Y     
B-041    -      Y      Y     
B-042    -      Y      Y     
B-043    -      Y      Y     
B-044    -      Y      Y     
B-045    -      Y      Y     
B-046    -      Y      Y     
B-047    -      Y      Y     
B-048    -      Y      Y     
B-049    -      Y      Y     
B-050    -      Y      Y     
B-051    -      Y      Y     
B-052    -      Y      Y     
B-053    -      Y      Y     
B-054    -      Y      Y     
B-055    -      Y      Y     
B-056    -      Y      Y     
B-057    Y      Y      Y     
B-058    -      Y      Y     
B-059    -      Y      Y     
B-060    Y      Y      Y     
B-061    Y      Y      Y     
B-062    Y      Y      Y     
B-063    Y      Y      Y     
B-064    Y      Y      Y     
B-065    Y      Y      Y     
B-066    Y      Y      Y     
B-067    Y      Y      Y     
B-068    Y      Y      Y     
B-069    Y      Y      Y     
B-070    Y      Y      Y     
B-071    Y      Y      Y     
B-072    Y      Y      Y     
B-073    Y      Y      Y     
B-074    Y      Y      Y     
B-075    Y      Y      Y     
B-076    Y      Y      Y     
B-077    Y      Y      Y     
B-078    -      Y      Y     
B-079    -      Y      Y     
B-080    -      Y      Y     
B-081    Y      Y      Y     
B-082    Y      Y      Y     
B-083    -      Y      Y     
B-084    Y      Y      Y     
B-085    Y      Y      Y     
B-086    -      Y      Y     
B-087    Y      Y      Y     
B-088    -      Y      Y     
B-089    Y      Y      Y     
B-090    Y      Y      Y     
B-091    -      Y      Y     
B-092    -      Y      Y     
B-093    Y      Y      Y     
B-094    Y      Y      Y     
B-095    Y      Y      Y     
B-096    Y      Y      Y     
B-097    Y      Y      Y     
B-098    Y      Y      Y     

=== RESULT: PASS ===
```


---

## 3. Which document covers each B-rule / 各 B 規則由哪些文件涵蓋

| B-rule | Documents that cite it / 引用文件 |
|---|---|
| B-001 | data-model.md, test-plan.md |
| B-002 | data-model.md, non-functional.md, test-plan.md |
| B-003 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-004 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-005 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-006 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-007 | data-model.md, test-plan.md |
| B-008 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-009 | data-model.md, permission-matrix.md, test-plan.md |
| B-010 | data-model.md, test-plan.md |
| B-011 | data-model.md, test-plan.md |
| B-012 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-013 | data-model.md, test-plan.md |
| B-014 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-015 | data-model.md, data-flow.md, test-plan.md |
| B-016 | data-model.md, data-flow.md, test-plan.md |
| B-017 | data-model.md, data-flow.md, test-plan.md |
| B-018 | data-model.md, data-flow.md, test-plan.md |
| B-019 | data-model.md, data-flow.md, test-plan.md |
| B-020 | data-model.md, data-flow.md, test-plan.md |
| B-021 | data-model.md, data-flow.md, test-plan.md |
| B-022 | data-model.md, data-flow.md, test-plan.md |
| B-023 | data-model.md, data-flow.md, test-plan.md |
| B-024 | data-model.md, data-flow.md, test-plan.md |
| B-025 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-026 | data-model.md, data-flow.md, test-plan.md |
| B-027 | data-model.md, data-flow.md, test-plan.md |
| B-028 | data-model.md, data-flow.md, test-plan.md |
| B-029 | data-model.md, data-flow.md, test-plan.md |
| B-030 | data-model.md, data-flow.md, test-plan.md |
| B-031 | data-model.md, data-flow.md, test-plan.md |
| B-032 | data-model.md, data-flow.md, test-plan.md |
| B-033 | data-model.md, data-flow.md, test-plan.md |
| B-034 | data-model.md, data-flow.md, test-plan.md |
| B-035 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-036 | data-model.md, data-flow.md, test-plan.md |
| B-037 | data-model.md, data-flow.md, non-functional.md, test-plan.md |
| B-038 | data-model.md, data-flow.md, test-plan.md |
| B-039 | data-model.md, data-flow.md, test-plan.md |
| B-040 | data-model.md, data-flow.md, test-plan.md |
| B-041 | data-model.md, data-flow.md, test-plan.md |
| B-042 | data-model.md, data-flow.md, test-plan.md |
| B-043 | data-model.md, data-flow.md, test-plan.md |
| B-044 | data-model.md, data-flow.md, test-plan.md |
| B-045 | data-model.md, data-flow.md, test-plan.md |
| B-046 | data-model.md, data-flow.md, test-plan.md |
| B-047 | data-model.md, data-flow.md, test-plan.md |
| B-048 | data-model.md, data-flow.md, test-plan.md |
| B-049 | data-model.md, data-flow.md, non-functional.md, test-plan.md |
| B-050 | data-model.md, data-flow.md, test-plan.md |
| B-051 | data-model.md, data-flow.md, test-plan.md |
| B-052 | data-model.md, test-plan.md |
| B-053 | data-model.md, data-flow.md, test-plan.md |
| B-054 | data-model.md, data-flow.md, test-plan.md |
| B-055 | data-model.md, data-flow.md, test-plan.md |
| B-056 | data-model.md, data-flow.md, test-plan.md |
| B-057 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-058 | data-model.md, data-flow.md, non-functional.md, test-plan.md |
| B-059 | data-model.md, data-flow.md, test-plan.md |
| B-060 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-061 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-062 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-063 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-064 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-065 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-066 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-067 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-068 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-069 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-070 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-071 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-072 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-073 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-074 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-075 | data-model.md, permission-matrix.md, test-plan.md |
| B-076 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-077 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-078 | data-model.md, data-flow.md, non-functional.md, test-plan.md |
| B-079 | data-model.md, data-flow.md, non-functional.md, test-plan.md |
| B-080 | data-model.md, data-flow.md, non-functional.md, test-plan.md |
| B-081 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-082 | data-model.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-083 | data-model.md, data-flow.md, non-functional.md, test-plan.md |
| B-084 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-085 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-086 | data-model.md, data-flow.md, non-functional.md, test-plan.md |
| B-087 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-088 | data-model.md, data-flow.md, non-functional.md, test-plan.md |
| B-089 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-090 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-091 | data-model.md, data-flow.md, test-plan.md |
| B-092 | data-model.md, data-flow.md, test-plan.md |
| B-093 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-094 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-095 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |
| B-096 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-097 | data-model.md, data-flow.md, permission-matrix.md, non-functional.md, test-plan.md |
| B-098 | data-model.md, data-flow.md, permission-matrix.md, test-plan.md |

None missing: every ID in B-001–B-098 appears in at least one design doc, and `test-plan.md` contains every non-Removed ID (all 98). / 無缺漏：B-001–B-098 皆出現在至少一份設計文件，且 `test-plan.md` 含全部 98 條非 Removed 規則。

---

## 4. Provisional items / 暫定事項 (Q-052–Q-062)

Implemented as written, tagged `PROVISIONAL(Q-0xx)`, pending Kuei. / 照規格實作並標註，待 Kuei 確認。

| ID | Summary / 摘要 | Affects / 影響 |
|---|---|---|
| Q-052 | Owner listed under sign-in type `admin`; lands on confirmation | B-060, B-096 |
| Q-053 | Owner password change needs current password; 5-failure / 15-minute lock applies to owner | B-004, B-008, B-089, B-096 |
| Q-054 | Owner fields changed only by owner; payroll treats owner like `ADMIN` (no retention) | B-045, B-047, B-096 |
| Q-055 | Apart from own password, an `ADMIN`'s own fields are owner-only | B-004, B-074, B-096 |
| Q-056 | `ADMIN` account management lists `USER` only; `ADMIN` accounts are on Admin management | B-004, B-074, B-096 |
| Q-057 | Switch to `ADMIN` requires big-meter off; existing reports unchanged; payroll uses role at calculation time | B-003, B-004, B-011, B-088, B-096 |
| Q-058 | No audit for ordinary sign-in/out; lockout logged as system; unauthenticated requests not logged; `ACCESS_DENIED` content; new action types | B-037, B-089, B-097 |
| Q-059 | Audit rows permanent; nobody including owner can edit or delete them | B-037, B-067 |
| Q-060 | Per-year cap history; already calculated/exported/archived results stay; no upper limit; 0 means no retention; no automatic refund if new cap is below YTD; error 「保留金年度上限須為 0 以上的整數」 | B-035, B-046, B-047, B-048, B-088, B-090 |
| Q-061 | Voided ledger stays listed as 「作廢」; excluded from totals and 零用金餘額; cannot edit/settle/un-void in v0; included in Excel; any entry may be voided (`LEDGER_VOID`) | B-031, B-076, B-084, B-088, B-098, BDD-008 |
| Q-062 | One current evidence file; earlier versions listed; replace only, no remove; ever-had-file ⇒ can only be voided | B-030, B-085, B-098 |

---

## 5. Spec ambiguities noted, not resolved by invention / 規格含糊處（不自行發明規則）

These are recorded for Chief / Kuei; the design does not add conditions Kuei did not state. / 記錄供 Chief／Kuei 決定；設計不添加 Kuei 未說的條件。

1. **Official default material catalogue (B-036 / Q-029).** Kuei will provide the official item list later. Seed uses a placeholder catalogue tagged provisional; reset restores that placeholder until the official list exists. / 正式材料清單稍後由 Kuei 提供；種子為佔位清單。
2. **Deleting a material that has non-pending requests.** Spec says pending requests are also removed (B-066). It does not say what happens to `APPROVED` / `REJECTED` rows. Not decided here. / 已審申請在材料刪除後如何處理，規格未說。
3. **Two different `PENDING` requests that together exceed remaining stock, approved in parallel.** Spec covers insufficient stock on one request (BDD-003) and a second approve of the *same* request (BDD-002). Concurrent distinct requests are not specified. The data-model recommends `SELECT … FOR UPDATE` so the invariant cannot break, but that concurrency policy is a safety implementation, not a new user-visible rule. / 兩筆不同待審申請併發核准是否拒其一，規格未寫。
4. **Bank encryption algorithm.** Spec requires encryption at rest, no plaintext, fail closed (B-081). Algorithm (e.g. AES-256-GCM) is an operations choice, not a business rule. / 演算法屬營運選擇。
5. **Auth identifier behind the display-name picker (B-060).** Sign-in is type → name → password, not an email form. How the row is stored in Supabase Auth (synthetic email vs username) is a design choice and is not user-visible. / Auth 內部識別名為設計選擇，非使用者欄位。
6. **Automatic New Year YTD reset audit row (B-083).** “Should be attributable (system actor) *if* it writes a row.” Whether v0 writes that row is not a hard yes/no in the spec. / 跨年自動歸零是否寫紀錄，規格用「若寫紀錄」。
7. **板信商業銀行 transfer-slip layout (B-072, B-084).** Required format is Word `.docx` for `TRANSFER` and `final > 0`, “formatted for bank submission.” The exact cell layout of the bank form is not in the spec. / 薪轉單精確版面規格未附。
8. **Ledger `entry_date` window.** Unlike report dates, the field table only requires “a valid date” (B-088). No future/past limit is invented. / 記帳日期未另設可選範圍。
9. **How “already calculated pay is not recalculated” is stored (B-035).** Snapshot tables (`payroll_runs`) are a design structure to implement the rule, not an extra business rule. / 快照表是為落實「不重算」的結構。
10. **Storing `bank_account_last4` separately.** Allows the default last-four view without decryption. The spec requires last-four display and no stored plaintext of the *full* number; it does not explicitly require or forbid a last-four column. / 後四碼分欄為實作選擇。
11. **Admin-deleted confirmed reports and the daily cap (B-025).** The cap counts own submissions that *still exist*. The spec does not spell out the cap effect of an administrator deleting a confirmed report; the literal reading is that a deleted row no longer counts. Flagged so it is not silently over-specified. / 管理員刪已核准回報是否釋放額度，僅能依「仍存在」字面理解，未另發明。
12. **Backup RPO/RTO.** Not in the spec. `non-functional.md` only notes managed Supabase backups as operations, not a product feature. / 規格無備份指標，不另定產品功能。

---

## 6. Out of scope for this stage / 本階段不做

No GitHub writes, no Cloud Agents, no network calls to any Supabase / Railway / Vercel host, no secrets, no feature code. / 不寫 GitHub、不開 Cloud Agent、不連任何託管主機、不放密鑰、不寫功能程式。
