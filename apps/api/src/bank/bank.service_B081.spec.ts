import { BankService } from './bank.service';

describe('B-081 fail closed without key', () => {
  it('requireKey throws when env unset', () => {
    const prev = process.env.BANK_ENCRYPTION_KEY_BASE64;
    delete process.env.BANK_ENCRYPTION_KEY_BASE64;
    const svc = new BankService();
    expect(() => svc.requireKey()).toThrow();
    if (prev) process.env.BANK_ENCRYPTION_KEY_BASE64 = prev;
  });
});
