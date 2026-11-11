import { ValidationMessages } from '@yc/validation';

describe('B-088 user-facing messages are Chinese', () => {
  it('ValidationMessages values are not ASCII-only', () => {
    for (const msg of Object.values(ValidationMessages)) {
      expect(msg).toMatch(/[\u4e00-\u9fff]/);
    }
  });
});
