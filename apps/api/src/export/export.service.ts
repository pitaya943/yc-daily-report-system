import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

export type PayrollExportRow = {
  display_name_snapshot?: string;
  gross?: number;
  period_retention?: number;
  net?: number;
  fixed_salary_applied?: number;
  insurance_applied?: number;
  uninsured_deduction?: number;
  final_pay?: number;
  payment_method?: string;
  bank_last4?: string | null;
};

/** B-072 B-073 B-076 B-084 Traditional Chinese exports. */
@Injectable()
export class ExportService {
  async buildPayrollXlsx(run: {
    startDate: string;
    endDate: string;
    rows: PayrollExportRow[];
  }): Promise<Buffer> {
    const wb = new Workbook();
    const summary = wb.addWorksheet('摘要');
    summary.addRow([
      '薪資期間',
      `${run.startDate} ~ ${run.endDate}`,
      'B-084',
    ]);
    summary.addRow([
      '姓名',
      '毛額',
      '保留金',
      '淨額',
      '固定薪',
      '勞健保',
      '未投保',
      '實發',
    ]);
    let cash = 0;
    let transfer = 0;
    for (const r of run.rows) {
      const finalPay = Number(r.final_pay ?? 0);
      summary.addRow([
        r.display_name_snapshot,
        r.gross ?? 0,
        r.period_retention ?? 0,
        r.net ?? 0,
        r.fixed_salary_applied ?? 0,
        r.insurance_applied ?? 0,
        r.uninsured_deduction ?? 0,
        finalPay,
      ]);
      if (finalPay > 0 && r.payment_method === 'CASH') cash += finalPay;
      if (finalPay > 0 && r.payment_method === 'TRANSFER') transfer += finalPay;
      const sheetName = String(r.display_name_snapshot ?? '人員')
        .slice(0, 28)
        .replace(/[*?:/\\[\]]/g, '_');
      const sheet = wb.addWorksheet(sheetName || '人員');
      sheet.addRow(['工項毛額', r.gross ?? 0]);
      sheet.addRow(['保留金', r.period_retention ?? 0]);
      sheet.addRow(['淨額', r.net ?? 0]);
      sheet.addRow(['固定薪', r.fixed_salary_applied ?? 0]);
      sheet.addRow(['勞健保', r.insurance_applied ?? 0]);
      sheet.addRow(['未投保', r.uninsured_deduction ?? 0]);
      sheet.addRow(['實發', finalPay]);
    }
    summary.addRow(['現金總額', cash]);
    summary.addRow(['轉帳總額', transfer]);
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async buildPayrollPdf(run: {
    startDate: string;
    endDate: string;
    rows: PayrollExportRow[];
  }): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([842, 595]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const lines = [
      `Payroll ${run.startDate} ~ ${run.endDate} (B-084 PDF)`,
      ...run.rows.map(
        (r) =>
          `${r.display_name_snapshot}: gross=${r.gross} final=${r.final_pay}`,
      ),
    ];
    let y = 550;
    for (const line of lines) {
      page.drawText(line.slice(0, 110), { x: 40, y, size: 11, font });
      y -= 16;
      if (y < 40) break;
    }
    const bytes = await doc.save();
    return Buffer.from(bytes);
  }

  /** B-084 板信商業銀行薪轉單 — transfer accounts with final > 0 only. */
  async buildTransferDocx(
    rows: Array<PayrollExportRow & { bank_account_full?: string | null }>,
  ): Promise<Buffer> {
    const transferRows = rows.filter(
      (r) => r.payment_method === 'TRANSFER' && Number(r.final_pay ?? 0) > 0,
    );
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('姓名')] }),
          new TableCell({ children: [new Paragraph('帳號')] }),
          new TableCell({ children: [new Paragraph('金額')] }),
        ],
      }),
      ...transferRows.map(
        (r) =>
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph(String(r.display_name_snapshot ?? '')),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph(String(r.bank_account_full ?? r.bank_last4 ?? '')),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph(String(r.final_pay ?? 0)),
                ],
              }),
            ],
          }),
      ),
    ];
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: '板信商業銀行薪轉單 (B-084)',
                  bold: true,
                }),
              ],
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),
          ],
        },
      ],
    });
  return Buffer.from(await Packer.toBuffer(doc));
  }

  async buildSummaryXlsx(rows: Array<Record<string, unknown>>): Promise<Buffer> {
    const wb = new Workbook();
    const ws = wb.addWorksheet('總表');
    ws.addRow(['帳戶', '工項總量', '金額', 'B-073']);
    for (const r of rows) {
      ws.addRow([r.displayName, r.qty, r.amount]);
    }
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async buildHistoryXlsx(rows: Array<Record<string, unknown>>): Promise<Buffer> {
    const wb = new Workbook();
    const ws = wb.addWorksheet('歷史');
    ws.addRow(['日期', '提交者', '狀態', 'B-063']);
    for (const r of rows) {
      ws.addRow([r.reportDate, r.submitter, r.status]);
    }
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async buildLedgerXlsx(
    entries: Array<{
      entry_date: string;
      type: string;
      amount: number;
      description: string;
      voided_at: string | null;
    }>,
  ): Promise<Buffer> {
    const wb = new Workbook();
    const ws = wb.addWorksheet('流水帳');
    ws.addRow(['日期', '類型', '金額', '摘要', '狀態', 'B-084']);
    for (const e of entries) {
      ws.addRow([
        e.entry_date,
        e.type,
        e.amount,
        e.description,
        e.voided_at ? '作廢' : '',
      ]);
    }
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async buildArchiveWorkbook(archiveDate: string, rowCount: number): Promise<Buffer> {
    const wb = new Workbook();
    const ws = wb.addWorksheet('日報歸檔');
    ws.addRow(['歸檔日期', archiveDate, 'B-077']);
    ws.addRow(['回報筆數', rowCount]);
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
