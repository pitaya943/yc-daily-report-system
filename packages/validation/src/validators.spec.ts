/** @jest-environment node */
import { validatePasswordLength, validateDisplayName } from './validators';
import { ValidationMessages } from './messages';

describe('B-088 validatePasswordLength', () => {
  it('accepts 6-30 characters', () => {
    expect(validatePasswordLength('abcdef')).toBeNull();
    expect(validatePasswordLength('a'.repeat(30))).toBeNull();
  });

  it('rejects short password with Chinese message', () => {
    expect(validatePasswordLength('abc')?.message).toBe(
      ValidationMessages.passwordLength,
    );
  });
});

describe('B-088 validateDisplayName', () => {
  it('rejects blank display name', () => {
    expect(validateDisplayName('   ')?.message).toBe(
      ValidationMessages.displayNameRequired,
    );
  });

  it('rejects over 50 characters', () => {
    expect(validateDisplayName('字'.repeat(51))?.message).toBe(
      ValidationMessages.displayNameMaxLength,
    );
  });
});
