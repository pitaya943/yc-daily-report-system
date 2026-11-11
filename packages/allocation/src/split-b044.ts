/**
 * B-044 collaboration split at 0.1-unit layer.
 * Participant order: submitter first, then collaborators in roster order.
 */
export type SplitParticipant = { accountId: string };

export type ItemQtyUnits = { itemCode: string; qtyUnits: number };

const CUSTOM_SENTINEL = '__custom__';

export function splitQtyUnitsAmongParticipants(
  qtyUnits: number,
  participants: SplitParticipant[],
): Map<string, number> {
  const n = participants.length;
  if (n === 0 || qtyUnits < 0) {
    return new Map();
  }
  const base = Math.floor(qtyUnits / n);
  const rem = qtyUnits - base * n;
  const out = new Map<string, number>();
  participants.forEach((p, i) => {
    out.set(p.accountId, base + (i < rem ? 1 : 0));
  });
  return out;
}

/** B-091: persist-ready rows per (report, item). */
export function buildReportShareRows(input: {
  reportId: string;
  submitterId: string;
  collaboratorIdsInOrder: string[];
  quantities: ItemQtyUnits[];
  customQtyUnits?: number;
}): Array<{ accountId: string; itemCode: string; shareUnits: number }> {
  const roster = [
    { accountId: input.submitterId },
    ...input.collaboratorIdsInOrder.map((id) => ({ accountId: id })),
  ];
  const rows: Array<{ accountId: string; itemCode: string; shareUnits: number }> =
    [];
  for (const q of input.quantities) {
    if (q.qtyUnits <= 0) continue;
    const shares = splitQtyUnitsAmongParticipants(q.qtyUnits, roster);
    for (const [accountId, shareUnits] of shares) {
      if (shareUnits > 0) {
        rows.push({ accountId, itemCode: q.itemCode, shareUnits });
      }
    }
  }
  if (input.customQtyUnits && input.customQtyUnits > 0) {
    const shares = splitQtyUnitsAmongParticipants(
      input.customQtyUnits,
      roster,
    );
    for (const [accountId, shareUnits] of shares) {
      if (shareUnits > 0) {
        rows.push({ accountId, itemCode: CUSTOM_SENTINEL, shareUnits });
      }
    }
  }
  return rows;
}

export function unitsToQty(qtyUnits: number): number {
  return qtyUnits / 10;
}
