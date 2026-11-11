import { ValidationMessages } from './messages';
import type { FieldError } from './validators';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Spec L355 action types (B-037), plus the later B-097 names. */
export const FILTER_ACTION_TYPES = [
  'REPORT_CREATE',
  'REPORT_UPDATE',
  'REPORT_DELETE',
  'REPORT_CONFIRM',
  'REPORT_REJECT',
  'REPORT_UNCONFIRM',
  'ACCOUNT_CREATE',
  'ACCOUNT_UPDATE',
  'ACCOUNT_ARCHIVE',
  'ACCOUNT_RESTORE',
  'PASSWORD_CHANGE',
  'MATERIAL_REQUEST',
  'MATERIAL_CANCEL',
  'MATERIAL_ADD',
  'MATERIAL_UPDATE',
  'MATERIAL_DELETE',
  'MATERIAL_APPROVE',
  'MATERIAL_REJECT',
  'MATERIAL_IMPORT',
  'MATERIAL_RESET',
  'MATERIAL_KEEP_A',
  'MATERIAL_SYNC_B',
  'SYSTEM_CONFIG',
  'RETENTION_RESET',
  'RETENTION_SET',
  'RETENTION_YEAR_END',
  'LEDGER_CREATE',
  'LEDGER_UPDATE',
  'LEDGER_DELETE',
  'LEDGER_SETTLE',
  'BANK_REVEAL',
  'EXPORT',
  'FILE_DOWNLOAD',
  'ACCESS_DENIED',
  'LEDGER_VOID',
  'ACCOUNT_ROLE_CHANGE',
  'ACCOUNT_LOCKOUT',
] as const;

export function validateOptionalFilterDate(
  value: string | undefined,
  field: string,
): FieldError | null {
  if (value == null || value === '') return null;
  if (!DATE_RE.test(value)) {
    return { field, message: ValidationMessages.filterInvalid };
  }
  return null;
}

export function validateOptionalFilterZone(
  zone: string | undefined,
): FieldError | null {
  if (zone == null || zone === '') return null;
  if (zone !== 'WEST' && zone !== 'SOUTH') {
    return { field: 'zone', message: ValidationMessages.filterInvalid };
  }
  return null;
}

export function validateOptionalFilterAction(
  action: string | undefined,
): FieldError | null {
  if (action == null || action === '') return null;
  if (!(FILTER_ACTION_TYPES as readonly string[]).includes(action)) {
    return { field: 'actionType', message: ValidationMessages.filterInvalid };
  }
  return null;
}
