import { computeFinalPay } from './final-pay';
import { periodRetentionNtd } from './retention-cap';

export type PayrollRowInput = {
  gross: number;
  workItemGross: number;
  periodRawRetention: number;
  ytdBefore: number;
  annualCap: number;
  fixedSalaryApplied: number;
  insuranceApplied: number;
  uninsuredRatePercent: number;
  enrolled: boolean;
  uninsuredExempt: boolean;
};

export function buildPayrollRow(input: PayrollRowInput): {
  periodRetention: number;
  net: number;
  uninsured: number;
  finalPay: number;
} {
  const periodRetention = periodRetentionNtd(
    input.periodRawRetention,
    input.ytdBefore,
    input.annualCap,
  );
  const { net, uninsured, finalPay } = computeFinalPay({
    gross: input.gross,
    periodRetention,
    fixedSalaryApplied: input.fixedSalaryApplied,
    insuranceApplied: input.insuranceApplied,
    workItemGross: input.workItemGross,
    uninsuredRatePercent: input.uninsuredRatePercent,
    enrolled: input.enrolled,
    uninsuredExempt: input.uninsuredExempt,
  });
  return { periodRetention, net, uninsured, finalPay };
}
