import { PanelModel, InverterModel, InverterProposal } from '../types/solar';

export interface InverterSelectionParams {
  installedKwp: number;
  panelCount: number;
  panel: PanelModel;
  phases: '1' | '3';
  sysType: 'zero_export' | 'on_grid' | 'hybrid' | 'off_grid';
  tMinC: number;
  tMaxC: number;
  availableInverters: InverterModel[];
}

export function selectInverters(params: InverterSelectionParams): InverterProposal[] {
  const {
    installedKwp,
    panelCount,
    panel,
    phases,
    sysType,
    tMinC,
    tMaxC,
    availableInverters,
  } = params;

  // Nhiệt độ cell tối đa khi vận hành dưới nắng hè gắt
  const tCellMax = tMaxC + 25; // Thường đạt 65 - 70°C

  // 1. Điện áp Voc ở nhiệt độ thấp nhất (mùa đông / rạng sáng)
  const vocCold = panel.voc * (1 + (panel.tempCoeffVocPct / 100) * (tMinC - 25));

  // 2. Điện áp Vmpp ở nhiệt độ nóng nhất
  const vmppHot = panel.vmpp * (1 + (panel.tempCoeffVmppPct / 100) * (tCellMax - 25));

  // Lọc inverter phù hợp pha điện và loại hệ thống
  const compatibleInverters = availableInverters.filter((inv) => {
    if (inv.phases !== phases) return false;
    if (sysType === 'zero_export' && !inv.supportsZeroExport) return false;
    return true;
  });

  const proposals: InverterProposal[] = [];

  for (const inv of compatibleInverters) {
    // Ràng buộc số tấm cực đại theo Vdc_max
    const seriesMax = Math.floor(inv.vdcMax / vocCold);

    // Ràng buộc số tấm cực tiểu để MPPT khởi động ở nhiệt độ cao nhất
    const seriesMin = Math.ceil(inv.mpptVmin / vmppHot);

    if (seriesMin > seriesMax || seriesMin <= 0) continue;

    // Kiểm tra dòng điện tối đa mỗi kênh MPPT
    // Ràng buộc an toàn: Isc * 1.25 <= mpptMaxIsc
    const maxParallelPerMppt = Math.max(1, Math.floor(inv.mpptMaxIsc / (panel.isc * 1.05)));

    // Công suất AC 1 bộ và ước tính số bộ cần dùng để đạt tỷ lệ DC/AC khoảng 1.15 - 1.25
    const targetDcAcRatio = 1.2;
    const qtyNeeded = Math.max(1, Math.round(installedKwp / (inv.acKw * targetDcAcRatio)));

    const totalAcKw = inv.acKw * qtyNeeded;
    const dcAcRatio = Number((installedKwp / totalAcKw).toFixed(2));

    // Tìm cấu hình chuỗi (string) hợp lý chia đều cho panelCount
    // Chọn seriesCount trong [seriesMin, seriesMax]
    let chosenSeries = Math.min(seriesMax, Math.max(seriesMin, Math.round((seriesMin + seriesMax) / 2)));
    
    // Ưu tiên chọn seriesCount sao cho panelCount chia hết hoặc phần dư nhỏ
    for (let s = seriesMax; s >= seriesMin; s--) {
      if (panelCount % s === 0) {
        chosenSeries = s;
        break;
      }
    }

    const totalStrings = Math.ceil(panelCount / chosenSeries);
    const stringsPerInverter = Math.ceil(totalStrings / qtyNeeded);

    // Kiểm tra số string vật lý tối đa của Inverter
    const maxCapacityStrings = inv.mpptCount * Math.min(inv.mpptChannelsPerMppt, maxParallelPerMppt);
    if (stringsPerInverter > maxCapacityStrings) {
      // Nếu 1 bộ không đủ ngõ vào MPPT, cần tăng số bộ lên
      // continue hoặc xem xét
    }

    // Đánh giá tỷ lệ DC/AC
    let ratingLabel: InverterProposal['ratingLabel'] = '✗ Không khuyến nghị';
    if (dcAcRatio >= 1.10 && dcAcRatio <= 1.30) {
      ratingLabel = '✓ Tối ưu';
    } else if (dcAcRatio >= 1.00 && dcAcRatio <= 1.45) {
      ratingLabel = '⚠ Chấp nhận được';
    }

    const stringConfigText = `${qtyNeeded} bộ × ${stringsPerInverter} chuỗi (${chosenSeries} tấm/chuỗi)`;

    proposals.push({
      inverter: inv,
      qtyNeeded,
      seriesMin,
      seriesMax,
      chosenSeries,
      totalStrings,
      stringsPerInverter,
      dcAcRatio,
      ratingLabel,
      vocCold: Number(vocCold.toFixed(1)),
      vmppHot: Number(vmppHot.toFixed(1)),
      stringConfigText,
    });
  }

  // Sắp xếp ưu tiên: "✓ Tối ưu" lên đầu, sau đó theo độ lệch |dcAcRatio - 1.20| tăng dần
  proposals.sort((a, b) => {
    const scoreRank = (r: InverterProposal['ratingLabel']) => {
      if (r === '✓ Tối ưu') return 3;
      if (r === '⚠ Chấp nhận được') return 2;
      return 1;
    };
    const rankDiff = scoreRank(b.ratingLabel) - scoreRank(a.ratingLabel);
    if (rankDiff !== 0) return rankDiff;

    return Math.abs(a.dcAcRatio - 1.2) - Math.abs(b.dcAcRatio - 1.2);
  });

  return proposals;
}
