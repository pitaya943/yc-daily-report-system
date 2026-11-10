/** B-019 offset applied to raw YTD before annual cap clamp. */
export function ytdWithOffset(
  rawYtd: number,
  offsetNtd: number,
  annualCap: number,
): number {
  const combined = rawYtd + offsetNtd;
  if (annualCap <= 0) return Math.max(0, combined);
  return Math.max(0, Math.min(combined, annualCap));
}

export function offsetForTargetYtd(
  rawYtd: number,
  targetYtd: number,
  annualCap: number,
): number {
  const clamped = annualCap > 0 ? Math.min(targetYtd, annualCap) : targetYtd;
  return clamped - rawYtd;
}
