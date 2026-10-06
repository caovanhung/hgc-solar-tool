import React, { useState } from 'react';
import { Project, InverterProposal, CableResult, DistributionBoardResult, MountingResult, PanelModel } from '../../types/solar';
import { INITIAL_INVERTERS, INITIAL_PANELS } from '../../data/catalog';
import { SingleLineDiagram } from '../layout/SingleLineDiagram';
import { HgcCommissioningModal } from './HgcCommissioningModal';
import {
  Zap,
  Cable,
  Wrench,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Info,
  FileCheck,
} from 'lucide-react';

interface Step4Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onSelectInverterProposal: (proposal: InverterProposal) => void;
  onNext: () => void;
  onBack: () => void;
  userRole: 'ky_su' | 'sales' | 'admin';
}

export const Step4TechnicalResults: React.FC<Step4Props> = ({
  project,
  onUpdate,
  onSelectInverterProposal,
  onNext,
  onBack,
  userRole,
}) => {
  // Toggle Đơn giản / Chi tiết
  const [detailMode, setDetailMode] = useState<boolean>(userRole === 'ky_su');
  const [showHgcGuide, setShowHgcGuide] = useState<boolean>(false);

  // Trạng thái mở/đóng từng thẻ
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    inverter: true,
    cables: false,
    mounting: false,
    board: false,
  });

  const toggleCard = (key: string) => {
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedPanel =
    INITIAL_PANELS.find((p) => p.id === project.selectedPanelId) || INITIAL_PANELS[0];

  const proposals = project.inverterProposals || [];
  const selectedProposal =
    proposals.find((p) => p.inverter.id === project.selectedInverterId) || proposals[0];

  const cables = project.cableResults || [];
  const board = project.distributionBoard;
  const mounting = project.mountingResult;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Mode Toggle Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#E4572E] text-white flex items-center justify-center text-xs font-bold">
              4
            </span>
            <h3 className="text-base font-bold text-[#0F2A45]">
              Kết Quả Tính Toán Kỹ Thuật (Calculation Engine)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tự động kế thừa từ giàn pin {project.layoutResult?.installedKwp || 0} kWp · Chuẩn IEC 62548 · IEC 60364-5-52 · TCVN 9207
          </p>
        </div>

        {/* Buttons & View Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowHgcGuide(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs shadow-2xs transition-all"
            title="Xem quy trình đóng điện 6 bước, chuẩn kẹp CT và cẩm nang xử lý 5 sự cố thường gặp HGC"
          >
            <FileCheck size={14} className="text-emerald-700" />
            <span>Cẩm Nang Nghiệm Thu & Sự Cố HGC</span>
          </button>

          {/* View Toggle: Đơn Giản (Sales) vs Chi Tiết (Kỹ Sư) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setDetailMode(false)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                !detailMode
                  ? 'bg-white text-[#0F2A45] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sales
            </button>
            <button
              onClick={() => setDetailMode(true)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                detailMode
                  ? 'bg-[#0F2A45] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal size={12} />
              <span>Kỹ Sư</span>
            </button>
          </div>
        </div>
      </div>

      {/* Card 1: INVERTER VÀ CẤU HÌNH CHUỖI STRING */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div
          onClick={() => toggleCard('inverter')}
          className="p-4 sm:p-5 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E4572E] flex items-center justify-center font-bold">
              <Zap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#0F2A45]">Biến Tần Inverter & Cấu Hình Chuỗi</h4>
                {selectedProposal && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedProposal.ratingLabel === '✓ Tối ưu'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedProposal.ratingLabel === '⚠ Chấp nhận được'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedProposal.ratingLabel}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {selectedProposal ? (
                  <span>
                    <strong>
                      {selectedProposal.qtyNeeded}× {selectedProposal.inverter.brand} {selectedProposal.inverter.model}
                    </strong>{' '}
                    ({selectedProposal.inverter.acKw * selectedProposal.qtyNeeded} kW AC) · Tỷ lệ DC/AC:{' '}
                    <strong className="text-emerald-600">{selectedProposal.dcAcRatio}</strong> ·{' '}
                    {selectedProposal.stringConfigText}
                  </span>
                ) : (
                  'Chưa chọn Inverter'
                )}
              </p>
            </div>
          </div>
          <button className="text-slate-400 p-1">
            {expandedCards.inverter ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {(expandedCards.inverter || detailMode) && (
          <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Danh Sách Inverter Đề Xuất Phù Hợp (Chuẩn IEC 62548):
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0F2A45] text-white text-[11px] uppercase font-bold font-mono">
                  <tr>
                    <th className="px-3 py-2.5">Hãng / Model</th>
                    <th className="px-3 py-2.5">CS AC (kW)</th>
                    <th className="px-3 py-2.5">Số Bộ</th>
                    <th className="px-3 py-2.5">Cấu Hình Chuỗi (String)</th>
                    <th className="px-3 py-2.5">Tỷ Lệ DC/AC</th>
                    <th className="px-3 py-2.5">Đánh Giá</th>
                    <th className="px-3 py-2.5 text-center">Lựa Chọn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposals.map((prop) => {
                    const isPicked = selectedProposal?.inverter.id === prop.inverter.id;
                    return (
                      <tr
                        key={prop.inverter.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isPicked ? 'bg-orange-50/40 font-semibold' : ''
                        }`}
                      >
                        <td className="px-3 py-3">
                          <div className="font-bold text-slate-900">{prop.inverter.brand}</div>
                          <div className="text-slate-500 font-mono text-[11px]">{prop.inverter.model}</div>
                        </td>
                        <td className="px-3 py-3 font-mono font-bold text-slate-800">
                          {prop.inverter.acKw} kW
                        </td>
                        <td className="px-3 py-3 font-mono font-bold text-slate-800">
                          {prop.qtyNeeded} bộ
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-700">
                          <div>{prop.stringConfigText}</div>
                          <div className="text-[10px] text-slate-400">
                            Voc max ({prop.vocCold}V) ≤ {prop.inverter.vdcMax}V
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono font-bold">
                          <span
                            className={
                              prop.dcAcRatio >= 1.15 && prop.dcAcRatio <= 1.3
                                ? 'text-emerald-600'
                                : 'text-slate-700'
                            }
                          >
                            {prop.dcAcRatio}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              prop.ratingLabel === '✓ Tối ưu'
                                ? 'bg-emerald-100 text-emerald-800'
                                : prop.ratingLabel === '⚠ Chấp nhận được'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {prop.ratingLabel}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => {
                              onSelectInverterProposal(prop);
                              onUpdate({ selectedInverterId: prop.inverter.id });
                            }}
                            className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${
                              isPicked
                                ? 'bg-[#E4572E] text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isPicked ? 'Đang chọn' : 'Chọn'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {detailMode && selectedProposal && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-400">Vdc cực đại cho phép:</span>{' '}
                  <strong className="text-slate-800 font-mono">{selectedProposal.inverter.vdcMax}V</strong>
                </div>
                <div>
                  <span className="text-slate-400">Dải điện áp MPPT:</span>{' '}
                  <strong className="text-slate-800 font-mono">
                    {selectedProposal.inverter.mpptVmin} - {selectedProposal.inverter.mpptVmax}V
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Dòng Isc max mỗi MPPT:</span>{' '}
                  <strong className="text-slate-800 font-mono">{selectedProposal.inverter.mpptMaxIsc}A</strong>
                </div>
                <div>
                  <span className="text-slate-400">Hiệu suất cực đại:</span>{' '}
                  <strong className="text-emerald-600 font-mono">
                    {selectedProposal.inverter.maxEfficiencyPct}%
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card 2: DÂY DẪN & MÁNG CÁP */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div
          onClick={() => toggleCard('cables')}
          className="p-4 sm:p-5 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
              <Cable size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#0F2A45]">Dây Dẫn & Máng Cáp Hạ Thế / DC</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  ✓ Đạt chuẩn IEC 60364-5-52
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Cáp AC tổng: <strong>Cu {cables[0]?.standardCsaMm2 || 16} mm²</strong> (Sụt áp:{' '}
                {cables[0]?.voltageDropPct || 1.1}%) · Cáp DC Solar 1500V: <strong>Cu 4.0 mm²</strong>
              </p>
            </div>
          </div>
          <button className="text-slate-400 p-1">
            {expandedCards.cables ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {(expandedCards.cables || detailMode) && (
          <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {cables.map((c, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-[#0F2A45]">{c.title}</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Đạt
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tiết diện chuẩn:</span>
                      <strong className="font-mono text-slate-900">{c.standardCsaMm2} mm² ({c.material})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dòng tải tính toán (Ib):</span>
                      <strong className="font-mono text-slate-900">{c.ibA} A</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dòng cho phép (Iz):</span>
                      <strong className="font-mono text-emerald-700">{c.izA} A</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Độ sụt áp (ΔU%):</span>
                      <strong className="font-mono text-emerald-700">{c.voltageDropPct}% (≤ 3.0%)</strong>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 truncate">
                    {c.method}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card 3: KHUNG GIÁ ĐỠ & MOUNTING */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div
          onClick={() => toggleCard('mounting')}
          className="p-4 sm:p-5 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Wrench size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#0F2A45]">Khung Giá Đỡ & Kết Cấu Mounting</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  ✓ Chuẩn Chống Bão TCVN 2737
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Nhôm đúc Al6005-T5 Anodized · Kẹp sóng tôn Seam / Chân L chống dột · Inox 304
              </p>
            </div>
          </div>
          <button className="text-slate-400 p-1">
            {expandedCards.mounting ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {(expandedCards.mounting || detailMode) && mounting && (
          <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Thanh Rail Nhôm:</span>
                <strong className="text-slate-900 font-mono text-sm">{mounting.railLengthM} m</strong>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">
                  {mounting.roofType === 'tole' ? 'Kẹp tôn Cliplock:' : 'Chân chữ L:'}
                </span>
                <strong className="text-slate-900 font-mono text-sm">
                  {mounting.roofType === 'tole' ? mounting.clipLockQty : mounting.lFeetQty} bộ
                </strong>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Kẹp giữa (Mid Clamp):</span>
                <strong className="text-slate-900 font-mono text-sm">{mounting.midClampQty} bộ</strong>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Kẹp biên (End Clamp):</span>
                <strong className="text-slate-900 font-mono text-sm">{mounting.endClampQty} bộ</strong>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Thanh nối Rail:</span>
                <strong className="text-slate-900 font-mono text-sm">{mounting.railJoinerQty} bộ</strong>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Kẹp tiếp địa:</span>
                <strong className="text-slate-900 font-mono text-sm">{mounting.groundingLugQty} bộ</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card 4: TỦ ĐIỆN PHÂN PHỐI & SLD */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div
          onClick={() => toggleCard('board')}
          className="p-4 sm:p-5 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#0F2A45]">Tủ Điện Phân Phối & Sơ Đồ SLD</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  ✓ IEC 60364-7-712
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                MCCB {board?.mccbRatedA || 40}A · Chống sét SPD Type 2 (DC & AC) · Smart Meter Zero-Export bám tải
              </p>
            </div>
          </div>
          <button className="text-slate-400 p-1">
            {expandedCards.board ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {(expandedCards.board || detailMode) && board && (
          <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4">
            {/* Electrical SLD Schematic SVG */}
            <SingleLineDiagram
              inverterProposal={selectedProposal}
              board={board}
              cables={cables}
              panel={selectedPanel}
              phases={project.phases}
            />

            {/* Construction & Safety Technical Notes */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="font-bold text-[#0F2A45] flex items-center gap-1.5">
                <Info size={14} className="text-[#E4572E]" />
                <span>Yêu Cầu Kỹ Thuật Thi Công & Nghiệm Thu An Toàn:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                <li>Hệ thống tiếp địa an toàn chống sét phải có điện trở đo đạc thực tế R ≤ 4Ω (TCVN 9207).</li>
                <li>Đầu cosse bấm dây cáp DC Solar 1500V phải dùng kìm bấm chuyên dụng MC4, siết đúng lực mô-men xoắn.</li>
                <li>Cáp DC phải đi trong ống luồn chịu nhiệt UV chống chuột bọ cắn phá, cố định bằng dây rút inox.</li>
                <li>Bộ Smart Meter & Biến dòng CT phải được cài đặt đúng chiều dòng điện P(kW) để bám tải chính xác 0W phát ngược.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-all"
        >
          <ArrowLeft size={16} />
          <span>Quay lại: Tấm pin & Layout</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E4572E] hover:bg-[#d04922] text-white font-bold text-sm shadow-sm transition-all"
        >
          <span>Tiếp tục: Báo giá & BOM</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Modal Cẩm Nang Kỹ Thuật Đào Tạo & Nghiệm Thu HGC */}
      <HgcCommissioningModal
        isOpen={showHgcGuide}
        onClose={() => setShowHgcGuide(false)}
        projectName={project.name}
        installedKwp={project.layoutResult?.installedKwp || 10}
        sysType={project.sysType}
      />
    </div>
  );
};
