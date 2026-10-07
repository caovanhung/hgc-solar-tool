import {
  PanelModel,
  InverterModel,
  LayoutResult,
  MountingResult,
  CableResult,
  DistributionBoardResult,
  BomLine,
  MaterialItem,
  STANDARD_BOM_GROUPS,
  HGC_BOM_SECTIONS,
  HgcSectionDefinition,
  Project,
  DEFAULT_SURVEY_CHECKLIST,
} from '../types/solar';

export interface GenerateBomParams {
  panel: PanelModel;
  inverter?: InverterModel;
  inverterQty: number;
  layout: LayoutResult;
  mounting: MountingResult;
  cables: CableResult[];
  board: DistributionBoardResult;
  materialsCatalog: MaterialItem[];
  marginPct: number;
  roofType?: string;
  hasCanopyFrame?: boolean;
  canopyAreaM2?: number;
  canopyUnitCostVnd?: number;
  includeEvnDocs?: boolean;
  evnDocsCostVnd?: number;
  includeTransport?: boolean;
  transportCostVnd?: number;
  installCostVndPerKwp?: number;
  includeScada?: boolean;
  scadaCostVnd?: number;
  sysType?: string;
  phases?: string;
}

export interface HgcSectionGroup {
  section: HgcSectionDefinition;
  items: BomLine[];
  subsections?: Array<{
    title: string;
    items: BomLine[];
    subtotalCostVnd: number;
    subtotalSellVnd: number;
  }>;
  subtotalCostVnd: number;
  subtotalSellVnd: number;
}

/**
 * Tạo danh mục bóc tách vật tư (BOM) theo chuẩn 100% mẫu file 'Bảng kê vật tư mẫu.xlsx'
 * Bao gồm đầy đủ 4 nhóm phân mục:
 *   A. THIẾT BỊ CHÍNH (Biến tần, Tấm pin, Pin lưu trữ, Biến dòng CT / Meter, Tủ điện)
 *   B. HỆ RAIL NHÔM / GIÀN KHUNG (Hệ Rail Nhôm Fravi/Hopergy & Hệ Rail Giàn Khung VN)
 *   C. THIẾT BỊ NGOẠI VI (Cáp DC Helukabel, Cáp Cadivi CV, PE, MC4 Leader, Cọc đất, Máng gen, Ruột gà CVL, Phụ kiện)
 *   D. CÁC CHI PHÍ KHÁC (Nhân công lắp đặt, Thuê thiết bị, Vận chuyển cẩu kéo)
 */
export function generateProjectBom(params: GenerateBomParams): BomLine[] {
  const {
    panel,
    inverter,
    inverterQty,
    layout,
    mounting,
    cables,
    materialsCatalog,
    marginPct,
    sysType = 'on_grid',
    phases = '1',
  } = params;

  const lines: BomLine[] = [];
  const multiplier = 1 + marginPct / 100;

  // Helper tìm kiếm vật tư trong catalog theo SKU hoặc ID
  const findMat = (
    key: string,
    fallbackCost: number,
    fallbackName?: string,
    fallbackSpec?: string,
    fallbackUnit?: string,
    fallbackBrand?: string
  ) => {
    const found = materialsCatalog.find(
      (m) => m.id === key || m.sku.toLowerCase() === key.toLowerCase() || m.name.toLowerCase().includes(key.toLowerCase())
    );
    return {
      cost: found ? found.costVnd : fallbackCost,
      name: found ? found.name : fallbackName || key,
      spec: found ? found.spec : fallbackSpec || '',
      sku: found ? found.sku : key,
      unit: found ? found.unit : fallbackUnit || 'Cái',
      brand: fallbackBrand || 'VN',
    };
  };

  const isHybrid = sysType === 'hybrid';
  const is3Phase = phases === '3';

  // =========================================================================
  // PHẦN A: THIẾT BỊ CHÍNH (MAIN EQUIPMENT)
  // =========================================================================

  // 1. Biến tần (Inverter)
  if (inverter) {
    const invCost = inverter.priceHintVnd;
    const invTypeName = inverter.type === 'hybrid' ? 'Hybrid' : 'hòa lưới';
    const invPhaseName = inverter.phases === '3' ? '3Pha' : '1pha';
    lines.push({
      id: 'bom-inverter',
      categoryCode: 'I',
      categoryName: 'Vật tư chính',
      hgcSectionCode: 'A',
      hgcSubsection: 'THIẾT BỊ CHÍNH',
      name: `Biến tần năng lượng mặt trời ${invTypeName} ${inverter.brand} ${inverter.acKw}kW ${invPhaseName}`,
      spec: `Công suất AC ${inverter.acKw}kW, ${inverter.phases === '3' ? '3 Pha 380V' : '1 Pha 220V'}, ${inverter.mpptCount} MPPT`,
      sku: inverter.model,
      brand: inverter.brand,
      origin: 'Chính hãng',
      unit: 'Bộ',
      qty: inverterQty,
      unitCostVnd: invCost,
      totalCostVnd: invCost * inverterQty,
      unitSellVnd: Math.round(invCost * multiplier),
      totalSellVnd: Math.round(invCost * inverterQty * multiplier),
      note: 'Bảo hành 5 năm chính hãng',
    });
  }

  // 2. Tấm pin (PV Module)
  const panelCost = panel.priceHintVnd;
  lines.push({
    id: 'bom-panel',
    categoryCode: 'I',
    categoryName: 'Vật tư chính',
    hgcSectionCode: 'A',
    hgcSubsection: 'THIẾT BỊ CHÍNH',
    name: `Tấm pin năng lượng mặt trời ${panel.wp}Wp`,
    spec: `${panel.wp}Wp, Voc=${panel.voc}V, Vmpp=${panel.vmpp}V, ${panel.tech}`,
    sku: panel.model,
    brand: panel.brand,
    origin: 'Chính hãng',
    unit: 'Tấm',
    qty: layout.panelQty,
    unitCostVnd: panelCost,
    totalCostVnd: panelCost * layout.panelQty,
    unitSellVnd: Math.round(panelCost * multiplier),
    totalSellVnd: Math.round(panelCost * layout.panelQty * multiplier),
    note: `Bảo hành hiệu suất ${panel.warrantyYears} năm`,
  });

  // 3. Pin lưu trữ (Battery Lithium) - Bắt buộc khi là hệ Hybrid ESS theo mẫu file
  if (isHybrid) {
    if (is3Phase) {
      // Mẫu HYBRID 3P: Pin lưu trữ 16kWh (W16-5A / Lithium Valley, SL: 2 bộ)
      const batMat = findMat('bat-lv-16k', 38292734, 'Pin lưu trữ 16kWh', 'Điện áp thấp 51.2V 16kWh Lithium Valley', 'Bộ', 'LITHIUM VALLEY');
      const batQty = 2;
      lines.push({
        id: 'bom-battery',
        categoryCode: 'I',
        categoryName: 'Vật tư chính',
        hgcSectionCode: 'A',
        hgcSubsection: 'THIẾT BỊ CHÍNH',
        name: 'Pin lưu trữ 16kWh',
        spec: 'Điện áp thấp 51.2V, dung lượng 16kWh x 2 = 32kWh lưu trữ',
        sku: 'W16-5A',
        brand: 'LITHIUM VALLEY',
        origin: 'Chính hãng',
        unit: 'Bộ',
        qty: batQty,
        unitCostVnd: batMat.cost,
        totalCostVnd: batMat.cost * batQty,
        unitSellVnd: Math.round(batMat.cost * multiplier),
        totalSellVnd: Math.round(batMat.cost * batQty * multiplier),
        note: 'Bảo hành 5 năm chính hãng, tích hợp BMS',
      });
    } else {
      // Mẫu HYBRID 1P: Bộ pin lưu trữ điện 16kWh (FB-L-16 / Pylontech, SL: 1 bộ)
      const batMat = findMat('bat-pylon-16k', 43000200, 'Bộ pin lưu trữ điện 16kWh', '16kWh kèm cáp & fire proof', 'Bộ', 'PYLONTECH');
      const batQty = 1;
      lines.push({
        id: 'bom-battery',
        categoryCode: 'I',
        categoryName: 'Vật tư chính',
        hgcSectionCode: 'A',
        hgcSubsection: 'THIẾT BỊ CHÍNH',
        name: 'Bộ pin lưu trữ điện 16kWh',
        spec: 'Điện áp thấp 51.2V, 16.38kWh, cable kit và chống cháy nổ an toàn',
        sku: 'FB-L-16',
        brand: 'PYLONTECH',
        origin: 'Chính hãng',
        unit: 'Bộ',
        qty: batQty,
        unitCostVnd: batMat.cost,
        totalCostVnd: batMat.cost * batQty,
        unitSellVnd: Math.round(batMat.cost * multiplier),
        totalSellVnd: Math.round(batMat.cost * batQty * multiplier),
        note: 'Bảo hành 10 năm chính hãng Pylontech',
      });
    }
  }

  // 4. Biến dòng đo lường CT / Meter (Dành cho On-Grid bám tải hoặc đo lường)
  if (!isHybrid) {
    const ctMat = findMat('b-ct-sensor', 1800000, 'Biến dòng đo lường', 'Dải đo 100A-600A/5A Class 0.5', 'Bộ', 'VN');
    lines.push({
      id: 'bom-ct-sensor',
      categoryCode: 'II',
      categoryName: 'Hệ bám tải',
      hgcSectionCode: 'A',
      hgcSubsection: 'THIẾT BỊ CHÍNH',
      name: 'Biến dòng đo lường',
      spec: 'Cảm biến biến dòng đo đếm phụ tải bám tải Zero-Export',
      sku: is3Phase ? 'CT-3P-MEASURE' : 'CT-1P-MEASURE',
      brand: 'VN',
      origin: 'Chính hãng',
      unit: 'Bộ',
      qty: 1,
      unitCostVnd: ctMat.cost,
      totalCostVnd: ctMat.cost,
      unitSellVnd: Math.round(ctMat.cost * multiplier),
      totalSellVnd: Math.round(ctMat.cost * multiplier),
      note: 'Phục vụ đo dòng phụ tải hòa lưới',
    });
  }

  // 5. Tủ điện theo đúng cấu hình hệ thống & công suất Inverter
  const invKw = inverter?.acKw || 10;
  let cabKey = 'td-gt-10k1p';
  let fallbackCost = 3200000;
  let fallbackName = 'TỦ ĐIỆN HÒA LƯỚI 10KW 1PHA';
  let fallbackSpec = 'Kèm MCCB 63A + SPD Chống sét Type 2 + Đèn báo pha';
  let fallbackSku = 'TD-GT-10K1P-2S2M-SPD-E';
  let cabNote = 'Đấu nối bảo vệ đóng cắt hệ thống';

  if (isHybrid) {
    if (is3Phase) {
      if (invKw <= 15) {
        cabKey = 'td-hb-3p-1015';
        fallbackCost = 5286600;
        fallbackName = 'Tủ điện Hybrid 10KW-15KW, 3 Pha, 3 String tích hợp ATS TD-HB3P1015K3S-ATS';
        fallbackSpec = 'Tích hợp ATS 4P 40A, CB AC/DC, SPD chống sét Type 2';
        fallbackSku = 'TD-HB3P1015K3S-ATS';
        cabNote = 'ATS 4P tự động chuyển nguồn phụ tải ưu tiên khi mất lưới';
      } else if (invKw <= 20) {
        cabKey = 'td-hb-3p-20';
        fallbackCost = 6252120;
        fallbackName = 'Tủ điện Hybrid 20KW, 3 Pha, 4 String tích hợp ATS TD-HB3P20K4S-ATS';
        fallbackSpec = 'Tích hợp ATS 4P 63A, CB AC/DC, SPD chống sét Type 2';
        fallbackSku = 'TD-HB3P20K4S-ATS';
        cabNote = 'ATS 4P tự động chuyển nguồn phụ tải ưu tiên khi mất lưới';
      } else if (invKw <= 30) {
        cabKey = 'td-hb-3p-30';
        fallbackCost = 8800000;
        fallbackName = 'Tủ điện Hybrid 30KW, 3 Pha tích hợp ATS TD-HB3P30K-ATS';
        fallbackSpec = 'Tích hợp ATS 4P 100A, MCCB 100A, CB AC/DC, SPD chống sét Type 2';
        fallbackSku = 'TD-HB3P30K-ATS';
        cabNote = 'ATS 4P 100A bảo vệ phụ tải công suất lớn';
      } else {
        cabKey = 'td-hb-3p-50';
        fallbackCost = 13500000;
        fallbackName = 'Tủ điện Hybrid 50KW, 3 Pha tích hợp ATS TD-HB3P50K-ATS';
        fallbackSpec = 'Tích hợp ATS 4P 160A, MCCB 160A, CB AC/DC, SPD chống sét Type 2';
        fallbackSku = 'TD-HB3P50K-ATS';
        cabNote = 'ATS 4P 160A bảo vệ trọn gói hệ thống Hybrid 50kW';
      }
    } else {
      // Hybrid 1 Pha
      if (invKw <= 8) {
        cabKey = 'td-hb-1p-0508';
        fallbackCost = 3407400;
        fallbackName = 'Tủ điện Hybrid 5KW-8KW, 1 Pha, 2 String tích hợp ATS TD-HB1P0508K2S-ATS';
        fallbackSpec = 'Tích hợp ATS 2P 40A, CB AC/DC, SPD chống sét Type 2';
        fallbackSku = 'TD-HB1P0508K2S-ATS';
        cabNote = 'ATS 2P chuyển mạch phụ tải ưu tiên khi mất lưới';
      } else if (invKw <= 10) {
        cabKey = 'td-hb-1p-10';
        fallbackCost = 3797280;
        fallbackName = 'Tủ điện Hybrid 10KW, 1 Pha, 2 String tích hợp ATS TD-HB1P10K2S-ATS';
        fallbackSpec = 'Tích hợp ATS 2P 63A, CB AC/DC, SPD chống sét Type 2';
        fallbackSku = 'TD-HB1P10K2S-ATS';
        cabNote = 'ATS 2P 63A chuyển mạch tức thời < 20ms';
      } else {
        cabKey = 'td-hb-1p-12';
        fallbackCost = 4892400;
        fallbackName = 'Tủ điện Hybrid 12KW, 1 Pha, 3 String tích hợp ATS TD-HB1P12K3S-ATS';
        fallbackSpec = 'Tích hợp ATS 2P 63A, CB AC/DC, SPD chống sét Type 2';
        fallbackSku = 'TD-HB1P12K3S-ATS';
        cabNote = 'ATS 2P 63A cho Inverter 1P công suất lớn';
      }
    }
  } else {
    // On-grid
    if (is3Phase) {
      if (invKw <= 15) {
        cabKey = 'td-gt-15k3p';
        fallbackCost = 4500000;
        fallbackName = 'TỦ ĐIỆN HÒA LƯỚI 10KW-15KW 3PHA';
        fallbackSpec = 'Kèm MCB/MCCB 40A 3P + SPD Type 2 385V + Đèn báo pha, cầu chì DC';
        fallbackSku = 'TD-GT-15K3P-2S2M';
        cabNote = 'Đấu nối bảo vệ cổng hòa lưới On-Grid 3P';
      } else if (invKw <= 20) {
        cabKey = 'td-gt-20k3p';
        fallbackCost = 5800000;
        fallbackName = 'TỦ ĐIỆN HÒA LƯỚI 20KW 3PHA';
        fallbackSpec = 'Kèm MCCB 80A 3P + SPD Type 2 385V + Đèn báo pha, cầu chì DC';
        fallbackSku = 'TD-GT-20K3P-2S2M';
        cabNote = 'Tiêu chuẩn bảo vệ hạ thế ngoài trời IP65';
      } else if (invKw <= 30) {
        cabKey = 'td-gt-30k3p';
        fallbackCost = 7800000;
        fallbackName = 'TỦ ĐIỆN HÒA LƯỚI 30KW 3PHA';
        fallbackSpec = 'Kèm MCCB 100A 3P + SPD Type 2 385V + Đèn báo pha, cầu chì DC';
        fallbackSku = 'TD-GT-30K3P-3S3M';
        cabNote = 'MCCB 100A bảo vệ hệ 30kW theo tiêu chuẩn 1.25xIb';
      } else {
        cabKey = 'td-gt-50k3p';
        fallbackCost = 10500000;
        fallbackName = 'TỦ ĐIỆN HÒA LƯỚI 50KW 3PHA';
        fallbackSpec = 'Kèm MCCB 160A 3P + SPD Type 2 385V + Đèn báo pha, chống phát ngược Zero-Export';
        fallbackSku = 'TD-GT-50K3P-4S4M';
        cabNote = 'MCCB 160A bảo vệ hệ 50kW theo tiêu chuẩn 1.25xIb';
      }
    } else {
      // On-grid 1 Pha
      if (invKw <= 6) {
        cabKey = 'td-gt-05k1p';
        fallbackCost = 2400000;
        fallbackName = 'TỦ ĐIỆN HÒA LƯỚI 5KW-6KW 1PHA';
        fallbackSpec = 'Kèm MCB 32A 2P + SPD Chống sét Type 2 275V + Đèn báo pha';
        fallbackSku = 'TD-GT-05K1P-2S-SPD';
        cabNote = 'Đấu nối bảo vệ cổng hòa lưới 1P 5-6kW';
      } else {
        cabKey = 'td-gt-10k1p';
        fallbackCost = 3200000;
        fallbackName = 'TỦ ĐIỆN HÒA LƯỚI 10KW 1PHA';
        fallbackSpec = 'Kèm MCCB 63A 2P + SPD Chống sét Type 2 275V + Đèn báo pha';
        fallbackSku = 'TD-GT-10K1P-2S2M-SPD-E';
        cabNote = 'Đấu nối bảo vệ cổng hòa lưới 1P 10kW';
      }
    }
  }

  const cabMat = findMat(cabKey, fallbackCost, fallbackName, fallbackSpec, 'Bộ', 'VN');
  lines.push({
    id: 'bom-cabinet',
    categoryCode: 'IV',
    categoryName: 'Hệ thống điện',
    hgcSectionCode: 'A',
    hgcSubsection: 'THIẾT BỊ CHÍNH',
    name: cabMat.name,
    spec: cabMat.spec,
    sku: cabMat.sku,
    brand: cabMat.brand,
    origin: 'Việt Nam',
    unit: 'Bộ',
    qty: 1,
    unitCostVnd: cabMat.cost,
    totalCostVnd: cabMat.cost,
    unitSellVnd: Math.round(cabMat.cost * multiplier),
    totalSellVnd: Math.round(cabMat.cost * multiplier),
    note: cabNote,
  });

  // =========================================================================
  // PHẦN B: HỆ RAIL NHÔM/ GIÀN KHUNG
  // =========================================================================

  // --- B.1: HỆ RAIL NHÔM ---
  const railQty = mounting.railLengthM;
  const railMat = findMat(
    'm-rail',
    85000,
    'Thanh rail nhôm Anodized Al6005-T5 chuyên dụng NLMT',
    'Kích thước 28x50mm, dài 4.2m, kháng ăn mòn muối biển',
    'm',
    'HLC'
  );
  lines.push({
    id: 'bom-rail-al42',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    hgcSectionCode: 'B',
    hgcSubsection: 'HỆ RAIL NHÔM',
    name: railMat.name,
    spec: railMat.spec,
    sku: railMat.sku,
    brand: railMat.brand || 'HLC',
    origin: 'Việt Nam',
    unit: railMat.unit || 'm',
    qty: railQty,
    unitCostVnd: railMat.cost,
    totalCostVnd: railMat.cost * railQty,
    unitSellVnd: Math.round(railMat.cost * multiplier),
    totalSellVnd: Math.round(railMat.cost * railQty * multiplier),
  });

  const joinerQty = mounting.railJoinerQty;
  const joinerMat = findMat('m-joiner-hopergy', 22000, 'Nối rail', 'Khớp nối thanh rail kèm bu lông M8 Inox 304', 'Cái', 'Hopergy');
  lines.push({
    id: 'bom-joiner-hopergy',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    hgcSectionCode: 'B',
    hgcSubsection: 'HỆ RAIL NHÔM',
    name: joinerMat.name,
    spec: joinerMat.spec,
    sku: joinerMat.sku,
    brand: joinerMat.brand,
    origin: 'Việt Nam',
    unit: joinerMat.unit,
    qty: joinerQty,
    unitCostVnd: joinerMat.cost,
    totalCostVnd: joinerMat.cost * joinerQty,
    unitSellVnd: Math.round(joinerMat.cost * multiplier),
    totalSellVnd: Math.round(joinerMat.cost * joinerQty * multiplier),
  });

  const midQty = mounting.midClampQty;
  const midMat = findMat('m-mid-fravi', 12000, 'Kẹp giữa 30', 'Kẹp giữa Al6005-T5 cho pin dày 30/35mm', 'Cái', 'Fravi');
  lines.push({
    id: 'bom-mid-fravi',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    hgcSectionCode: 'B',
    hgcSubsection: 'HỆ RAIL NHÔM',
    name: midMat.name,
    spec: midMat.spec,
    sku: midMat.sku,
    brand: midMat.brand,
    origin: 'Việt Nam',
    unit: midMat.unit,
    qty: midQty,
    unitCostVnd: midMat.cost,
    totalCostVnd: midMat.cost * midQty,
    unitSellVnd: Math.round(midMat.cost * multiplier),
    totalSellVnd: Math.round(midMat.cost * midQty * multiplier),
  });

  const endQty = mounting.endClampQty;
  const endMat = findMat('m-end-fravi', 12000, 'Kẹp biên 30', 'Kẹp biên Al6005-T5 cho pin dày 30/35mm', 'Cái', 'Fravi');
  lines.push({
    id: 'bom-end-fravi',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    hgcSectionCode: 'B',
    hgcSubsection: 'HỆ RAIL NHÔM',
    name: endMat.name,
    spec: endMat.spec,
    sku: endMat.sku,
    brand: endMat.brand,
    origin: 'Việt Nam',
    unit: endMat.unit,
    qty: endQty,
    unitCostVnd: endMat.cost,
    totalCostVnd: endMat.cost * endQty,
    unitSellVnd: Math.round(endMat.cost * multiplier),
    totalSellVnd: Math.round(endMat.cost * endQty * multiplier),
  });

  const discQty = mounting.midClampQty;
  const discMat = findMat('g-ground-disc', 6000, 'Lá tiếp địa', 'Inox 304 xuyên thủng Anode', 'Cái', 'Hopergy');
  lines.push({
    id: 'bom-ground-disc',
    categoryCode: 'VI',
    categoryName: 'Hệ thống phụ trợ',
    hgcSectionCode: 'B',
    hgcSubsection: 'HỆ RAIL NHÔM',
    name: discMat.name,
    spec: discMat.spec,
    sku: discMat.sku,
    brand: discMat.brand,
    origin: 'Việt Nam',
    unit: discMat.unit,
    qty: discQty,
    unitCostVnd: discMat.cost,
    totalCostVnd: discMat.cost * discQty,
    unitSellVnd: Math.round(discMat.cost * multiplier),
    totalSellVnd: Math.round(discMat.cost * discQty * multiplier),
  });

  const clampSetQty = mounting.groundingLugQty;
  const clampSetMat = findMat('g-ground-clamp-set', 22000, 'Kẹp tiếp địa + lá kẹp tiếp địa', 'Bộ kẹp tiếp địa an toàn rail', 'Cái', 'Hopergy');
  lines.push({
    id: 'bom-ground-clamp-set',
    categoryCode: 'VI',
    categoryName: 'Hệ thống phụ trợ',
    hgcSectionCode: 'B',
    hgcSubsection: 'HỆ RAIL NHÔM',
    name: clampSetMat.name,
    spec: clampSetMat.spec,
    sku: clampSetMat.sku,
    brand: clampSetMat.brand,
    origin: 'Việt Nam',
    unit: clampSetMat.unit,
    qty: clampSetQty,
    unitCostVnd: clampSetMat.cost,
    totalCostVnd: clampSetMat.cost * clampSetQty,
    unitSellVnd: Math.round(clampSetMat.cost * multiplier),
    totalSellVnd: Math.round(clampSetMat.cost * clampSetQty * multiplier),
  });

  const lfeetQty = mounting.lFeetQty;
  const lfeetMat = findMat('m-lfeet-hopergy', 28000, 'Chân đế L', 'Nhôm đúc kèm vít bắn tôn và đệm EPDM', 'Cái', 'Hopergy');
  lines.push({
    id: 'bom-lfeet-hopergy',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    hgcSectionCode: 'B',
    hgcSubsection: 'HỆ RAIL NHÔM',
    name: lfeetMat.name,
    spec: lfeetMat.spec,
    sku: lfeetMat.sku,
    brand: lfeetMat.brand,
    origin: 'Việt Nam',
    unit: lfeetMat.unit,
    qty: lfeetQty,
    unitCostVnd: lfeetMat.cost,
    totalCostVnd: lfeetMat.cost * lfeetQty,
    unitSellVnd: Math.round(lfeetMat.cost * multiplier),
    totalSellVnd: Math.round(lfeetMat.cost * lfeetQty * multiplier),
  });

  // --- B.2: HỆ RAIL GIÀN KHUNG ---
  // Luôn có trong danh mục bóc tách mẫu (tùy chỉnh khối lượng theo dự toán canopy / kết cấu gia cố)
  const isCanopy = params.roofType === 'canopy' || Boolean(params.hasCanopyFrame);
  const canopyScale = isCanopy ? Math.max(1, Math.round((params.canopyAreaM2 || 60) / 40)) : 1;

  const steel30x60Mat = findMat('m-steel-30x60', 280000, 'Thép hộp 30x60x1.4mm', 'Cây 6m mạ kẽm', 'Cây', 'VN');
  const steel30x60Qty = isCanopy ? 6 * canopyScale : 4;
  lines.push({
    id: 'bom-steel-30x60',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    hgcSectionCode: 'B',
    hgcSubsection: 'HỆ RAIL GIÀN KHUNG',
    name: 'Thép hộp 30x60x1.4mm',
    spec: 'Thép hộp mạ kẽm nhúng nóng cây dài 6m chống ăn mòn',
    sku: 'THEP-HOP-30X60',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Cây',
    qty: steel30x60Qty,
    unitCostVnd: steel30x60Mat.cost,
    totalCostVnd: steel30x60Mat.cost * steel30x60Qty,
    unitSellVnd: Math.round(steel30x60Mat.cost * multiplier),
    totalSellVnd: Math.round(steel30x60Mat.cost * steel30x60Qty * multiplier),
  });

  const steel40x80Mat = findMat('m-steel-40x80', 380000, 'Thép hộp 40x80x1.4mm', 'Cây 6m mạ kẽm', 'Cây', 'VN');
  const steel40x80Qty = isCanopy ? 6 * canopyScale : 4;
  lines.push({
    id: 'bom-steel-40x80',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    hgcSectionCode: 'B',
    hgcSubsection: 'HỆ RAIL GIÀN KHUNG',
    name: 'Thép hộp 40x80x1.4mm',
    spec: 'Thép hộp mạ kẽm cây dài 6m làm xà gồ đỡ thanh rail',
    sku: 'THEP-HOP-40X80',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Cây',
    qty: steel40x80Qty,
    unitCostVnd: steel40x80Mat.cost,
    totalCostVnd: steel40x80Mat.cost * steel40x80Qty,
    unitSellVnd: Math.round(steel40x80Mat.cost * multiplier),
    totalSellVnd: Math.round(steel40x80Mat.cost * steel40x80Qty * multiplier),
  });

  const steel50x100Mat = findMat('m-steel-50x100', 650000, 'Thép hộp 50x100x1.8mm', 'Cây 6m mạ kẽm', 'Cây', 'VN');
  const steel50x100Qty = isCanopy ? 4 * canopyScale : 2;
  lines.push({
    id: 'bom-steel-50x100',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    hgcSectionCode: 'B',
    hgcSubsection: 'HỆ RAIL GIÀN KHUNG',
    name: 'Thép hộp 50x100x1.8mm',
    spec: 'Thép hộp mạ kẽm dày 1.8mm làm kèo chịu lực chính',
    sku: 'THEP-HOP-50X100',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Cây',
    qty: steel50x100Qty,
    unitCostVnd: steel50x100Mat.cost,
    totalCostVnd: steel50x100Mat.cost * steel50x100Qty,
    unitSellVnd: Math.round(steel50x100Mat.cost * multiplier),
    totalSellVnd: Math.round(steel50x100Mat.cost * steel50x100Qty * multiplier),
  });

  const steel75x75Mat = findMat('m-steel-75x75', 720000, 'Thép hộp 75x75x1.8mm', 'Cây 6m mạ kẽm', 'Cây', 'VN');
  const steel75x75Qty = isCanopy ? 4 * canopyScale : 2;
  lines.push({
    id: 'bom-steel-75x75',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    hgcSectionCode: 'B',
    hgcSubsection: 'HỆ RAIL GIÀN KHUNG',
    name: 'Thép hộp 75x75x1.8mm',
    spec: 'Thép hộp vuông dày 1.8mm làm cột đỡ giàn khung',
    sku: 'THEP-HOP-75X75',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Cây',
    qty: steel75x75Qty,
    unitCostVnd: steel75x75Mat.cost,
    totalCostVnd: steel75x75Mat.cost * steel75x75Qty,
    unitSellVnd: Math.round(steel75x75Mat.cost * multiplier),
    totalSellVnd: Math.round(steel75x75Mat.cost * steel75x75Qty * multiplier),
  });

  const plateMat = findMat('m-base-plate', 145000, 'Bản mã 200x200x10mm', 'Thép tấm đột lỗ', 'Cái', 'VN');
  const plateQty = isCanopy ? 8 : 4;
  lines.push({
    id: 'bom-base-plate',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    hgcSectionCode: 'B',
    hgcSubsection: 'HỆ RAIL GIÀN KHUNG',
    name: 'Bản mã 200x200x10mm',
    spec: 'Bản mã chân cột thép tấm gia công đột 4 lỗ bu lông neo',
    sku: 'BANMA-200X200',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Cái',
    qty: plateQty,
    unitCostVnd: plateMat.cost,
    totalCostVnd: plateMat.cost * plateQty,
    unitSellVnd: Math.round(plateMat.cost * multiplier),
    totalSellVnd: Math.round(plateMat.cost * plateQty * multiplier),
  });

  const boltPaintMat = findMat('m-bolts-paint', 1500000, 'Bulong,chống thấm,sơn,..', 'Vật tư phụ liên kết', 'Hệ', 'VN');
  lines.push({
    id: 'bom-bolts-paint',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    hgcSectionCode: 'B',
    hgcSubsection: 'HỆ RAIL GIÀN KHUNG',
    name: 'Bulong,chống thấm,sơn,..',
    spec: 'Bulong nở liên kết kết cấu, keo chống thấm Sika, sơn chống rỉ mối hàn',
    sku: 'BULONG-SON-SET',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Hệ',
    qty: 1,
    unitCostVnd: boltPaintMat.cost,
    totalCostVnd: boltPaintMat.cost,
    unitSellVnd: Math.round(boltPaintMat.cost * multiplier),
    totalSellVnd: Math.round(boltPaintMat.cost * multiplier),
  });

  // =========================================================================
  // PHẦN C: THIẾT BỊ NGOẠI VI (PERIPHERAL EQUIPMENT)
  // =========================================================================
  const cableList = Array.isArray(cables) ? cables : ((cables as any)?.cables || []);
  const dcCable = cableList.find((c: any) => c.cableType === 'DC_SOLAR');
  const dcLen = dcCable ? dcCable.lengthM : Math.max(50, layout.panelQty * 3);

  // 1. Dây cáp DC đỏ
  const dcRedMat = findMat('e-dc-helukabel-red', 16500, 'Dây cáp động lực chuyên dụng solar 1x4mm² / (cáp đơn, màu đỏ)', '1500V DC Helukabel', 'Mét', 'Helukabel');
  lines.push({
    id: 'bom-dc-red',
    categoryCode: 'IV',
    categoryName: 'Hệ thống điện',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Dây cáp động lực chuyên dụng solar 1x4mm² / (cáp đơn, màu đỏ)',
    spec: '1500V DC, đồng mạ thiếc, vỏ bọc kép XLPO chống tia UV Helukabel',
    sku: 'RT-RED-4MM2-HELU',
    brand: 'Helukabel',
    origin: 'Đức',
    unit: 'Mét',
    qty: dcLen,
    unitCostVnd: dcRedMat.cost,
    totalCostVnd: dcRedMat.cost * dcLen,
    unitSellVnd: Math.round(dcRedMat.cost * multiplier),
    totalSellVnd: Math.round(dcRedMat.cost * dcLen * multiplier),
    note: 'Dây DC cực dương (+)',
  });

  // 2. Dây cáp DC đen
  const dcBlackMat = findMat('e-dc-helukabel-black', 16500, 'Dây cáp động lực chuyên dụng solar 1x4mm² / (cáp đơn, màu đen)', '1500V DC Helukabel', 'Mét', 'Helukabel');
  lines.push({
    id: 'bom-dc-black',
    categoryCode: 'IV',
    categoryName: 'Hệ thống điện',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Dây cáp động lực chuyên dụng solar 1x4mm² / (cáp đơn, màu đen)',
    spec: '1500V DC, đồng mạ thiếc, vỏ bọc kép XLPO chống tia UV Helukabel',
    sku: 'SW-BLACK-4MM2-HELU',
    brand: 'Helukabel',
    origin: 'Đức',
    unit: 'Mét',
    qty: dcLen,
    unitCostVnd: dcBlackMat.cost,
    totalCostVnd: dcBlackMat.cost * dcLen,
    unitSellVnd: Math.round(dcBlackMat.cost * multiplier),
    totalSellVnd: Math.round(dcBlackMat.cost * dcLen * multiplier),
    note: 'Dây DC cực âm (-)',
  });

  // 3. Dây cáp AC nguồn INV (CV 1 lõi Cadivi: 10mm2 cho 1P, 8mm2 hoặc 6mm2 cho 3P)
  const acCable = cableList.find((c: any) => c.cableType === 'LV_MAIN');
  const acRouteLen = acCable ? acCable.lengthM : 30;
  const acTotalMeters = acRouteLen * (is3Phase ? 4 : 2);

  if (is3Phase) {
    const cv3pMat = findMat('e-cv-8mm2', 52000, 'Dây cáp động lực 1Cx8 mm²/ (cáp 01 lõi, cáp CV)', 'Cadivi 1Cx8mm2', 'Mét', 'Cadivi');
    lines.push({
      id: 'bom-ac-inv-cadivi',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      hgcSectionCode: 'C',
      hgcSubsection: 'THIẾT BỊ NGOẠI VI',
      name: 'Dây cáp động lực 1Cx8 mm²/ (cáp 01 lõi, cáp CV)',
      spec: '0.6/1kV ruột đồng cách điện PVC Cadivi (4 sợi 3P+N)',
      sku: 'CV-8mm2',
      brand: 'Cadivi',
      origin: 'Việt Nam',
      unit: 'Mét',
      qty: acTotalMeters,
      unitCostVnd: cv3pMat.cost,
      totalCostVnd: cv3pMat.cost * acTotalMeters,
      unitSellVnd: Math.round(cv3pMat.cost * multiplier),
      totalSellVnd: Math.round(cv3pMat.cost * acTotalMeters * multiplier),
      note: 'Dây nguồn INV 3 pha',
    });
  } else {
    const cv1pMat = findMat('e-cv-10mm2', 68000, 'Dây cáp động lực 1Cx10 mm²/ (cáp 01 lõi, cáp CV)', 'Cadivi 1Cx10mm2', 'Mét', 'Cadivi');
    lines.push({
      id: 'bom-ac-inv-cadivi',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      hgcSectionCode: 'C',
      hgcSubsection: 'THIẾT BỊ NGOẠI VI',
      name: 'Dây cáp động lực 1Cx10 mm²/ (cáp 01 lõi, cáp CV)',
      spec: '0.6/1kV ruột đồng cách điện PVC Cadivi (2 sợi L+N)',
      sku: 'CV-10mm2',
      brand: 'Cadivi',
      origin: 'Việt Nam',
      unit: 'Mét',
      qty: acTotalMeters,
      unitCostVnd: cv1pMat.cost,
      totalCostVnd: cv1pMat.cost * acTotalMeters,
      unitSellVnd: Math.round(cv1pMat.cost * multiplier),
      totalSellVnd: Math.round(cv1pMat.cost * acTotalMeters * multiplier),
      note: 'Dây nguồn INV 1 pha',
    });
  }

  // 4. Dây cáp tiếp địa PE (CV 1 lõi màu Vàng-Xanh)
  const peLen = acRouteLen + 10;
  if (is3Phase && isHybrid) {
    const peMat = findMat('e-pe-4mm2', 26000, 'Dây cáp động lực PE 4 mm² (Màu Te / Vàng -Xanh)', 'Cadivi PE 4mm2', 'Mét', 'Cadivi');
    lines.push({
      id: 'bom-pe-cable',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      hgcSectionCode: 'C',
      hgcSubsection: 'THIẾT BỊ NGOẠI VI',
      name: 'Dây cáp động lực PE 4 mm² (Màu Te / Vàng -Xanh)',
      spec: 'Dây đồng đơn bọc cách điện màu Te tiếp địa bảo vệ Inverter & vỏ tủ điện',
      sku: 'CV-4mm2-PE',
      brand: 'Cadivi',
      origin: 'Việt Nam',
      unit: 'Mét',
      qty: peLen,
      unitCostVnd: peMat.cost,
      totalCostVnd: peMat.cost * peLen,
      unitSellVnd: Math.round(peMat.cost * multiplier),
      totalSellVnd: Math.round(peMat.cost * peLen * multiplier),
      note: 'Dây PE',
    });
  } else {
    const peMat = findMat('e-pe-6mm2', 38000, 'Dây cáp động lực PE 6 mm² (Màu Te / Vàng -Xanh)', 'Cadivi PE 6mm2', 'Mét', 'Cadivi');
    lines.push({
      id: 'bom-pe-cable',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      hgcSectionCode: 'C',
      hgcSubsection: 'THIẾT BỊ NGOẠI VI',
      name: 'Dây cáp động lực PE 6 mm² (Màu Te / Vàng -Xanh)',
      spec: 'Dây đồng đơn bọc cách điện màu Te tiếp địa bảo vệ Inverter & vỏ tủ điện',
      sku: 'CV-6mm2-PE',
      brand: 'Cadivi',
      origin: 'Việt Nam',
      unit: 'Mét',
      qty: peLen,
      unitCostVnd: peMat.cost,
      totalCostVnd: peMat.cost * peLen,
      unitSellVnd: Math.round(peMat.cost * multiplier),
      totalSellVnd: Math.round(peMat.cost * peLen * multiplier),
      note: 'Dây PE',
    });
  }

  // Nếu là hệ 3 pha On-grid: Thêm dây nguồn Smart Meter theo mẫu file ON-GRID 3P
  if (is3Phase && !isHybrid) {
    const meterCableMat = findMat('e-meter-cable-1.5', 12000, 'Dây cáp động lực 1Cx1.5 mm²/ (cáp 01 lõi, cáp CV)', 'Cadivi 1Cx1.5mm2', 'Mét', 'Cadivi');
    lines.push({
      id: 'bom-meter-cable',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      hgcSectionCode: 'C',
      hgcSubsection: 'THIẾT BỊ NGOẠI VI',
      name: 'Dây cáp động lực 1Cx1.5 mm²/ (cáp 01 lõi, cáp CV)',
      spec: 'Dây nguồn cấp tín hiệu đồng hồ đo Smart Meter Cadivi',
      sku: 'CV-1.5mm2-PE',
      brand: 'Cadivi',
      origin: 'Việt Nam',
      unit: 'Mét',
      qty: 20,
      unitCostVnd: meterCableMat.cost,
      totalCostVnd: meterCableMat.cost * 20,
      unitSellVnd: Math.round(meterCableMat.cost * multiplier),
      totalSellVnd: Math.round(meterCableMat.cost * 20 * multiplier),
      note: 'Dây nguồn meter',
    });
  }

  // 5. Bộ nối MC4 Leader
  const mc4Qty = Math.max(8, Math.ceil(layout.panelQty / 4) * 2);
  const mc4Mat = findMat('e-mc4-leader', 25000, 'Bộ nối của tấm pin quang điện mặt trời MC4', '1500V DC IP68 Leader', 'Bộ', 'Leader');
  lines.push({
    id: 'bom-mc4-leader',
    categoryCode: 'IV',
    categoryName: 'Hệ thống điện',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Bộ nối của tấm pin quang điện mặt trời MC4',
    spec: 'Đầu nối giắc MC4 đực/cái 1500V DC, chân đồng mạ bạc IP68',
    sku: 'Solar-Connector-MC4',
    brand: 'Leader',
    origin: 'Chính hãng',
    unit: 'Bộ',
    qty: mc4Qty,
    unitCostVnd: mc4Mat.cost,
    totalCostVnd: mc4Mat.cost * mc4Qty,
    unitSellVnd: Math.round(mc4Mat.cost * multiplier),
    totalSellVnd: Math.round(mc4Mat.cost * mc4Qty * multiplier),
  });

  // 6. Cọc nối đất Ø16 dài 2.4m
  const rodQty = Math.max(3, Math.ceil(layout.installedKwp / 10));
  const rodMat = findMat('g-earth-rod-16', 280000, 'Cọc nối đất, mạ đồng, Ø16, dài 2.4m', 'Thép mạ đồng D16 2.4m', 'Cây', 'VN');
  lines.push({
    id: 'bom-earth-rod-vn',
    categoryCode: 'VI',
    categoryName: 'Hệ thống phụ trợ',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Cọc nối đất, mạ đồng, Ø16, dài 2.4m',
    spec: 'Cọc thép mạ đồng nguyên chất D16 dài 2.4 mét đạt chuẩn tiếp địa',
    sku: 'COC16X2M4',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Cây',
    qty: rodQty,
    unitCostVnd: rodMat.cost,
    totalCostVnd: rodMat.cost * rodQty,
    unitSellVnd: Math.round(rodMat.cost * multiplier),
    totalSellVnd: Math.round(rodMat.cost * rodQty * multiplier),
  });

  // 7. Kẹp cọc tiếp địa F16
  const clampRodMat = findMat('g-clamp-16', 45000, 'Kẹp cọc tiếp địa F16', 'Kẹp cọc đồng siết bu lông', 'Cái', 'VN');
  lines.push({
    id: 'bom-clamp-rod',
    categoryCode: 'VI',
    categoryName: 'Hệ thống phụ trợ',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Kẹp cọc tiếp địa F16',
    spec: 'Kẹp quả bàng đồng vàng liên kết cọc D16 với dây đồng trần',
    sku: 'CANACU-16',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Cái',
    qty: rodQty,
    unitCostVnd: clampRodMat.cost,
    totalCostVnd: clampRodMat.cost * rodQty,
    unitSellVnd: Math.round(clampRodMat.cost * multiplier),
    totalSellVnd: Math.round(clampRodMat.cost * rodQty * multiplier),
  });

  // 8. Máng gen luồn dây điện: 40x60mm, dài 2m
  const trunkingQty = Math.max(8, Math.ceil(acRouteLen / 2));
  const trunkingMat = findMat('t-trunking-40x60', 65000, 'Máng gen luồn dây điện: 40x60mm, dài 2m', 'Gen nhựa 40x60', 'Thanh', 'VN');
  lines.push({
    id: 'bom-trunking',
    categoryCode: 'V',
    categoryName: 'Hệ thống máng cáp',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Máng gen luồn dây điện: 40x60mm, dài 2m',
    spec: 'Nẹp máng gen luồn dây điện PVC chống cháy 40x60mm cây 2 mét',
    sku: 'GA60/02',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Thanh',
    qty: trunkingQty,
    unitCostVnd: trunkingMat.cost,
    totalCostVnd: trunkingMat.cost * trunkingQty,
    unitSellVnd: Math.round(trunkingMat.cost * multiplier),
    totalSellVnd: Math.round(trunkingMat.cost * trunkingQty * multiplier),
  });

  // 9. Co vuông ống điện Ø25
  const elbowMat = findMat('t-conduit-elbow-25', 8000, 'Co vuông ống điện Ø25', 'Co vuông PVC D25', 'Cái', 'VN');
  lines.push({
    id: 'bom-elbow-25',
    categoryCode: 'V',
    categoryName: 'Hệ thống máng cáp',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Co vuông ống điện Ø25',
    spec: 'Phụ kiện co vuông nối góc ống luồn PVC D25',
    sku: 'COVUONGNOIONGP25',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Cái',
    qty: 6,
    unitCostVnd: elbowMat.cost,
    totalCostVnd: elbowMat.cost * 6,
    unitSellVnd: Math.round(elbowMat.cost * multiplier),
    totalSellVnd: Math.round(elbowMat.cost * 6 * multiplier),
  });

  // 10. Nối thẳng ống điện Ø25
  const couplerMat = findMat('t-conduit-coupler-25', 5000, 'Nối thẳng ống điện Ø25', 'Nối thẳng PVC D25', 'Cái', 'VN');
  lines.push({
    id: 'bom-coupler-25',
    categoryCode: 'V',
    categoryName: 'Hệ thống máng cáp',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Nối thẳng ống điện Ø25',
    spec: 'Khớp nối thẳng măng sông ống luồn PVC D25',
    sku: 'NOIONGP25',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Cái',
    qty: 10,
    unitCostVnd: couplerMat.cost,
    totalCostVnd: couplerMat.cost * 10,
    unitSellVnd: Math.round(couplerMat.cost * multiplier),
    totalSellVnd: Math.round(couplerMat.cost * 10 * multiplier),
  });

  // 11. Kẹp ống điện nhựa Ø25
  const clampPipeMat = findMat('t-conduit-clamp-25', 4000, 'Kẹp ống điện nhựa Ø25', 'Cùm kẹp ống PVC D25', 'Cái', 'VN');
  lines.push({
    id: 'bom-clamp-pipe-25',
    categoryCode: 'V',
    categoryName: 'Hệ thống máng cáp',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Kẹp ống điện nhựa Ø25',
    spec: 'Cùm kẹp gắn tường giữ ống điện PVC D25',
    sku: 'CUM-27 / KEPONG25',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Cái',
    qty: 25,
    unitCostVnd: clampPipeMat.cost,
    totalCostVnd: clampPipeMat.cost * 25,
    unitSellVnd: Math.round(clampPipeMat.cost * multiplier),
    totalSellVnd: Math.round(clampPipeMat.cost * 25 * multiplier),
  });

  // 12. Ống điện nhựa trắng Ø25
  const pipeMat = findMat('t-conduit-pipe-25', 35000, 'Ống điện nhựa trắng Ø25', 'Ống cứng PVC D25', 'Cái', 'VN');
  lines.push({
    id: 'bom-pipe-25',
    categoryCode: 'V',
    categoryName: 'Hệ thống máng cáp',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Ống điện nhựa trắng Ø25',
    spec: 'Ống luồn dây điện PVC chống cháy D25 cây 2.92m',
    sku: 'ONGP25TRANG',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Cái',
    qty: 15,
    unitCostVnd: pipeMat.cost,
    totalCostVnd: pipeMat.cost * 15,
    unitSellVnd: Math.round(pipeMat.cost * multiplier),
    totalSellVnd: Math.round(pipeMat.cost * 15 * multiplier),
  });

  // 13. Tắc kê nhựa
  const wallPlugMat = findMat('t-wall-plug-8', 25000, 'Tắc kê nhựa', 'Bịch nở nhựa số 8', 'Bịch', 'VN');
  lines.push({
    id: 'bom-wall-plug',
    categoryCode: 'V',
    categoryName: 'Hệ thống máng cáp',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Tắc kê nhựa',
    spec: 'Tắc kê nở nhựa số 8 (bịch 100 cái)',
    sku: 'TACKE-NH-8',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Bịch',
    qty: 1,
    unitCostVnd: wallPlugMat.cost,
    totalCostVnd: wallPlugMat.cost,
    unitSellVnd: Math.round(wallPlugMat.cost * multiplier),
    totalSellVnd: Math.round(wallPlugMat.cost * multiplier),
  });

  // 14. Vít bắt tắc kê
  const screwMat = findMat('t-screw-8', 45000, 'Vít bắt tắc kê', 'Vít mạ kẽm bắt tắc kê', 'Bịch', 'VN');
  lines.push({
    id: 'bom-screw-8',
    categoryCode: 'V',
    categoryName: 'Hệ thống máng cáp',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Vít bắt tắc kê',
    spec: 'Vít tự khoan/bắt tắc kê số 8 (bịch 100 con)',
    sku: 'VITTACKE-NH-8',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Bịch',
    qty: 1,
    unitCostVnd: screwMat.cost,
    totalCostVnd: screwMat.cost,
    unitSellVnd: Math.round(screwMat.cost * multiplier),
    totalSellVnd: Math.round(screwMat.cost * multiplier),
  });

  // 15. Dây gút nhựa 400mm
  const cableTieMat = findMat('t-cable-tie-400', 65000, 'Dây gút nhựa 400mm', 'Dây thít đen chống UV 400mm', 'Bịch', 'VN');
  lines.push({
    id: 'bom-cable-tie',
    categoryCode: 'V',
    categoryName: 'Hệ thống máng cáp',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Dây gút nhựa 400mm',
    spec: 'Dây rút nhựa đen ngoài trời chống tia cực tím UV 400mm (bịch 100 sợi)',
    sku: 'TH8X400',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Bịch',
    qty: 1,
    unitCostVnd: cableTieMat.cost,
    totalCostVnd: cableTieMat.cost,
    unitSellVnd: Math.round(cableTieMat.cost * multiplier),
    totalSellVnd: Math.round(cableTieMat.cost * multiplier),
  });

  // 16. Ống ruột gà lõi thép bọc nhựa Φ34
  const flexConduitMat = findMat('t-flex-conduit-34', 58000, 'Ống ruột gà lõi thép bọc nhựa Φ34', 'Ống ruột gà CVL D34', 'Mét', 'CVL');
  lines.push({
    id: 'bom-flex-conduit-34',
    categoryCode: 'V',
    categoryName: 'Hệ thống máng cáp',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Ống ruột gà lõi thép bọc nhựa Φ34',
    spec: 'Ống mềm ruột gà lõi thép bọc nhựa PVC chống thấm nước IP67 CVL',
    sku: 'OMB34VCL',
    brand: 'CVL',
    origin: 'Việt Nam',
    unit: 'Mét',
    qty: 12,
    unitCostVnd: flexConduitMat.cost,
    totalCostVnd: flexConduitMat.cost * 12,
    unitSellVnd: Math.round(flexConduitMat.cost * multiplier),
    totalSellVnd: Math.round(flexConduitMat.cost * 12 * multiplier),
  });

  // 17. Đầu nối ống ruột gà lõi thép bọc nhựa Φ34
  const flexConnMat = findMat('t-flex-connector-34', 28000, 'Đầu nối ống ruột gà lõi thép bọc nhựa Φ34', 'Đầu nối ren D34', 'Cái', 'CVL');
  lines.push({
    id: 'bom-flex-conn-34',
    categoryCode: 'V',
    categoryName: 'Hệ thống máng cáp',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Đầu nối ống ruột gà lõi thép bọc nhựa Φ34',
    spec: 'Đầu nối ren liên kết ống ruột gà D34 vào tủ điện/inverter',
    sku: 'DNCK34',
    brand: 'CVL',
    origin: 'Việt Nam',
    unit: 'Cái',
    qty: 4,
    unitCostVnd: flexConnMat.cost,
    totalCostVnd: flexConnMat.cost * 4,
    unitSellVnd: Math.round(flexConnMat.cost * multiplier),
    totalSellVnd: Math.round(flexConnMat.cost * 4 * multiplier),
  });

  // 18. Đầu bịt ống ruột gà lõi thép bọc nhựa Φ34
  const flexCapMat = findMat('t-flex-cap-34', 18000, 'Đầu bịt ống ruột gà lõi thép bọc nhựa Φ34', 'Đầu bịt bảo vệ cáp D34', 'Cái', 'CVL');
  lines.push({
    id: 'bom-flex-cap-34',
    categoryCode: 'V',
    categoryName: 'Hệ thống máng cáp',
    hgcSectionCode: 'C',
    hgcSubsection: 'THIẾT BỊ NGOẠI VI',
    name: 'Đầu bịt ống ruột gà lõi thép bọc nhựa Φ34',
    spec: 'Đầu bịt chống sờn rách vỏ cáp tại mép cắt ống ruột gà',
    sku: 'AMF34',
    brand: 'CVL',
    origin: 'Việt Nam',
    unit: 'Cái',
    qty: 4,
    unitCostVnd: flexCapMat.cost,
    totalCostVnd: flexCapMat.cost * 4,
    unitSellVnd: Math.round(flexCapMat.cost * multiplier),
    totalSellVnd: Math.round(flexCapMat.cost * 4 * multiplier),
  });

  // =========================================================================
  // PHẦN D: CÁC CHI PHÍ KHÁC (OTHER COSTS & SERVICES)
  // =========================================================================

  // 1. Chi phí nhân công lắp đặt
  const defaultInstallPerKwp = params.installCostVndPerKwp !== undefined ? params.installCostVndPerKwp : 550000;
  const totalInstallCost = Math.round(defaultInstallPerKwp * layout.installedKwp);
  lines.push({
    id: 'bom-labor-install',
    categoryCode: 'VIII',
    categoryName: 'Chi phí dịch vụ',
    hgcSectionCode: 'D',
    hgcSubsection: 'CÁC CHI PHÍ KHÁC',
    name: 'Chi phí nhân công lắp đặt',
    spec: `Nhân công cơ khí khung rail, lắp đặt tấm pin, đấu nối tủ điện & đóng điện trọn gói (${layout.installedKwp} kWp)`,
    sku: 'LABOR-EPC-KWP',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Hệ',
    qty: 1,
    unitCostVnd: totalInstallCost,
    totalCostVnd: totalInstallCost,
    unitSellVnd: Math.round(totalInstallCost * multiplier),
    totalSellVnd: Math.round(totalInstallCost * multiplier),
    note: 'Đội ngũ kỹ thuật chứng chỉ an toàn',
  });

  // 2. Chi phí thuê thiết bị
  const equipRentMat = findMat('s-rent-equip', 2500000, 'Chi phí thuê thiết bị', 'Xe cẩu, giàn giáo, máy đo', 'Hệ', 'VN');
  lines.push({
    id: 'bom-rent-equip',
    categoryCode: 'VIII',
    categoryName: 'Chi phí dịch vụ',
    hgcSectionCode: 'D',
    hgcSubsection: 'CÁC CHI PHÍ KHÁC',
    name: 'Chi phí thuê thiết bị',
    spec: 'Thuê thiết bị nâng hạ giàn giáo, máy đo chuyên dụng & máy cẩu kéo phục vụ thi công',
    sku: 'EQUIP-RENT-SITE',
    brand: 'VN',
    origin: 'Việt Nam',
    unit: 'Hệ',
    qty: 1,
    unitCostVnd: equipRentMat.cost,
    totalCostVnd: equipRentMat.cost,
    unitSellVnd: Math.round(equipRentMat.cost * multiplier),
    totalSellVnd: Math.round(equipRentMat.cost * multiplier),
  });

  // 3. Chi phí vận chuyển
  const includeTransport = params.includeTransport ?? true;
  if (includeTransport) {
    const transCost = params.transportCostVnd !== undefined ? params.transportCostVnd : 3500000;
    lines.push({
      id: 'bom-transport-cost',
      categoryCode: 'VIII',
      categoryName: 'Chi phí dịch vụ',
      hgcSectionCode: 'D',
      hgcSubsection: 'CÁC CHI PHÍ KHÁC',
      name: 'Chi phí vận chuyển',
      spec: 'Vận chuyển thiết bị, cẩu kéo tấm pin & vật tư đến chân công trình',
      sku: 'TRANS-CRANE-SITE',
      brand: 'VN',
      origin: 'Việt Nam',
      unit: 'Hệ',
      qty: 1,
      unitCostVnd: transCost,
      totalCostVnd: transCost,
      unitSellVnd: Math.round(transCost * multiplier),
      totalSellVnd: Math.round(transCost * multiplier),
    });
  }

  // Tùy chọn nâng cao: Thí nghiệm & Hồ sơ EVN (nếu kỹ sư bật)
  if (params.includeEvnDocs) {
    const docCost = params.evnDocsCostVnd !== undefined ? params.evnDocsCostVnd : 4500000;
    lines.push({
      id: 'bom-evn-docs',
      categoryCode: 'VIII',
      categoryName: 'Chi phí dịch vụ',
      hgcSectionCode: 'D',
      hgcSubsection: 'CÁC CHI PHÍ KHÁC',
      name: 'Thí nghiệm đo kiểm định điện & Lập hồ sơ kỹ thuật thỏa thuận EVN (Tùy chọn)',
      spec: 'Hồ sơ pháp lý nghiệm thu kỹ thuật đấu nối với Điện lực EVN',
      sku: 'SERVICE-EVN-DOCS',
      brand: 'VN',
      origin: 'Việt Nam',
      unit: 'Hệ',
      qty: 1,
      unitCostVnd: docCost,
      totalCostVnd: docCost,
      unitSellVnd: Math.round(docCost * multiplier),
      totalSellVnd: Math.round(docCost * multiplier),
    });
  }

  // Tùy chọn nâng cao: Scada Datalogger (nếu kỹ sư bật)
  if (params.includeScada) {
    const scadaCost = params.scadaCostVnd !== undefined ? params.scadaCostVnd : 3200000;
    lines.push({
      id: 'bom-scada-logger',
      categoryCode: 'X',
      categoryName: 'Hệ thống Scada',
      hgcSectionCode: 'C',
      hgcSubsection: 'THIẾT BỊ NGOẠI VI',
      name: 'Datalogger thông minh & Thiết bị truyền thông đám mây 24/7 (Tùy chọn)',
      spec: 'Cổng RS485/WiFi/4G giám sát thời gian thực qua App/Web',
      sku: 'SCADA-LOGGER-IOT',
      brand: inverter?.brand || 'VN',
      origin: 'Chính hãng',
      unit: 'Bộ',
      qty: 1,
      unitCostVnd: scadaCost,
      totalCostVnd: scadaCost,
      unitSellVnd: Math.round(scadaCost * multiplier),
      totalSellVnd: Math.round(scadaCost * multiplier),
    });
  }

  return lines;
}

/**
 * Trả về danh sách tổng hợp theo 4 Section chuẩn file 'Bảng kê vật tư mẫu.xlsx':
 *   A. THIẾT BỊ CHÍNH
 *   B. HỆ RAIL NHÔM/ GIÀN KHUNG (có 2 phân mục: Hệ Rail Nhôm & Hệ Rail Giàn Khung)
 *   C. THIẾT BỊ NGOẠI VI
 *   D. CÁC CHI PHÍ KHÁC
 */
export function getHgcSectionGroupedBom(lines: BomLine[]): HgcSectionGroup[] {
  return HGC_BOM_SECTIONS.map((sec) => {
    const secLines = lines.filter((l) => l.hgcSectionCode === sec.code);
    const subtotalCostVnd = secLines.reduce((sum, item) => sum + item.totalCostVnd, 0);
    const subtotalSellVnd = secLines.reduce((sum, item) => sum + item.totalSellVnd, 0);

    let subsections: HgcSectionGroup['subsections'] = undefined;
    if (sec.code === 'B') {
      const railItems = secLines.filter((l) => l.hgcSubsection === 'HỆ RAIL NHÔM');
      const frameItems = secLines.filter((l) => l.hgcSubsection === 'HỆ RAIL GIÀN KHUNG');
      subsections = [
        {
          title: 'HỆ RAIL NHÔM',
          items: railItems,
          subtotalCostVnd: railItems.reduce((sum, item) => sum + item.totalCostVnd, 0),
          subtotalSellVnd: railItems.reduce((sum, item) => sum + item.totalSellVnd, 0),
        },
        {
          title: 'HỆ RAIL GIÀN KHUNG',
          items: frameItems,
          subtotalCostVnd: frameItems.reduce((sum, item) => sum + item.totalCostVnd, 0),
          subtotalSellVnd: frameItems.reduce((sum, item) => sum + item.totalSellVnd, 0),
        },
      ];
    }

    return {
      section: sec,
      items: secLines,
      subsections,
      subtotalCostVnd,
      subtotalSellVnd,
    };
  });
}

/**
 * Trả về danh sách tổng hợp 8 nhóm hạng mục BOM theo chuẩn quản trị
 */
export function getStandardGroupedBom(lines: BomLine[]): Array<{
  group: (typeof STANDARD_BOM_GROUPS)[number];
  items: BomLine[];
  subtotalCostVnd: number;
  subtotalSellVnd: number;
}> {
  return STANDARD_BOM_GROUPS.map((grp) => {
    const items = lines.filter((l) => l.categoryCode === grp.code);
    const subtotalCostVnd = items.reduce((sum, item) => sum + item.totalCostVnd, 0);
    const subtotalSellVnd = items.reduce((sum, item) => sum + item.totalSellVnd, 0);
    return {
      group: grp,
      items,
      subtotalCostVnd,
      subtotalSellVnd,
    };
  });
}

/**
 * Xuất file Excel / CSV bám sát 100% bố cục và cột mẫu file 'Bảng kê vật tư mẫu.xlsx':
 * Cột: STT, TÊN THIẾT BỊ, Mã hàng, Hãng, ĐVT, Số lượng, Đơn giá (đ), Thành tiền (đ), Ghi chú
 */
export function exportHgcSampleBomCsv(
  lines: BomLine[],
  project: Project,
  viewType: 'customer' | 'internal' = 'customer'
): string {
  const sections = getHgcSectionGroupedBom(lines);
  const headers = [
    'STT',
    'TÊN THIẾT BỊ',
    'Mã hàng',
    'Hãng',
    'ĐVT',
    'Số lượng',
    ...(viewType === 'internal' ? ['Giá vốn (đ)', 'Tổng vốn (đ)'] : []),
    'Đơn giá (đ)',
    'Thành tiền (đ)',
    'Ghi chú',
  ];

  const csvRows: string[] = [];
  csvRows.push(headers.join(','));

  sections.forEach((secGroup) => {
    // Dòng Header Nhóm lớn A, B, C, D
    csvRows.push([
      `"${secGroup.section.code}"`,
      `"${secGroup.section.name}"`,
      '""',
      '""',
      '""',
      '""',
      ...(viewType === 'internal' ? ['""', `"${secGroup.subtotalCostVnd}"`] : []),
      '""',
      `"${secGroup.subtotalSellVnd}"`,
      '""',
    ].join(','));

    if (secGroup.subsections) {
      secGroup.subsections.forEach((sub) => {
        // Dòng Tiêu đề phân mục (vd: HỆ RAIL NHÔM, HỆ RAIL GIÀN KHUNG)
        csvRows.push([
          '""',
          `"${sub.title}"`,
          '""',
          '""',
          '""',
          '""',
          ...(viewType === 'internal' ? ['""', `"${sub.subtotalCostVnd}"`] : []),
          '""',
          `"${sub.subtotalSellVnd}"`,
          '""',
        ].join(','));

        sub.items.forEach((item, idx) => {
          csvRows.push([
            idx + 1,
            `"${item.name.replace(/"/g, '""')}"`,
            `"${(item.sku || '').replace(/"/g, '""')}"`,
            `"${(item.brand || 'VN').replace(/"/g, '""')}"`,
            `"${item.unit}"`,
            item.qty,
            ...(viewType === 'internal' ? [item.unitCostVnd, item.totalCostVnd] : []),
            item.unitSellVnd,
            item.totalSellVnd,
            `"${(item.note || '').replace(/"/g, '""')}"`,
          ].join(','));
        });
      });
    } else {
      secGroup.items.forEach((item, idx) => {
        csvRows.push([
          idx + 1,
          `"${item.name.replace(/"/g, '""')}"`,
          `"${(item.sku || '').replace(/"/g, '""')}"`,
          `"${(item.brand || 'VN').replace(/"/g, '""')}"`,
          `"${item.unit}"`,
          item.qty,
          ...(viewType === 'internal' ? [item.unitCostVnd, item.totalCostVnd] : []),
          item.unitSellVnd,
          item.totalSellVnd,
          `"${(item.note || '').replace(/"/g, '""')}"`,
        ].join(','));
      });
    }
  });

  const grandSell = lines.reduce((s, l) => s + l.totalSellVnd, 0);
  const grandCost = lines.reduce((s, l) => s + l.totalCostVnd, 0);
  const vatSell = Math.round(grandSell * 0.1);
  const totalWithVat = grandSell + vatSell;

  csvRows.push('');
  csvRows.push([
    '""',
    '"TỔNG CỘNG CHƯA VAT:"',
    '""',
    '""',
    '""',
    '""',
    ...(viewType === 'internal' ? ['""', `"${grandCost}"`] : []),
    '""',
    `"${grandSell}"`,
    '""',
  ].join(','));
  csvRows.push([
    '""',
    '"THUẾ VAT (10%):"',
    '""',
    '""',
    '""',
    '""',
    ...(viewType === 'internal' ? ['""', '""'] : []),
    '""',
    `"${vatSell}"`,
    '""',
  ].join(','));
  csvRows.push([
    '""',
    '"TỔNG CỘNG THANH TOÁN (ĐÃ GỒM VAT):"',
    '""',
    '""',
    '""',
    '""',
    ...(viewType === 'internal' ? ['""', '""'] : []),
    '""',
    `"${totalWithVat}"`,
    '""',
  ].join(','));

  return '\ufeff' + csvRows.join('\r\n');
}

/**
 * Xuất bảng Checklist Khảo Sát Hiện Trường theo chuẩn sheet 'CHECKLIST' trong 'Bảng kê vật tư mẫu.xlsx'
 */
export function exportSurveyChecklistCsv(project: Project): string {
  const checklist = project.surveyChecklist && project.surveyChecklist.length > 0
    ? project.surveyChecklist
    : DEFAULT_SURVEY_CHECKLIST;

  const headers = ['STT', 'Hạng Mục Khảo Sát', 'Thông Tin / Tiêu Chuẩn Thu Thập', 'Ghi Chú / Hiện Trạng Thực Tế'];
  const rows: string[] = [];

  let currentCategory = '';
  checklist.forEach((item, idx) => {
    if (item.category !== currentCategory) {
      currentCategory = item.category;
      rows.push(['""', `"${currentCategory.toUpperCase()}"`, '""', '""'].join(','));
    }
    rows.push([
      idx + 1,
      `"${item.category}"`,
      `"${item.item.replace(/"/g, '""')}"`,
      `"${(item.note || '').replace(/"/g, '""')}"`,
    ].join(','));
  });

  return '\ufeff' + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Xuất file Excel / CSV theo chuẩn mẫu BOM ERP của công ty
 */
export function exportErpBomCsv(lines: BomLine[], projectName: string): string {
  const headers = [
    'Loại (*)',
    'Có tính doanh thu',
    'Nhóm hàng cha',
    'Nhóm hàng con',
    'STT*',
    'Mã hàng cha',
    'Mã hàng*',
    'Tên hàng*',
    'Model',
    'Thương hiệu*',
    'Xuất xứ*',
    'Thông số kỹ thuật',
    'Ghi chú',
    'ĐVT*',
    'Số lượng*',
    'Đơn giá (đ)',
    'Thành tiền (đ)',
  ];

  const rows = lines.map((item, idx) => {
    const isService = item.categoryCode === 'VIII';
    const typeLabel = isService ? 'Dịch vụ' : 'Hàng hóa';
    const groupName = `${item.categoryCode} - ${item.categoryName}`;

    return [
      `"${typeLabel}"`,
      '"Có"',
      `"${groupName}"`,
      `"${item.name}"`,
      idx + 1,
      `"${item.categoryCode}"`,
      `"${item.sku}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.spec.replace(/"/g, '""')}"`,
      `"${item.brand || 'VN'}"`,
      `"${item.origin || 'Việt Nam'}"`,
      `"${item.spec.replace(/"/g, '""')}"`,
      `"${(item.note || '').replace(/"/g, '""')}"`,
      `"${item.unit}"`,
      item.qty,
      item.unitSellVnd,
      item.totalSellVnd,
    ].join(',');
  });

  return '\ufeff' + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Xuất file Excel / CSV Bảng Dự Toán Báo Giá Tổng Hợp Theo 8 Nhóm Hạng Mục
 */
export function exportSummaryQuotationCsv(
  lines: BomLine[],
  projectName: string,
  installedKwp: number,
  financial: any
): string {
  const standardGroups = getStandardGroupedBom(lines);
  const headers = [
    'STT',
    'Tên Hạng Mục Đầu Tư',
    'Quy Cách / Thành Phần Chính',
    'ĐVT',
    'Số Lượng',
    'Đơn Giá (đ)',
    'Thành Tiền (đ)',
  ];

  const rows = standardGroups.map((g) => {
    return [
      `"${g.group.code}"`,
      `"${g.group.name}"`,
      `"${g.group.description.replace(/"/g, '""')}"`,
      '"Lot"',
      1,
      g.subtotalSellVnd,
      g.subtotalSellVnd,
    ].join(',');
  });

  const ratePreVat = financial?.investmentRatePreVatVndPerKwp || Math.round((financial?.capexSellVnd || 0) / (installedKwp || 1));
  const ratePostVat = financial?.investmentRatePostVatVndPerKwp || Math.round((financial?.grandTotalVnd || 0) / (installedKwp || 1));

  const summaryRows = [
    '',
    `"TỈ SUẤT ĐẦU TƯ (CHƯA VAT) / kWp:","${ratePreVat.toLocaleString('vi-VN')} Vnđ / kWp"`,
    `"TỈ SUẤT ĐẦU TƯ TRỌN GÓI (ĐÃ GỒM VAT 10%) / kWp:","${ratePostVat.toLocaleString('vi-VN')} Vnđ / kWp"`,
    '',
    `"Tổng cộng (chưa VAT):","${(financial?.capexSellVnd || 0).toLocaleString('vi-VN')} đ"`,
    `"Thuế VAT (10%):","${(financial?.vatVnd || 0).toLocaleString('vi-VN')} đ"`,
    `"Tổng Cộng Thanh Toán:","${(financial?.grandTotalVnd || 0).toLocaleString('vi-VN')} đ"`,
    '',
    `"* Ghi chú: Báo giá đã bao gồm toàn bộ thiết bị chính hãng, phụ kiện mounting nhôm Anodized Al6005-T5, cáp điện Cadivi, tủ điện bám tải Zero-Export, nhân công lắp đặt và hồ sơ thỏa thuận Điện lực EVN."`,
  ];

  return '\ufeff' + [headers.join(','), ...rows, ...summaryRows].join('\r\n');
}
