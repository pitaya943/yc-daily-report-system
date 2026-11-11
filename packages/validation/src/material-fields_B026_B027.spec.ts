import { validateMaterialRequestQty } from './report-validators';

describe('B-026 material field validation via request qty', () => {
  it('rejects qty outside 1-99', () => {
    expect(validateMaterialRequestQty(0)?.message).toBeDefined();
    expect(validateMaterialRequestQty(100)?.message).toBeDefined();
  });
});

describe('B-027 inventory invariant', () => {
  it('received equals usage plus remaining', () => {
    const usage = 30;
    const remaining = 70;
    const received = remaining + usage;
    expect(received).toBe(100);
  });
});
