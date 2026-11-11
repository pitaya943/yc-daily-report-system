/**
 * B-044 BDD-001 examples
 */
import {
  buildReportShareRows,
  splitQtyUnitsAmongParticipants,
  unitsToQty,
} from './split-b044';

describe('B-044 splitQtyUnitsAmongParticipants', () => {
  const ids = ['A', 'B', 'C'];

  it('BDD-001 example A: 7.0 只 among 3 people', () => {
    const shares = splitQtyUnitsAmongParticipants(
      70,
      ids.map((id) => ({ accountId: id })),
    );
    expect(unitsToQty(shares.get('A')!)).toBe(2.4);
    expect(unitsToQty(shares.get('B')!)).toBe(2.3);
    expect(unitsToQty(shares.get('C')!)).toBe(2.3);
    expect([...shares.values()].reduce((a, b) => a + b, 0)).toBe(70);
  });

  it('BDD-001 example B: 1.0 只 among 3 people', () => {
    const shares = splitQtyUnitsAmongParticipants(
      10,
      ids.map((id) => ({ accountId: id })),
    );
    expect(unitsToQty(shares.get('A')!)).toBe(0.4);
    expect(unitsToQty(shares.get('B')!)).toBe(0.3);
    expect(unitsToQty(shares.get('C')!)).toBe(0.3);
  });

  it('BDD-001 roster order A, C, B after submitter', () => {
    const rows = buildReportShareRows({
      reportId: 'r1',
      submitterId: 'A',
      collaboratorIdsInOrder: ['C', 'B'],
      quantities: [{ itemCode: 'direct_13', qtyUnits: 70 }],
    });
    const byPerson = Object.fromEntries(
      rows.map((r) => [r.accountId, r.shareUnits]),
    );
    expect(unitsToQty(byPerson['A'])).toBe(2.4);
    expect(unitsToQty(byPerson['C'])).toBe(2.3);
    expect(unitsToQty(byPerson['B'])).toBe(2.3);
  });
});
