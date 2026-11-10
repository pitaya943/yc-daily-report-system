/** @jest-environment node */
import {
  validateDailyCapCount,
  validateMaterialRequestQty,
  validateQtyUnits,
  validateReportDate,
} from './report-validators';
import { ValidationMessages } from './messages';

describe('B-088 validateReportDate', () => {
  it('rejects future and out-of-window dates', () => {
    expect(
      validateReportDate('2099-01-01', '2026-11-10')?.message,
    ).toBe(ValidationMessages.reportDateInvalid);
    expect(
      validateReportDate('2020-01-01', '2026-11-10')?.message,
    ).toBe(ValidationMessages.reportDateInvalid);
  });

  it('accepts today', () => {
    expect(validateReportDate('2026-11-10', '2026-11-10')).toBeNull();
  });
});

describe('B-025 B-088 validateDailyCapCount', () => {
  it('rejects when count is 3', () => {
    expect(validateDailyCapCount(3)?.message).toBe(ValidationMessages.dailyCap);
  });
});

describe('B-021 B-088 validateQtyUnits', () => {
  it('rejects invalid units', () => {
    expect(validateQtyUnits(-1)?.message).toBe(ValidationMessages.qtyInvalid);
  });
});

describe('B-065 B-088 validateMaterialRequestQty', () => {
  it('rejects 0 and 100', () => {
    expect(validateMaterialRequestQty(0)?.message).toBe(
      ValidationMessages.materialRequestQty,
    );
    expect(validateMaterialRequestQty(100)?.message).toBe(
      ValidationMessages.materialRequestQty,
    );
  });
});
