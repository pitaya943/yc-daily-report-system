import { assertSafeBootstrapEnv } from './bootstrap-env';

describe('B-088 E2E_TESTS forbidden in production', () => {
  it('refuses production + E2E_TESTS', () => {
    const prevNode = process.env.NODE_ENV;
    const prevE2e = process.env.E2E_TESTS;
    process.env.NODE_ENV = 'production';
    process.env.E2E_TESTS = '1';
    expect(() => assertSafeBootstrapEnv()).toThrow(/E2E_TESTS/);
    process.env.NODE_ENV = prevNode;
    process.env.E2E_TESTS = prevE2e;
  });
});
