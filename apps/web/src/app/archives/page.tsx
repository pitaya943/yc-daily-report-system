'use client';

import { useEffect, useState } from 'react';
import { AppNav } from '../../components/AppNav';
import { apiGet, apiSend } from '../../lib/api';

type ArchiveRow = { id: string; archive_date: string; source: string };

/** B-077 list + download */
export default function ArchivesPage() {
  const [rows, setRows] = useState<ArchiveRow[]>([]);
  const [page, setPage] = useState(1);

  async function reload() {
    const data = await apiGet<{ rows: ArchiveRow[] }>(`/archives?page=${page}`);
    setRows(data.rows ?? []);
  }

  useEffect(() => {
    void reload();
  }, [page]);

  async function download(id: string) {
    const links = await apiGet<{ links: { xlsx?: string; pdf?: string } }>(
      `/archives/${id}/download`,
    );
    if (links.links?.xlsx) window.open(links.links.xlsx, '_blank');
  }

  async function generate() {
    const archiveDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Taipei',
    }).format(new Date());
    await apiSend('/archives/daily', 'POST', {
      archiveDate,
      type: 'DAILY',
      source: 'MANUAL',
    });
    await reload();
  }

  return (
    <main>
      <AppNav />
      <h1>檔案庫（B-077）</h1>
      <button type="button" onClick={() => void generate()}>
        手動日歸檔
      </button>
      <ul>
        {rows.map((r) => (
          <li key={r.id}>
            {r.archive_date} ({r.source})
            <button type="button" onClick={() => void download(r.id)}>
              下載
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setPage((p) => p + 1)}>
        下一頁
      </button>
    </main>
  );
}
