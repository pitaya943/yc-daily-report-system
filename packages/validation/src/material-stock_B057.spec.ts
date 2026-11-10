import { assertMaterialRequestable, stockColourHint } from './material-stock_B057';

describe('B-057 stock colours and request refusal', () => {
  it('colour thresholds', () => {
    expect(stockColourHint(6)).toBe('green');
    expect(stockColourHint(5)).toBe('yellow');
    expect(stockColourHint(0)).toBe('red');
  });

  it('server refuses zero or quarantined', () => {
    expect(
      assertMaterialRequestable({
        remaining_qty: 0,
        hidden: false,
        quarantined: false,
      })?.message,
    ).toBeDefined();
  });
});
