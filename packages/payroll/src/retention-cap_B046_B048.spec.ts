import { clampYtdBefore, periodRetentionNtd } from './retention-cap';

describe('B-046 ytd_before clamped to cap', () => {
  it('clamps before period room', () => {
    expect(clampYtdBefore(70000, 60000)).toBe(60000);
  });
});

describe('B-047 period retention room under cap', () => {
  it('period capped by remaining room', () => {
    expect(periodRetentionNtd(5000, 58000, 60000)).toBe(2000);
  });
});

describe('B-048 new calendar year ytd starts at zero', () => {
  it('ytd before is per-year input', () => {
    expect(clampYtdBefore(0, 60000)).toBe(0);
  });
});
