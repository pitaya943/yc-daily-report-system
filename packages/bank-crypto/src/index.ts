import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const IV_LEN = 12;
const TAG_LEN = 16;

/** B-081 AES-256-GCM; key is 32 bytes base64. */
export function parseBankKeyBase64(env: string | undefined): Buffer | null {
  if (!env?.trim()) return null;
  const buf = Buffer.from(env.trim(), 'base64');
  if (buf.length !== 32) {
    throw new Error('BANK_ENCRYPTION_KEY_BASE64 must decode to 32 bytes');
  }
  return buf;
}

export function encryptBankAccount(
  plaintext: string,
  key: Buffer,
): Buffer {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]);
}

export function decryptBankAccount(ciphertext: Buffer, key: Buffer): string {
  if (ciphertext.length < IV_LEN + TAG_LEN + 1) {
    throw new Error('invalid bank ciphertext');
  }
  const iv = ciphertext.subarray(0, IV_LEN);
  const tag = ciphertext.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = ciphertext.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    'utf8',
  );
}

export function bankLast4(account: string): string {
  const digits = account.replace(/\D/g, '');
  if (digits.length < 4) {
    throw new Error('bank account too short');
  }
  return digits.slice(-4);
}

export function normalizeBankDigits(input: string): string {
  return input.replace(/\D/g, '');
}
