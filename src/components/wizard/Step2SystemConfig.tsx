import React, { useState } from 'react';
import { Project, SystemType, PhaseType, InstallMode, BatteryType } from '../../types/solar';
import { calculateRecommendedCapacityByBill, calculatePanelLayout } from '../../engine/layout';
import { INITIAL_PANELS } from '../../data/catalog';
import { getProvinceByCode } from '../../data/provinces';
import { getEffectiveTariffVnd } from '../../data/tariffs';
import { ArrowLeft, ArrowRight, Zap, CheckCircle2, Shield, Battery, Sparkles, Calculator, Check, Maximize2, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

interface Step2Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2SystemConfig: React.FC<Step2Props> = ({ project, onUpdate, onNext, onBack }) => {
  const [showAdvancedModes, setShowAdvancedModes] = useState(
    project.installMode === 'by_load' || project.installMode === 'manual_qty'
  );

  const province = getProvinceByCode(project.provinceCode);
  const tariffVnd = getEffectiveTariffVnd(project.custType, project.monthlyConsumptionKwh);
  const selectedPanel = INITIAL_PANELS.find((p) => p.id === project.selectedPanelId) || INITIAL_PANELS[0];

  // 1. Tính toán phương án theo hóa đơn tiền điện
  const billCalc = calculateRecommendedCapacityByBill({
    monthlyElectricityBillVnd: project.monthlyElectricityBillVnd,
    monthlyConsumptionKwh: project.monthlyConsumptionKwh,
    irradianceKwhM2Day: province.dailyIrradianceKwhM2,
    roofDir: project.roofDir,
    tariffVnd,
  });

  const billRecommendedKwp = billCalc.recommendedKwp;
  const billPanelQty = Math.ceil((billRecommendedKwp * 1000) / selectedPanel.wp);

  // 2. Tính toán phương án tối đa diện tích mái (Full mái)
  const fullRoofCalc = calculatePanelLayout({
    roofLengthM: project.roofLengthM,
    roofWidthM: project.roofWidthM,
    roofShape: project.roofShape,
    manualAreaM2: project.manualAreaM2,
    roofL1M: project.roofL1M,
    roofW1M: project.roofW1M,
    roofL2M: project.roofL2M,
    roofW2M: project.roofW2M,
    panel: selectedPanel,
    installMode: 'full_roof',
    irradianceKwhM2Day: province.dailyIrradianceKwhM2,
    roofDir: project.roofDir,
    tariffVnd,
  });

  const fullRoofKwp = fullRoofCalc.installedKwp;
  const fullRoofPanelQty = fullRoofCalc.panelQty;
  const fullRoofAreaM2 = project.roofShape === 'manual'
    ? (project.manualAreaM2 || 100)
    : Math.round(project.roofLengthM * project.roofWidthM);

  const systemTypeExplanations: Record<SystemType, { title: string; desc: string; badge: string; highlight: boolean }> = {
    zero_export: {
      title: 'Hòa lưới bám tải (Zero-Export)',
      desc: 'Inverter tự động điều chỉnh công suất bám sát tải tiêu thụ tức thời của công trình, không phát ngược điện dư lên lưới điện EVN. Cần Smart Meter & CT. Phù hợp chính sách hiện hành.',
      badge: 'Khuyến nghị 2026',
      highlight: true,
    },
    on_grid: {
      title: 'Hòa lưới tự do (On-Grid)',
      desc: 'Inverter phát tối đa công suất lên lưới điện nội bộ. Phần điện dư không được tính giá mua lại từ EVN theo quy định mới.',
      badge: 'Cơ bản',
      highlight: false,
    },
    hybrid: {
      title: 'Hệ thống Hybrid (Lưu trữ ESS)',
      desc: 'Kết hợp điện mặt trời, pin lưu trữ Lithium và lưới điện. Đảm bảo nguồn điện liên tục cho các tải ưu tiên khi mất điện lưới.',
      badge: 'Cao cấp',
      highlight: false,
    },
    off_grid: {
      title: 'Độc lập hoàn toàn (Off-Grid)',
      desc: 'Hệ thống độc lập không đấu nối lưới điện quốc gia. Sử dụng cho vùng sâu vùng xa, hải đảo hoặc trạm viễn thông.',
      badge: 'Đặc thù',
      highlight: false,
    },
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Box 1: Lựa chọn loại hệ thống */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#E4572E] text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            <h3 className="text-base font-bold text-[#0F2A45]">Mô Hình Vận Hành Hệ Thống</h3>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">Chọn cơ chế đấu nối điện</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {(['zero_export', 'on_grid', 'hybrid', 'off_grid'] as SystemType[]).map((type) => {
            const info = systemTypeExplanations[type];
            const isSelected = project.sysType === type;

            return (
              <div
                key={type}
                onClick={() => onUpdate({ sysType: type })}
                className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative ${
                  isSelected
                    ? 'border-[#E4572E] bg-orange-50/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-[#E4572E]' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#E4572E]"></div>}
                    </div>
                    <span className="font-bold text-sm text-[#0F2A45]">{info.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      info.highlight
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {info.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">{info.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Lựa chọn Pin lưu trữ nếu chọn Hybrid */}
        {project.sysType === 'hybrid' && (
          <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Battery size={15} className="text-[#E4572E]" />
              <span>Loại Pin Lưu Trữ Năng Lượng (BESS)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`cursor-pointer flex items-center gap-3 p-3 rounded-lg border text-xs ${
                  project.batteryType === 'lfp'
                    ? 'border-[#E4572E] bg-white font-bold text-slate-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="batteryType"
                  checked={project.batteryType === 'lfp'}
                  onChange={() => onUpdate({ batteryType: 'lfp' })}
                  className="accent-[#E4572E]"
                />
                <div>
                  <div className="text-slate-900 font-semibold">Lithium LFP (LiFePO4)</div>
                  <div className="text-[11px] text-slate-500 font-normal">Độ xả sâu DoD 80-90%, tuổi thọ 6,000 chu kỳ</div>
                </div>
              </label>

              <label
                className={`cursor-pointer flex items-center gap-3 p-3 rounded-lg border text-xs ${
                  project.batteryType === 'gel'
                    ? 'border-[#E4572E] bg-white font-bold text-slate-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="batteryType"
                  checked={project.batteryType === 'gel'}
                  onChange={() => onUpdate({ batteryType: 'gel' })}
                  className="accent-[#E4572E]"
                />
                <div>
                  <div className="text-slate-900 font-semibold">GEL / AGM Kín Khí</div>
                  <div className="text-[11px] text-slate-500 font-normal">Độ xả sâu DoD 50%, chi phí đầu tư ban đầu thấp hơn</div>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Box 2: Cấp điện áp Pha & Phương án lắp đặt */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="w-6 h-6 rounded-full bg-[#E4572E] text-white flex items-center justify-center text-xs font-bold">
            4
          </span>
          <h3 className="text-base font-bold text-[#0F2A45]">Pha Điện & Phương Án Khai Thác Mái</h3>
        </div>

        {/* Cấp điện áp pha */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
            Pha Điện Đấu Nối <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <button
              type="button"
              onClick={() => onUpdate({ phases: '3' })}
              className={`p-3 rounded-lg border text-left transition-all ${
                project.phases === '3'
                  ? 'border-[#E4572E] bg-orange-50/20 shadow-sm font-bold text-[#0F2A45]'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="text-sm font-bold">3 Pha (380V)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Doanh nghiệp, xưởng sản xuất, biệt thự</div>
            </button>

            <button
              type="button"
              onClick={() => onUpdate({ phases: '1' })}
              className={`p-3 rounded-lg border text-left transition-all ${
                project.phases === '1'
                  ? 'border-[#E4572E] bg-orange-50/20 shadow-sm font-bold text-[#0F2A45]'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="text-sm font-bold">1 Pha (220V)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Hộ gia đình nhỏ ≤ 10kW</div>
            </button>
          </div>
        </div>

        {/* 2 Thẻ Phương Án Khai Thác Mái So Sánh Trực Quan */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Phương Án Khai Thác Mái <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-slate-500">
              Chọn phương án phù hợp với nhu cầu & ngân sách khách hàng
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* THẺ PHƯƠNG ÁN 1: THEO TIỀN ĐIỆN (ZERO-EXPORT) */}
            <div
              onClick={() => onUpdate({ installMode: 'by_bill', targetLoadKw: billRecommendedKwp })}
              className={`cursor-pointer rounded-xl p-4 sm:p-5 border-2 transition-all relative flex flex-col justify-between ${
                project.installMode === 'by_bill'
                  ? 'border-[#E4572E] bg-gradient-to-br from-orange-50/60 via-amber-50/30 to-white shadow-md'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#E4572E] flex items-center justify-center shrink-0">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0F2A45]">
                        Tối Ưu Theo Tiền Điện (Bám Tải)
                      </h4>
                      <span className="text-[11px] text-slate-500">Chuẩn QĐ 1279 Zero-Export</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                    Khuyến nghị kinh tế
                  </span>
                </div>

                {/* Con số công suất to nổi bật */}
                <div className="my-3 p-3 rounded-lg bg-white/90 border border-slate-200/80 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Công suất đề xuất:</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#E4572E] font-mono">
                        {billRecommendedKwp}
                      </span>
                      <span className="text-sm font-bold text-slate-700">kWp</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block font-medium">Số lượng pin:</span>
                    <span className="text-base sm:text-lg font-bold text-[#0F2A45] font-mono">
                      ~{billPanelQty} tấm
                    </span>
                  </div>
                </div>

                <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed mb-4">
                  <li className="flex items-start gap-1.5">
                    <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Hóa đơn: <strong>{project.monthlyElectricityBillVnd ? project.monthlyElectricityBillVnd.toLocaleString('vi-VN') + ' đ/tháng' : 'Theo mức tiêu thụ'}</strong> (~{billCalc.estimatedMonthlyKwh.toLocaleString('vi-VN')} kWh).
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Bù trừ 70% điện dùng ban ngày, hoàn vốn nhanh nhất (4.5 - 5.5 năm).</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Không phát thừa lên lưới EVN, diện tích mái còn lại để lối đi & dự phòng.</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  project.installMode === 'by_bill'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {project.installMode === 'by_bill' ? (
                  <>
                    <Check size={15} />
                    <span>ĐANG ÁP DỤNG PHƯƠNG ÁN NÀY</span>
                  </>
                ) : (
                  <span>Áp Dụng Phương Án Này</span>
                )}
              </button>
            </div>

            {/* THẺ PHƯƠNG ÁN 2: LẮP FULL MÁI (TỐI ĐA DIỆN TÍCH) */}
            <div
              onClick={() => onUpdate({ installMode: 'full_roof' })}
              className={`cursor-pointer rounded-xl p-4 sm:p-5 border-2 transition-all relative flex flex-col justify-between ${
                project.installMode === 'full_roof'
                  ? 'border-[#E4572E] bg-gradient-to-br from-blue-50/60 via-slate-50/40 to-white shadow-md'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                      <Maximize2 size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0F2A45]">
                        Tối Đa Hóa Diện Tích (Lắp Full Mái)
                      </h4>
                      <span className="text-[11px] text-slate-500">Khai thác 100% tiềm năng mái</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 shrink-0">
                    Tối đa công suất
                  </span>
                </div>

                {/* Con số công suất to nổi bật */}
                <div className="my-3 p-3 rounded-lg bg-white/90 border border-slate-200/80 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Công suất tối đa mái:</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#0F2A45] font-mono">
                        {fullRoofKwp}
                      </span>
                      <span className="text-sm font-bold text-slate-700">kWp</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block font-medium">Số lượng pin:</span>
                    <span className="text-base sm:text-lg font-bold text-[#E4572E] font-mono">
                      {fullRoofPanelQty} tấm
                    </span>
                  </div>
                </div>

                <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed mb-4">
                  <li className="flex items-start gap-1.5">
                    <Check size={14} className="text-cyan-700 shrink-0 mt-0.5" />
                    <span>
                      Phủ kín diện tích mái: <strong>{fullRoofAreaM2} m²</strong> ({fullRoofCalc.cols} cột × {fullRoofCalc.rows} hàng).
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check size={14} className="text-cyan-700 shrink-0 mt-0.5" />
                    <span>Sản lượng điện tối đa (~{fullRoofCalc.monthlyKwh.toLocaleString('vi-VN')} kWh/tháng).</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check size={14} className="text-cyan-700 shrink-0 mt-0.5" />
                    <span>Suất đầu tư/kWp rẻ hơn, sẵn sàng mở rộng tải tiêu thụ hoặc lắp pin lưu trữ ESS.</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  project.installMode === 'full_roof'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {project.installMode === 'full_roof' ? (
                  <>
                    <Check size={15} />
                    <span>ĐANG ÁP DỤNG PHƯƠNG ÁN NÀY</span>
                  </>
                ) : (
                  <span>Áp Dụng Phương Án Này</span>
                )}
              </button>
            </div>
          </div>

          {/* Tùy chọn nâng cao (By Load & Manual Qty) */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdvancedModes(!showAdvancedModes)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-all"
            >
              <Sliders size={14} />
              <span>Tùy chọn khai thác nâng cao khác (Chỉ định kWp tải hoặc số lượng tấm pin cụ thể)</span>
              {showAdvancedModes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdvancedModes && (
              <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                <div
                  onClick={() => onUpdate({ installMode: 'by_load', targetLoadKw: project.targetLoadKw || billRecommendedKwp })}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    project.installMode === 'by_load'
                      ? 'border-[#E4572E] bg-white shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#0F2A45]">Chỉ định công suất mong muốn (kWp)</span>
                    {project.installMode === 'by_load' && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Đang chọn</span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="0.5"
                    value={project.targetLoadKw || ''}
                    onChange={(e) => onUpdate({ installMode: 'by_load', targetLoadKw: Math.max(1, Number(e.target.value)) })}
                    placeholder={`VD: ${billRecommendedKwp}`}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">Hệ thống sẽ tự tính số tấm pin tương ứng</span>
                </div>

                <div
                  onClick={() => onUpdate({ installMode: 'manual_qty', manualPanelQty: project.manualPanelQty || billPanelQty })}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    project.installMode === 'manual_qty'
                      ? 'border-[#E4572E] bg-white shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#0F2A45]">Chỉ định số lượng tấm pin chính xác</span>
                    {project.installMode === 'manual_qty' && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Đang chọn</span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="2"
                    max="5000"
                    step="1"
                    value={project.manualPanelQty || ''}
                    onChange={(e) => onUpdate({ installMode: 'manual_qty', manualPanelQty: Math.max(1, Number(e.target.value)) })}
                    placeholder={`VD: ${billPanelQty}`}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">Tối đa mặt bằng mái: {fullRoofPanelQty} tấm</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-all"
        >
          <ArrowLeft size={16} />
          <span>Quay lại: Bước 1</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E4572E] hover:bg-[#d04922] text-white font-bold text-sm shadow-sm transition-all"
        >
          <span>Tiếp tục: Chọn tấm pin & Xếp mái</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
