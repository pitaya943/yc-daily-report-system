import {
  decryptBankAccount,
  encryptBankAccount,
  bankLast4,
  normalizeBankDigits,
  parseBankKeyBase64,
} from './index';

describe('B-081 bank encryption at rest', () => {
  const key = parseBankKeyBase64(
    Buffer.alloc(32, 7).toString('base64'),
  )!;

  it('round-trips 14-digit account', () => {
    const plain = '12345678901234';
    const ct = encryptBankAccount(plain, key);
    expect(decryptBankAccount(ct, key)).toBe(plain);
  });

  it('last four masking B-014', () => {
    expect(bankLast4('12345678901234')).toBe('1234');
    expect(normalizeBankDigits('1234-5678-9012-34')).toBe('12345678901234');
  });

  it('missing key is null not throw', () => {
    expect(parseBankKeyBase64(undefined)).toBeNull();
    expect(parseBankKeyBase64('')).toBeNull();
  });
});
