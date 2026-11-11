import { ValidationMessages } from './messages';
import type { FieldError } from './validators';

export function validateReportDate(
  reportDate: string,
  todayTaipei: string,
): FieldError | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
    return { field: 'reportDate', message: ValidationMessages.reportDateInvalid };
  }
  if (reportDate > todayTaipei) {
    return { field: 'reportDate', message: ValidationMessages.reportDateInvalid };
  }
  const start = addDays(todayTaipei, -30);
  if (reportDate < start) {
    return { field: 'reportDate', message: ValidationMessages.reportDateInvalid };
  }
  return null;
}

function addDays(ymd: string, delta: number): string {
  const d = new Date(`${ymd}T12:00:00+08:00`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function validateQtyUnits(qtyUnits: number): FieldError | null {
  if (!Number.isInteger(qtyUnits) || qtyUnits < 0 || qtyUnits > 9999) {
    return { field: 'qty', message: ValidationMessages.qtyInvalid };
  }
  return null;
}

export function validateDailyCapCount(count: number): FieldError | null {
  if (count >= 3) {
    return { field: 'report', message: ValidationMessages.dailyCap };
  }
  return null;
}

export function validateMaterialRequestQty(qty: number): FieldError | null {
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
    return { field: 'quantity', message: ValidationMessages.materialRequestQty };
  }
  return null;
}
