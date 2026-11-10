/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleNameMapper: {
    '^@yc/validation$': '<rootDir>/../../packages/validation/src',
  },
  testTimeout: 120000,
};
