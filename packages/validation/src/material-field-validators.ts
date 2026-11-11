import { ValidationMessages } from './messages';
import type { FieldError } from './validators';

export function validateMaterialName(name: string): FieldError | null {
  const t = name?.trim() ?? '';
  if (!t) return { field: 'name', message: ValidationMessages.materialNameRequired };
  if (t.length > 100) {
    return { field: 'name', message: ValidationMessages.materialNameMax };
  }
  return null;
}

export function validateMaterialUnit(unit: string): FieldError | null {
  const t = unit?.trim() ?? '';
  if (!t) return { field: 'unit', message: ValidationMessages.materialUnitRequired };
  if (t.length > 20) {
    return { field: 'unit', message: ValidationMessages.materialUnitMax };
  }
  return null;
}

export function validateMaterialCode(code: string | undefined): FieldError | null {
  if (code == null || code === '') return null;
  if (code.length > 50) {
    return { field: 'code', message: ValidationMessages.materialCodeMax };
  }
  return null;
}

export function validateMaterialTab(tab: number | undefined): FieldError | null {
  if (tab == null) return null;
  if (!Number.isInteger(tab) || tab < 1 || tab > 10) {
    return { field: 'tab', message: ValidationMessages.materialTabRange };
  }
  return null;
}

export function validateMaterialQty(qty: number | undefined, field = 'remainingQty'): FieldError | null {
  if (qty == null) return null;
  if (qty < 0 || !Number.isFinite(qty)) {
    return { field, message: ValidationMessages.materialQtyRange };
  }
  const s = String(qty);
  const frac = s.includes('.') ? s.split('.')[1] : '';
  if (frac.length > 3) {
    return { field, message: ValidationMessages.materialQtyRange };
  }
  return null;
}

export function validateMaterialSpecification(
  specification: string | undefined,
): FieldError | null {
  if (specification == null || specification === '') return null;
  if (specification.length > 200) {
    return { field: 'specification', message: ValidationMessages.materialSpecificationMax };
  }
  return null;
}

export function validateMaterialRequestNote(note: string | undefined): FieldError | null {
  if (note == null || note === '') return null;
  if (note.length > 50) {
    return { field: 'note', message: ValidationMessages.materialRequestNoteMax };
  }
  return null;
}
