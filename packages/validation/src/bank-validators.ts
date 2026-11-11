import { ValidationMessages } from './messages';

/** B-013 B-014 14 digit bank account. */
export function validateBankAccountDigits(input: string): { message: string } | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length !== 14) {
    return { message: ValidationMessages.bankDigitsInvalid };
  }
  return null;
}
