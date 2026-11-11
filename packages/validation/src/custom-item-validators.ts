import { ValidationMessages } from './messages';

/** B-024 custom work item on reports (admin attach). */
export function validateCustomItem(input: {
  name?: string | null;
  qty?: number | null;
  unitPrice?: number | null;
}): { message: string } | null {
  const name = input.name?.trim() ?? '';
  if (!name) {
    return null;
  }
  if (name.length > 100) {
    return { message: ValidationMessages.customItemNameMax };
  }
  if (input.qty === undefined || input.qty === null) {
    return { message: ValidationMessages.customItemQty };
  }
  const units = Math.round(input.qty * 10);
  if (units < 0 || units > 9999 || Math.abs(input.qty * 10 - units) > 1e-6) {
    return { message: ValidationMessages.customItemQty };
  }
  if (
    input.unitPrice === undefined ||
    input.unitPrice === null ||
    input.unitPrice < 0 ||
    !Number.isInteger(input.unitPrice)
  ) {
    return { message: ValidationMessages.customItemPrice };
  }
  return null;
}
