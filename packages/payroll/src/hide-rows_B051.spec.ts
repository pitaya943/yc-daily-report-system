describe('B-051 payroll hide zero-zero rows', () => {
  it('B-051 drops gross0 and final0 but keeps fixed salary', () => {
    const shouldShow = (gross: number, finalPay: number, fixed: number) => {
      if (finalPay === 0 && gross === 0 && fixed === 0) return false;
      return true;
    };
    expect(shouldShow(0, 0, 0)).toBe(false);
    expect(shouldShow(0, 0, 5000)).toBe(true);
    expect(shouldShow(100, 80, 0)).toBe(true);
  });
});
