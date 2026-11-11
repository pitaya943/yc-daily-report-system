import { roundHalfUpNtd, uninsuredDeductionNtd } from './money';

describe('B-049 half-up rounding', () => {
  it('rounds 2.5 up to 3', () => {
    expect(roundHalfUpNtd(2.5)).toBe(3);
  });
});

describe('B-050 uninsured on work-item gross only', () => {
  it('3% of gross excluding fixed salary path', () => {
    expect(
      uninsuredDeductionNtd(1000, 3, false, false),
    ).toBe(30);
    expect(uninsuredDeductionNtd(1000, 3, true, false)).toBe(0);
  });
});
