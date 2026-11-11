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
