import { FinancialResult, BomLine } from '../types/solar';

export interface FinancialCalculationParams {
  bomLines: BomLine[];
  installedKwp: number;
  dailyKwh: number;
  tariffVnd: number;
  discountPct?: number; // e.g. 2%
  vatPct?: number; // Mặc định 0% vì đơn giá thiết bị/vật tư đã bao gồm thuế VAT
  daySelfConsumptionRatio?: number; // 70% daytime self-consumption
}

export function calculateFinancials(params: FinancialCalculationParams): FinancialResult {
  const {
    bomLines,
    installedKwp,
    dailyKwh,
    tariffVnd,
    discountPct = 0,
    vatPct = 0,
    daySelfConsumptionRatio = 0.7,
  } = params;

  // 1. Tính tổng giá vốn (Cost) và giá bán (Sell) từ BOM
  const capexCostVnd = bomLines.reduce((acc, line) => acc + line.totalCostVnd, 0);
  const rawSellVnd = bomLines.reduce((acc, line) => acc + line.totalSellVnd, 0);

  const discountVnd = Math.round((rawSellVnd * discountPct) / 100);
  const subtotalAfterDiscount = rawSellVnd - discountVnd;
  const vatVnd = Math.round((subtotalAfterDiscount * vatPct) / 100);
  const grandTotalVnd = subtotalAfterDiscount + vatVnd;

  const grossMarginVnd = subtotalAfterDiscount - capexCostVnd;
  const grossMarginPct = rawSellVnd > 0 ? Number(((grossMarginVnd / subtotalAfterDiscount) * 100).toFixed(1)) : 0;

  // 2. Sản lượng điện & Tiết kiệm năm đầu (Year 1)
  const annualTotalKwh = dailyKwh * 365;
  const selfConsumedKwhYear1 = annualTotalKwh * daySelfConsumptionRatio;
  const year1SavingsVnd = Math.round(selfConsumedKwhYear1 * tariffVnd);

  // 3. Dòng tiền 20 năm
  // - Suy hao panel: 0.7%/năm
  // - Giá điện tăng: 1.0%/năm
  const annualDegrade = 0.007;
  const electricityEscalation = 0.01;
  const cashflow20Years: FinancialResult['cashflow20Years'] = [];

  let cumulativeSavings = 0;
  let paybackYears = 0;
  let paybackFound = false;

  for (let year = 1; year <= 20; year++) {
    const degradationFactor = Math.pow(1 - annualDegrade, year - 1);
    const generatedKwh = Math.round(annualTotalKwh * degradationFactor);
    const currentTariff = Math.round(tariffVnd * Math.pow(1 + electricityEscalation, year - 1));
    const annualSavingsVnd = Math.round(generatedKwh * daySelfConsumptionRatio * currentTariff);

    cumulativeSavings += annualSavingsVnd;
    const netCashflowVnd = cumulativeSavings - grandTotalVnd;

    if (!paybackFound && netCashflowVnd >= 0) {
      // Nội suy tuyến tính thời gian hoàn vốn
      const prevCumulative = cumulativeSavings - annualSavingsVnd;
      const fraction = (grandTotalVnd - prevCumulative) / annualSavingsVnd;
      paybackYears = Number((year - 1 + Math.max(0, Math.min(1, fraction))).toFixed(1));
      paybackFound = true;
    }

    cashflow20Years.push({
      year,
      degradationFactor: Number(degradationFactor.toFixed(3)),
      generatedKwh,
      tariffVnd: currentTariff,
      annualSavingsVnd,
      cumulativeSavingsVnd: cumulativeSavings,
      netCashflowVnd,
    });
  }

  if (!paybackFound) {
    paybackYears = Number((grandTotalVnd / (year1SavingsVnd || 1)).toFixed(1));
  }

  // 4. Tính IRR bằng phương pháp dò nhị phân (Binary Search)
  // NPV(r) = -CAPEX + sum(CF_t / (1 + r)^t) = 0
  let lowR = -0.1; // -10%
  let highR = 0.6; // 60%
  let irrPct = 0;

  for (let iter = 0; iter < 40; iter++) {
    const midR = (lowR + highR) / 2;
    let npv = -grandTotalVnd;
    for (let t = 1; t <= 20; t++) {
      npv += cashflow20Years[t - 1].annualSavingsVnd / Math.pow(1 + midR, t);
    }
    if (Math.abs(npv) < 1000) {
      irrPct = Number((midR * 100).toFixed(1));
      break;
    }
    if (npv > 0) {
      lowR = midR;
    } else {
      highR = midR;
    }
    irrPct = Number((midR * 100).toFixed(1));
  }

  // 5. Performance Ratio & Môi trường
  // PR = Sản lượng thực / (kWp * GHI * 365) ~ 80 - 84%
  const performanceRatioPct = 81.5;
  const co2ReductionTonsYear = Number(((annualTotalKwh * 0.65) / 1000).toFixed(1));
  const treesEquivalentYear = Math.round(co2ReductionTonsYear * 45);

  // 6. Suất đầu tư (Vnđ/kWp) chuẩn Etek Power
  const validKwp = installedKwp > 0 ? installedKwp : 1;
  const investmentRatePreVatVndPerKwp = Math.round(subtotalAfterDiscount / validKwp);
  const investmentRatePostVatVndPerKwp = Math.round(grandTotalVnd / validKwp);

  return {
    capexCostVnd,
    capexSellVnd: rawSellVnd,
    discountVnd,
    vatVnd,
    grandTotalVnd,
    grossMarginPct,
    grossMarginVnd,
    investmentRatePreVatVndPerKwp,
    investmentRatePostVatVndPerKwp,
    year1OutputKwh: annualTotalKwh,
    year1SavingsVnd,
    paybackYears,
    irrPct: Math.max(0, irrPct),
    performanceRatioPct,
    co2ReductionTonsYear,
    treesEquivalentYear,
    cashflow20Years,
  };
}
