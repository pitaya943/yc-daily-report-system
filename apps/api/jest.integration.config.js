/** @type {import('jest').Config} */
module.exports = {
  ...require('./jest.config.js'),
  setupFilesAfterEnv: ['<rootDir>/test/integration/hooks.ts'],
};
