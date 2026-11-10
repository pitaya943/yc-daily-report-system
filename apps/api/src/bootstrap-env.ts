/** Refuse unsafe combinations at process start (B-088 / done-when). */
export function assertSafeBootstrapEnv(): void {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.E2E_TESTS === '1'
  ) {
    throw new Error(
      'E2E_TESTS must not be set when NODE_ENV is production',
    );
  }
}
