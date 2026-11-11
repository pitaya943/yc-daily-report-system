import { validateCustomItem } from './custom-item-validators';

describe('B-024 custom work item', () => {
  it('requires qty and price when name set', () => {
    expect(validateCustomItem({ name: '加強', qty: 1, unitPrice: 10 })).toBeNull();
    expect(validateCustomItem({ name: '加強' })?.message).toBeDefined();
  });
});
