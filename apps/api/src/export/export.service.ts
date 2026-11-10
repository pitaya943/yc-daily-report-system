import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';

/** B-072 B-073 B-084 minimal Traditional Chinese xlsx. */
@Injectable()
export class ExportService {
  async buildPayrollXlsx(run: {
    startDate: string;
    endDate: string;
    rows: Array<Record<string, unknown>>;
  }): Promise<Buffer> {
    const wb = new Workbook();
    const summary = wb.addWorksheet('摘要');
    summary.addRow(['薪資期間', `${run.startDate} ~ ${run.endDate}`]);
    for (const r of run.rows) {
      const sheet = wb.addWorksheet(String(r.display_name_snapshot ?? '人員'));
      sheet.addRow(['應發', r.gross ?? 0]);
      sheet.addRow(['實發', r.final_pay ?? 0]);
    }
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async buildSummaryXlsx(rows: Array<Record<string, unknown>>): Promise<Buffer> {
    const wb = new Workbook();
    const ws = wb.addWorksheet('總表');
    ws.addRow(['帳戶', '工項總量', '金額']);
    for (const r of rows) {
      ws.addRow([r.displayName, r.qty, r.amount]);
    }
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
