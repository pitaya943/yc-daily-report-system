/**
 * B-046 ytd_before clamped to [0, cap]
 * B-047 period_retention = max(0, min(period_raw, cap - ytd_before))
 */
export function clampYtdBefore(ytdRaw: number, annualCap: number): number {
  if (annualCap <= 0) return 0;
  return Math.max(0, Math.min(ytdRaw, annualCap));
}

export function periodRetentionNtd(
  periodRaw: number,
  ytdBefore: number,
  annualCap: number,
): number {
  if (annualCap <= 0) return 0;
  const room = Math.max(0, annualCap - ytdBefore);
  return Math.max(0, Math.min(periodRaw, room));
}
