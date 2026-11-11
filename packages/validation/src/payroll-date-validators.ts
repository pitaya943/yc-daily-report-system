import { ValidationMessages } from './messages';
import type { FieldError } from './validators';

export function validatePayrollDateRange(startDate: string, endDate: string): FieldError | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return { field: 'dates', message: ValidationMessages.payrollDatesRequired };
  }
  if (endDate < startDate) {
    return { field: 'endDate', message: ValidationMessages.payrollEndBeforeStart };
  }
  return null;
}
