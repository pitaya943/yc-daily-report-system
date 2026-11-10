import { roundHalfUpNtd, uninsuredDeductionNtd } from './money';

export type FinalPayInput = {
  gross: number;
  periodRetention: number;
  fixedSalaryApplied: number;
  insuranceApplied: number;
  workItemGross: number;
  uninsuredRatePercent: number;
  enrolled: boolean;
  uninsuredExempt: boolean;
};

/** B-049 net and final (before last rounding pass on components) */
export function computeFinalPay(input: FinalPayInput): {
  net: number;
  uninsured: number;
  finalPay: number;
} {
  const net = input.gross - input.periodRetention;
  const uninsured = uninsuredDeductionNtd(
    input.workItemGross,
    input.uninsuredRatePercent,
    input.enrolled,
    input.uninsuredExempt,
  );
  const finalBeforeRound =
    net + input.fixedSalaryApplied - input.insuranceApplied - uninsured;
  return {
    net,
    uninsured,
    finalPay: roundHalfUpNtd(finalBeforeRound),
  };
}
