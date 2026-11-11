/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleNameMapper: {
    '^@yc/validation$': '<rootDir>/../../packages/validation/src',
    '^@yc/allocation$': '<rootDir>/../../packages/allocation/src',
    '^@yc/payroll$': '<rootDir>/../../packages/payroll/src',
    '^@yc/bank-crypto$': '<rootDir>/../../packages/bank-crypto/src',
  },
  testTimeout: 120000,
};
