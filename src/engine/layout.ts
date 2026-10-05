import { PanelModel, LayoutResult, RoofDirection, InstallMode } from '../types/solar';

export function getRoofDirectionFactor(dir: RoofDirection): number {
  switch (dir) {
    case 's': // Nam: tối ưu 100%
      return 1.0;
    case 'se': // Đông Nam: -5%
    case 'sw': // Tây Nam: -5%
      return 0.95;
    case 'e': // Đông: -15%
    case 'w': // Tây: -15%
      return 0.85;
    default:
      return 1.0;
  }
}

export interface LayoutParams {
  roofLengthM: number;
  roofWidthM: number;
  roofShape: 'rect' | 'l' | 'manual';
  manualAreaM2?: number;
  roofL1M?: number;
  roofW1M?: number;
  roofL2M?: number;
  roofW2M?: number;
  panel: PanelModel;
  installMode: InstallMode;
  targetLoadKw?: number;
  manualPanelQty?: number;
  monthlyElectricityBillVnd?: number;
  monthlyConsumptionKwh?: number;
  irradianceKwhM2Day: number;
  roofDir: RoofDirection;
  tariffVnd: number;
}

/**
 * Tính công suất (kWp) tối ưu đề xuất dựa trên số tiền điện hoặc sản lượng điện hàng tháng
 * Công thức: bù trừ 70% điện tiêu thụ ban ngày theo cơ chế bám tải Zero-Export
 */
export function calculateRecommendedCapacityByBill(params: {
  monthlyElectricityBillVnd?: number;
  monthlyConsumptionKwh?: number;
  irradianceKwhM2Day: number;
  roofDir: RoofDirection;
  tariffVnd: number;
}): {
  recommendedKwp: number;
  estimatedMonthlyKwh: number;
  daytimeTargetKwh: number;
} {
  const { monthlyElectricityBillVnd, monthlyConsumptionKwh, irradianceKwhM2Day, roofDir, tariffVnd } = params;

  let monthlyKwh = monthlyConsumptionKwh || 0;
  if (!monthlyKwh && monthlyElectricityBillVnd) {
    monthlyKwh = Math.round(monthlyElectricityBillVnd / (tariffVnd || 2800));
  }
  if (!monthlyKwh) monthlyKwh = 1000; // fallback mặc định

  // 70% điện dùng vào ban ngày (giờ có nắng phát điện mặt trời)
  const daytimeRatio = 0.70;
  const daytimeTargetMonthlyKwh = monthlyKwh * daytimeRatio;
  const dailyTargetKwh = daytimeTargetMonthlyKwh / 30;

  const dirFactor = getRoofDirectionFactor(roofDir);
  const sysEfficiency = 0.85; // 85% hiệu suất thực tế

  // kWp = Sản lượng ngày / (GHI * Hệ số hướng * Hiệu suất)
  const kwp = dailyTargetKwh / (irradianceKwhM2Day * dirFactor * sysEfficiency);
  const recommendedKwp = Number(Math.max(1, kwp).toFixed(1));

  return {
    recommendedKwp,
    estimatedMonthlyKwh: monthlyKwh,
    daytimeTargetKwh: Number(dailyTargetKwh.toFixed(1)),
  };
}

export function calculatePanelLayout(params: LayoutParams): LayoutResult {
  const {
    roofLengthM,
    roofWidthM,
    roofShape,
    manualAreaM2,
    roofL1M,
    roofW1M,
    roofL2M,
    roofW2M,
    panel,
    installMode,
    targetLoadKw,
    manualPanelQty,
    monthlyElectricityBillVnd,
    monthlyConsumptionKwh,
    irradianceKwhM2Day,
    roofDir,
    tariffVnd,
  } = params;

  const panelLengthM = panel.lengthMm / 1000;
  const panelWidthM = panel.widthMm / 1000;
  const gapM = 0.025; // 25mm khe hở giữa 2 tấm (mid-clamp)
  const edgeMarginM = 0.5; // 500mm lùi mép an toàn

  let totalRoofAreaM2 = roofLengthM * roofWidthM;
  let usableAreaM2 = totalRoofAreaM2 * 0.85;
  let maxCount = 0;
  let bestOrientation: 'portrait' | 'landscape' = 'portrait';
  let bestCols = 1;
  let bestRows = 1;
  let chosenPw = panelWidthM;
  let chosenPh = panelLengthM;

  // 1. Trường hợp Mái Hình Chữ L (2 cánh section 1 & section 2)
  if (roofShape === 'l') {
    const l1 = roofL1M && roofL1M > 0 ? roofL1M : roofLengthM;
    const w1 = roofW1M && roofW1M > 0 ? roofW1M : Math.round(roofWidthM * 0.6);
    const l2 = roofL2M && roofL2M > 0 ? roofL2M : Math.round(roofLengthM * 0.5);
    const w2 = roofW2M && roofW2M > 0 ? roofW2M : Math.max(2, roofWidthM - w1);

    totalRoofAreaM2 = Number(((l1 * w1) + (l2 * w2)).toFixed(1));
    usableAreaM2 = Number((totalRoofAreaM2 * 0.85).toFixed(1));

    // Tính số tấm trên Cánh 1
    const uL1 = Math.max(0.5, l1 - 2 * edgeMarginM);
    const uW1 = Math.max(0.5, w1 - 2 * edgeMarginM);
    const colsP1 = Math.max(0, Math.floor((uW1 + gapM) / (panelWidthM + gapM)));
    const rowsP1 = Math.max(0, Math.floor((uL1 + gapM) / (panelLengthM + gapM)));
    const count1 = colsP1 * rowsP1;

    // Tính số tấm trên Cánh 2
    const uL2 = Math.max(0.5, l2 - 2 * edgeMarginM);
    const uW2 = Math.max(0.5, w2 - 2 * edgeMarginM);
    const colsP2 = Math.max(0, Math.floor((uW2 + gapM) / (panelWidthM + gapM)));
    const rowsP2 = Math.max(0, Math.floor((uL2 + gapM) / (panelLengthM + gapM)));
    const count2 = colsP2 * rowsP2;

    maxCount = count1 + count2;
    bestCols = Math.max(1, colsP1 + colsP2);
    bestRows = Math.max(1, Math.max(rowsP1, rowsP2));
    chosenPw = panelWidthM;
    chosenPh = panelLengthM;
  }
  // 2. Trường hợp nhập diện tích thủ công
  else if (roofShape === 'manual') {
    totalRoofAreaM2 = manualAreaM2 && manualAreaM2 > 0 ? manualAreaM2 : 100;
    usableAreaM2 = Number((totalRoofAreaM2 * 0.85).toFixed(1));
    const panelArea = panelLengthM * panelWidthM * 1.15; // tính cả khung ray và khoảng hở
    maxCount = Math.floor(usableAreaM2 / panelArea);
    bestCols = Math.max(1, Math.round(Math.sqrt(maxCount * 1.5)));
    bestRows = Math.max(1, Math.ceil(maxCount / bestCols));
  }
  // 3. Trường hợp Mái Hình Chữ Nhật tiêu chuẩn
  else {
    totalRoofAreaM2 = Number((roofLengthM * roofWidthM).toFixed(1));
    usableAreaM2 = Number((totalRoofAreaM2 * 0.85).toFixed(1));

    const usableLengthM = Math.max(0.5, roofLengthM - 2 * edgeMarginM);
    const usableWidthM = Math.max(0.5, roofWidthM - 2 * edgeMarginM);

    // Phương án 1: Portrait (dọc)
    const colsP = Math.max(0, Math.floor((usableWidthM + gapM) / (panelWidthM + gapM)));
    const rowsP = Math.max(0, Math.floor((usableLengthM + gapM) / (panelLengthM + gapM)));
    const countP = colsP * rowsP;

    // Phương án 2: Landscape (ngang)
    const colsL = Math.max(0, Math.floor((usableWidthM + gapM) / (panelLengthM + gapM)));
    const rowsL = Math.max(0, Math.floor((usableLengthM + gapM) / (panelWidthM + gapM)));
    const countL = colsL * rowsL;

    if (countL > countP) {
      bestOrientation = 'landscape';
      bestCols = colsL;
      bestRows = rowsL;
      maxCount = countL;
      chosenPw = panelLengthM;
      chosenPh = panelWidthM;
    } else {
      bestOrientation = 'portrait';
      bestCols = colsP;
      bestRows = rowsP;
      maxCount = countP;
      chosenPw = panelWidthM;
      chosenPh = panelLengthM;
    }
  }

  // Thử kiểm tra có dư chỗ xếp thêm 1 hàng xoay ngang ở mép không (cho hình chữ nhật)
  let extraRow: { cols: number; rotated: boolean } | undefined;
  if (roofShape === 'rect' && maxCount > 0) {
    const usableLengthM = Math.max(0.5, roofLengthM - 2 * edgeMarginM);
    const usableWidthM = Math.max(0.5, roofWidthM - 2 * edgeMarginM);
    const usedLength = bestRows * (chosenPh + gapM) - gapM;
    const remainderLength = usableLengthM - usedLength;
    if (remainderLength >= chosenPw + gapM) {
      const extraCols = Math.floor((usableWidthM + gapM) / (chosenPh + gapM));
      if (extraCols > 0) {
        extraRow = { cols: extraCols, rotated: true };
        maxCount += extraCols;
      }
    }
  }

  // Xác định số tấm pin cuối cùng theo installMode:
  let finalPanelQty = maxCount;

  if (installMode === 'manual_qty' && manualPanelQty && manualPanelQty > 0) {
    finalPanelQty = manualPanelQty;
  } else if (installMode === 'by_bill') {
    // Tự động tính số tấm bám sát theo số tiền điện đã nhập
    const { recommendedKwp } = calculateRecommendedCapacityByBill({
      monthlyElectricityBillVnd,
      monthlyConsumptionKwh,
      irradianceKwhM2Day,
      roofDir,
      tariffVnd,
    });
    const neededPanels = Math.ceil((recommendedKwp * 1000) / panel.wp);
    finalPanelQty = maxCount > 0 ? Math.min(maxCount, neededPanels) : neededPanels;
  } else if (installMode === 'by_load' && targetLoadKw && targetLoadKw > 0) {
    const neededKwp = targetLoadKw;
    const neededPanels = Math.ceil((neededKwp * 1000) / panel.wp);
    finalPanelQty = maxCount > 0 ? Math.min(maxCount, neededPanels) : neededPanels;
  }

  finalPanelQty = Math.max(1, finalPanelQty);

  const installedKwp = Number(((finalPanelQty * panel.wp) / 1000).toFixed(2));
  const dirFactor = getRoofDirectionFactor(roofDir);
  const systemLossPct = 0.15; // 15% tổn thất chuẩn (bụi bẩn, dây dẫn, nhiệt độ, biến tần)

  // Sản lượng điện ngày = kWp * GHI * Hệ số hướng * (1 - loss)
  const dailyKwh = Number((installedKwp * irradianceKwhM2Day * dirFactor * (1 - systemLossPct)).toFixed(1));
  const monthlyKwh = Number((dailyKwh * 30).toFixed(0));
  const monthlySavingVnd = Number((monthlyKwh * tariffVnd).toFixed(0));

  return {
    panelQty: finalPanelQty,
    installedKwp,
    cols: bestCols,
    rows: bestRows,
    pw: chosenPw,
    ph: chosenPh,
    orientation: bestOrientation,
    extraRow,
    dailyKwh,
    monthlyKwh,
    monthlySavingVnd,
    usableAreaM2: Number(usableAreaM2.toFixed(1)),
    totalRoofAreaM2: Number(totalRoofAreaM2.toFixed(1)),
  };
}
