/** B-053 greedy bill breakdown */
const DENOMS = [1000, 500, 100, 50, 10, 5, 1] as const;

export function greedyCashBreakdown(totalNtd: number): Record<number, number> {
  let left = Math.max(0, Math.floor(totalNtd));
  const out: Record<number, number> = {};
  for (const d of DENOMS) {
    const n = Math.floor(left / d);
    if (n > 0) out[d] = n;
    left -= n * d;
  }
  return out;
}
