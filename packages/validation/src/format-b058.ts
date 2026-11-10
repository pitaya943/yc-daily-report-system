/** B-058 display helpers */
export function formatWorkQty(qty: number): string {
  if (qty === 0) return '';
  const u = Math.round(qty * 10);
  if (u % 10 === 0) return String(u / 10);
  return (u / 10).toFixed(1);
}

export function formatMoneyNtd(amount: number): string {
  const n = Math.round(amount);
  return n.toLocaleString('zh-Hant-TW');
}

export function formatMaterialQty(qty: number): string {
  return String(qty).replace(/\.?0+$/, '');
}
