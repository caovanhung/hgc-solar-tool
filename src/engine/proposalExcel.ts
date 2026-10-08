import type { Borders, Cell, Fill, Font, Row, Worksheet } from 'exceljs';
import { Project } from '../types/solar';
import { getHgcSectionGroupedBom } from './bom';

/**
 * Xuất file Excel (.xlsx) Hồ Sơ Đề Xuất Giá Trị & Báo Giá (Proposal) gửi khách hàng.
 * Nội dung bám theo bản in PDF (CustomerValueProposalPrint): thông tin dự án, 4 giá trị cốt lõi,
 * hiệu quả tài chính, báo giá tổng hợp Phần A - B - C - D, bảo hành và dòng tiền 20 năm.
 * exceljs được nạp động để không làm nặng bundle ban đầu.
 */

const NAVY = 'FF0F2A45';
const ORANGE = 'FFE4572E';
const DARK_BLUE = 'FF002060';
const RED = 'FFDC2626';
const SLATE_50 = 'FFF8FAFC';
const SLATE_200 = 'FFE2E8F0';
const SLATE_500 = 'FF64748B';
const EMERALD_50 = 'FFECFDF5';
const EMERALD_700 = 'FF047857';
const ORANGE_50 = 'FFFFF7ED';

const FONT = 'Arial';
const VND = '#,##0';
const LAST_COL = 7; // A..G

const solid = (argb: string): Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const thin = { style: 'thin' as const, color: { argb: SLATE_200 } };
const allBorders: Partial<Borders> = { top: thin, left: thin, bottom: thin, right: thin };
const font = (f: Partial<Font> = {}): Partial<Font> => ({ name: FONT, size: 10, ...f });

function mergeRow(ws: Worksheet, rowNum: number, from = 1, to = LAST_COL): Cell {
  ws.mergeCells(rowNum, from, rowNum, to);
  return ws.getCell(rowNum, from);
}

function sectionTitle(ws: Worksheet, text: string): Row {
  ws.addRow([]);
  const row = ws.addRow([text]);
  const cell = mergeRow(ws, row.number);
  cell.font = font({ bold: true, size: 11, color: { argb: NAVY } });
  cell.border = { bottom: { style: 'medium', color: { argb: ORANGE } } };
  row.height = 20;
  return row;
}

function headerRow(ws: Worksheet, values: string[]): Row {
  const row = ws.addRow(values);
  row.height = 22;
  row.eachCell((c) => {
    c.font = font({ bold: true, color: { argb: 'FFFFFFFF' } });
    c.fill = solid(NAVY);
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = allBorders;
  });
  return row;
}

/** Dòng nhãn (gộp A..labelTo) + giá trị (gộp phần còn lại) */
function labelValueRow(
  ws: Worksheet,
  label: string,
  value: string | number,
  opts: { labelTo?: number; numFmt?: string; fill?: string; valueColor?: string; bold?: boolean; size?: number } = {}
): Row {
  const labelTo = opts.labelTo ?? 3;
  const row = ws.addRow([]);
  row.height = 19;
  row.getCell(1).value = label;
  row.getCell(labelTo + 1).value = value;
  ws.mergeCells(row.number, 1, row.number, labelTo);
  ws.mergeCells(row.number, labelTo + 1, row.number, LAST_COL);

  const l = row.getCell(1);
  const v = row.getCell(labelTo + 1);
  l.font = font({ bold: opts.bold ?? true, color: { argb: NAVY }, size: opts.size });
  v.font = font({ bold: opts.bold, color: { argb: opts.valueColor ?? 'FF0F172A' }, size: opts.size });
  l.alignment = { vertical: 'middle', wrapText: true };
  v.alignment = {
    vertical: 'middle',
    horizontal: typeof value === 'number' ? 'right' : 'left',
    wrapText: true,
  };
  if (opts.numFmt) v.numFmt = opts.numFmt;
  for (let c = 1; c <= LAST_COL; c++) {
    const cell = row.getCell(c);
    cell.border = allBorders;
    if (opts.fill) cell.fill = solid(opts.fill);
  }
  return row;
}

function fitRowHeight(row: Row, text: string, charsPerLine: number) {
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  row.height = Math.max(18, lines * 14 + 4);
}

function buildProposalSheet(ws: Worksheet, project: Project) {
  const fin = project.financial;
  const layout = project.layoutResult;
  const installedKwp = layout?.installedKwp || 1;
  const ratePreVat = fin?.investmentRatePreVatVndPerKwp || Math.round((fin?.capexSellVnd || 0) / installedKwp);
  const ratePostVat = fin?.investmentRatePostVatVndPerKwp || Math.round((fin?.grandTotalVnd || 0) / installedKwp);
  const roofLabel = project.roofType === 'tole' ? 'Tôn' : project.roofType === 'tile' ? 'Ngói' : 'Bê tông';

  ws.columns = [
    { width: 7 },
    { width: 30 },
    { width: 44 },
    { width: 8 },
    { width: 6 },
    { width: 18 },
    { width: 20 },
  ];

  // ---------- Letterhead ----------
  const companyRow = ws.addRow(['CÔNG TY TNHH HGC']);
  const company = mergeRow(ws, companyRow.number);
  company.font = font({ bold: true, size: 16, color: { argb: DARK_BLUE } });
  company.alignment = { horizontal: 'right' };
  companyRow.height = 24;

  const contact: Array<[string, string]> = [
    ['[Add]: B36 TT7 Khu đô thị Văn Quán Hà Đông Hà Nội', DARK_BLUE],
    ['[Web]: https://hgcvn.com - [Email]: hgc.vn2026@gmail.com', RED],
    ['[Head]: 0974 04 19 84 - 0989 09 97 35', DARK_BLUE],
    [
      `Mã hồ sơ: HGC-PROPOSAL-${project.id.slice(0, 6).toUpperCase()} · Ngày phát hành: ${new Date().toLocaleDateString('vi-VN')}`,
      SLATE_500,
    ],
  ];
  contact.forEach(([text, color], i) => {
    const r = ws.addRow([text]);
    const c = mergeRow(ws, r.number);
    c.font = font({ size: 9, color: { argb: color }, italic: i === contact.length - 1 });
    c.alignment = { horizontal: 'right' };
    if (i === contact.length - 1) {
      for (let col = 1; col <= LAST_COL; col++) {
        r.getCell(col).border = { bottom: { style: 'medium', color: { argb: RED } } };
      }
    }
  });

  // ---------- Title ----------
  ws.addRow([]);
  const badgeRow = ws.addRow(['HỒ SƠ ĐỀ XUẤT ĐẦU TƯ & BÁO GIÁ THƯƠNG MẠI']);
  const badge = mergeRow(ws, badgeRow.number);
  badge.font = font({ bold: true, size: 10, color: { argb: EMERALD_700 } });
  badge.alignment = { horizontal: 'center' };

  const titleRow = ws.addRow(['HỆ THỐNG ĐIỆN MẶT TRỜI ÁP MÁI TỰ DÙNG (ZERO-EXPORT)']);
  const title = mergeRow(ws, titleRow.number);
  title.font = font({ bold: true, size: 16, color: { argb: NAVY } });
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 26;

  const subRow = ws.addRow([
    'Giải pháp cắt giảm chi phí điện, chống nóng công trình & nâng cao chỉ số phát triển bền vững ESG',
  ]);
  const sub = mergeRow(ws, subRow.number);
  sub.font = font({ italic: true, size: 9, color: { argb: SLATE_500 } });
  sub.alignment = { horizontal: 'center' };

  // ---------- I. Thông tin dự án ----------
  sectionTitle(ws, 'I. THÔNG TIN DỰ ÁN');
  labelValueRow(ws, 'Chủ Đầu Tư', project.customerName || 'Quý Khách Hàng', { fill: SLATE_50 });
  labelValueRow(ws, 'Công Suất Đề Xuất (kWp)', installedKwp, {
    fill: SLATE_50,
    numFmt: '#,##0.00',
    valueColor: ORANGE,
    bold: true,
  });
  labelValueRow(ws, 'Số Lượng Tấm Pin', layout?.panelQty ?? 0, { fill: SLATE_50, numFmt: VND });
  labelValueRow(ws, 'Địa Điểm Lắp Đặt', `${project.provinceCode} · Mái ${roofLabel}`, { fill: SLATE_50 });
  labelValueRow(ws, 'Cơ Chế Đấu Nối', 'Zero-Export (Bám tải) · Tuân thủ QĐ 1279/QĐ-BCT', {
    fill: SLATE_50,
    valueColor: EMERALD_700,
  });

  // ---------- II. 4 giá trị cốt lõi ----------
  sectionTitle(ws, 'II. 4 GIÁ TRỊ & LỢI ÍCH CỐT LÕI DỰ ÁN MANG LẠI CHO KHÁCH HÀNG');
  const values: Array<[string, string]> = [
    [
      '1. Cắt giảm tiền điện & tự chủ chi phí',
      `Tự sản xuất điện sạch vào khung giờ làm việc ban ngày. Ước tính tiết kiệm ngay ${
        fin ? Math.round(fin.year1SavingsVnd / 1000000).toLocaleString('vi-VN') : 0
      } triệu đồng trong năm đầu tiên (~${
        fin ? (fin.year1SavingsVnd / 12 / 1000000).toFixed(1) : 0
      } tr/tháng), phòng ngừa rủi ro giá điện EVN tăng lũy tiến hàng năm.`,
    ],
    [
      '2. Hạ nhiệt mái nhà & bảo vệ tài sản',
      'Hệ thống tấm pin cản xạ 85% ánh nắng trực tiếp, hạ nhiệt độ mái tôn từ 3°C - 5°C. Giảm 15-25% điện năng tiêu thụ cho điều hòa/quạt hút và kéo dài tuổi thọ tôn mái.',
    ],
    [
      '3. Tiêu chuẩn xanh ESG & tín chỉ I-REC',
      `Giảm phát thải ${fin?.co2ReductionTonsYear ?? 0} tấn CO₂/năm (tương đương trồng ${
        fin?.treesEquivalentYear ?? 0
      } cây xanh). Đủ điều kiện đăng ký chứng chỉ I-REC quốc tế, lợi thế xuất khẩu sang EU (CBAM) và Mỹ.`,
    ],
    [
      '4. Vận hành bám tải & an toàn tuyệt đối',
      'Smart Meter kiểm soát công suất phát tức thời trong <0.2 giây, triệt tiêu phát ngược lên lưới điện 100%. Tủ AC tích hợp chống sét lan truyền Type 1+2 và ngắt sự cố hồ quang AFCI.',
    ],
  ];
  const valueFills = [EMERALD_50, 'FFFFFBEB', 'FFF0FDFA', 'FFEFF6FF'];
  values.forEach(([label, text], i) => {
    const r = labelValueRow(ws, label, text, { labelTo: 2, fill: valueFills[i], bold: false });
    r.getCell(1).font = font({ bold: true, color: { argb: NAVY } });
    r.getCell(3).font = font({ color: { argb: 'FF334155' } });
    fitRowHeight(r, text, 85);
  });

  // ---------- III. Hiệu quả kinh tế ----------
  if (fin) {
    sectionTitle(ws, 'III. HIỆU QUẢ KINH TẾ & PHÂN TÍCH DÒNG TIỀN ĐẦU TƯ');
    labelValueRow(ws, 'Suất Đầu Tư Trọn Gói (đ/kWp, đã gồm VAT)', ratePostVat, {
      numFmt: VND,
      fill: EMERALD_50,
      valueColor: EMERALD_700,
      bold: true,
    });
    labelValueRow(ws, 'Thời Gian Hoàn Vốn (năm)', fin.paybackYears, { numFmt: '0.0', bold: true });
    labelValueRow(ws, 'Tỷ Suất Sinh Lời IRR (%/năm)', fin.irrPct, {
      numFmt: '0.0',
      fill: ORANGE_50,
      valueColor: ORANGE,
      bold: true,
    });
    labelValueRow(ws, 'Tiết Kiệm Năm Đầu (đ)', fin.year1SavingsVnd, {
      numFmt: VND,
      valueColor: EMERALD_700,
      bold: true,
    });
    if (fin.cashflow20Years?.length) {
      const note = ws.addRow(['* Chi tiết dự phóng dòng tiền 20 năm xem tại sheet "Dòng Tiền 20 Năm".']);
      const c = mergeRow(ws, note.number);
      c.font = font({ italic: true, size: 9, color: { argb: SLATE_500 } });
    }
  }

  // ---------- IV. Bảng báo giá A-B-C-D ----------
  sectionTitle(ws, 'IV. BẢNG DỰ TOÁN BÁO GIÁ THEO MẪU BẢNG KÊ VẬT TƯ THIẾT BỊ (PHẦN A - B - C - D)');
  headerRow(ws, ['STT', 'Tên Hạng Mục Đầu Tư', 'Quy Cách / Thành Phần Chính', 'ĐVT', 'SL', 'Đơn Giá (đ)', 'Thành Tiền (đ)']);

  const sections = getHgcSectionGroupedBom(project.bomLines || []).filter((s) => s.items.length > 0);
  sections.forEach((s, i) => {
    const sample = s.items.slice(0, 3).map((it) => it.name).join(', ');
    const desc = `${sample}... (${s.items.length} hạng mục)`;
    const r = ws.addRow([s.section.code, s.section.name, desc, 'Lot', 1, s.subtotalSellVnd, s.subtotalSellVnd]);
    fitRowHeight(r, desc, 50);
    r.eachCell({ includeEmpty: true }, (c, col) => {
      c.border = allBorders;
      c.font = font({ bold: col === 1 || col === 2 || col === 7, color: { argb: col === 2 || col === 7 ? NAVY : 'FF334155' } });
      c.alignment = {
        vertical: 'middle',
        wrapText: col === 2 || col === 3,
        horizontal: col === 1 || col === 4 ? 'center' : col >= 5 ? 'right' : 'left',
      };
      if (col >= 6) c.numFmt = VND;
      if (i % 2 === 1) c.fill = solid(SLATE_50);
    });
  });

  labelValueRow(ws, 'TỈ SUẤT ĐẦU TƯ (CHƯA VAT) / kWp (đ)', ratePreVat, {
    labelTo: 5,
    numFmt: VND,
    fill: 'FFD1FAE5',
    valueColor: 'FF064E3B',
    bold: true,
  });
  labelValueRow(ws, 'TỈ SUẤT ĐẦU TƯ TRỌN GÓI (ĐÃ GỒM VAT) / kWp (đ)', ratePostVat, {
    labelTo: 5,
    numFmt: VND,
    fill: 'FFFFEDD5',
    valueColor: ORANGE,
    bold: true,
    size: 11,
  });

  // ---------- Tổng thanh toán ----------
  if (fin) {
    ws.addRow([]);
    labelValueRow(ws, 'Tổng cộng (chưa VAT) (đ)', fin.capexSellVnd, { labelTo: 5, numFmt: VND, bold: true });
    if (fin.discountVnd > 0) {
      labelValueRow(ws, `Chiết khấu (${project.discountPct}%) (đ)`, -fin.discountVnd, {
        labelTo: 5,
        numFmt: VND,
        valueColor: EMERALD_700,
      });
    }
    labelValueRow(ws, 'Thuế VAT (đ)', fin.vatVnd, { labelTo: 5, numFmt: VND });
    const total = labelValueRow(ws, 'TỔNG CỘNG THANH TOÁN (đ)', fin.grandTotalVnd, {
      labelTo: 5,
      numFmt: VND,
      fill: NAVY,
      valueColor: 'FFFFFFFF',
      bold: true,
      size: 12,
    });
    total.getCell(1).font = font({ bold: true, size: 12, color: { argb: 'FFFFFFFF' } });
    total.height = 24;
  }

  const noteText =
    '* Báo giá đã bao gồm toàn bộ thiết bị chính hãng, phụ kiện mounting nhôm Anodized Al6005-T5, cáp điện Cadivi, tủ điện bám tải Zero-Export, nhân công lắp đặt và hồ sơ thỏa thuận Điện lực EVN.';
  const noteRow = ws.addRow([noteText]);
  const noteCell = mergeRow(ws, noteRow.number);
  noteCell.font = font({ italic: true, size: 9, color: { argb: SLATE_500 } });
  noteCell.alignment = { wrapText: true, vertical: 'top' };
  fitRowHeight(noteRow, noteText, 120);

  // ---------- V. Bảo hành ----------
  sectionTitle(ws, 'V. CAM KẾT CHẤT LƯỢNG & CHÍNH SÁCH BẢO HÀNH CHÍNH HÃNG');
  const warranties: Array<[string, string]> = [
    ['✔ Tấm pin quang điện', 'Bảo hành hiệu suất 25 - 30 năm (>80% công suất danh định).'],
    ['✔ Biến tần Inverter', 'Bảo hành tiêu chuẩn 5 năm chính hãng (hỗ trợ kỹ thuật 24/7).'],
    ['✔ Khung giàn ray nhôm Al6005-T5', 'Bảo hành 12 năm chống ăn mòn, chịu gió bão cấp 12.'],
    ['✔ Hồ sơ pháp lý', 'Đồng hành nghiệm thu kỹ thuật đấu nối và ký thỏa thuận với Điện lực EVN.'],
  ];
  warranties.forEach(([label, text]) => {
    const r = labelValueRow(ws, label, text, { labelTo: 2, fill: SLATE_50, bold: false });
    r.getCell(1).font = font({ bold: true, color: { argb: EMERALD_700 } });
  });

  // ---------- Chữ ký ----------
  ws.addRow([]);
  ws.addRow([]);
  const signRow = ws.addRow([]);
  signRow.getCell(1).value = 'ĐẠI DIỆN KHÁCH HÀNG';
  signRow.getCell(4).value = 'ĐẠI DIỆN CÔNG TY TNHH HGC';
  ws.mergeCells(signRow.number, 1, signRow.number, 3);
  ws.mergeCells(signRow.number, 4, signRow.number, LAST_COL);
  const signNote = ws.addRow([]);
  signNote.getCell(1).value = '(Ký, ghi rõ họ tên & đóng dấu)';
  signNote.getCell(4).value = '(Ký, ghi rõ họ tên & đóng dấu)';
  ws.mergeCells(signNote.number, 1, signNote.number, 3);
  ws.mergeCells(signNote.number, 4, signNote.number, LAST_COL);
  [1, 4].forEach((col) => {
    signRow.getCell(col).font = font({ bold: true, color: { argb: NAVY } });
    signRow.getCell(col).alignment = { horizontal: 'center' };
    signNote.getCell(col).font = font({ italic: true, size: 9, color: { argb: SLATE_500 } });
    signNote.getCell(col).alignment = { horizontal: 'center' };
  });
}

function buildCashflowSheet(ws: Worksheet, project: Project) {
  const fin = project.financial;
  if (!fin?.cashflow20Years?.length) return;

  ws.columns = [{ width: 10 }, { width: 22 }, { width: 22 }, { width: 24 }, { width: 24 }];

  const titleRow = ws.addRow(['DỰ PHÓNG DÒNG TIỀN TIẾT KIỆM 20 NĂM']);
  ws.mergeCells(titleRow.number, 1, titleRow.number, 5);
  titleRow.getCell(1).font = font({ bold: true, size: 14, color: { argb: NAVY } });
  titleRow.getCell(1).alignment = { horizontal: 'center' };
  titleRow.height = 24;

  const subRow = ws.addRow([
    `Đã tính tỷ lệ suy hao tấm pin 0.7%/năm · Vốn đầu tư ban đầu: ${fin.grandTotalVnd.toLocaleString('vi-VN')} đ · Hoàn vốn: ${fin.paybackYears} năm`,
  ]);
  ws.mergeCells(subRow.number, 1, subRow.number, 5);
  subRow.getCell(1).font = font({ italic: true, size: 9, color: { argb: SLATE_500 } });
  subRow.getCell(1).alignment = { horizontal: 'center' };
  ws.addRow([]);

  const header = ws.addRow(['Năm', 'Sản Lượng Phát (kWh)', 'Tiết Kiệm Năm (đ)', 'Lũy Kế Tiết Kiệm (đ)', 'Dòng Tiền Ròng (đ)']);
  header.height = 22;
  header.eachCell((c) => {
    c.font = font({ bold: true, color: { argb: 'FFFFFFFF' } });
    c.fill = solid(NAVY);
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = allBorders;
  });

  const paybackYear = Math.ceil(fin.paybackYears || 0);
  fin.cashflow20Years.forEach((cf, i) => {
    const r = ws.addRow([cf.year, cf.generatedKwh, cf.annualSavingsVnd, cf.cumulativeSavingsVnd, cf.netCashflowVnd]);
    const isPayback = cf.year === paybackYear;
    r.eachCell((c, col) => {
      c.border = allBorders;
      c.numFmt = col === 1 ? '"Năm "0' : VND;
      c.alignment = { horizontal: col === 1 ? 'center' : 'right' };
      c.font = font({
        bold: col === 1 || isPayback,
        color: {
          argb: col === 3 ? EMERALD_700 : col === 5 ? (cf.netCashflowVnd >= 0 ? EMERALD_700 : RED) : 'FF0F172A',
        },
      });
      if (isPayback) c.fill = solid('FFD1FAE5');
      else if (i % 2 === 1) c.fill = solid(SLATE_50);
    });
  });

  ws.views = [{ state: 'frozen', ySplit: header.number, showGridLines: false }];
}

export async function buildValueProposalXlsx(project: Project): Promise<Blob> {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CÔNG TY TNHH HGC';
  wb.created = new Date();

  const pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait' as const,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
  };

  const proposal = wb.addWorksheet('Proposal Báo Giá', {
    pageSetup,
    views: [{ showGridLines: false }],
  });
  buildProposalSheet(proposal, project);

  if (project.financial?.cashflow20Years?.length) {
    const cashflow = wb.addWorksheet('Dòng Tiền 20 Năm', {
      pageSetup,
      views: [{ showGridLines: false }],
    });
    buildCashflowSheet(cashflow, project);
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
