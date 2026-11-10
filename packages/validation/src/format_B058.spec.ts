import {
  formatMaterialQty,
  formatMoneyNtd,
  formatWorkQty,
} from './format-b058';

describe('B-058 quantity and money display', () => {
  it('B-058 work qty shows integer without decimal', () => {
    expect(formatWorkQty(3)).toBe('3');
    expect(formatWorkQty(3.1)).toBe('3.1');
    expect(formatWorkQty(0)).toBe('');
  });

  it('B-058 money uses grouping', () => {
    expect(formatMoneyNtd(1234)).toBe('1,234');
  });

  it('B-058 material qty trims trailing zeros', () => {
    expect(formatMaterialQty(5.0)).toBe('5');
  });
});
