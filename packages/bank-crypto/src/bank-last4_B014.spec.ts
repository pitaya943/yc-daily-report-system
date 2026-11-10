import { bankLast4 } from './index';

describe('B-014 bank last four display', () => {
  it('masks to last 4 digits', () => {
    expect(bankLast4('12345678901234')).toBe('1234');
  });
});
