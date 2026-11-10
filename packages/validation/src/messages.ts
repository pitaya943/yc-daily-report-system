/** B-088 Chinese error messages (non-functional.md / behavior spec §3.7). */
export const ValidationMessages = {
  displayNameRequired: '請輸入顯示名稱',
  displayNameMaxLength: '顯示名稱最多 50 個字',
  displayNameDuplicate: '此顯示名稱已被使用',
  passwordLength: '密碼長度須為 6 至 30 個字',
  passwordMismatch: '兩次輸入的密碼不一致',
  passwordCurrentIncorrect: '目前密碼不正確',
  roleRequired: '請選擇角色',
  zoneRequired: '請選擇施工區域',
  paymentRequired: '請選擇發薪方式',
  accountRequired: '請選擇帳戶',
  passwordWrong: '密碼錯誤，請重試',
  lockout: '密碼錯誤次數過多，請在 15 分鐘後再試',
  bigMeterBeforeAdmin: '請先關閉大表旗標，再切換為管理員', // PROVISIONAL(Q-057)
  reportDateInvalid:
    '回報日期須為今天或往前 30 天內，不可選擇未來日期',
  qtyInvalid: '工項數量須為 0 到 999.9，最小單位 0.1',
  dailyCap: '每日最多只能送出 3 筆回報',
  materialRequestQty: '申請數量須為 1 到 99 的整數',
  materialNotRequestable: '此材料目前不可申請',
  materialInsufficient: '庫存不足，無法申請',
  materialInsufficientApprove: '庫存不足，無法核准',
  collaboratorLimit:
    '共同作業者最多 6 人，且須為同一區域、同一類型的啟用員工',
  confirmedReportNoEdit: '已核准回報僅可預覽',
  bankDigitsInvalid: '銀行帳號須為 14 位數字',
  bankEncryptionUnavailable:
    '銀行帳號加密金鑰未設定，無法讀寫完整銀行帳號',
  customItemNameMax: '自訂工項名稱最多 100 個字',
  customItemQty: '自訂工項數量須為 0 到 999.9，最小單位 0.1',
  customItemPrice: '自訂工項單價須為 0 或正整數',
  importFileInvalid:
    '請上傳 xlsx 或 csv 檔，且標題列須含「材料編號」與「實領量」',
} as const;
