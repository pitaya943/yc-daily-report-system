import { ValidationMessages } from './messages';

export type StockColour = 'green' | 'yellow' | 'red';

/** B-057 colour hints for remaining quantity. */
export function stockColourHint(remaining: number): StockColour {
  if (remaining <= 0) return 'red';
  if (remaining <= 5) return 'yellow';
  return 'green';
}

export function assertMaterialRequestable(row: {
  remaining_qty: number;
  hidden: boolean;
  quarantined: boolean;
}): { message: string } | null {
  if (row.hidden || row.quarantined || Number(row.remaining_qty) <= 0) {
    return { message: ValidationMessages.materialNotRequestable };
  }
  return null;
}
