import React from 'react';
import { Project, SystemType, PhaseType, InstallMode, BatteryType } from '../../types/solar';
import { calculateRecommendedCapacityByBill } from '../../engine/layout';
import { getProvinceByCode } from '../../data/provinces';
import { getEffectiveTariffVnd } from '../../data/tariffs';
import { ArrowLeft, ArrowRight, Zap, CheckCircle2, Shield, Battery, Sparkles, Calculator, Check } from 'lucide-react';

interface Step2Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2SystemConfig: React.FC<Step2Props> = ({ project, onUpdate, onNext, onBack }) => {
  const province = getProvinceByCode(project.provinceCode);
  const tariffVnd = getEffectiveTariffVnd(project.custType, project.monthlyConsumptionKwh);

  // Tính toán công suất tối ưu từ hóa đơn tiền điện
  const billCalc = calculateRecommendedCapacityByBill({
    monthlyElectricityBillVnd: project.monthlyElectricityBillVnd,
    monthlyConsumptionKwh: project.monthlyConsumptionKwh,
    irradianceKwhM2Day: province.dailyIrradianceKwhM2,
    roofDir: project.roofDir,
    tariffVnd,
  });

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
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <span className="w-6 h-6 rounded-full bg-[#E4572E] text-white flex items-center justify-center text-xs font-bold">
            4
          </span>
          <h3 className="text-base font-bold text-[#0F2A45]">Pha Điện & Phương Án Khai Thác Mái</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Cấp điện áp pha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Pha Điện Đấu Nối <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
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
                <div className="text-[11px] text-slate-500 mt-0.5">Doanh nghiệp, xưởng, biệt thự</div>
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

          {/* Phương án lắp đặt */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Phương Án Khai Thác Mái <span className="text-red-500">*</span>
            </label>
            <select
              value={project.installMode}
              onChange={(e) => onUpdate({ installMode: e.target.value as InstallMode })}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none font-medium"
            >
              <option value="by_bill">
                ⚡ Tự động tối ưu theo tiền điện đã nhập (~{billCalc.recommendedKwp} kWp)
              </option>
              <option value="full_roof">Tối đa hóa diện tích mái (Lắp full mái)</option>
              <option value="by_load">Lắp theo công suất tải chỉ định (kWp)</option>
              <option value="manual_qty">Nhập số lượng tấm pin chính xác</option>
            </select>

            {project.installMode === 'by_load' && (
              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Công suất hệ thống mong muốn (kWp)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  step="0.5"
                  value={project.targetLoadKw || ''}
                  onChange={(e) => onUpdate({ targetLoadKw: Math.max(1, Number(e.target.value)) })}
                  placeholder={`VD: ${billCalc.recommendedKwp}`}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none font-mono font-bold"
                />
              </div>
            )}

            {project.installMode === 'manual_qty' && (
              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Số lượng tấm pin chỉ định (Tấm)
                </label>
                <input
                  type="number"
                  min="2"
                  max="5000"
                  step="1"
                  value={project.manualPanelQty || ''}
                  onChange={(e) => onUpdate({ manualPanelQty: Math.max(1, Number(e.target.value)) })}
                  placeholder="VD: 60"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none font-mono font-bold"
                />
              </div>
            )}
          </div>
        </div>

        {/* Card Tính Toán & Đề Xuất Công Suất Tối Ưu Từ Tiền Điện Đã Nhập */}
        <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-slate-50 border border-[#E4572E]/25">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F2A45] uppercase tracking-wide">
                <Calculator size={15} className="text-[#E4572E]" />
                <span>Gợi Ý Công Suất Tự Động Từ Tiền Điện Đã Nhập:</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hóa đơn:{' '}
                <strong className="text-slate-900 font-mono">
                  {project.monthlyElectricityBillVnd ? project.monthlyElectricityBillVnd.toLocaleString('vi-VN') + ' đ/tháng' : 'Chưa nhập'}
                </strong>{' '}
                (~{billCalc.estimatedMonthlyKwh.toLocaleString('vi-VN')} kWh) · Bù trừ 70% điện dùng ban ngày bám tải (Zero-Export).
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Công suất đề xuất:</span>
                <span className="text-lg sm:text-xl font-extrabold text-[#E4572E] font-mono">
                  {billCalc.recommendedKwp} kWp
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onUpdate({
                    installMode: 'by_bill',
                    targetLoadKw: billCalc.recommendedKwp,
                  });
                }}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm ${
                  project.installMode === 'by_bill'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0F2A45] hover:bg-[#1E4C7C] text-white'
                }`}
              >
                {project.installMode === 'by_bill' ? (
                  <>
                    <Check size={14} />
                    <span>Đang áp dụng</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Áp dụng gợi ý này</span>
                  </>
                )}
              </button>
            </div>
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
