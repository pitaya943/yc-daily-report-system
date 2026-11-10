import { assertSafeBootstrapEnv } from './bootstrap-env';

describe('B-079 B-061 session safety', () => {
  it('B-079 production rejects E2E_TESTS', () => {
    const prev = process.env.NODE_ENV;
    const e2e = process.env.E2E_TESTS;
    process.env.NODE_ENV = 'production';
    process.env.E2E_TESTS = '1';
    expect(() => assertSafeBootstrapEnv()).toThrow();
    process.env.NODE_ENV = prev;
    process.env.E2E_TESTS = e2e;
  });
});
