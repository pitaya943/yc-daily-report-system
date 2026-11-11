import { readFileSync } from 'node:fs';
import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { PDFDocument, rgb } from 'pdf-lib';
import * as fontkitImport from '@pdf-lib/fontkit';

const fontkit =
  (fontkitImport as { default?: typeof fontkitImport }).default ?? fontkitImport;
import { resolveNotoSansTcFont } from './font-path';
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

  private async embedTcFont(doc: PDFDocument) {
    doc.registerFontkit(fontkit);
    const fontBytes = readFileSync(resolveNotoSansTcFont());
    return doc.embedFont(fontBytes, { subset: true });
  }

  /** B-084 A4 landscape payroll PDF with embedded Noto Sans TC (OFL). */
  async buildPayrollPdf(run: {
    startDate: string;
    endDate: string;
    rows: PayrollExportRow[];
  }): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([842, 595]);
    const font = await this.embedTcFont(doc);
    const lines = [
      `薪資期間 ${run.startDate} ～ ${run.endDate}`,
      '摘要：姓名、毛額、實發（B-084）',
      ...run.rows.map(
        (r) =>
          `${r.display_name_snapshot ?? ''} 毛額 ${r.gross ?? 0} 實發 ${r.final_pay ?? 0}`,
      ),
    ];
    let y = 550;
    for (const line of lines) {
      page.drawText(line, { x: 40, y, size: 12, font, color: rgb(0, 0, 0) });
      y -= 18;
      if (y < 40) break;
    }
    const bytes = await doc.save();
    return Buffer.from(bytes);
  }

  /** B-084 板信商業銀行薪轉單 PDF (transfer rows). */
  async buildTransferPdf(
    rows: Array<PayrollExportRow & { bank_account_full?: string | null }>,
  ): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([842, 595]);
    const font = await this.embedTcFont(doc);
    page.drawText('板信商業銀行薪資轉帳單', { x: 40, y: 560, size: 16, font });
    let y = 520;
    for (const r of rows.filter(
      (x) => x.payment_method === 'TRANSFER' && Number(x.final_pay ?? 0) > 0,
    )) {
      const line = `姓名 ${r.display_name_snapshot} 帳號 ${r.bank_account_full ?? r.bank_last4} 金額 ${r.final_pay}`;
      page.drawText(line, { x: 40, y, size: 11, font });
      y -= 16;
    }
    return Buffer.from(await doc.save());
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

  /** B-077 three sheets: 西區 / 南區 / 大表 */
  async buildArchiveWorkbook(
    archiveDate: string,
    zones: { west: number; south: number; bigMeter: number },
  ): Promise<Buffer> {
    const wb = new Workbook();
    for (const [name, count] of [
      ['西區', zones.west],
      ['南區', zones.south],
      ['大表', zones.bigMeter],
    ] as const) {
      const ws = wb.addWorksheet(name);
      ws.addRow(['歸檔日期', archiveDate]);
      ws.addRow(['已確認回報筆數', count]);
    }
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async buildArchivePdf(archiveDate: string, title: string): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await this.embedTcFont(doc);
    page.drawText(title, { x: 40, y: 780, size: 14, font });
    page.drawText(`歸檔日 ${archiveDate}`, { x: 40, y: 750, size: 12, font });
    return Buffer.from(await doc.save());
  }
}
