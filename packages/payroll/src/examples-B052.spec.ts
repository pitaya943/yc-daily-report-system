/**
 * B-052 worked examples A–F (pure payroll math)
 */
import { computeFinalPay } from './final-pay';
import { periodRetentionNtd } from './retention-cap';
import { roundHalfUpNtd, uninsuredDeductionNtd } from './money';

describe('B-052 worked examples', () => {
  it('example A: gross 1200, retention 200, uninsured 3%', () => {
    const gross = 1200;
    const retention = 200;
    const r = computeFinalPay({
      gross,
      periodRetention: retention,
      fixedSalaryApplied: 0,
      insuranceApplied: 0,
      workItemGross: gross,
      uninsuredRatePercent: 3,
      enrolled: false,
      uninsuredExempt: false,
    });
    expect(r.net).toBe(1000);
    expect(r.uninsured).toBe(36);
    expect(r.finalPay).toBe(964);
  });

  it('example B: 10th payday, fixed 5000, insurance 834', () => {
    const r = computeFinalPay({
      gross: 1200,
      periodRetention: 200,
      fixedSalaryApplied: 5000,
      insuranceApplied: 834,
      workItemGross: 1200,
      uninsuredRatePercent: 3,
      enrolled: true,
      uninsuredExempt: false,
    });
    expect(r.finalPay).toBe(5166);
  });

  it('example C: cap room 5000 from ytd 55000 cap 60000', () => {
    const period = periodRetentionNtd(8000, 55000, 60000);
    expect(period).toBe(5000);
  });

  it('example D: round 300.03 uninsured to 300', () => {
    expect(uninsuredDeductionNtd(10001, 3, false, false)).toBe(300);
    expect(roundHalfUpNtd(300.03)).toBe(300);
  });

  it('example E: 25th payday no fixed/insurance, uninsured on gross 10000', () => {
    const r = computeFinalPay({
      gross: 10000,
      periodRetention: 2000,
      fixedSalaryApplied: 0,
      insuranceApplied: 0,
      workItemGross: 10000,
      uninsuredRatePercent: 3,
      enrolled: false,
      uninsuredExempt: false,
    });
    expect(r.uninsured).toBe(300);
    expect(r.finalPay).toBe(7700);
  });

  it('example F: collaboration gross per person 288 + 276 + 276 = 840', () => {
    const shares = [2.4, 2.3, 2.3];
    const price = 120;
    const grosses = shares.map((s) => s * price);
    expect(grosses[0]).toBe(288);
    expect(grosses[1]).toBe(276);
    expect(grosses[2]).toBe(276);
    expect(grosses.reduce((a, b) => a + b, 0)).toBe(840);
  });
});
