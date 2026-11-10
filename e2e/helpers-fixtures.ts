import pg from 'pg';

const WEST_USER_ID = 'b0000001-0001-4000-8000-000000000003';
const materialId = 'c0000001-0001-4000-8000-000000000001';

export async function withPg<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required for e2e DB helpers');
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function clearWestUserReportsToday(): Promise<void> {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  await withPg(async (client) => {
    await client.query(
      `DELETE FROM public.daily_reports WHERE submitter_id = $1 AND report_date = $2::date`,
      [WEST_USER_ID, today],
    );
  });
}

export async function resetMaterialInventory(
  remaining: number,
  received = 100,
): Promise<void> {
  await withPg(async (client) => {
    await client.query(
      `UPDATE public.materials SET remaining_qty = $2, received_qty = $3, cumulative_usage = $3 - $2 WHERE id = $1`,
      [materialId, remaining, received],
    );
  });
}

export { materialId };
