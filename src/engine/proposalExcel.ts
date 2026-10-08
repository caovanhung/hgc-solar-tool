import type { Borders, Cell, Fill, Font, RichText, Worksheet, Workbook } from 'exceljs';
import { Project } from '../types/solar';
import { getHgcSectionGroupedBom } from './bom';
import { HGC_EMBLEM_COLOR, HGC_EMBLEM_G_PATH, HGC_EMBLEM_H_PATH } from '../components/common/Logo';
import {
  PROPOSAL_COMPANY,
  PROPOSAL_KEY_CASHFLOW_YEARS,
  PROPOSAL_QUOTE_NOTE,
  PROPOSAL_TITLES,
  PROPOSAL_WARRANTIES,
  ProposalValueTheme,
  getProposalValues,
  roofTypeLabel,
} from '../components/proposal/proposalContent';

/**
 * Xuất file Excel (.xlsx) Hồ Sơ Đề Xuất Giá Trị & Báo Giá (Proposal) gửi khách hàng,
 * dựng lại đúng bố cục bản in PDF (CustomerValueProposalPrint) trên lưới 12 cột:
 * letterhead + logo, thông tin dự án (4 ô), 4 giá trị cốt lõi (2×2), 4 chỉ số tài chính,
 * biểu đồ dự phóng 20 năm (ảnh chụp từ biểu đồ trên màn hình), bảng dòng tiền các năm tiêu biểu,
 * bảng báo giá Phần A - B - C - D, tổng thanh toán, bảo hành và chữ ký.
 * Nội dung chữ lấy từ proposalContent.ts (dùng chung với bản PDF). exceljs được nạp động.
 */

// Bảng màu Tailwind dùng trên bản PDF
const C = {
  navy: 'FF0F2A45',
  orange: 'FFE4572E',
  darkBlue: 'FF002060',
  red600: 'FFDC2626',
  white: 'FFFFFFFF',
  slate900: 'FF0F172A',
  slate800: 'FF1E293B',
  slate700: 'FF334155',
  slate600: 'FF475569',
  slate500: 'FF64748B',
  slate400: 'FF94A3B8',
  slate200: 'FFE2E8F0',
  slate100: 'FFF1F5F9',
  slate50: 'FFF8FAFC',
  emerald950: 'FF022C22',
  emerald900: 'FF064E3B',
  emerald800: 'FF065F46',
  emerald700: 'FF047857',
  emerald600: 'FF059669',
  emerald400: 'FF34D399',
  emerald300: 'FF6EE7B7',
  emerald200: 'FFA7F3D0',
  emerald50: 'FFECFDF5',
  orange950: 'FF431407',
  orange900: 'FF7C2D12',
  orange700: 'FFC2410C',
  orange300: 'FFFDBA74',
  chartBlue: 'FF0284C7',
  chartGreen: 'FF10B981',
};

const VALUE_THEME: Record<ProposalValueTheme, { border: string; fill: string; title: string; badge: string }> = {
  emerald: { border: 'FFA7F3D0', fill: 'FFF5FDF9', title: 'FF064E3B', badge: 'FF059669' },
  amber: { border: 'FFFDE68A', fill: 'FFFFFDF5', title: 'FF78350F', badge: 'FFD97706' },
  teal: { border: 'FF99F6E4', fill: 'FFF5FDFC', title: 'FF134E4A', badge: 'FF0F766E' },
  blue: { border: 'FFBFDBFE', fill: 'FFF7FAFF', title: 'FF1E3A8A', badge: 'FF1D4ED8' },
};

const FONT = 'Arial';
const MONO = 'Courier New';
const COLS = 12;
const COL_WIDTH = 10.5; // ký tự
const COL_PX = Math.round(COL_WIDTH * 7 + 5); // xấp xỉ pixel / cột
const SHEET_PX = COL_PX * COLS;
const CIRCLED = ['①', '②', '③', '④'];
const LOGO_SIZE = { width: 250, height: 56 };
const VI = (n: number) => n.toLocaleString('vi-VN');

const solid = (argb: string): Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const font = (f: Partial<Font> = {}): Partial<Font> => ({ name: FONT, size: 9, color: { argb: C.slate900 }, ...f });

type Align = NonNullable<Cell['alignment']>;

/** Gộp ô [r1..r2] × [c1..c2], ghi giá trị và định dạng vào ô đầu */
function put(
  ws: Worksheet,
  r1: number,
  c1: number,
  c2: number,
  value: Cell['value'],
  style: { font?: Partial<Font>; align?: Partial<Align>; numFmt?: string; fill?: string; r2?: number } = {}
): Cell {
  const r2 = style.r2 ?? r1;
  if (r2 > r1 || c2 > c1) ws.mergeCells(r1, c1, r2, c2);
  const cell = ws.getCell(r1, c1);
  cell.value = value;
  cell.font = font(style.font);
  cell.alignment = { vertical: 'middle', wrapText: true, ...style.align };
  if (style.numFmt) cell.numFmt = style.numFmt;
  if (style.fill) fillRange(ws, r1, c1, r2, c2, style.fill);
  return cell;
}

function fillRange(ws: Worksheet, r1: number, c1: number, r2: number, c2: number, argb: string) {
  for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) ws.getCell(r, c).fill = solid(argb);
}

/** Viền bao ngoài một vùng (giống border của card trên PDF) */
function outline(
  ws: Worksheet,
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  argb: string,
  style: 'thin' | 'medium' = 'thin'
) {
  const edge = { style, color: { argb } };
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const cell = ws.getCell(r, c);
      const b: Partial<Borders> = { ...cell.border };
      if (r === r1) b.top = edge;
      if (r === r2) b.bottom = edge;
      if (c === c1) b.left = edge;
      if (c === c2) b.right = edge;
      cell.border = b;
    }
  }
}

function lineBelow(ws: Worksheet, r: number, c1: number, c2: number, argb: string, style: 'thin' | 'medium' = 'thin') {
  for (let c = c1; c <= c2; c++) {
    ws.getCell(r, c).border = { ...ws.getCell(r, c).border, bottom: { style, color: { argb } } };
  }
}

function lineAbove(ws: Worksheet, r: number, c1: number, c2: number, argb: string, style: 'thin' | 'medium' = 'thin') {
  for (let c = c1; c <= c2; c++) {
    ws.getCell(r, c).border = { ...ws.getCell(r, c).border, top: { style, color: { argb } } };
  }
}

/** Ước lượng chiều cao dòng (pt) cho đoạn chữ xuống dòng trong vùng rộng `cols` cột */
function wrapHeight(text: string, cols: number, fontSize = 9, minLines = 1) {
  // Arial: ~1.35 ký tự / đơn vị độ rộng cột ở cỡ 9pt
  const charsPerLine = Math.floor((cols * COL_WIDTH * 1.35 * 9) / fontSize) - 2;
  const lines = Math.max(minLines, Math.ceil(text.length / charsPerLine));
  return lines * fontSize * 1.45 + 6;
}

/** Tiêu đề mục: chữ in hoa đậm navy, có ký hiệu cam thay icon */
function sectionHeading(ws: Worksheet, r: number, text: string, c2 = COLS) {
  put(ws, r, 1, c2, {
    richText: [
      { text: '◆ ', font: font({ bold: true, color: { argb: C.orange } }) },
      { text: text.toUpperCase(), font: font({ bold: true, color: { argb: C.navy } }) },
    ],
  });
  ws.getRow(r).height = 18;
}

export interface ProposalImages {
  /** PNG dạng data URL hoặc base64 */
  logoPng?: string | null;
  chartPng?: { dataUrl: string; width: number; height: number } | null;
}

function addPng(wb: Workbook, png: string) {
  return wb.addImage({ base64: png.replace(/^data:image\/png;base64,/, ''), extension: 'png' });
}

function buildProposalSheet(wb: Workbook, ws: Worksheet, project: Project, images: ProposalImages) {
  const fin = project.financial;
  const layout = project.layoutResult;
  const installedKwp = layout?.installedKwp || 1;
  const ratePreVat = fin?.investmentRatePreVatVndPerKwp || Math.round((fin?.capexSellVnd || 0) / installedKwp);
  const ratePostVat = fin?.investmentRatePostVatVndPerKwp || Math.round((fin?.grandTotalVnd || 0) / installedKwp);
  const ratePerWp = Math.round(ratePostVat / 1000);
  const initialCapexMillion = Number(((fin?.grandTotalVnd || 0) / 1000000).toFixed(1));

  ws.columns = Array.from({ length: COLS }, () => ({ width: COL_WIDTH }));
  let r = 1;

  // ======================= LETTERHEAD =======================
  if (images.logoPng) {
    ws.addImage(addPng(wb, images.logoPng), { tl: { col: 0.1, row: 0.4 }, ext: LOGO_SIZE });
  }
  put(ws, r, 5, COLS, PROPOSAL_COMPANY.name, {
    font: font({ bold: true, size: 13, color: { argb: C.darkBlue } }),
    align: { horizontal: 'right' },
  });
  ws.getRow(r).height = 20;
  r++;
  const contactLines: Array<[string, string, string]> = [
    ['[Add ]: ', PROPOSAL_COMPANY.address, C.darkBlue],
    ['[Web]: ', `${PROPOSAL_COMPANY.web} - `, C.red600],
    ['[Head]: ', PROPOSAL_COMPANY.hotline, C.darkBlue],
  ];
  contactLines.forEach(([label, text, color], i) => {
    const parts: RichText[] = [
      { text: label, font: font({ bold: true, size: 8.5, color: { argb: color } }) },
      { text, font: font({ size: 8.5, color: { argb: color } }) },
    ];
    if (i === 1) {
      parts.push(
        { text: '[Email]: ', font: font({ bold: true, size: 8.5, color: { argb: color } }) },
        { text: PROPOSAL_COMPANY.email, font: font({ size: 8.5, color: { argb: color } }) }
      );
    }
    put(ws, r, 5, COLS, { richText: parts }, { align: { horizontal: 'right' } });
    r++;
  });
  put(
    ws,
    r,
    5,
    COLS,
    `Mã hồ sơ: HGC-PROPOSAL-${project.id.slice(0, 6).toUpperCase()} · Ngày phát hành: ${new Date().toLocaleDateString('vi-VN')}`,
    { font: font({ name: MONO, size: 8, color: { argb: C.slate400 } }), align: { horizontal: 'right' } }
  );
  lineBelow(ws, r, 1, COLS, C.red600, 'medium');
  r += 2;

  // ======================= TIÊU ĐỀ =======================
  put(ws, r, 4, 9, PROPOSAL_TITLES.badge, {
    font: font({ bold: true, size: 8.5, color: { argb: C.emerald800 } }),
    align: { horizontal: 'center' },
    fill: C.emerald50,
  });
  outline(ws, r, 4, r, 9, C.emerald200);
  r++;
  put(ws, r, 1, COLS, PROPOSAL_TITLES.title, {
    font: font({ bold: true, size: 16, color: { argb: C.navy } }),
    align: { horizontal: 'center' },
  });
  ws.getRow(r).height = 26;
  r++;
  put(ws, r, 1, COLS, PROPOSAL_TITLES.subtitle, {
    font: font({ size: 9, color: { argb: C.slate500 } }),
    align: { horizontal: 'center' },
  });
  r += 2;

  // ======================= THÔNG TIN DỰ ÁN (4 ô) =======================
  const profile: Array<[string, string, Partial<Font>, string]> = [
    ['Chủ Đầu Tư:', project.customerName || 'Quý Khách Hàng', { bold: true, size: 10.5 }, ''],
    [
      'Công Suất Đề Xuất:',
      `${installedKwp} kWp`,
      { bold: true, size: 10.5, name: MONO, color: { argb: C.orange } },
      `(${layout?.panelQty} tấm pin)`,
    ],
    ['Địa Điểm Lắp Đặt:', `${project.provinceCode}`, { bold: true }, `Mái ${roofTypeLabel(project.roofType)}`],
    ['Cơ Chế Đấu Nối:', 'Zero-Export (Bám tải)', { bold: true, color: { argb: C.emerald700 } }, 'Tuân thủ QĐ 1279/QĐ-BCT'],
  ];
  fillRange(ws, r, 1, r + 2, COLS, C.slate50);
  profile.forEach(([label, value, valueFont, sub], i) => {
    const c1 = i * 3 + 1;
    put(ws, r, c1, c1 + 2, label, { font: font({ size: 8.5, color: { argb: C.slate400 } }), align: { indent: 1 } });
    put(ws, r + 1, c1, c1 + 2, value, { font: font(valueFont), align: { indent: 1 } });
    put(ws, r + 2, c1, c1 + 2, sub, { font: font({ size: 8.5, color: { argb: C.slate500 } }), align: { indent: 1 } });
  });
  outline(ws, r, 1, r + 2, COLS, C.slate200);
  ws.getRow(r + 1).height = 18;
  r += 4;

  // ======================= 4 GIÁ TRỊ CỐT LÕI (2×2) =======================
  sectionHeading(ws, r, PROPOSAL_TITLES.values);
  r++;
  const values = getProposalValues(project);
  for (let pair = 0; pair < 2; pair++) {
    const rowValues = values.slice(pair * 2, pair * 2 + 2);
    rowValues.forEach((v, j) => {
      const idx = pair * 2 + j;
      const theme = VALUE_THEME[v.theme];
      const c1 = j * 6 + 1;
      const c2 = c1 + 5;
      put(
        ws,
        r,
        c1,
        c2,
        {
          richText: [
            { text: `${CIRCLED[idx]} `, font: font({ bold: true, size: 11, color: { argb: theme.badge } }) },
            { text: v.title.toUpperCase(), font: font({ bold: true, color: { argb: theme.title } }) },
          ],
        },
        { fill: theme.fill, align: { indent: 1 } }
      );
      put(
        ws,
        r + 1,
        c1,
        c2,
        {
          richText: v.segments.map((seg) => ({
            text: seg.text,
            font: font({ size: 8.5, bold: seg.bold, color: { argb: seg.bold ? C.slate900 : C.slate600 } }),
          })),
        },
        { fill: theme.fill, align: { vertical: 'top', indent: 1 } }
      );
      outline(ws, r, c1, r + 1, c2, theme.border);
    });
    ws.getRow(r).height = 18;
    ws.getRow(r + 1).height = Math.max(
      ...rowValues.map((v) => wrapHeight(v.segments.map((s) => s.text).join(''), 6, 8.5, 2))
    );
    r += 2;
    if (pair === 0) {
      ws.getRow(r).height = 6;
      r++;
    }
  }
  lineBelow(ws, r, 1, COLS, C.slate200, 'medium');
  r += 2;

  // ======================= HIỆU QUẢ KINH TẾ =======================
  sectionHeading(ws, r, PROPOSAL_TITLES.financial);
  r++;
  if (fin) {
    const cards: Array<{
      label: string;
      value: string;
      sub: string;
      fill: string;
      border: string;
      labelColor: string;
      valueColor: string;
      subColor: string;
    }> = [
      {
        label: 'Suất Đầu Tư Trọn Gói',
        value: VI(ratePostVat),
        sub: `đ / kWp (VAT) · ~${ratePerWp} đ/Wp`,
        fill: 'FFF0FDF6',
        border: C.emerald300,
        labelColor: C.emerald800,
        valueColor: C.emerald950,
        subColor: C.emerald700,
      },
      {
        label: 'Thời Gian Hoàn Vốn',
        value: `${fin.paybackYears} năm`,
        sub: 'Thu hồi 100% vốn đầu tư',
        fill: C.slate50,
        border: C.slate200,
        labelColor: C.slate500,
        valueColor: C.navy,
        subColor: C.slate400,
      },
      {
        label: 'Tỷ Suất Sinh Lời IRR',
        value: `${fin.irrPct} % / năm`,
        sub: 'Cao gấp 3-4 lần lãi suất tiền gửi',
        fill: 'FFFFF8F0',
        border: C.orange300,
        labelColor: C.orange900,
        valueColor: C.orange,
        subColor: C.orange700,
      },
      {
        label: 'Tiết Kiệm Năm Đầu',
        value: `${VI(Math.round(fin.year1SavingsVnd / 1000000))} triệu`,
        sub: `~${VI(Math.round(fin.year1SavingsVnd / 12))} đ/tháng`,
        fill: C.slate50,
        border: C.slate200,
        labelColor: C.slate500,
        valueColor: C.emerald600,
        subColor: C.slate400,
      },
    ];
    cards.forEach((card, i) => {
      const c1 = i * 3 + 1;
      const c2 = c1 + 2;
      const center = { horizontal: 'center' as const };
      put(ws, r, c1, c2, card.label.toUpperCase(), {
        font: font({ bold: true, size: 8, color: { argb: card.labelColor } }),
        align: center,
        fill: card.fill,
      });
      put(ws, r + 1, c1, c2, card.value, {
        font: font({ bold: true, size: 13, name: MONO, color: { argb: card.valueColor } }),
        align: center,
        fill: card.fill,
      });
      put(ws, r + 2, c1, c2, card.sub, {
        font: font({ size: 8, color: { argb: card.subColor } }),
        align: center,
        fill: card.fill,
      });
      outline(ws, r, c1, r + 2, c2, card.border);
    });
    ws.getRow(r).height = 16;
    ws.getRow(r + 1).height = 22;
    ws.getRow(r + 2).height = 16;
    r += 4;
  }

  // ---- Biểu đồ dự phóng 20 năm ----
  if (fin?.cashflow20Years?.length) {
    const boxTop = r;
    put(ws, r, 1, 8, PROPOSAL_TITLES.chart, {
      font: font({ bold: true, size: 8.5, color: { argb: C.navy } }),
      align: { indent: 1 },
    });
    put(
      ws,
      r,
      9,
      COLS,
      `🎯 Mốc hòa vốn: ${fin.paybackYears} năm · ${20 - Math.ceil(fin.paybackYears || 4)} năm sau sinh lời tự do 100%`,
      { font: font({ bold: true, size: 8, color: { argb: C.emerald800 } }), align: { horizontal: 'center' } }
    );
    ws.getRow(r).height = 22;
    r++;
    put(
      ws,
      r,
      1,
      9,
      {
        richText: [
          { text: '- - ', font: font({ bold: true, size: 8.5, color: { argb: C.orange } }) },
          {
            text: `Mức Vốn Đầu Tư (${initialCapexMillion} tr đ)     `,
            font: font({ bold: true, size: 8.5, color: { argb: C.orange } }),
          },
          { text: '▬ ', font: font({ size: 8.5, color: { argb: C.chartBlue } }) },
          {
            text: 'Lũy Kế Tiết Kiệm (Tăng dần theo năm)     ',
            font: font({ bold: true, size: 8.5, color: { argb: C.chartBlue } }),
          },
          { text: '— ', font: font({ size: 8.5, color: { argb: C.chartGreen } }) },
          { text: 'Tiền điện tiết kiệm từng năm     ', font: font({ size: 8.5, color: { argb: C.emerald700 } }) },
          { text: '¦ ', font: font({ bold: true, size: 8.5, color: { argb: C.emerald600 } }) },
          {
            text: `Cột mốc hòa vốn (${fin.paybackYears} năm)`,
            font: font({ size: 8.5, color: { argb: C.emerald800 } }),
          },
        ],
      },
      { align: { indent: 1 } }
    );
    put(ws, r, 10, COLS, PROPOSAL_TITLES.chartDegradeNote, {
      font: font({ italic: true, size: 8, color: { argb: C.slate400 } }),
      align: { horizontal: 'right' },
    });
    ws.getRow(r).height = 24;
    r++;

    const chart = images.chartPng;
    if (chart) {
      const width = SHEET_PX - 24;
      const height = Math.round((width * chart.height) / chart.width);
      const rowPx = 20;
      const rowsNeeded = Math.ceil((height + 8) / rowPx);
      for (let i = 0; i < rowsNeeded; i++) ws.getRow(r + i).height = rowPx * 0.75;
      ws.addImage(addPng(wb, chart.dataUrl), {
        tl: { col: 0.15, row: r - 1 + 0.2 },
        ext: { width, height },
      });
      r += rowsNeeded;
    }
    put(ws, r, 1, COLS, PROPOSAL_TITLES.chartFootnote, {
      font: font({ italic: true, size: 8, color: { argb: C.slate500 } }),
      align: { horizontal: 'right' },
    });
    fillRange(ws, boxTop, 1, r, COLS, C.slate50);
    // badge mốc hòa vốn nền xanh, viền xanh; kẻ dưới dòng tiêu đề biểu đồ
    fillRange(ws, boxTop, 9, boxTop, COLS, C.emerald50);
    outline(ws, boxTop, 9, boxTop, COLS, C.emerald200);
    lineBelow(ws, boxTop, 1, 8, C.slate200);
    outline(ws, boxTop, 1, r, COLS, C.slate200);
    r += 2;

    // ---- Bảng dòng tiền các năm tiêu biểu ----
    const keyYears = fin.cashflow20Years.filter((cf) => PROPOSAL_KEY_CASHFLOW_YEARS.includes(cf.year));
    put(ws, r, 1, 9, PROPOSAL_TITLES.cashflowTable, { font: font({ bold: true, size: 8.5, color: { argb: C.slate700 } }) });
    put(ws, r, 10, COLS, 'Đơn vị: VNĐ', { font: font({ size: 8.5, color: { argb: C.slate400 } }), align: { horizontal: 'right' } });
    r++;
    const cfCols: Array<[number, number, string, Align['horizontal']]> = [
      [1, 2, 'Năm', 'center'],
      [3, 4, 'Sản Lượng Phát (kWh)', 'right'],
      [5, 6, 'Tiết Kiệm Năm (đ)', 'right'],
      [7, 9, 'Lũy Kế Tiết Kiệm (đ)', 'right'],
      [10, 12, 'Dòng Tiền Ròng (đ)', 'right'],
    ];
    cfCols.forEach(([c1, c2, label, h]) =>
      put(ws, r, c1, c2, label.toUpperCase(), {
        font: font({ bold: true, size: 8, name: MONO, color: { argb: C.white } }),
        align: { horizontal: h },
        fill: C.navy,
      })
    );
    ws.getRow(r).height = 20;
    const tableTop = r;
    r++;
    keyYears.forEach((cf) => {
      const highlight = cf.netCashflowVnd >= 0 && cf.year <= 5;
      const mono = (f: Partial<Font> = {}) => font({ name: MONO, size: 8.5, bold: highlight, ...f });
      const fill = highlight ? C.emerald50 : undefined;
      put(ws, r, 1, 2, `Năm ${cf.year}`, { font: mono({ bold: true }), align: { horizontal: 'center' }, fill });
      put(ws, r, 3, 4, cf.generatedKwh, { font: mono(), align: { horizontal: 'right' }, numFmt: '#,##0', fill });
      put(ws, r, 5, 6, cf.annualSavingsVnd, {
        font: mono({ color: { argb: C.emerald700 } }),
        align: { horizontal: 'right' },
        numFmt: '"+"#,##0',
        fill,
      });
      put(ws, r, 7, 9, cf.cumulativeSavingsVnd, { font: mono(), align: { horizontal: 'right' }, numFmt: '#,##0', fill });
      put(ws, r, 10, 12, cf.netCashflowVnd, {
        font: mono({ bold: true, color: { argb: cf.netCashflowVnd >= 0 ? C.emerald700 : C.slate400 } }),
        align: { horizontal: 'right' },
        numFmt: '#,##0',
        fill,
      });
      lineBelow(ws, r, 1, COLS, C.slate100);
      ws.getRow(r).height = 16;
      r++;
    });
    outline(ws, tableTop, 1, r - 1, COLS, C.slate200);
    r++;
  }
  lineBelow(ws, r, 1, COLS, C.slate200, 'medium');
  r += 2;

  // ======================= BẢNG BÁO GIÁ A-B-C-D =======================
  sectionHeading(ws, r, PROPOSAL_TITLES.quote, 8);
  put(ws, r, 9, COLS, PROPOSAL_TITLES.quoteHint.toUpperCase(), {
    font: font({ italic: true, size: 7.5, color: { argb: C.slate500 } }),
    align: { horizontal: 'right' },
  });
  ws.getRow(r).height = 24;
  r++;
  const qCols: Array<[number, number, string, Align['horizontal']]> = [
    [1, 1, 'STT', 'center'],
    [2, 3, 'Tên Hạng Mục Đầu Tư', 'left'],
    [4, 6, 'Quy Cách / Thành Phần Chính', 'left'],
    [7, 7, 'ĐVT', 'center'],
    [8, 8, 'SL', 'right'],
    [9, 10, 'Đơn Giá (đ)', 'right'],
    [11, 12, 'Thành Tiền (đ)', 'right'],
  ];
  qCols.forEach(([c1, c2, label, h]) =>
    put(ws, r, c1, c2, label.toUpperCase(), {
      font: font({ bold: true, size: 8.5, name: MONO, color: { argb: C.white } }),
      align: { horizontal: h, indent: h === 'left' ? 1 : 0 },
      fill: C.navy,
    })
  );
  ws.getRow(r).height = 20;
  const quoteTop = r;
  r++;
  const sections = getHgcSectionGroupedBom(project.bomLines || []).filter((s) => s.items.length > 0);
  sections.forEach((sec) => {
    const sampleItems = sec.items.slice(0, 3).map((it) => it.name).join(', ');
    const desc = sampleItems ? `${sampleItems}... (${sec.items.length} hạng mục)` : '';
    put(ws, r, 1, 1, sec.section.code, {
      font: font({ bold: true, name: MONO, color: { argb: C.slate700 } }),
      align: { horizontal: 'center' },
    });
    put(ws, r, 2, 3, sec.section.name, { font: font({ bold: true, color: { argb: C.navy } }), align: { indent: 1 } });
    put(ws, r, 4, 6, desc, { font: font({ size: 8.5, color: { argb: C.slate600 } }), align: { indent: 1 } });
    put(ws, r, 7, 7, 'Lot', { font: font({ name: MONO, color: { argb: C.slate500 } }), align: { horizontal: 'center' } });
    put(ws, r, 8, 8, 1, {
      font: font({ bold: true, name: MONO, color: { argb: C.slate700 } }),
      align: { horizontal: 'right' },
    });
    put(ws, r, 9, 10, sec.subtotalSellVnd, {
      font: font({ name: MONO, color: { argb: C.slate800 } }),
      align: { horizontal: 'right' },
      numFmt: '#,##0',
    });
    put(ws, r, 11, 12, sec.subtotalSellVnd, {
      font: font({ bold: true, name: MONO, color: { argb: C.navy } }),
      align: { horizontal: 'right' },
      numFmt: '#,##0',
    });
    lineBelow(ws, r, 1, COLS, C.slate100);
    ws.getRow(r).height = Math.max(22, wrapHeight(desc, 3, 8.5));
    r++;
  });
  // Tỉ suất đầu tư
  put(
    ws,
    r,
    1,
    7,
    {
      richText: [
        { text: '◉ ', font: font({ bold: true, color: { argb: C.emerald700 } }) },
        { text: PROPOSAL_TITLES.ratePreVat.toUpperCase(), font: font({ bold: true, color: { argb: C.emerald950 } }) },
      ],
    },
    { fill: 'FFE3F8EE', align: { indent: 1 } }
  );
  put(ws, r, 8, COLS, ratePreVat, {
    font: font({ bold: true, size: 10.5, name: MONO, color: { argb: C.emerald900 } }),
    align: { horizontal: 'right' },
    numFmt: '#,##0 "Vnđ / kWp"',
    fill: 'FFE3F8EE',
  });
  lineAbove(ws, r, 1, COLS, C.emerald400, 'medium');
  ws.getRow(r).height = 20;
  outline(ws, quoteTop, 1, r, COLS, C.slate200);
  r += 2;

  // ---- Tổng thanh toán (ghi chú bên trái, hộp tổng bên phải) ----
  if (fin) {
    const totals: Array<{ label: string; value: number; fmt: string; color?: string; total?: boolean }> = [
      { label: 'Tổng cộng (chưa VAT):', value: fin.capexSellVnd, fmt: '#,##0 "đ"' },
    ];
    if (fin.discountVnd > 0) {
      totals.push({
        label: `Chiết khấu (${project.discountPct}%):`,
        value: fin.discountVnd,
        fmt: '"-"#,##0 "đ"',
        color: C.emerald600,
      });
    }
    totals.push({ label: 'TỔNG CỘNG THANH TOÁN:', value: fin.grandTotalVnd, fmt: '#,##0 "đ"', total: true });
    const boxTop = r;
    totals.forEach((t) => {
      put(ws, r, 8, 10, t.label, {
        font: font({
          bold: t.total,
          size: t.total ? 9.5 : 9,
          color: { argb: t.total ? C.navy : t.color ?? C.slate600 },
        }),
        align: { indent: 1 },
        fill: C.slate50,
      });
      put(ws, r, 11, COLS, t.value, {
        font: font({
          bold: true,
          name: MONO,
          size: t.total ? 11 : 9,
          color: { argb: t.total ? C.orange : t.color ?? C.slate900 },
        }),
        align: { horizontal: 'right' },
        numFmt: t.fmt,
        fill: C.slate50,
      });
      if (t.total) lineAbove(ws, r, 8, COLS, C.navy, 'medium');
      else lineBelow(ws, r, 8, COLS, C.slate200);
      ws.getRow(r).height = t.total ? 22 : 18;
      r++;
    });
    outline(ws, boxTop, 8, r - 1, COLS, C.slate200);
    put(ws, boxTop, 1, 6, PROPOSAL_QUOTE_NOTE, {
      font: font({ italic: true, size: 8.5, color: { argb: C.slate500 } }),
      align: { vertical: 'bottom' },
      r2: r - 1,
    });
    r++;
  }

  // ======================= BẢO HÀNH =======================
  const wTop = r;
  put(
    ws,
    r,
    1,
    COLS,
    {
      richText: [
        { text: '✔ ', font: font({ bold: true, color: { argb: C.emerald700 } }) },
        { text: PROPOSAL_TITLES.warranty.toUpperCase(), font: font({ bold: true, color: { argb: C.navy } }) },
      ],
    },
    { align: { indent: 1 } }
  );
  ws.getRow(r).height = 20;
  r++;
  for (let i = 0; i < PROPOSAL_WARRANTIES.length; i += 2) {
    PROPOSAL_WARRANTIES.slice(i, i + 2).forEach((w, j) => {
      const c1 = j * 6 + 1;
      put(
        ws,
        r,
        c1,
        c1 + 5,
        {
          richText: [
            { text: '✔ ', font: font({ bold: true, color: { argb: C.emerald600 } }) },
            { text: `${w.label} `, font: font({ bold: true, size: 8.5, color: { argb: C.slate900 } }) },
            { text: w.text, font: font({ size: 8.5, color: { argb: C.slate600 } }) },
          ],
        },
        { align: { indent: 1 } }
      );
    });
    ws.getRow(r).height = 26;
    r++;
  }
  fillRange(ws, wTop, 1, r - 1, COLS, C.slate50);
  outline(ws, wTop, 1, r - 1, COLS, C.slate200);
  r += 2;

  // ======================= CHỮ KÝ =======================
  lineAbove(ws, r, 1, COLS, C.slate200);
  const signBlocks: Array<[number, number, string]> = [
    [1, 6, PROPOSAL_TITLES.customerSign],
    [7, 12, PROPOSAL_TITLES.companySign],
  ];
  signBlocks.forEach(([c1, c2, label]) => {
    put(ws, r, c1, c2, label, {
      font: font({ bold: true, color: { argb: C.slate900 } }),
      align: { horizontal: 'center', vertical: 'bottom' },
    });
    put(ws, r + 1, c1, c2, PROPOSAL_TITLES.signHint, {
      font: font({ size: 8.5, color: { argb: C.slate400 } }),
      align: { horizontal: 'center', vertical: 'top' },
    });
  });
  ws.getRow(r).height = 24;
  for (let i = 2; i <= 5; i++) ws.getRow(r + i).height = 16;

  ws.pageSetup.printArea = `A1:L${r + 5}`;
}

/* ------------------------------------------------------------------ */
/* Ảnh logo & biểu đồ (chạy trên trình duyệt)                          */
/* ------------------------------------------------------------------ */

async function svgToPngDataUrl(svgMarkup: string, width: number, height: number, scale = 2): Promise<string> {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D không khả dụng');
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}

/** Logo HGC (biểu tượng + chữ) giống component <Logo size="lg" /> */
export async function renderHgcLogoPng(): Promise<string> {
  const w = LOGO_SIZE.width;
  const h = LOGO_SIZE.height;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <g transform="translate(0 4) scale(0.533)">
    <path d="${HGC_EMBLEM_G_PATH}" fill="${HGC_EMBLEM_COLOR}"/>
    <path d="${HGC_EMBLEM_H_PATH}" fill="${HGC_EMBLEM_COLOR}"/>
  </g>
  <text x="66" y="33" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="800" letter-spacing="1.5" fill="#3D2E27">HGC</text>
  <text x="67" y="46" font-family="Arial, Helvetica, sans-serif" font-size="9" font-weight="600" letter-spacing="2" fill="#4A3B32">HI-TEK · GREEN · CLEAN</text>
</svg>`;
  return svgToPngDataUrl(svg, w, h, 3);
}

/** Chụp biểu đồ dự phóng 20 năm đang hiển thị trên bản Proposal */
export async function captureProposalChartPng(): Promise<ProposalImages['chartPng']> {
  const container = document.querySelector('[data-proposal-chart]');
  const svgEl = container?.querySelector('svg.recharts-surface') ?? container?.querySelector('svg');
  if (!svgEl) return null;
  const rect = svgEl.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(rect.width));
  clone.setAttribute('height', String(rect.height));
  clone.setAttribute('style', `font-family: ${getComputedStyle(svgEl).fontFamily}; background: #F8FAFC;`);
  const markup = new XMLSerializer().serializeToString(clone);
  const dataUrl = await svgToPngDataUrl(markup, rect.width, rect.height, 2);
  return { dataUrl, width: rect.width, height: rect.height };
}

/* ------------------------------------------------------------------ */

export async function buildValueProposalXlsx(project: Project, images: ProposalImages = {}): Promise<Blob> {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = PROPOSAL_COMPANY.name;
  wb.created = new Date();

  const ws = wb.addWorksheet('Proposal Báo Giá', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    views: [{ showGridLines: false }],
  });
  buildProposalSheet(wb, ws, project, images);

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
