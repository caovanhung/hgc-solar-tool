import {
  PanelModel,
  InverterModel,
  LayoutResult,
  MountingResult,
  CableResult,
  DistributionBoardResult,
  BomLine,
  MaterialItem,
  MaterialCategoryCode,
  STANDARD_BOM_GROUPS,
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
  } = params;

  const lines: BomLine[] = [];
  const multiplier = 1 + marginPct / 100;

  const findMat = (id: string, fallbackCost: number, fallbackName?: string, fallbackSpec?: string) => {
    const found = materialsCatalog.find((m) => m.id === id);
    return {
      cost: found ? found.costVnd : fallbackCost,
      name: found ? found.name : fallbackName || '',
      spec: found ? found.spec : fallbackSpec || '',
      sku: found ? found.sku : id.toUpperCase(),
      unit: found ? found.unit : 'cái',
    };
  };

  // =========================================================================
  // NHÓM I - VẬT TƯ CHÍNH (Tấm Pin & Inverter)
  // =========================================================================
  const panelCost = panel.priceHintVnd;
  lines.push({
    id: 'bom-panel',
    categoryCode: 'I',
    categoryName: 'Vật tư chính',
    name: `Tấm pin năng lượng mặt trời ${panel.brand} ${panel.model}`,
    spec: `${panel.wp}Wp, Voc=${panel.voc}V, Vmpp=${panel.vmpp}V, ${panel.tech}`,
    sku: `PV-${panel.brand.slice(0, 3).toUpperCase()}-${panel.wp}W`,
    unit: 'tấm',
    qty: layout.panelQty,
    unitCostVnd: panelCost,
    totalCostVnd: panelCost * layout.panelQty,
    unitSellVnd: Math.round(panelCost * multiplier),
    totalSellVnd: Math.round(panelCost * layout.panelQty * multiplier),
    brand: panel.brand,
    origin: 'Chính hãng',
    note: `Bảo hành hiệu suất ${panel.warrantyYears} năm`,
  });

  if (inverter) {
    const invCost = inverter.priceHintVnd;
    lines.push({
      id: 'bom-inverter',
      categoryCode: 'I',
      categoryName: 'Vật tư chính',
      name: `Biến tần hòa lưới ${inverter.brand} ${inverter.model}`,
      spec: `Công suất AC ${inverter.acKw}kW, ${inverter.phases === '3' ? '3 Pha 380V' : '1 Pha 220V'}, ${inverter.mpptCount} MPPT`,
      sku: `INV-${inverter.brand.slice(0, 3).toUpperCase()}-${inverter.acKw}K`,
      unit: 'bộ',
      qty: inverterQty,
      unitCostVnd: invCost,
      totalCostVnd: invCost * inverterQty,
      unitSellVnd: Math.round(invCost * multiplier),
      totalSellVnd: Math.round(invCost * inverterQty * multiplier),
      brand: inverter.brand,
      origin: 'Chính hãng',
      note: 'Bảo hành tiêu chuẩn 5 năm chính hãng',
    });
  }

  // =========================================================================
  // NHÓM II - HỆ BÁM TẢI (Smart Meter & CT Zero-Export)
  // =========================================================================
  const meterMat = findMat('b-meter', 6800000);
  lines.push({
    id: 'bom-meter',
    categoryCode: 'II',
    categoryName: 'Hệ bám tải',
    name: 'Bộ Smart Meter & CT Zero-Export chống phát ngược lưới',
    spec: 'Đo lường 3 pha / 1 pha, truyền thông RS485 Modbus RTU',
    sku: meterMat.sku,
    unit: 'bộ',
    qty: 1,
    unitCostVnd: meterMat.cost,
    totalCostVnd: meterMat.cost,
    unitSellVnd: Math.round(meterMat.cost * multiplier),
    totalSellVnd: Math.round(meterMat.cost * multiplier),
    brand: 'Chint / Acrel / Huawei',
    origin: 'Chính hãng',
    note: 'Đáp ứng quy định Zero-Export bám tải tức thời',
  });

  const ctMat = findMat('b-ct-sensor', 1800000);
  lines.push({
    id: 'bom-ct-sensor',
    categoryCode: 'II',
    categoryName: 'Hệ bám tải',
    name: 'Biến dòng đo lường CT lõi hở (Current Transformer)',
    spec: 'Dải đo 100A - 600A/5A, độ chính xác Class 0.5',
    sku: ctMat.sku,
    unit: 'bộ',
    qty: 1,
    unitCostVnd: ctMat.cost,
    totalCostVnd: ctMat.cost,
    unitSellVnd: Math.round(ctMat.cost * multiplier),
    totalSellVnd: Math.round(ctMat.cost * multiplier),
    brand: 'Chint / Acrel',
    origin: 'Chính hãng',
    note: 'Bộ 3 biến dòng cho 3 pha',
  });

  // =========================================================================
  // NHÓM IV - HỆ THỐNG ĐIỆN (Tủ AC, Cáp AC, Cáp DC, MC4)
  // =========================================================================
  const cabinetMat = findMat('e-db-cabinet', 12500000);
  lines.push({
    id: 'bom-db-cabinet',
    categoryCode: 'IV',
    categoryName: 'Hệ thống điện',
    name: 'Tủ điện Solar tổng AC ngoài trời IP65 sơn tĩnh điện',
    spec: `MCCB ${params.board.mccbRatedA}A + SPD Chống sét Type 2 (40kA) + Đèn báo pha, đồng hồ Volt/Ampe`,
    sku: cabinetMat.sku,
    unit: 'tủ',
    qty: 1,
    unitCostVnd: cabinetMat.cost,
    totalCostVnd: cabinetMat.cost,
    unitSellVnd: Math.round(cabinetMat.cost * multiplier),
    totalSellVnd: Math.round(cabinetMat.cost * multiplier),
    brand: 'ETEK / HGC Tech',
    origin: 'Việt Nam',
    note: 'Tiêu chuẩn IEC 61439-1',
  });

  const dcCable = cables.find((c) => c.cableType === 'DC_SOLAR');
  const dcLen = dcCable ? dcCable.lengthM * 2 : Math.max(100, layout.panelQty * 4);
  const dcMat = findMat('e-dc-cable', 16500);
  lines.push({
    id: 'bom-dc-cable',
    categoryCode: 'IV',
    categoryName: 'Hệ thống điện',
    name: `Cáp điện DC chuyên dụng Solar PV 1x${dcCable ? dcCable.standardCsaMm2 : 4}.0mm²`,
    spec: '1500V DC, đồng mạ thiếc, vỏ cách điện kép XLPO chống tia UV & chịu nhiệt 120°C',
    sku: dcMat.sku,
    unit: 'm',
    qty: dcLen,
    unitCostVnd: dcMat.cost,
    totalCostVnd: dcMat.cost * dcLen,
    unitSellVnd: Math.round(dcMat.cost * multiplier),
    totalSellVnd: Math.round(dcMat.cost * dcLen * multiplier),
    brand: 'Cadivi / Leader',
    origin: 'Việt Nam',
    note: 'Tuyến cáp DC từ string về Inverter',
  });

  const acCable = cables.find((c) => c.cableType === 'LV_MAIN');
  const acLen = acCable ? acCable.lengthM : 35;
  const acMat = findMat('e-ac-cable', 125000);
  lines.push({
    id: 'bom-ac-cable',
    categoryCode: 'IV',
    categoryName: 'Hệ thống điện',
    name: `Cáp điện hạ thế AC Cu/XLPE/PVC ${acCable ? acCable.standardCsaMm2 : 16}mm² Cadivi`,
    spec: '0.6/1kV, ruột đồng tinh chất, cách điện XLPE, vỏ bọc PVC bảo vệ',
    sku: acMat.sku,
    unit: 'm',
    qty: acLen,
    unitCostVnd: acMat.cost,
    totalCostVnd: acMat.cost * acLen,
    unitSellVnd: Math.round(acMat.cost * multiplier),
    totalSellVnd: Math.round(acMat.cost * acLen * multiplier),
    brand: 'Cadivi',
    origin: 'Việt Nam',
    note: 'Tuyến cáp AC tổng từ Inverter về tủ điện công trình',
  });

  const mc4Mat = findMat('e-mc4', 25000);
  const mc4Qty = Math.max(8, Math.ceil(layout.panelQty / 4) * 2);
  lines.push({
    id: 'bom-mc4',
    categoryCode: 'IV',
    categoryName: 'Hệ thống điện',
    name: 'Đầu nối giắc MC4 1500V DC chống nước IP68 (Cặp Đực/Cái)',
    spec: 'Chân đồng mạ bạc dẫn điện cao, chịu dòng 30A liên tục',
    sku: mc4Mat.sku,
    unit: 'cặp',
    qty: mc4Qty,
    unitCostVnd: mc4Mat.cost,
    totalCostVnd: mc4Mat.cost * mc4Qty,
    unitSellVnd: Math.round(mc4Mat.cost * multiplier),
    totalSellVnd: Math.round(mc4Mat.cost * mc4Qty * multiplier),
    brand: 'Staubli / Amphenol',
    origin: 'Thụy Sĩ / Đức',
    note: 'Bấm cos và đấu nối chuỗi chuỗi string',
  });

  // Đối với hệ thống Hybrid ESS: Bổ sung bộ ATS chuyển nguồn tự động & cáp động lực Battery theo chuẩn HGC
  if (params.sysType === 'hybrid') {
    const atsMat = findMat('e-ats-63a', 2200000);
    lines.push({
      id: 'bom-ats-switch',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'Bộ chuyển đổi nguồn tự động ATS (Lưới & Cổng Back-up EPS)',
      spec: params.phases === '3' ? 'ATS 4P 100A chuyển mạch phụ tải ưu tiên' : 'ATS 2P 63A chuyển mạch tức thời khi mất điện lưới',
      sku: atsMat.sku,
      unit: 'bộ',
      qty: 1,
      unitCostVnd: atsMat.cost,
      totalCostVnd: atsMat.cost,
      unitSellVnd: Math.round(atsMat.cost * multiplier),
      totalSellVnd: Math.round(atsMat.cost * multiplier),
      brand: 'Chint / Schneider',
      origin: 'Trung Quốc / Pháp',
      note: 'Tự động chuyển nguồn phụ tải ưu tiên khi mất lưới EVN',
    });

    const batCableMat = findMat('e-bat-cable', 180000);
    const batCableLen = 6; // 6m cặp đỏ/đen
    lines.push({
      id: 'bom-bat-cable',
      categoryCode: 'IV',
      categoryName: 'Hệ thống điện',
      name: 'Cáp mềm chuyên dụng động lực Battery Lithium (35 - 50 mm²)',
      spec: 'Ruột đồng mềm mạ thiếc, chịu dòng sạc xả lớn 150A - 200A ở 51.2V',
      sku: batCableMat.sku,
      unit: 'm',
      qty: batCableLen,
      unitCostVnd: batCableMat.cost,
      totalCostVnd: batCableMat.cost * batCableLen,
      unitSellVnd: Math.round(batCableMat.cost * multiplier),
      totalSellVnd: Math.round(batCableMat.cost * batCableLen * multiplier),
      brand: 'Cadivi / Leader',
      origin: 'Việt Nam',
      note: 'Kết nối an toàn khối Pin lưu trữ Lithium với Inverter Hybrid',
    });
  }

  // =========================================================================
  // NHÓM V - HỆ THỐNG MÁNG CÁP (Máng Trunking, Phụ kiện, Ống HDPE)
  // =========================================================================
  const trayMat = findMat('t-tray', 145000);
  const trayLen = Math.max(15, Math.round(acLen * 0.8));
  lines.push({
    id: 'bom-tray',
    categoryCode: 'V',
    categoryName: 'Hệ thống máng cáp',
    name: 'Máng cáp trunking đục lỗ tôn mạ kẽm nhúng nóng / sơn tĩnh điện',
    spec: 'Kích thước 100x50mm hoặc 150x100mm, dày 1.5mm, kèm nắp đậy',
    sku: trayMat.sku,
    unit: 'm',
    qty: trayLen,
    unitCostVnd: trayMat.cost,
    totalCostVnd: trayMat.cost * trayLen,
    unitSellVnd: Math.round(trayMat.cost * multiplier),
    totalSellVnd: Math.round(trayMat.cost * trayLen * multiplier),
    brand: 'HGC Industrial',
    origin: 'Việt Nam',
    note: 'Tiêu chuẩn bảo vệ cáp điện IEC 61537',
  });

  const hdpeMat = findMat('t-hdpe', 28000);
  const hdpeLen = Math.max(10, Math.round(acLen * 0.5));
  lines.push({
    id: 'bom-hdpe',
    categoryCode: 'V',
    categoryName: 'Hệ thống máng cáp',
    name: 'Ống luồn gân xoắn chịu lực HDPE D65/50 luồn cáp ngầm',
    spec: 'Chống va đập, chịu nén chôn ngầm theo TCVN 8699',
    sku: hdpeMat.sku,
    unit: 'm',
    qty: hdpeLen,
    unitCostVnd: hdpeMat.cost,
    totalCostVnd: hdpeMat.cost * hdpeLen,
    unitSellVnd: Math.round(hdpeMat.cost * multiplier),
    totalSellVnd: Math.round(hdpeMat.cost * hdpeLen * multiplier),
    brand: 'Ba An / Tiền Phong',
    origin: 'Việt Nam',
    note: 'Bảo vệ cáp các đoạn đi ngầm dưới đất',
  });

  // =========================================================================
  // NHÓM VI - HỆ THỐNG PHỤ TRỢ (Tiếp địa, Chống sét, Hóa chất GEM)
  // =========================================================================
  const earthRodMat = findMat('g-copper-rod', 280000);
  const rodQty = Math.max(3, Math.ceil(layout.installedKwp / 30) * 2);
  lines.push({
    id: 'bom-earth-rod',
    categoryCode: 'VI',
    categoryName: 'Hệ thống phụ trợ',
    name: 'Cọc tiếp địa đồng nguyên chất / thép mạ đồng D16 L=2.4m',
    spec: 'Đường kính 16mm, dài 2.4 mét đạt chuẩn chống sét tiếp địa',
    sku: earthRodMat.sku,
    unit: 'cây',
    qty: rodQty,
    unitCostVnd: earthRodMat.cost,
    totalCostVnd: earthRodMat.cost * rodQty,
    unitSellVnd: Math.round(earthRodMat.cost * multiplier),
    totalSellVnd: Math.round(earthRodMat.cost * rodQty * multiplier),
    brand: 'Ramratna / Việt Nam',
    origin: 'Ấn Độ / Việt Nam',
    note: 'Đóng bãi cọc đạt R đất < 4 Ohm',
  });

  const bareCuMat = findMat('g-cable-bare', 115000);
  const bareCuLen = rodQty * 5 + 15;
  lines.push({
    id: 'bom-bare-cu',
    categoryCode: 'VI',
    categoryName: 'Hệ thống phụ trợ',
    name: 'Dây đồng trần tiếp địa an toàn M25 / M50 (Cadivi)',
    spec: 'Đồng đỏ 99.99%, liên kết bãi cọc và khung giàn tấm pin',
    sku: bareCuMat.sku,
    unit: 'm',
    qty: bareCuLen,
    unitCostVnd: bareCuMat.cost,
    totalCostVnd: bareCuMat.cost * bareCuLen,
    unitSellVnd: Math.round(bareCuMat.cost * multiplier),
    totalSellVnd: Math.round(bareCuMat.cost * bareCuLen * multiplier),
    brand: 'Cadivi',
    origin: 'Việt Nam',
    note: 'Hệ thống đẳng thế tiếp địa khung giàn',
  });

  const gemMat = findMat('g-gem-cadweld', 3500000);
  lines.push({
    id: 'bom-gem',
    categoryCode: 'VI',
    categoryName: 'Hệ thống phụ trợ',
    name: 'Thuốc hàn hóa nhiệt Cadweld & Hóa chất giảm điện trở đất GEM',
    spec: 'Giảm điện trở suất của đất, chống ăn mòn điện cực tiếp địa',
    sku: gemMat.sku,
    unit: 'gói',
    qty: 1,
    unitCostVnd: gemMat.cost,
    totalCostVnd: gemMat.cost,
    unitSellVnd: Math.round(gemMat.cost * multiplier),
    totalSellVnd: Math.round(gemMat.cost * multiplier),
    brand: 'Erico / San Earth',
    origin: 'Mỹ / Nhật Bản',
    note: 'Xử lý bãi cọc tiếp địa an toàn',
  });

  const groundLugMat = findMat('g-ground-lug', 15000);
  const groundLugQty = Math.max(mounting.groundingLugQty, layout.panelQty * 2);
  lines.push({
    id: 'bom-ground-lug',
    categoryCode: 'VI',
    categoryName: 'Hệ thống phụ trợ',
    name: 'Kẹp tiếp địa & Lá tiếp địa Inox 304 liên kết khung nhôm pin',
    spec: 'Thép không gỉ 304, xuyên thủng lớp nhôm Anode tạo liên kết đẳng thế ngăn ngừa tích điện',
    sku: groundLugMat.sku,
    unit: 'bộ',
    qty: groundLugQty,
    unitCostVnd: groundLugMat.cost,
    totalCostVnd: groundLugMat.cost * groundLugQty,
    unitSellVnd: Math.round(groundLugMat.cost * multiplier),
    totalSellVnd: Math.round(groundLugMat.cost * groundLugQty * multiplier),
    brand: 'HGC Mounting',
    origin: 'Việt Nam',
    note: 'Liên kết đẳng thế bảo vệ an toàn giàn pin',
  });

  // =========================================================================
  // NHÓM VII - HẠNG MỤC XÂY DỰNG & MOUNTING (Khung ray nhôm, Kẹp cơ khí)
  // =========================================================================
  const railMat = findMat('m-rail', 85000);
  lines.push({
    id: 'bom-m-rail',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    name: 'Thanh rail nhôm Anodized Al6005-T5 chuyên dụng NLMT',
    spec: 'Kích thước 28x50mm, dài 4.2m, kháng ăn mòn muối biển',
    sku: railMat.sku,
    unit: 'm',
    qty: Math.ceil(mounting.railLengthM),
    unitCostVnd: railMat.cost,
    totalCostVnd: railMat.cost * Math.ceil(mounting.railLengthM),
    unitSellVnd: Math.round(railMat.cost * multiplier),
    totalSellVnd: Math.round(railMat.cost * Math.ceil(mounting.railLengthM) * multiplier),
    brand: 'HGC Solar Mounting',
    origin: 'Việt Nam',
    note: 'Chịu tải gió cấp 12, bảo hành 12 năm',
  });

  const midMat = findMat('m-cl-mid', 12000);
  lines.push({
    id: 'bom-m-mid',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    name: 'Kẹp giữa (Mid Clamp) nhôm đúc nguyên khối kèm bulong Inox 304',
    spec: 'Phù hợp pin năng lượng mặt trời dày 30/35mm',
    sku: midMat.sku,
    unit: 'bộ',
    qty: mounting.midClampQty,
    unitCostVnd: midMat.cost,
    totalCostVnd: midMat.cost * mounting.midClampQty,
    unitSellVnd: Math.round(midMat.cost * multiplier),
    totalSellVnd: Math.round(midMat.cost * mounting.midClampQty * multiplier),
    brand: 'HGC Mounting',
    origin: 'Việt Nam',
  });

  const endMat = findMat('m-cl-end', 12000);
  lines.push({
    id: 'bom-m-end',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    name: 'Kẹp biên (End Clamp) nhôm đúc nguyên khối kèm bulong Inox 304',
    spec: 'Phù hợp pin năng lượng mặt trời dày 30/35mm',
    sku: endMat.sku,
    unit: 'bộ',
    qty: mounting.endClampQty,
    unitCostVnd: endMat.cost,
    totalCostVnd: endMat.cost * mounting.endClampQty,
    unitSellVnd: Math.round(endMat.cost * multiplier),
    totalSellVnd: Math.round(endMat.cost * mounting.endClampQty * multiplier),
    brand: 'HGC Mounting',
    origin: 'Việt Nam',
  });

  if (mounting.roofType === 'tole') {
    const clipMat = findMat('m-clip', 45000);
    lines.push({
      id: 'bom-m-clip',
      categoryCode: 'VII',
      categoryName: 'Hạng mục xây dựng',
      name: 'Chân kẹp mái tôn cliplock (Seam clamp) kèm đệm cao su EPDM',
      spec: 'Nhôm đúc mạ điện phân, không đục thủng tôn mái, chống dột 100%',
      sku: clipMat.sku,
      unit: 'bộ',
      qty: mounting.clipLockQty,
      unitCostVnd: clipMat.cost,
      totalCostVnd: clipMat.cost * mounting.clipLockQty,
      unitSellVnd: Math.round(clipMat.cost * multiplier),
      totalSellVnd: Math.round(clipMat.cost * mounting.clipLockQty * multiplier),
      brand: 'HGC Mounting',
      origin: 'Việt Nam',
    });
  } else {
    const lfeetMat = findMat('m-lfeet', 28000);
    lines.push({
      id: 'bom-m-lfeet',
      categoryCode: 'VII',
      categoryName: 'Hạng mục xây dựng',
      name: 'Chân chữ L (L-Feet) nhôm đúc kèm vít nở chống bão',
      spec: 'Kèm bulong inox và gioăng chống dột EPDM',
      sku: lfeetMat.sku,
      unit: 'bộ',
      qty: mounting.lFeetQty,
      unitCostVnd: lfeetMat.cost,
      totalCostVnd: lfeetMat.cost * mounting.lFeetQty,
      unitSellVnd: Math.round(lfeetMat.cost * multiplier),
      totalSellVnd: Math.round(lfeetMat.cost * mounting.lFeetQty * multiplier),
      brand: 'HGC Mounting',
      origin: 'Việt Nam',
    });
  }

  const joinMat = findMat('m-joiner', 22000);
  lines.push({
    id: 'bom-m-join',
    categoryCode: 'VII',
    categoryName: 'Hạng mục xây dựng',
    name: 'Thanh nối rail nhôm kèm bu lông M8 Inox 304',
    spec: 'Al6005-T5, dài 200mm liên kết thanh rail',
    sku: joinMat.sku,
    unit: 'bộ',
    qty: mounting.railJoinerQty,
    unitCostVnd: joinMat.cost,
    totalCostVnd: joinMat.cost * mounting.railJoinerQty,
    unitSellVnd: Math.round(joinMat.cost * multiplier),
    totalSellVnd: Math.round(joinMat.cost * mounting.railJoinerQty * multiplier),
    brand: 'HGC Mounting',
    origin: 'Việt Nam',
  });

  // Bổ sung keo trung tính Sikaflex chống dột mái theo tài liệu HGC (mái tôn & ngói)
  if (mounting.roofType === 'tole' || mounting.roofType === 'tile') {
    const sikaMat = findMat('m-sikaflex', 185000);
    const sikaQty = Math.max(2, Math.ceil(mounting.lFeetQty / 12));
    lines.push({
      id: 'bom-m-sikaflex',
      categoryCode: 'VII',
      categoryName: 'Hạng mục xây dựng',
      name: 'Keo trung tính chuyên dụng chống dột mái tôn (Sikaflex)',
      spec: 'Bơm trám chân bu lông L-feet / vít xà gồ, kháng thời tiết UV, chống co ngót',
      sku: sikaMat.sku,
      unit: 'tuýp',
      qty: sikaQty,
      unitCostVnd: sikaMat.cost,
      totalCostVnd: sikaMat.cost * sikaQty,
      unitSellVnd: Math.round(sikaMat.cost * multiplier),
      totalSellVnd: Math.round(sikaMat.cost * sikaQty * multiplier),
      brand: 'Sika',
      origin: 'Thụy Sĩ / Việt Nam',
      note: 'Xử lý chống dột 100% tại các lỗ khoan ngàm xà gồ',
    });
  }

  // HẠNG MỤC MÁI KHUNG GIÀN NÂNG CAO (CANOPY) - TÙY CHỈNH THEO CÔNG TRÌNH
  const isCanopy = params.roofType === 'canopy' || Boolean(params.hasCanopyFrame);
  if (isCanopy) {
    const canopyMat = findMat('m-canopy-steel', 450000);
    const canopyUnitCost = params.canopyUnitCostVnd !== undefined ? params.canopyUnitCostVnd : canopyMat.cost;
    const canopyArea = params.canopyAreaM2 !== undefined && params.canopyAreaM2 > 0
      ? params.canopyAreaM2
      : Math.round(layout.usableAreaM2 || layout.panelQty * 2.6);

    lines.push({
      id: 'bom-canopy-frame',
      categoryCode: 'VII',
      categoryName: 'Hạng mục xây dựng',
      name: 'Gia công kết cấu khung giàn thép mạ kẽm / Mái khung nâng cao',
      spec: `Hệ cột, kèo, xà gồ sắt hộp kẽm chống rỉ, bu lông neo liên kết chịu tải gió bão (${canopyArea} m²)`,
      sku: canopyMat.sku,
      unit: 'm²',
      qty: canopyArea,
      unitCostVnd: canopyUnitCost,
      totalCostVnd: Math.round(canopyUnitCost * canopyArea),
      unitSellVnd: Math.round(canopyUnitCost * multiplier),
      totalSellVnd: Math.round(canopyUnitCost * canopyArea * multiplier),
      brand: 'HGC Structural',
      origin: 'Việt Nam',
      note: 'Khung giàn chịu lực gió cấp 12',
    });
  }

  // =========================================================================
  // NHÓM VIII - CHI PHÍ DỊCH VỤ (Nhân công, Vận chuyển, Hồ sơ EVN)
  // =========================================================================
  const installMat = findMat('s-install', 550000);
  const installCostPerKwp = params.installCostVndPerKwp !== undefined ? params.installCostVndPerKwp : installMat.cost;
  lines.push({
    id: 'bom-s-install',
    categoryCode: 'VIII',
    categoryName: 'Chi phí dịch vụ',
    name: 'Nhân công thi công cơ khí & đấu nối điện đóng điện trọn gói',
    spec: 'Đội ngũ kỹ sư & công nhân chứng chỉ an toàn lao động & an toàn điện',
    sku: installMat.sku,
    unit: 'kWp',
    qty: layout.installedKwp,
    unitCostVnd: installCostPerKwp,
    totalCostVnd: Math.round(installCostPerKwp * layout.installedKwp),
    unitSellVnd: Math.round(installCostPerKwp * multiplier),
    totalSellVnd: Math.round(installCostPerKwp * layout.installedKwp * multiplier),
    brand: 'HGC Engineering',
    origin: 'Việt Nam',
    note: 'Thi công theo tiêu chuẩn kỹ thuật & an toàn PCCC',
  });

  const includeTransport = params.includeTransport ?? true;
  if (includeTransport) {
    const transMat = findMat('s-transport', 3500000);
    const transCost = params.transportCostVnd !== undefined ? params.transportCostVnd : transMat.cost;
    lines.push({
      id: 'bom-s-transport',
      categoryCode: 'VIII',
      categoryName: 'Chi phí dịch vụ',
      name: 'Vận chuyển thiết bị, cẩu kéo tấm pin & vật tư lên mái công trình',
      spec: 'Xe cẩu chuyên dụng trọn gói tới chân công trình',
      sku: transMat.sku,
      unit: 'gói',
      qty: 1,
      unitCostVnd: transCost,
      totalCostVnd: transCost,
      unitSellVnd: Math.round(transCost * multiplier),
      totalSellVnd: Math.round(transCost * multiplier),
      brand: 'Logistics',
      origin: 'Việt Nam',
      note: 'Bao gồm bảo hiểm hàng hóa vận chuyển',
    });
  }

  // Hồ sơ kỹ thuật thỏa thuận EVN: Mặc định KHÔNG CÓ (theo thực tế, chỉ đưa vào khi kỹ sư bật tùy chọn)
  const includeEvnDocs = Boolean(params.includeEvnDocs);
  if (includeEvnDocs) {
    const docMat = findMat('s-testing-evn', 4500000);
    const docCost = params.evnDocsCostVnd !== undefined ? params.evnDocsCostVnd : docMat.cost;
    lines.push({
      id: 'bom-s-docs',
      categoryCode: 'VIII',
      categoryName: 'Chi phí dịch vụ',
      name: 'Thí nghiệm đo kiểm định điện & Lập hồ sơ kỹ thuật thỏa thuận EVN',
      spec: 'Hồ sơ pháp lý nghiệm thu kỹ thuật đấu nối với Công ty Điện lực EVN',
      sku: docMat.sku,
      unit: 'gói',
      qty: 1,
      unitCostVnd: docCost,
      totalCostVnd: docCost,
      unitSellVnd: Math.round(docCost * multiplier),
      totalSellVnd: Math.round(docCost * multiplier),
      brand: 'HGC Service',
      origin: 'Việt Nam',
      note: 'Nghiệm thu đóng điện theo QĐ 1279/QĐ-BCT',
    });
  }

  // =========================================================================
  // NHÓM X - HỆ THỐNG SCADA & GIÁM SÁT
  // =========================================================================
  // Mặc định KHÔNG CÓ (thực tế Etek không cần do Inverter đã tích hợp sẵn Wifi Dongle miễn phí)
  const includeScada = Boolean(params.includeScada);
  if (includeScada) {
    const scadaMat = findMat('scada-logger', 3200000);
    const scadaCost = params.scadaCostVnd !== undefined ? params.scadaCostVnd : scadaMat.cost;
    lines.push({
      id: 'bom-scada',
      categoryCode: 'X',
      categoryName: 'Hệ thống Scada',
      name: 'Datalogger thông minh & Thiết bị truyền thông đám mây 24/7 (Tùy chọn)',
      spec: 'Cổng RS485/WiFi/4G, tài khoản giám sát thời gian thực qua App/Web',
      sku: scadaMat.sku,
      unit: 'bộ',
      qty: 1,
      unitCostVnd: scadaCost,
      totalCostVnd: scadaCost,
      unitSellVnd: Math.round(scadaCost * multiplier),
      totalSellVnd: Math.round(scadaCost * multiplier),
      brand: inverter?.brand || 'Huawei / Sungrow',
      origin: 'Chính hãng',
      note: 'Giám sát sản lượng điện phát & cảnh báo sự cố từ xa',
    });
  }

  return lines;
}

/**
 * Trả về danh sách tổng hợp 8 nhóm hạng mục BOM theo chuẩn Etek Power
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
 * Xuất file Excel / CSV theo chuẩn mẫu BOM ERP của công ty
 * (Tương thích với mẫu ERP trên etekpower.vn)
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
      `"${item.brand || 'Chính hãng'}"`,
      `"${item.origin || 'Việt Nam'}"`,
      `"${item.spec.replace(/"/g, '""')}"`,
      `"${(item.note || '').replace(/"/g, '""')}"`,
      `"${item.unit}"`,
      item.qty,
      item.unitSellVnd,
      item.totalSellVnd,
    ].join(',');
  });

  // Chèn BOM UTF-8 để Excel hiển thị đúng tiếng Việt có dấu
  return '\ufeff' + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Xuất file Excel / CSV Bảng Dự Toán Báo Giá Tổng Hợp Theo 8 Nhóm Hạng Mục
 * (Chuẩn bản tóm tắt quản trị cho Ban Giám Đốc và Khách Hàng)
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
