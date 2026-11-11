import { ValidationMessages } from './messages';

export type FieldError = { field: string; message: string };

export function validatePasswordLength(password: string): FieldError | null {
  if (password.length < 6 || password.length > 30) {
    return { field: 'password', message: ValidationMessages.passwordLength };
  }
  return null;
}

export function validateDisplayName(name: string): FieldError | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return { field: 'displayName', message: ValidationMessages.displayNameRequired };
  }
  if ([...trimmed].length > 50) {
    return { field: 'displayName', message: ValidationMessages.displayNameMaxLength };
  }
  return null;
}
