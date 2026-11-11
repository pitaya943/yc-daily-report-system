import {
  validateLedgerPayerOnIncome,
} from './ledger-validators';
import { ValidationMessages } from './messages';

describe('ledger payer on INCOME', () => {
  it('rejects payerAccountId on INCOME (B-088)', () => {
    const err = validateLedgerPayerOnIncome('INCOME', 'user-id');
    expect(err?.message).toBe(ValidationMessages.ledgerPayerIncomeOnly);
  });
});
