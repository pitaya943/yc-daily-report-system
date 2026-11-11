import { ValidationMessages } from './messages';
import type { FieldError } from './validators';

const LEDGER_CATEGORIES = new Set([
  '材料費',
  '人工費',
  '雜支',
  '設備費',
  '運費',
  '其他',
]);

export function validateLedgerDate(entryDate: string): FieldError | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    return { field: 'entryDate', message: ValidationMessages.ledgerDateRequired };
  }
  const d = new Date(`${entryDate}T12:00:00+08:00`);
  if (Number.isNaN(d.getTime())) {
    return { field: 'entryDate', message: ValidationMessages.ledgerDateRequired };
  }
  return null;
}

export function validateLedgerType(type: string): FieldError | null {
  if (type !== 'INCOME' && type !== 'EXPENSE') {
    return { field: 'type', message: ValidationMessages.ledgerTypeRequired };
  }
  return null;
}

export function validateLedgerAmount(amount: number): FieldError | null {
  if (!Number.isInteger(amount) || amount < 1) {
    return { field: 'amount', message: ValidationMessages.ledgerAmountPositive };
  }
  return null;
}

export function validateLedgerDescription(description: string): FieldError | null {
  const t = description?.trim() ?? '';
  if (!t) {
    return { field: 'description', message: ValidationMessages.ledgerDescriptionRequired };
  }
  if (t.length > 200) {
    return { field: 'description', message: ValidationMessages.ledgerDescriptionMax };
  }
  return null;
}

export function validateLedgerCategory(category: string | undefined): FieldError | null {
  if (category == null || category === '') return null;
  if (!LEDGER_CATEGORIES.has(category)) {
    return { field: 'category', message: ValidationMessages.ledgerCategoryInvalid };
  }
  return null;
}

export function validateLedgerNote(note: string | undefined): FieldError | null {
  if (note == null || note === '') return null;
  if (note.length > 100) {
    return { field: 'note', message: ValidationMessages.ledgerNoteMax };
  }
  return null;
}
