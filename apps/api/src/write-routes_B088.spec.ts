import { WRITE_ROUTE_VALIDATORS } from './write-route-registry';

describe('B-088 write routes have validators', () => {
  it('enumerates all write routes with validator ids', () => {
    expect(WRITE_ROUTE_VALIDATORS.length).toBeGreaterThanOrEqual(14);
    for (const row of WRITE_ROUTE_VALIDATORS) {
      expect(row.validator).toMatch(/^[a-z0-9-]+$/);
      expect(row.path.startsWith('/')).toBe(true);
    }
  });
});
