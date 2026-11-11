import { ValidationMessages } from './messages';
import type { FieldError } from './validators';

export function validateRetentionOffset(offsetNtd: number): FieldError | null {
  if (!Number.isInteger(offsetNtd)) {
    return { field: 'offsetNtd', message: ValidationMessages.retentionOffsetInteger };
  }
  return null;
}

export function validateRetentionCap(capNtd: number): FieldError | null {
  if (!Number.isInteger(capNtd) || capNtd < 0) {
    return { field: 'capNtd', message: ValidationMessages.retentionCapInteger };
  }
  return null;
}

export function validateGlobalRetentionRate(rate: number): FieldError | null {
  if (!Number.isInteger(rate) || rate < 0 || rate > 9999) {
    return { field: 'rate', message: ValidationMessages.globalRetentionRate };
  }
  return null;
}

/** B-034 per-item retention (same numeric rules as global). */
export function validatePerItemRetentionRate(rate: number): FieldError | null {
  if (!Number.isInteger(rate) || rate < 0 || rate > 9999) {
    return {
      field: 'rateNtd',
      message: ValidationMessages.perItemRetentionRate,
    };
  }
  return null;
}

export function validateZone(zone: string | undefined): FieldError | null {
  if (zone == null) return null;
  if (zone !== 'WEST' && zone !== 'SOUTH') {
    return { field: 'zone', message: ValidationMessages.zoneRequired };
  }
  return null;
}

/** B-088 L308 — only USER or ADMIN; OWNER cannot be chosen. */
export function validateSwitchRole(role: unknown): FieldError | null {
  if (role !== 'USER' && role !== 'ADMIN') {
    return { field: 'role', message: ValidationMessages.roleRequired };
  }
  return null;
}

/** B-088 L310 — big-meter flag must be an explicit confirmed boolean. */
export function validateBigMeterFlag(
  bigMeter: unknown,
  confirmBigMeter?: unknown,
): FieldError | null {
  if (bigMeter === undefined) return null;
  if (typeof bigMeter !== 'boolean') {
    return { field: 'bigMeter', message: ValidationMessages.bigMeterConfirm };
  }
  if (bigMeter === true && confirmBigMeter !== true) {
    return {
      field: 'confirmBigMeter',
      message: ValidationMessages.bigMeterConfirm,
    };
  }
  return null;
}

/** B-088 L315 — uninsured-exempt flag must be boolean when sent. */
export function validateUninsuredExemptFlag(value: unknown): FieldError | null {
  if (value === undefined) return null;
  if (typeof value !== 'boolean') {
    return {
      field: 'uninsuredExempt',
      message: ValidationMessages.uninsuredExemptConfirm,
    };
  }
  return null;
}

export function validateUninsuredRate(rate: number): FieldError | null {
  if (rate < 0 || rate > 100) {
    return { field: 'rate', message: ValidationMessages.uninsuredRateRange };
  }
  const s = String(rate);
  const frac = s.includes('.') ? s.split('.')[1] : '';
  if (frac.length > 2) {
    return { field: 'rate', message: ValidationMessages.uninsuredRateRange };
  }
  return null;
}

export function validateFixedSalary(n: number): FieldError | null {
  if (!Number.isInteger(n) || n < 0) {
    return { field: 'fixedSalary', message: ValidationMessages.fixedSalaryInteger };
  }
  return null;
}

export function validateInsuranceDeduction(n: number, enrolled: boolean): FieldError | null {
  if (!Number.isInteger(n) || n < 0) {
    return { field: 'insuranceDeduction', message: ValidationMessages.insuranceDeductionInteger };
  }
  if (enrolled && n < 1) {
    return { field: 'insuranceDeduction', message: ValidationMessages.insuranceDeductionEnrolledMin };
  }
  return null;
}

export function validatePaymentMethod(
  method: string | undefined,
): FieldError | null {
  if (method == null) return null;
  if (method !== 'TRANSFER' && method !== 'CASH') {
    return { field: 'paymentMethod', message: ValidationMessages.paymentRequired };
  }
  return null;
}

export function validateSettingsTabName(name: string | undefined): FieldError | null {
  if (name == null) return null;
  if (name.length > 50) {
    return { field: 'tabName1', message: ValidationMessages.materialTabNameMax };
  }
  return null;
}

export function validateUnitPrice(price: number): FieldError | null {
  if (price < 0 || !Number.isFinite(price)) {
    return { field: 'price', message: ValidationMessages.unitPriceRange };
  }
  const s = String(price);
  const frac = s.includes('.') ? s.split('.')[1] : '';
  if (frac.length > 2) {
    return { field: 'price', message: ValidationMessages.unitPriceRange };
  }
  return null;
}
