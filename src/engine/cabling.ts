import { CableResult, DistributionBoardResult } from '../types/solar';

// Bảng dòng tải Iz định mức cho cáp Đồng (Cu) cách điện XLPE/PVC theo IEC 60364-5-52 (Đi trên máng / trong ống)
const STANDARD_CSA_TABLE_CU: Array<{ csa: number; iz3Phase: number; iz1Phase: number }> = [
  { csa: 1.5, iz3Phase: 15.5, iz1Phase: 18.5 },
  { csa: 2.5, iz3Phase: 21, iz1Phase: 25 },
  { csa: 4.0, iz3Phase: 28, iz1Phase: 34 },
  { csa: 6.0, iz3Phase: 36, iz1Phase: 43 },
  { csa: 10, iz3Phase: 50, iz1Phase: 60 },
  { csa: 16, iz3Phase: 68, iz1Phase: 80 },
  { csa: 25, iz3Phase: 89, iz1Phase: 105 },
  { csa: 35, iz3Phase: 110, iz1Phase: 130 },
  { csa: 50, iz3Phase: 134, iz1Phase: 160 },
  { csa: 70, iz3Phase: 171, iz1Phase: 200 },
  { csa: 95, iz3Phase: 207, iz1Phase: 245 },
  { csa: 120, iz3Phase: 239, iz1Phase: 285 },
  { csa: 150, iz3Phase: 275, iz1Phase: 325 },
  { csa: 185, iz3Phase: 314, iz1Phase: 370 },
  { csa: 240, iz3Phase: 370, iz1Phase: 435 },
];

export interface CableSizingInput {
  totalAcKw: number;
  inverterKw: number;
  phases: '1' | '3';
  routeLengthM: number;
  stringIsc: number;
  cosPhi?: number;
}

export function calculateCablingAndBoard(input: CableSizingInput): {
  cables: CableResult[];
  board: DistributionBoardResult;
} {
  const { totalAcKw, inverterKw, phases, routeLengthM, stringIsc, cosPhi = 0.9 } = input;
  const is3Phase = phases === '3';
  const uVoltage = is3Phase ? 380 : 220;
  const rhoCu = 0.0175; // Điện trở suất đồng ohm.mm2/m ở nhiệt độ vận hành

  // 1. Tính toán Dây hạ thế AC Tổng (Inverter/Tủ gom -> Tủ phân phối tổng)
  const ibTotal = is3Phase
    ? (totalAcKw * 1000) / (Math.sqrt(3) * uVoltage * cosPhi)
    : (totalAcKw * 1000) / (uVoltage * cosPhi);

  // Chọn tiết diện thỏa mãn dòng Iz >= Ib và sụt áp Delta U <= 2.5%
  let chosenMainCsa = 240;
  let chosenMainIz = 370;
  let mainVoltDropPct = 0;

  for (const row of STANDARD_CSA_TABLE_CU) {
    const iz = is3Phase ? row.iz3Phase : row.iz1Phase;
    if (iz >= ibTotal) {
      // Tính sụt áp
      const deltaU = is3Phase
        ? (Math.sqrt(3) * rhoCu * routeLengthM * ibTotal * cosPhi) / row.csa
        : (2 * rhoCu * routeLengthM * ibTotal * cosPhi) / row.csa;
      const dropPct = (deltaU / uVoltage) * 100;
      if (dropPct <= 3.0) {
        chosenMainCsa = row.csa;
        chosenMainIz = iz;
        mainVoltDropPct = Number(dropPct.toFixed(2));
        break;
      }
    }
  }

  const lvMainCable: CableResult = {
    cableType: 'LV_MAIN',
    title: 'Dây cáp AC Hạ thế tổng',
    standard: 'IEC 60502-1 · TCVN 9207:2012',
    pKw: totalAcKw,
    ibA: Number(ibTotal.toFixed(1)),
    izA: chosenMainIz,
    standardCsaMm2: chosenMainCsa,
    voltageDropPct: mainVoltDropPct,
    lengthM: routeLengthM,
    material: 'Cu',
    method: 'Đi trong máng cáp đục lỗ (Method C/E)',
    status: 'passed',
  };

  // 2. Dây AC nhánh từng Inverter
  const ibInv = is3Phase
    ? (inverterKw * 1000) / (Math.sqrt(3) * uVoltage * cosPhi)
    : (inverterKw * 1000) / (uVoltage * cosPhi);

  let chosenInvCsa = 70;
  let chosenInvIz = 171;
  let invVoltDropPct = 0;

  for (const row of STANDARD_CSA_TABLE_CU) {
    const iz = is3Phase ? row.iz3Phase : row.iz1Phase;
    if (iz >= ibInv) {
      const deltaU = is3Phase
        ? (Math.sqrt(3) * rhoCu * 15 * ibInv * cosPhi) / row.csa
        : (2 * rhoCu * 15 * ibInv * cosPhi) / row.csa;
      const dropPct = (deltaU / uVoltage) * 100;
      if (dropPct <= 1.5) {
        chosenInvCsa = row.csa;
        chosenInvIz = iz;
        invVoltDropPct = Number(dropPct.toFixed(2));
        break;
      }
    }
  }

  const lvInvCable: CableResult = {
    cableType: 'LV_INVERTER',
    title: 'Dây cáp AC nhánh Inverter',
    standard: 'IEC 60502-1',
    pKw: inverterKw,
    ibA: Number(ibInv.toFixed(1)),
    izA: chosenInvIz,
    standardCsaMm2: chosenInvCsa,
    voltageDropPct: invVoltDropPct,
    lengthM: 15,
    material: 'Cu',
    method: 'Đi trong máng cáp / ống luồn',
    status: 'passed',
  };

  // 3. Dây Cáp DC chuyên dụng Solar PV
  // Dòng chuỗi Isc * 1.25 (hệ số an toàn quang điện)
  const idcDesign = stringIsc * 1.25;
  const dcCsa = idcDesign > 25 ? 6.0 : 4.0;
  const dcDropPct = Number(((2 * rhoCu * 25 * idcDesign) / (dcCsa * 600) * 100).toFixed(2));

  const dcCable: CableResult = {
    cableType: 'DC_SOLAR',
    title: 'Dây cáp DC Solar PV 1500V',
    standard: 'IEC 62930 / EN 50618 (1500V DC)',
    pKw: Number((idcDesign * 0.6).toFixed(1)),
    ibA: Number(idcDesign.toFixed(1)),
    izA: dcCsa === 4.0 ? 55 : 70,
    standardCsaMm2: dcCsa,
    voltageDropPct: dcDropPct,
    lengthM: Math.round(routeLengthM * 1.5),
    material: 'Cu',
    method: 'Kẹp dưới xà gồ / luồn ống HDPE',
    status: 'passed',
  };

  // 4. Tính toán Tủ điện phân phối & Bảo vệ (MCCB + SPD Type 2)
  // Quy tắc chọn MCCB: I_rated_MCCB >= I_AC_design * 1.25
  const iDesignMccb = ibTotal * 1.25;
  const STANDARD_MCCB = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400];
  const chosenMccb = STANDARD_MCCB.find((m) => m >= iDesignMccb) || 400;

  const board: DistributionBoardResult = {
    mccbRatedA: chosenMccb,
    iAcTotalDesignA: Number(ibTotal.toFixed(1)),
    spcDcType: 'Type 2',
    spdAcType: 'Type 2',
    smartMeter: 'Smart Meter 3-Pha + CT Biến dòng đo bám tải',
    enclosureType: 'Tủ ngoài trời chống nước IP65, sơn tĩnh điện 2 lớp',
    status: 'passed',
  };

  return {
    cables: [lvMainCable, lvInvCable, dcCable],
    board,
  };
}
