import { ValidationMessages } from './messages';
import { validateLedgerAmount, validateLedgerType } from './ledger-validators';

describe('B-088 ledger validators', () => {
  it('rejects non-positive amount with spec message', () => {
    expect(validateLedgerAmount(0)?.message).toBe(ValidationMessages.ledgerAmountPositive);
  });
  it('rejects invalid ledger type', () => {
    expect(validateLedgerType('FOO')?.message).toBe(ValidationMessages.ledgerTypeRequired);
  });
});
