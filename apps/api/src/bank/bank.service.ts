import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  bankLast4,
  decryptBankAccount,
  encryptBankAccount,
  normalizeBankDigits,
  parseBankKeyBase64,
} from '@yc/bank-crypto';
import { loadConfig } from '../config';
import { ValidationMessages } from '@yc/validation';

/** B-081 B-093 fail closed when key missing. */
@Injectable()
export class BankService {
  private key: Buffer | null = null;
  private attempted = false;

  /** B-081 / Q-022 — true when encryption key is configured. */
  hasEncryptionKey(): boolean {
    return this.getKey() !== null;
  }

  /** Mask last four for API responses; without a key show 無法讀取. */
  formatBankLast4(last4: string | null): string {
    if (!this.hasEncryptionKey()) {
      return ValidationMessages.bankDisplayUnreadable;
    }
    return last4 ?? '';
  }

  private getKey(): Buffer | null {
    if (!this.attempted) {
      this.attempted = true;
      const cfg = loadConfig();
      this.key = cfg.bankEncryptionKeyBase64
        ? parseBankKeyBase64(cfg.bankEncryptionKeyBase64)
        : null;
    }
    return this.key;
  }

  requireKey(): Buffer {
    const key = this.getKey();
    if (!key) {
      throw new ServiceUnavailableException(ValidationMessages.bankDisplayUnreadable);
    }
    return key;
  }

  encryptForStorage(plain: string): { ciphertext: Buffer; last4: string } {
    const digits = normalizeBankDigits(plain);
    if (digits.length !== 14) {
      throw new Error(ValidationMessages.bankDigitsInvalid);
    }
    const key = this.requireKey();
    return {
      ciphertext: encryptBankAccount(digits, key),
      last4: bankLast4(digits),
    };
  }

  decryptFromStorage(ciphertext: Buffer | null): string {
    if (!ciphertext) {
      throw new ServiceUnavailableException(ValidationMessages.bankDisplayUnreadable);
    }
    return decryptBankAccount(ciphertext, this.requireKey());
  }
}
