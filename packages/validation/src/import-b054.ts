/** B-054 inventory import step-1 / step-2 helpers */

export type MaterialSnapshot = {
  code: string;
  received: number;
  cumulative: number;
  remaining: number;
};

export type ImportRowResult =
  | { action: 'apply'; receivedNew: number; remainingNew: number; x: number }
  | {
      action: 'quarantine';
      x: number;
      expectedReceived: number;
      expectedRemaining: number;
      fault: 'A' | 'B' | '?';
      note: string;
    };

function invariantOk(m: MaterialSnapshot): boolean {
  const eps = 0.0001;
  return (
    m.received >= 0 &&
    m.remaining >= 0 &&
    m.cumulative >= 0 &&
    Math.abs(m.received - (m.cumulative + m.remaining)) < eps
  );
}

function bMatchesExpected(
  bReceived: number,
  bCumulative: number,
  bRemaining: number,
  expectedReceived: number,
  expectedRemaining: number,
): boolean {
  const eps = 0.0001;
  return (
    Math.abs(bReceived - expectedReceived) < eps &&
    Math.abs(bRemaining - expectedRemaining) < eps &&
    Math.abs(bReceived - (bCumulative + bRemaining)) < eps
  );
}

/** Decide apply vs quarantine per spec B-054. */
export function evaluateImportRow(
  a: MaterialSnapshot,
  bReceived: number,
  bCumulative = a.cumulative,
  bRemaining?: number,
): ImportRowResult {
  const x = bReceived - a.received;
  const expectedReceived = a.received + Math.max(0, x);
  const expectedRemaining = a.remaining + Math.max(0, x);
  const br = bRemaining ?? bReceived - bCumulative;

  if (x < 0) {
    return quarantine(a, bReceived, br, bCumulative, x, expectedReceived, expectedRemaining, 'B');
  }
  if (!invariantOk(a)) {
    return quarantine(a, bReceived, br, bCumulative, x, expectedReceived, expectedRemaining, 'A');
  }
  if (!bMatchesExpected(bReceived, bCumulative, br, expectedReceived, expectedRemaining)) {
    const fault = invariantOk(a) ? 'B' : 'A';
    return quarantine(a, bReceived, br, bCumulative, x, expectedReceived, expectedRemaining, fault);
  }
  if (x >= 0) {
    return {
      action: 'apply',
      x,
      receivedNew: expectedReceived,
      remainingNew: expectedRemaining,
    };
  }
  return quarantine(a, bReceived, br, bCumulative, x, expectedReceived, expectedRemaining, '?');
}

function quarantine(
  a: MaterialSnapshot,
  bReceived: number,
  bRemaining: number,
  bCumulative: number,
  x: number,
  expectedReceived: number,
  expectedRemaining: number,
  fault: 'A' | 'B' | '?',
): ImportRowResult {
  const note = [
    `A:實領${a.received} 累計${a.cumulative} 庫存${a.remaining}`,
    `B:實領${bReceived} 累計${bCumulative} 庫存${bRemaining}`,
    `x=${x}`,
    `A預期:實領${expectedReceived} 庫存${expectedRemaining}`,
    `fault=${fault}`,
  ].join(' | ');
  return {
    action: 'quarantine',
    x,
    expectedReceived,
    expectedRemaining,
    fault,
    note,
  };
}

/** B-055 default trust: fault A → trust B, else trust A */
export function defaultTrustChoice(fault: 'A' | 'B' | '?'): 'A' | 'B' {
  return fault === 'A' ? 'B' : 'A';
}
