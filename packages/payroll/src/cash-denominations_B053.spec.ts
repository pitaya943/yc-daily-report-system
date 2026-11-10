import { greedyCashBreakdown } from './cash-denominations';

describe('B-053 cash denomination breakdown', () => {
  it('B-053 greedy counts for 1236 NTD', () => {
    const d = greedyCashBreakdown(1236);
    expect(d[1000]).toBe(1);
    expect(d[100]).toBe(2);
    expect(d[10]).toBe(3);
    expect(d[5]).toBe(1);
    expect(d[1]).toBe(1);
  });
});
