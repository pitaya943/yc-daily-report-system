import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { WRITE_ROUTE_VALIDATORS } from './write-route-registry';

describe('B-088 write routes have validators', () => {
  const integrationPath = path.join(
    __dirname,
    '..',
    'test',
    'integration',
    'write_validation_B088.spec.ts',
  );
  const source = readFileSync(integrationPath, 'utf8');

  it('registry maps every validator id to a rejection case', () => {
    expect(WRITE_ROUTE_VALIDATORS.length).toBeGreaterThanOrEqual(14);
    for (const row of WRITE_ROUTE_VALIDATORS) {
      expect(row.validator).toMatch(/^[a-z0-9-]+$/);
      expect(row.path.startsWith('/')).toBe(true);
      expect(source).toContain(`'${row.validator}':`);
    }
  });
});
