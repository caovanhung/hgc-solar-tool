import React, { useState } from 'react';
import { Project, PanelModel } from '../../types/solar';
import { INITIAL_PANELS } from '../../data/catalog';
import { RoofCanvas } from '../layout/RoofCanvas';
import { ArrowLeft, ArrowRight, Zap, Check, ShieldCheck, Sun, Layers, Sparkles, Maximize2 } from 'lucide-react';

interface Step3Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onComputeLayout: (panel: PanelModel) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3PanelLayout: React.FC<Step3Props> = ({
  project,
  onUpdate,
  onComputeLayout,
  onNext,
  onBack,
}) => {
  const [brandFilter, setBrandFilter] = useState<string>('all');

  const selectedPanel =
    INITIAL_PANELS.find((p) => p.id === project.selectedPanelId) || INITIAL_PANELS[0];

  const brands = ['all', ...Array.from(new Set(INITIAL_PANELS.map((p) => p.brand)))];

  const filteredPanels = INITIAL_PANELS.filter(
    (p) => brandFilter === 'all' || p.brand === brandFilter
  );

  const handleSelectPanel = (panel: PanelModel) => {
    onUpdate({ selectedPanelId: panel.id });
    onComputeLayout(panel);
  };

  const layout = project.layoutResult;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 4 KPI Summary Cards (Real-time computed) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
            <span>Công Suất Lắp Đặt</span>
            <Zap size={14} className="text-[#E4572E]" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0F2A45] font-mono">
              {layout ? layout.installedKwp : '0'}
            </span>
            <span className="text-xs font-bold text-slate-600">kWp</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {layout ? `Tổng diện tích pin: ${(layout.panelQty * (selectedPanel.lengthMm / 1000) * (selectedPanel.widthMm / 1000)).toFixed(0)} m²` : 'Chờ tính toán'}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
            <span>Số Lượng Tấm Pin</span>
            <Layers size={14} className="text-cyan-600" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0F2A45] font-mono">
              {layout ? layout.panelQty : '0'}
            </span>
            <span className="text-xs font-bold text-slate-600">tấm</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {layout ? (
              layout.maxRoofPanels && layout.panelQty < layout.maxRoofPanels
                ? `Bám tải ${layout.panelQty}/${layout.maxRoofPanels} vị trí (${Math.round((layout.panelQty / layout.maxRoofPanels) * 100)}% mái)`
                : `Lắp kín 100% mái (${layout.cols} cột × ${layout.rows} hàng)`
            ) : 'Chờ tính toán'}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
            <span>Sản Lượng Điện / Ngày</span>
            <Sun size={14} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
              {layout ? layout.dailyKwh : '0'}
            </span>
            <span className="text-xs font-bold text-slate-600">kWh / ngày</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {layout ? `~${layout.monthlyKwh.toLocaleString('vi-VN')} kWh / tháng` : 'Chờ tính toán'}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
            <span>Tiết Kiệm Ước Tính</span>
            <Sparkles size={14} className="text-[#E4572E]" />
          </div>
          <div className="flex items-baseline gap-1 mt-1 truncate">
            <span className="text-xl sm:text-2xl font-extrabold text-[#E4572E] font-mono truncate">
              {layout ? layout.monthlySavingVnd.toLocaleString('vi-VN') : '0'}
            </span>
            <span className="text-[11px] font-bold text-slate-600">đ/tháng</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Theo biểu giá QĐ 1279 EVN
          </div>
        </div>
      </div>

      {/* Main Grid: Panel Selector (Left) & Live Roof Layout Canvas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Panel Catalog Picker */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-[#0F2A45] uppercase tracking-wide">
                  1. Chọn Model Tấm Pin NLMT
                </h3>
                <p className="text-[11px] text-slate-500">Tier-1 Bloomberg NEF · Bảo hành 25-30 năm</p>
              </div>
            </div>

            {/* Brand Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-3 scrollbar-thin">
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setBrandFilter(b)}
                  className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap font-medium transition-all ${
                    brandFilter === b
                      ? 'bg-[#0F2A45] text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {b === 'all' ? 'Tất cả hãng' : b}
                </button>
              ))}
            </div>

            {/* Panel Cards List */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredPanels.map((panel) => {
                const isSelected = selectedPanel.id === panel.id;
                return (
                  <div
                    key={panel.id}
                    onClick={() => handleSelectPanel(panel)}
                    className={`cursor-pointer rounded-xl p-3.5 border transition-all text-left relative ${
                      isSelected
                        ? 'border-[#E4572E] bg-orange-50/20 ring-1 ring-[#E4572E] shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">{panel.brand}</span>
                          <span className="text-[10px] text-slate-500 font-mono">· {panel.tech}</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-[#0F2A45] mt-0.5">{panel.model}</h4>
                      </div>

                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 bg-[#0F2A45] text-white text-xs font-mono font-bold rounded">
                          {panel.wp} Wp
                        </span>
                        <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                          {panel.efficiencyPct}% hiệu suất
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400">Voc:</span>{' '}
                        <strong className="font-mono text-slate-700">{panel.voc}V</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Vmpp:</span>{' '}
                        <strong className="font-mono text-slate-700">{panel.vmpp}V</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Isc:</span>{' '}
                        <strong className="font-mono text-slate-700">{panel.isc}A</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-slate-400">
                      <span>{panel.lengthMm} × {panel.widthMm} mm</span>
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <ShieldCheck size={12} /> Verified NSX
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#E4572E] text-white flex items-center justify-center shadow">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Recalculate CTA */}
            <button
              onClick={() => onComputeLayout(selectedPanel)}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-[#E4572E] to-[#F2A65A] text-white font-bold text-xs uppercase tracking-wider shadow hover:brightness-105 active:scale-98 transition-all"
            >
              <Zap size={15} className="fill-current" />
              <span>⚡ Tính toán & Tự động xếp tấm</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive 2D Roof Layout */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-[#0F2A45] uppercase tracking-wide">
                  2. Sơ Đồ Bố Trí Tấm Pin Trên Mặt Mái (2D Layout)
                </h3>
                <p className="text-[11px] text-slate-500">Mô phỏng kích thước thực tế, hướng la bàn và khoảng lùi an toàn</p>
              </div>

              {/* Chuyển nhanh giữa phương án bám tải và full mái */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdate({ installMode: 'by_bill' })}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                    project.installMode === 'by_bill'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  title="Phương án bám tải hóa đơn"
                >
                  <Zap size={12} />
                  <span>Theo tiền điện</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ installMode: 'full_roof' })}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                    project.installMode === 'full_roof'
                      ? 'bg-[#0F2A45] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  title="Phương án phủ kín 100% mái"
                >
                  <Maximize2 size={12} />
                  <span>Lắp Full mái</span>
                </button>
              </div>
            </div>

            {layout ? (
              <RoofCanvas
                layout={layout}
                panel={selectedPanel}
                roofLengthM={project.roofLengthM}
                roofWidthM={project.roofWidthM}
                roofDir={project.roofDir}
                roofType={project.roofType}
                roofShape={project.roofShape}
                roofL1M={project.roofL1M}
                roofW1M={project.roofW1M}
                roofL2M={project.roofL2M}
                roofW2M={project.roofW2M}
              />
            ) : (
              <div className="h-72 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                <Sun size={32} className="animate-spin text-slate-300 mb-2" />
                <span className="text-xs">Đang xếp tấm pin theo kích thước mái...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-all"
        >
          <ArrowLeft size={16} />
          <span>Quay lại: Cấu hình</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E4572E] hover:bg-[#d04922] text-white font-bold text-sm shadow-sm transition-all"
        >
          <span>Tiếp tục: Kết quả kỹ thuật</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
