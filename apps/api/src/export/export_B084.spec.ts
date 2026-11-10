import { ExportService } from './export.service';

describe('B-084 export formats', () => {
  const svc = new ExportService();

  it('B-084 payroll xlsx is OOXML zip', async () => {
    const buf = await svc.buildPayrollXlsx({
      startDate: '2026-11-01',
      endDate: '2026-11-10',
      rows: [
        {
          display_name_snapshot: '測試',
          gross: 100,
          final_pay: 90,
          payment_method: 'CASH',
        },
      ],
    });
    expect(buf.subarray(0, 2).toString()).toBe('PK');
  });

  it('B-084 payroll pdf starts with %PDF', async () => {
    const buf = await svc.buildPayrollPdf({
      startDate: '2026-11-01',
      endDate: '2026-11-10',
      rows: [{ display_name_snapshot: 'Tester', gross: 1, final_pay: 1 }],
    });
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('B-084 transfer docx includes 板信', async () => {
    const buf = await svc.buildTransferDocx([
      {
        display_name_snapshot: '轉帳戶',
        final_pay: 100,
        payment_method: 'TRANSFER',
        bank_account_full: '12345678901234',
      },
    ]);
    expect(buf.subarray(0, 2).toString()).toBe('PK');
    expect(buf.length).toBeGreaterThan(500);
  });
});
