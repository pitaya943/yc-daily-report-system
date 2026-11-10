/** B-049 half-up to whole NTD at payroll step */
export function roundHalfUpNtd(amount: number): number {
  return Math.round(amount);
}

/** B-050 uninsured: percentage on work-item gross only */
export function uninsuredDeductionNtd(
  workItemGross: number,
  ratePercent: number,
  enrolled: boolean,
  exempt: boolean,
): number {
  if (enrolled || exempt || workItemGross <= 0 || ratePercent <= 0) return 0;
  return roundHalfUpNtd(workItemGross * (ratePercent / 100));
}
