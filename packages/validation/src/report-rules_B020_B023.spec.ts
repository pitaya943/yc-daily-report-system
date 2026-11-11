import {
  validateDailyCapCount,
  validateQtyUnits,
  validateReportDate,
} from './report-validators';

describe('B-020 report date window', () => {
  it('rejects future dates', () => {
    const today = '2026-11-10';
    const err = validateReportDate('2026-11-11', today);
    expect(err?.message).toMatch(/不可選擇未來/);
  });
});

describe('B-021 quantity 0.1 units', () => {
  it('accepts 23 units = 2.3', () => {
    expect(validateQtyUnits(23)).toBeNull();
  });
});

describe('B-023 daily cap gates fourth report', () => {
  it('allows up to 3 existing', () => {
    expect(validateDailyCapCount(2)).toBeNull();
    expect(validateDailyCapCount(3)?.message).toBeDefined();
  });
});
