import { CustomerType } from '../types/solar';

// Quyết định số 1279/QĐ-BCT của Bộ Công Thương
export const ELECTRICITY_TARIFFS = {
  decision: '1279/QĐ-BCT ngày 09/05/2025',
  effectiveDate: '2025-05-10',
  vatPct: 10,
  
  // 1. Điện sinh hoạt (bậc thang lũy tiến 6 bậc)
  sinh_hoat_tiers: [
    { tier: 1, range: '0 - 50 kWh', limit: 50, priceVnd: 1893 },
    { tier: 2, range: '51 - 100 kWh', limit: 100, priceVnd: 1956 },
    { tier: 3, range: '101 - 200 kWh', limit: 200, priceVnd: 2271 },
    { tier: 4, range: '201 - 300 kWh', limit: 300, priceVnd: 2860 },
    { tier: 5, range: '301 - 400 kWh', limit: 400, priceVnd: 3197 },
    { tier: 6, range: '> 400 kWh', limit: Infinity, priceVnd: 3302 },
  ],

  // 2. Kinh doanh dịch vụ (giờ bình thường ban ngày nơi solar phát điện)
  kd_rates: {
    kd_tren22kv: { normal: 2680, peak: 4768, offPeak: 1494, label: 'Kinh doanh ≥ 22kV' },
    kd_6_22kv: { normal: 2875, peak: 4945, offPeak: 1672, label: 'Kinh doanh 6 - 22kV' },
    kd_duoi6kv: { normal: 2981, peak: 5122, offPeak: 1779, label: 'Kinh doanh < 6kV' },
  },

  // 3. Sản xuất công nghiệp
  sx_rates: {
    sx_tren110kv: { normal: 1716, peak: 3009, offPeak: 1079, label: 'Sản xuất ≥ 110kV' },
    sx_22_110kv: { normal: 1734, peak: 3089, offPeak: 1132, label: 'Sản xuất 22 - 110kV' },
    sx_6_22kv: { normal: 1787, peak: 3186, offPeak: 1186, label: 'Sản xuất 6 - 22kV' },
    sx_duoi6kv: { normal: 1876, peak: 3302, offPeak: 1239, label: 'Sản xuất < 6kV' },
  },

  // 4. Hành chính sự nghiệp
  hcsn_rates: {
    hcsn_ytegd: { standard: 1845, label: 'HCSN - Bệnh viện, trường học' },
    hcsn_khac: { standard: 1970, label: 'HCSN - Cơ quan, đơn vị khác' },
  },
};

export function getCustomerTypeLabel(type: CustomerType): string {
  switch (type) {
    case 'sinh_hoat':
      return 'Điện sinh hoạt (Hộ gia đình, biệt thự)';
    case 'kd_tren22kv':
      return 'Kinh doanh ≥ 22kV';
    case 'kd_6_22kv':
      return 'Kinh doanh 6 - 22kV';
    case 'kd_duoi6kv':
      return 'Kinh doanh < 6kV (Tòa nhà, khách sạn, nhà hàng)';
    case 'sx_tren110kv':
      return 'Sản xuất ≥ 110kV';
    case 'sx_22_110kv':
      return 'Sản xuất 22 - 110kV (Khu công nghiệp lớn)';
    case 'sx_6_22kv':
      return 'Sản xuất 6 - 22kV (Nhà máy, xưởng sản xuất)';
    case 'sx_duoi6kv':
      return 'Sản xuất < 6kV (Cơ sở chế biến vừa & nhỏ)';
    case 'hcsn_ytegd':
      return 'HCSN - Bệnh viện, trường học';
    case 'hcsn_khac':
      return 'HCSN - Đơn vị hành chính khác';
    default:
      return 'Điện sinh hoạt';
  }
}

/**
 * Tính đơn giá điện bình quân hoặc biên cho khách hàng để ước tính tiết kiệm điện mặt trời.
 * Solar phát vào ban ngày nên với SX/KD lấy giờ bình thường (hoặc trung bình ban ngày).
 * Với sinh hoạt, solar cắt bớt số điện ở các bậc cao nhất (bậc 4, 5, 6).
 */
export function getEffectiveTariffVnd(custType: CustomerType, monthlyConsumptionKwh?: number): number {
  if (custType === 'sinh_hoat') {
    const kwh = monthlyConsumptionKwh || 450;
    if (kwh > 400) return 3302;
    if (kwh > 300) return 3197;
    if (kwh > 200) return 2860;
    if (kwh > 100) return 2271;
    return 1956;
  }

  if (custType in ELECTRICITY_TARIFFS.kd_rates) {
    const rate = ELECTRICITY_TARIFFS.kd_rates[custType as keyof typeof ELECTRICITY_TARIFFS.kd_rates];
    // Giờ ban ngày có cả giờ cao điểm (9h-11h30) và bình thường -> ước tính trọng số 70% bình thường + 30% cao điểm
    return Math.round(rate.normal * 0.7 + rate.peak * 0.3);
  }

  if (custType in ELECTRICITY_TARIFFS.sx_rates) {
    const rate = ELECTRICITY_TARIFFS.sx_rates[custType as keyof typeof ELECTRICITY_TARIFFS.sx_rates];
    return Math.round(rate.normal * 0.75 + rate.peak * 0.25);
  }

  if (custType in ELECTRICITY_TARIFFS.hcsn_rates) {
    const rate = ELECTRICITY_TARIFFS.hcsn_rates[custType as keyof typeof ELECTRICITY_TARIFFS.hcsn_rates];
    return rate.standard;
  }

  return 2860;
}
