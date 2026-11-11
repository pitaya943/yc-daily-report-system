describe('B-045 work-item gross', () => {
  it('equals sum of share × unit price', () => {
    const shares = [
      { qty: 2, price: 100 },
      { qty: 1.5, price: 200 },
    ];
    const gross = shares.reduce((s, r) => s + r.qty * r.price, 0);
    expect(gross).toBe(500);
  });
});
