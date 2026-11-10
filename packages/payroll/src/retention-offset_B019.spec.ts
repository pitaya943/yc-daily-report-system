import { offsetForTargetYtd, ytdWithOffset } from './retention-offset-b019';

describe('B-019 retention offset', () => {
  it('stores offset so raw + offset equals target within cap', () => {
    const raw = 800;
    const target = 5000;
    const cap = 60000;
    const offset = offsetForTargetYtd(raw, target, cap);
    expect(ytdWithOffset(raw, offset, cap)).toBe(target);
  });

  it('does not carry offset across years (caller uses per-year row)', () => {
    expect(offsetForTargetYtd(100, 200, 60000)).toBe(100);
  });
});
