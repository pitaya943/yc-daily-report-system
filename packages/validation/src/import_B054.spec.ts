import {
  defaultTrustChoice,
  evaluateImportRow,
} from './import-b054';

describe('B-054 import comparison', () => {
  const a = { code: 'm1', received: 10, cumulative: 3, remaining: 7 };

  it('B-054 applies positive x in step 2', () => {
    const r = evaluateImportRow(a, 12, 3, 9);
    expect(r.action).toBe('apply');
    if (r.action === 'apply') {
      expect(r.x).toBe(2);
      expect(r.receivedNew).toBe(12);
      expect(r.remainingNew).toBe(9);
    }
  });

  it('B-054 quarantines when x negative', () => {
    const r = evaluateImportRow(a, 8);
    expect(r.action).toBe('quarantine');
    if (r.action === 'quarantine') {
      expect(r.fault).toBe('B');
    }
  });

  it('B-055 default trust when fault A', () => {
    expect(defaultTrustChoice('A')).toBe('B');
    expect(defaultTrustChoice('B')).toBe('A');
  });
});
