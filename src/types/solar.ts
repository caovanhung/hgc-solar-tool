export type CustomerType =
  | 'sinh_hoat'
  | 'kd_tren22kv'
  | 'kd_6_22kv'
  | 'kd_duoi6kv'
  | 'sx_tren110kv'
  | 'sx_22_110kv'
  | 'sx_6_22kv'
  | 'sx_duoi6kv'
  | 'hcsn_ytegd'
  | 'hcsn_khac';

export type RoofType = 'tole' | 'concrete' | 'tile';
export type RoofDirection = 's' | 'se' | 'sw' | 'e' | 'w';
export type RoofShape = 'rect' | 'l' | 'manual';
export type SystemType = 'zero_export' | 'on_grid' | 'hybrid' | 'off_grid';
export type PhaseType = '1' | '3';
export type InstallMode = 'full_roof' | 'by_bill' | 'by_load' | 'manual_qty';
export type BatteryType = 'lfp' | 'gel';

export interface ProvinceData {
  code: string;
  name: string;
  region: 'Bac' | 'Trung' | 'Nam';
  dailyIrradianceKwhM2: number; // kWh/m²/day
  tMinC: number;
  tMaxC: number;
}

export interface PanelModel {
  id: string;
  brand: string;
  model: string;
  wp: number;
  voc: number;
  vmpp: number;
  isc: number;
  impp: number;
  efficiencyPct: number;
  tech: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  weightKg: number;
  warrantyYears: number;
  tempCoeffVocPct: number; // e.g. -0.26 %/°C
  tempCoeffVmppPct: number; // e.g. -0.34 %/°C
  source: 'verified' | 'estimated';
  priceHintVnd: number;
  datasheetUrl?: string;
}

export interface InverterModel {
  id: string;
  brand: string;
  model: string;
  type: 'on_grid' | 'hybrid' | 'off_grid';
  phases: '1' | '3';
  acKw: number;
  vdcMax: number;
  mpptCount: number;
  mpptChannelsPerMppt: number;
  mpptVmin: number;
  mpptVmax: number;
  mpptMaxIsc: number;
  maxDcKwp: number;
  maxEfficiencyPct: number;
  source: 'verified' | 'estimated';
  priceHintVnd: number;
  supportsZeroExport: boolean;
}

export type MaterialCategoryCode = 'I' | 'II' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'X';

export interface BomGroupDefinition {
  code: MaterialCategoryCode;
  name: string;
  order: number;
  description: string;
}

export const STANDARD_BOM_GROUPS: BomGroupDefinition[] = [
  { code: 'I', name: 'Vật tư chính', order: 1, description: 'Tấm pin năng lượng mặt trời & Biến tần Inverter hòa lưới / Hybrid' },
  { code: 'II', name: 'Hệ bám tải', order: 2, description: 'Thiết bị đo đếm Smart Meter, Biến dòng CT & Bộ điều khiển Zero-Export' },
  { code: 'IV', name: 'Hệ thống điện', order: 3, description: 'Tủ điện AC tổng, MCCB, Chống sét lan truyền SPD, Tuyến cáp AC & Cáp DC' },
  { code: 'V', name: 'Hệ thống máng cáp', order: 4, description: 'Thang máng cáp trunking tôn mạ kẽm/nhúng nóng, ống gân xoắn HDPE & phụ kiện' },
  { code: 'VI', name: 'Hệ thống phụ trợ', order: 5, description: 'Hệ thống tiếp địa an toàn, cọc tiếp địa đồng, hóa chất GEM & Kim thu sét' },
  { code: 'VII', name: 'Hạng mục xây dựng', order: 6, description: 'Khung giàn giá đỡ ray nhôm Al6005-T5, kẹp biên/kẹp giữa, chân L, seam cliplock' },
  { code: 'VIII', name: 'Chi phí dịch vụ', order: 7, description: 'Nhân công lắp đặt cơ khí & điện, vận chuyển, kiểm định thí nghiệm, hồ sơ EVN' },
  { code: 'X', name: 'Hệ thống Scada', order: 8, description: 'Datalogger thông minh, truyền thông giám sát Cloud/App 24/7 & Cảm biến' },
];

export interface MaterialItem {
  id: string;
  categoryCode: MaterialCategoryCode;
  categoryName: string;
  name: string;
  spec: string;
  sku: string;
  unit: string;
  costVnd: number;
  source: 'demo_ui_observed' | 'derived_from_demo_total' | 'catalog';
}

export interface LayoutResult {
  panelQty: number;
  installedKwp: number;
  cols: number;
  rows: number;
  pw: number;
  ph: number;
  orientation: 'portrait' | 'landscape';
  extraRow?: {
    cols: number;
    rotated: boolean;
  };
  dailyKwh: number;
  monthlyKwh: number;
  monthlySavingVnd: number;
  usableAreaM2: number;
  totalRoofAreaM2: number;
}

export interface InverterProposal {
  inverter: InverterModel;
  qtyNeeded: number;
  seriesMin: number;
  seriesMax: number;
  chosenSeries: number;
  totalStrings: number;
  stringsPerInverter: number;
  dcAcRatio: number;
  ratingLabel: '✓ Tối ưu' | '⚠ Chấp nhận được' | '✗ Không khuyến nghị';
  vocCold: number;
  vmppHot: number;
  stringConfigText: string;
}

export interface CableResult {
  cableType: 'LV_MAIN' | 'LV_INVERTER' | 'DC_SOLAR';
  title: string;
  standard: string;
  pKw: number;
  ibA: number;
  izA: number;
  standardCsaMm2: number;
  voltageDropPct: number;
  lengthM: number;
  material: 'Cu' | 'Al';
  method: string;
  status: 'passed' | 'warning' | 'failed';
}

export interface DistributionBoardResult {
  mccbRatedA: number;
  iAcTotalDesignA: number;
  spcDcType: 'Type 2';
  spdAcType: 'Type 2';
  smartMeter: string;
  enclosureType: string;
  status: 'passed';
}

export interface MountingResult {
  supported: boolean;
  unsupportedReason?: string;
  railLengthM: number;
  lFeetQty: number;
  clipLockQty: number;
  midClampQty: number;
  endClampQty: number;
  groundingLugQty: number;
  railJoinerQty: number;
  roofType: RoofType;
}

export interface BomLine {
  id: string;
  categoryCode: MaterialCategoryCode;
  categoryName: string;
  name: string;
  spec: string;
  sku: string;
  unit: string;
  qty: number;
  unitCostVnd: number;
  totalCostVnd: number;
  unitSellVnd: number;
  totalSellVnd: number;
  brand?: string;
  origin?: string;
  note?: string;
}

export interface FinancialResult {
  capexCostVnd: number;
  capexSellVnd: number;
  discountVnd: number;
  vatVnd: number;
  grandTotalVnd: number;
  grossMarginPct: number;
  grossMarginVnd: number;
  investmentRatePreVatVndPerKwp: number; // Suất đầu tư chưa VAT (Vnđ/kWp)
  investmentRatePostVatVndPerKwp: number; // Suất đầu tư có VAT (Vnđ/kWp)
  year1OutputKwh: number;
  year1SavingsVnd: number;
  paybackYears: number;
  irrPct: number;
  performanceRatioPct: number;
  co2ReductionTonsYear: number;
  treesEquivalentYear: number;
  cashflow20Years: Array<{
    year: number;
    degradationFactor: number;
    generatedKwh: number;
    tariffVnd: number;
    annualSavingsVnd: number;
    cumulativeSavingsVnd: number;
    netCashflowVnd: number;
  }>;
}

export interface Project {
  id: string;
  name: string; // Tên dự án / Khách hàng
  customerName: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'saved' | 'approved';
  module: 'solar' | 'bess' | 'solar_bess';

  // Step 1: Customer & Roof
  custType: CustomerType;
  provinceCode: string;
  monthlyConsumptionKwh?: number;
  monthlyElectricityBillVnd?: number;
  roofType: RoofType;
  roofDir: RoofDirection;
  roofShape: RoofShape;
  roofLengthM: number;
  roofWidthM: number;
  roofHeightM: number;
  manualAreaM2?: number;
  roofL1M?: number; // Cánh 1 dài
  roofW1M?: number; // Cánh 1 rộng
  roofL2M?: number; // Cánh 2 dài
  roofW2M?: number; // Cánh 2 rộng

  // Step 2: System Config
  sysType: SystemType;
  phases: PhaseType;
  installMode: InstallMode;
  targetLoadKw?: number;
  manualPanelQty?: number;
  batteryType?: BatteryType;

  // Step 3: Panel Selection & Layout
  selectedPanelId: string;
  layoutResult?: LayoutResult;

  // Step 4: Technical Configuration
  selectedInverterId?: string;
  inverterProposals?: InverterProposal[];
  cableResults?: CableResult[];
  distributionBoard?: DistributionBoardResult;
  mountingResult?: MountingResult;

  // Step 5: Commercial & Pricing
  marginPct: number; // e.g. 18%
  discountPct: number; // e.g. 2%
  pricingTier: 'economy' | 'recommended' | 'premium';
  bomLines?: BomLine[];
  financial?: FinancialResult;
}
