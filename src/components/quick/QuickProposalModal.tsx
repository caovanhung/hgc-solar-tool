import React, { useState } from 'react';
import { VIETNAM_PROVINCES } from '../../data/provinces';
import { INITIAL_PANELS, INITIAL_INVERTERS, INITIAL_MATERIALS } from '../../data/catalog';
import { calculatePanelLayout } from '../../engine/layout';
import { selectInverters } from '../../engine/inverter';
import { calculateCablingAndBoard } from '../../engine/cabling';
import { calculateMounting } from '../../engine/mounting';
import { generateProjectBom } from '../../engine/bom';
import { calculateFinancials } from '../../engine/financial';
import { getEffectiveTariffVnd } from '../../data/tariffs';
import { Project, RoofType, DEFAULT_SURVEY_CHECKLIST } from '../../types/solar';
import { Zap, X, Check, ArrowRight, Sun, Award, TrendingUp } from 'lucide-react';

interface QuickProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProposal: (generatedProject: Project) => void;
}

export const QuickProposalModal: React.FC<QuickProposalModalProps> = ({
  isOpen,
  onClose,
  onApplyProposal,
}) => {
  const [customerName, setCustomerName] = useState('Khách Hàng Mới');
  const [provinceCode, setProvinceCode] = useState('HAN');
  const [monthlyBillVnd, setMonthlyBillVnd] = useState(12000000); // 12 triệu đ/tháng
  const [roofAreaM2, setRoofAreaM2] = useState(120); // 120 m²
  const [roofType, setRoofType] = useState<RoofType>('tole');
  const [selectedTier, setSelectedTier] = useState<'economy' | 'recommended' | 'premium'>('recommended');

  if (!isOpen) return null;

  const province = VIETNAM_PROVINCES.find((p) => p.code === provinceCode) || VIETNAM_PROVINCES[0];
  const tariffVnd = getEffectiveTariffVnd('sinh_hoat', Math.round(monthlyBillVnd / 2800));

  // Tự động tính toán kích thước mái giả lập (dài = sqrt(area*1.5), rộng = area / dài)
  const roofLengthM = Number(Math.sqrt(roofAreaM2 * 1.5).toFixed(1));
  const roofWidthM = Number((roofAreaM2 / roofLengthM).toFixed(1));

  // 3 Tiers configuration
  // 1. Tiết kiệm (JA Solar 575Wp / Solis)
  // 2. Khuyến nghị (Canadian Solar 585Wp / Huawei)
  // 3. Cao cấp (Jinko 625Wp / Huawei High Tier)
  const generateTierProject = (tier: 'economy' | 'recommended' | 'premium') => {
    let panel = INITIAL_PANELS[0]; // Canadian Solar
    let margin = 18;

    if (tier === 'economy') {
      panel = INITIAL_PANELS.find((p) => p.id === 'ja-575') || INITIAL_PANELS[3];
      margin = 14;
    } else if (tier === 'premium') {
      panel = INITIAL_PANELS.find((p) => p.id === 'jinko-625') || INITIAL_PANELS[4];
      margin = 22;
    }

    const layout = calculatePanelLayout({
      roofLengthM,
      roofWidthM,
      roofShape: 'rect',
      panel,
      installMode: 'full_roof',
      irradianceKwhM2Day: province.dailyIrradianceKwhM2,
      roofDir: 's',
      tariffVnd,
    });

    const inverterProposals = selectInverters({
      installedKwp: layout.installedKwp,
      panelCount: layout.panelQty,
      panel,
      phases: '3',
      sysType: 'zero_export',
      tMinC: province.tMinC,
      tMaxC: province.tMaxC,
      availableInverters: INITIAL_INVERTERS,
    });

    const topInverter = inverterProposals[0];
    const { cables, board } = calculateCablingAndBoard({
      totalAcKw: topInverter ? topInverter.inverter.acKw * topInverter.qtyNeeded : 20,
      inverterKw: topInverter ? topInverter.inverter.acKw : 10,
      phases: '3',
      routeLengthM: 30,
      stringIsc: panel.isc,
    });

    const mounting = calculateMounting(layout, roofType);

    const bomLines = generateProjectBom({
      panel,
      inverter: topInverter?.inverter,
      inverterQty: topInverter?.qtyNeeded || 1,
      layout,
      mounting,
      cables,
      board,
      materialsCatalog: INITIAL_MATERIALS,
      marginPct: margin,
    });

    const financial = calculateFinancials({
      bomLines,
      installedKwp: layout.installedKwp,
      dailyKwh: layout.dailyKwh,
      tariffVnd,
      discountPct: tier === 'economy' ? 3 : 0,
      vatPct: 10,
    });

    const proj: Project = {
      id: `proj-${Date.now()}`,
      name: `${customerName} - ${layout.installedKwp}kWp (${tier.toUpperCase()})`,
      customerName,
      status: 'saved',
      module: 'solar',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      custType: 'sinh_hoat',
      provinceCode,
      monthlyElectricityBillVnd: monthlyBillVnd,
      monthlyConsumptionKwh: Math.round(monthlyBillVnd / tariffVnd),
      roofType,
      roofDir: 's',
      roofShape: 'rect',
      roofLengthM,
      roofWidthM,
      roofHeightM: 10,
      sysType: 'zero_export',
      phases: '3',
      installMode: 'full_roof',
      selectedPanelId: panel.id,
      layoutResult: layout,
      selectedInverterId: topInverter?.inverter.id,
      inverterProposals,
      cableResults: cables,
      distributionBoard: board,
      mountingResult: mounting,
      marginPct: margin,
      discountPct: tier === 'economy' ? 3 : 0,
      pricingTier: tier,
      bomLines,
      financial,
      surveyChecklist: DEFAULT_SURVEY_CHECKLIST,
    };

    return proj;
  };

  const currentProject = generateTierProject(selectedTier);
  const fin = currentProject.financial;
  const layout = currentProject.layoutResult;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-auto animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E4572E] to-[#F2A65A] text-white flex items-center justify-center font-bold">
              <Zap size={18} className="fill-current" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0F2A45]">Báo Giá Nhanh 3 Phút (Quick Quotation)</h3>
              <p className="text-xs text-slate-500">Tự động tối ưu cấu hình và tính giá tức thì cho Salesman</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* 4 Minimal Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Tên Khách Hàng
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#E4572E]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Tỉnh / Thành Phố
            </label>
            <select
              value={provinceCode}
              onChange={(e) => setProvinceCode(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#E4572E]"
            >
              {VIETNAM_PROVINCES.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.dailyIrradianceKwhM2}h)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Tiền Điện Hàng Tháng
            </label>
            <select
              value={monthlyBillVnd}
              onChange={(e) => setMonthlyBillVnd(Number(e.target.value))}
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#E4572E]"
            >
              <option value={5000000}>5 - 7 triệu đ/tháng</option>
              <option value={12000000}>10 - 15 triệu đ/tháng</option>
              <option value={25000000}>20 - 30 triệu đ/tháng</option>
              <option value={50000000}>40 - 60 triệu đ/tháng</option>
              <option value={100000000}>80 - 120 triệu đ/tháng</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Diện Tích Mái Ước Tính
            </label>
            <div className="relative">
              <input
                type="number"
                min="20"
                step="10"
                value={roofAreaM2}
                onChange={(e) => setRoofAreaM2(Math.max(20, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#E4572E]"
              />
              <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-mono">m²</span>
            </div>
          </div>
        </div>

        {/* 3 Proposal Tiers Selector */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
            Chọn 1 Trong 3 Phương Án Đề Xuất Tự Động:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tier 1: Tiết kiệm */}
            <div
              onClick={() => setSelectedTier('economy')}
              className={`cursor-pointer rounded-xl p-3.5 border-2 transition-all relative ${
                selectedTier === 'economy'
                  ? 'border-emerald-500 bg-emerald-50/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Gói Tiết Kiệm (Economy)
              </div>
              <div className="text-sm font-bold text-[#0F2A45] mt-0.5">JA Solar 575Wp</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Tối ưu chi phí đầu tư ban đầu, hoàn vốn nhanh nhất.
              </p>
              {selectedTier === 'economy' && (
                <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check size={10} strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Tier 2: Khuyến nghị */}
            <div
              onClick={() => setSelectedTier('recommended')}
              className={`cursor-pointer rounded-xl p-3.5 border-2 transition-all relative ${
                selectedTier === 'recommended'
                  ? 'border-[#E4572E] bg-orange-50/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-[10px] font-bold text-[#E4572E] uppercase tracking-wider flex items-center gap-1">
                <Award size={12} />
                <span>Khuyến Nghị (Best Value)</span>
              </div>
              <div className="text-sm font-bold text-[#0F2A45] mt-0.5">Canadian Solar 585Wp</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Cân bằng hoàn hảo giữa hiệu suất N-Type TOPCon và độ bền 25 năm.
              </p>
              {selectedTier === 'recommended' && (
                <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#E4572E] text-white flex items-center justify-center">
                  <Check size={10} strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Tier 3: Cao cấp */}
            <div
              onClick={() => setSelectedTier('premium')}
              className={`cursor-pointer rounded-xl p-3.5 border-2 transition-all relative ${
                selectedTier === 'premium'
                  ? 'border-indigo-600 bg-indigo-50/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                Cao Cấp (Premium 30 Năm)
              </div>
              <div className="text-sm font-bold text-[#0F2A45] mt-0.5">Jinko Solar 625Wp</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Công suất đỉnh cao, bảo hành hiệu suất 30 năm, Inverter cao cấp.
              </p>
              {selectedTier === 'premium' && (
                <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <Check size={10} strokeWidth={3} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calculated Result Overview for this Proposal */}
        {layout && fin && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center mb-6">
            <div>
              <span className="text-[11px] text-slate-400 block uppercase">Công suất:</span>
              <strong className="text-xl font-mono font-extrabold text-[#0F2A45]">
                {layout.installedKwp} kWp
              </strong>
              <span className="text-[11px] text-slate-500 block">({layout.panelQty} tấm pin)</span>
            </div>

            <div>
              <span className="text-[11px] text-emerald-800 font-bold block uppercase">Suất đầu tư:</span>
              <strong className="text-xl font-mono font-black text-emerald-700">
                {Math.round(fin.investmentRatePostVatVndPerKwp / 1000000 * 10) / 10} tr
              </strong>
              <span className="text-[10px] text-emerald-700 font-mono block">
                {fin.investmentRatePostVatVndPerKwp.toLocaleString('vi-VN')} đ/kWp
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block uppercase">Sản lượng tháng:</span>
              <strong className="text-xl font-mono font-extrabold text-slate-800">
                {layout.monthlyKwh.toLocaleString('vi-VN')}
              </strong>
              <span className="text-[11px] text-slate-500 block">kWh / tháng</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block uppercase">Tiết kiệm năm 1:</span>
              <strong className="text-xl font-mono font-extrabold text-[#E4572E]">
                {Math.round(fin.year1SavingsVnd / 1000000)} tr
              </strong>
              <span className="text-[11px] text-slate-500 block">Hoàn vốn: {fin.paybackYears} năm</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block uppercase">Tổng Báo Giá (VAT):</span>
              <strong className="text-xl font-mono font-black text-[#0F2A45]">
                {Math.round(fin.grandTotalVnd / 1000000)} tr
              </strong>
              <span className="text-[11px] text-emerald-700 font-semibold block">IRR {fin.irrPct}%</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onApplyProposal(currentProject);
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#E4572E] to-[#F2A65A] text-white font-bold text-xs shadow hover:brightness-105 transition-all"
          >
            <span>Áp dụng phương án này & Xem thiết kế</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
