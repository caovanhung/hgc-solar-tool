import React, { useState } from 'react';
import { Project, BomLine } from '../../types/solar';
import {
  exportErpBomCsv,
  exportHgcSampleBomCsv,
  exportSurveyChecklistCsv,
} from '../../engine/bom';
import { buildValueProposalXlsx } from '../../engine/proposalExcel';
import { CashflowChart } from '../financial/CashflowChart';
import { RechartsRoiSavingsChart } from '../financial/RechartsRoiSavingsChart';
import { CustomerValueProposalPrint } from '../proposal/CustomerValueProposalPrint';
import { DetailedBomPrint } from '../proposal/DetailedBomPrint';
import { SurveyChecklistPrint } from '../proposal/SurveyChecklistPrint';
import {
  Printer,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  Sparkles,
  Layers,
  ArrowLeft,
  FileSpreadsheet,
  Zap,
  BarChart3,
  LineChart,
  Calculator,
  Coins,
  FileText,
  Check,
  X,
  Eye,
  Wrench,
  ClipboardCheck,
  BookOpen,
} from 'lucide-react';
import { SystemTechnicalDocModal } from '../docs/SystemTechnicalDocModal';

interface Step5Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onBack: () => void;
  onPrint: () => void;
  userRole: 'ky_su' | 'sales' | 'admin';
}

export type PrintDocumentType =
  | 'sample_bom'
  | 'value_proposal'
  | 'checklist'
  | 'full_bundle';

export const Step5QuotationBOM: React.FC<Step5Props> = ({
  project,
  onUpdate,
  onBack,
  onPrint,
  userRole,
}) => {
  // Chế độ xem trên màn hình:
  // 'sample_bom' (BẢNG KÊ VẬT TƯ THIẾT BỊ HỆ THỐNG ĐIỆN NĂNG LƯỢNG MẶT TRỜI theo đúng docs/Bảng kê vật tư mẫu.xlsx)
  // 'value_proposal' (Hồ sơ giá trị khách hàng)
  // 'checklist' (Phiếu khảo sát hiện trường chuẩn)
  const [activeDocView, setActiveDocView] = useState<'sample_bom' | 'value_proposal' | 'checklist'>('sample_bom');
  // Chế độ xem nội bộ (hiện giá vốn) hay xem khách hàng
  const [viewType, setViewType] = useState<'customer' | 'internal'>('customer');
  // Modal chọn loại tài liệu in PDF
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [selectedPrintDoc, setSelectedPrintDoc] = useState<PrintDocumentType>('sample_bom');
  const [showDocModal, setShowDocModal] = useState<boolean>(false);

  const [activeChartTab, setActiveChartTab] = useState<'recharts_roi' | 'cashflow'>('recharts_roi');

  const bomLines = project.bomLines || [];
  const fin = project.financial;
  const installedKwp = project.layoutResult?.installedKwp || 1;

  const handleMarginChange = (val: number) => {
    onUpdate({ marginPct: Math.max(0, Math.min(60, val)) });
  };

  const handleDiscountChange = (val: number) => {
    onUpdate({ discountPct: Math.max(0, Math.min(30, val)) });
  };

  // Chỉ số suất đầu tư rõ ràng
  const ratePreVat = fin?.investmentRatePreVatVndPerKwp || Math.round((fin?.capexSellVnd || 0) / installedKwp);
  const ratePostVat = fin?.investmentRatePostVatVndPerKwp || Math.round((fin?.grandTotalVnd || 0) / installedKwp);
  const ratePerWp = Math.round(ratePostVat / 1000);

  // 1. Xuất file Bảng Kê Vật Tư Mẫu Excel (A - B - C - D) theo docs/Bảng kê vật tư mẫu.xlsx
  const handleExportSampleExcel = () => {
    const csvContent = exportHgcSampleBomCsv(bomLines, project, viewType);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Bang_Ke_Vat_Tu_Mau_${(project.name || 'DuAn').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Xuất file Phiếu Khảo Sát Hiện Trường Checklist
  const handleExportChecklistExcel = () => {
    const csvContent = exportSurveyChecklistCsv(project);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Checklist_KhaoSat_${(project.name || 'DuAn').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Xuất file BOM ERP (17 cột chuẩn)
  const handleExportErpExcel = () => {
    const csvContent = exportErpBomCsv(bomLines, project.name || 'HGC_Solar_Project');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BOM_ERP_${(project.name || 'DuAn').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Xuất file Excel Hồ Sơ Đề Xuất Giá Trị & Báo Giá (Proposal) gửi khách
  const handleExportProposalExcel = async () => {
    try {
      const blob = await buildValueProposalXlsx(project);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Proposal_BaoGia_${(project.name || 'DuAn').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Xuất Excel Proposal thất bại:', err);
    }
  };

  // Thực hiện in theo loại tài liệu đã chọn
  const handleConfirmPrint = async (docType: PrintDocumentType) => {
    setSelectedPrintDoc(docType);
    setShowPrintModal(false);
    // Đồng bộ view hiển thị tương ứng
    if (docType === 'sample_bom') {
      setActiveDocView('sample_bom');
    } else if (docType === 'value_proposal') {
      setActiveDocView('value_proposal');
      // Proposal gửi khách: xuất file Excel trước, sau đó mới mở hộp thoại in PDF
      // (window.print() chặn luồng JS nên phải chờ file Excel tải xong)
      await handleExportProposalExcel();
    } else if (docType === 'checklist') {
      setActiveDocView('checklist');
    }
    // Kích hoạt lệnh in trình duyệt
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const isLowMargin = (fin?.grossMarginPct || 0) < 15;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Commercial Control Bar - Screen Only */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#E4572E] text-white flex items-center justify-center text-xs font-bold">
                5
              </span>
              <h3 className="text-base font-bold text-[#0F2A45]">
                Định Giá Thương Mại & Bảng Kê Vật Tư Thiết Bị
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chuẩn theo mẫu file Bảng Kê Vật Tư (ON-GRID / HYBRID) của công ty · Suất đầu tư công khai · Hồ sơ chuyên nghiệp
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setViewType('customer')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                  viewType === 'customer'
                    ? 'bg-white text-[#0F2A45] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Giá Bán Khách Hàng
              </button>
              <button
                onClick={() => setViewType('internal')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                  viewType === 'internal'
                    ? 'bg-white text-[#0F2A45] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                BOM Nội Bộ (Giá Vốn)
              </button>
            </div>

            <button
              onClick={handleExportSampleExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#E4572E] hover:bg-[#d04922] text-white font-bold text-xs shadow-sm transition-all"
              title="Xuất file Excel / CSV bám sát 100% mẫu file Bảng Kê Vật Tư (Phần A - B - C - D) của công ty"
            >
              <FileSpreadsheet size={15} />
              <span>Xuất Excel Mẫu Bảng Kê</span>
            </button>

            <button
              onClick={handleExportErpExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              title="Xuất file Excel / CSV 17 cột chuẩn phần mềm ERP quản trị kho & mua hàng"
            >
              <FileSpreadsheet size={15} />
              <span>Xuất BOM ERP</span>
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E4572E] hover:bg-[#d04922] text-white font-bold text-xs shadow transition-all"
            >
              <Printer size={15} />
              <span>In / Xuất PDF</span>
            </button>
          </div>
        </div>

        {/* Commercial Pricing Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center justify-between">
              <span>Biên Lợi Nhuận (Margin)</span>
              <span className="font-mono text-[#E4572E] font-bold">{project.marginPct}%</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={project.marginPct}
                onChange={(e) => handleMarginChange(Number(e.target.value))}
                className="w-full accent-[#E4572E]"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={project.marginPct}
                onChange={(e) => handleMarginChange(Number(e.target.value))}
                className="w-16 px-2 py-1 text-xs border border-slate-300 rounded font-mono text-center font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center justify-between">
              <span>Chiết Khấu (Discount)</span>
              <span className="font-mono text-slate-800 font-bold">{project.discountPct}%</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={project.discountPct}
                onChange={(e) => handleDiscountChange(Number(e.target.value))}
                className="w-full accent-slate-700"
              />
              <input
                type="number"
                min="0"
                max="30"
                value={project.discountPct}
                onChange={(e) => handleDiscountChange(Number(e.target.value))}
                className="w-16 px-2 py-1 text-xs border border-slate-300 rounded font-mono text-center font-bold"
              />
            </div>
          </div>

          {/* Hộp Suất Đầu Tư Rõ Ràng */}
          <div className="bg-gradient-to-br from-emerald-50 via-emerald-100/40 to-teal-50 p-3 rounded-lg border border-emerald-300/80 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-900 font-bold uppercase tracking-wide flex items-center gap-1">
                <Coins size={13} className="text-emerald-700" />
                <span>Suất Đầu Tư / kWp</span>
              </span>
              <span className="text-[10px] text-emerald-700 bg-white/80 px-1.5 py-0.5 rounded font-mono font-semibold">
                ~{ratePerWp} đ/Wp
              </span>
            </div>
            <div className="mt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-base sm:text-lg font-black text-emerald-950 font-mono">
                  {ratePostVat.toLocaleString('vi-VN')}
                </span>
                <span className="text-xs font-bold text-emerald-800 font-mono">đ/kWp (VAT)</span>
              </div>
              <div className="text-[10.5px] text-emerald-700 font-mono mt-0.5 flex justify-between">
                <span>Chưa VAT:</span>
                <strong className="text-emerald-900">{ratePreVat.toLocaleString('vi-VN')} đ/kWp</strong>
              </div>
            </div>
          </div>

          {/* Tổng giá trị trọn gói có VAT */}
          <div className="bg-orange-50/60 p-3 rounded-lg border border-[#E4572E]/30 flex flex-col justify-between">
            <span className="text-[11px] text-slate-700 font-bold uppercase tracking-wide">
              Tổng Báo Giá Trọn Gói:
            </span>
            <div className="text-lg font-extrabold text-[#E4572E] font-mono mt-0.5 truncate">
              {fin ? fin.grandTotalVnd.toLocaleString('vi-VN') : 0} đ
            </div>
            <div className="text-[10.5px] text-slate-500 font-mono mt-0.5 flex justify-between">
              <span>Đã gồm VAT 10%:</span>
              <span className="font-semibold text-slate-700">{fin ? fin.vatVnd.toLocaleString('vi-VN') : 0} đ</span>
            </div>
          </div>
        </div>

        {/* Price Guard Warning */}
        {isLowMargin && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-amber-600" />
            <span>
              <strong>Cảnh báo Price Guard:</strong> Biên lợi nhuận hiện tại ({fin?.grossMarginPct}%) dưới ngưỡng an toàn 15%. Cần phê duyệt từ Giám đốc kinh doanh trước khi phát hành báo giá.
            </span>
          </div>
        )}

        {/* Tùy Chỉnh Hạng Mục Mái Khung & Chi Phí Dịch Vụ Công Trình */}
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F2A45] uppercase tracking-wide flex items-center gap-1.5">
              <Wrench size={14} className="text-[#E4572E]" />
              <span>Tùy Chỉnh Hạng Mục Mái Khung & Dịch Vụ Công Trình (Chuẩn EPC)</span>
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Bật/tắt các gói dịch vụ và gia công mái khung theo yêu cầu thực tế
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Mái Khung Giàn Nâng Cao */}
            <div className={`p-3 rounded-xl border transition-all ${
              project.roofType === 'canopy' || project.hasCanopyFrame
                ? 'border-[#E4572E] bg-orange-50/20 shadow-2xs'
                : 'border-slate-200 bg-slate-50/50'
            }`}>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={project.roofType === 'canopy' || Boolean(project.hasCanopyFrame)}
                  onChange={(e) => onUpdate({
                    hasCanopyFrame: e.target.checked,
                    roofType: e.target.checked ? 'canopy' : (project.roofType === 'canopy' ? 'tole' : project.roofType),
                  })}
                  className="accent-[#E4572E] w-4 h-4 rounded"
                />
                <span className="font-bold text-xs text-slate-900">Làm Mái Khung Nâng Cao</span>
              </label>
              {(project.roofType === 'canopy' || project.hasCanopyFrame) ? (
                <div className="space-y-2 mt-2 pt-2 border-t border-orange-200/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Đơn giá gia công:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={project.canopyUnitCostVnd !== undefined ? project.canopyUnitCostVnd : 450000}
                        onChange={(e) => onUpdate({ canopyUnitCostVnd: Number(e.target.value) })}
                        className="w-20 px-1.5 py-0.5 text-right text-xs font-mono font-bold border border-slate-300 rounded bg-white"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">đ/m²</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Diện tích khung:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={project.canopyAreaM2 || Math.round(project.roofLengthM * project.roofWidthM)}
                        onChange={(e) => onUpdate({ canopyAreaM2: Number(e.target.value) })}
                        className="w-20 px-1.5 py-0.5 text-right text-xs font-mono font-bold border border-slate-300 rounded bg-white"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">m²</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">Mặc định: Lắp áp mái tiêu chuẩn (Không làm khung thép)</p>
              )}
            </div>

            {/* 2. Thí nghiệm & Hồ sơ EVN */}
            <div className={`p-3 rounded-xl border transition-all ${
              Boolean(project.includeEvnDocs)
                ? 'border-[#E4572E] bg-orange-50/20 shadow-2xs'
                : 'border-slate-200 bg-slate-50/50'
            }`}>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={Boolean(project.includeEvnDocs)}
                  onChange={(e) => onUpdate({ includeEvnDocs: e.target.checked })}
                  className="accent-[#E4572E] w-4 h-4 rounded"
                />
                <span className="font-bold text-xs text-slate-900">Hồ Sơ & Thí Nghiệm EVN</span>
              </label>
              {Boolean(project.includeEvnDocs) ? (
                <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-orange-200/60">
                  <span className="text-slate-600">Chi phí trọn gói:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      step="500000"
                      value={project.evnDocsCostVnd !== undefined ? project.evnDocsCostVnd : 4500000}
                      onChange={(e) => onUpdate({ evnDocsCostVnd: Number(e.target.value) })}
                      className="w-24 px-1.5 py-0.5 text-right text-xs font-mono font-bold border border-slate-300 rounded bg-white"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">đ</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">Mặc định không có (Tích chọn nếu cần hồ sơ EVN)</p>
              )}
            </div>

            {/* 3. Vận chuyển & Cẩu kéo */}
            <div className={`p-3 rounded-xl border transition-all ${
              project.includeTransport !== false
                ? 'border-slate-300 bg-white shadow-2xs'
                : 'border-slate-200 bg-slate-50/50 opacity-70'
            }`}>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={project.includeTransport !== false}
                  onChange={(e) => onUpdate({ includeTransport: e.target.checked })}
                  className="accent-[#E4572E] w-4 h-4 rounded"
                />
                <span className="font-bold text-xs text-slate-900">Vận Chuyển & Cẩu Kéo</span>
              </label>
              {project.includeTransport !== false ? (
                <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-600">Xe cẩu trọn gói:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      step="500000"
                      value={project.transportCostVnd !== undefined ? project.transportCostVnd : 3500000}
                      onChange={(e) => onUpdate({ transportCostVnd: Number(e.target.value) })}
                      className="w-24 px-1.5 py-0.5 text-right text-xs font-mono font-bold border border-slate-300 rounded bg-white"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">đ</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">Đã tắt: Chủ đầu tư tự chịu vận chuyển / nhận tại kho</p>
              )}
            </div>

            {/* 4. Hệ thống SCADA Datalogger */}
            <div className={`p-3 rounded-xl border transition-all ${
              Boolean(project.includeScada)
                ? 'border-[#E4572E] bg-orange-50/20 shadow-2xs'
                : 'border-slate-200 bg-slate-50/50'
            }`}>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={Boolean(project.includeScada)}
                  onChange={(e) => onUpdate({ includeScada: e.target.checked })}
                  className="accent-[#E4572E] w-4 h-4 rounded"
                />
                <span className="font-bold text-xs text-slate-900">Hệ Thống Scada Datalogger</span>
              </label>
              {project.includeScada ? (
                <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-orange-200/60">
                  <span className="text-slate-600">Chi phí bộ Logger:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      step="200000"
                      value={project.scadaCostVnd !== undefined ? project.scadaCostVnd : 3200000}
                      onChange={(e) => onUpdate({ scadaCostVnd: Number(e.target.value) })}
                      className="w-24 px-1.5 py-0.5 text-right text-xs font-mono font-bold border border-slate-300 rounded bg-white"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">đ</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-emerald-700 font-medium">
                  ✓ Đã tích hợp Wifi Dongle miễn phí theo Inverter (ETEK không cần)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5 Financial Highlight KPI Cards (Bao Gồm Suất Đầu Tư Rõ Ràng) */}
      {fin && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 print:hidden">
          <div className="bg-gradient-to-b from-white to-emerald-50/30 p-3.5 rounded-xl border-2 border-emerald-500/30 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-emerald-900 font-bold uppercase mb-1">
              <span>Suất Đầu Tư / kWp</span>
              <Coins size={16} className="text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
                {ratePostVat.toLocaleString('vi-VN')}
              </span>
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              Vnđ / kWp (Trọn gói VAT)
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Chưa VAT: {ratePreVat.toLocaleString('vi-VN')} đ
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase mb-1">
              <span>Thời Gian Hoàn Vốn</span>
              <Clock size={16} className="text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F2A45] font-mono">
                {fin.paybackYears}
              </span>
              <span className="text-xs font-bold text-slate-600">năm</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Hoàn vốn trên tổng vốn đầu tư</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase mb-1">
              <span>Tỷ Suất Sinh Lời IRR</span>
              <TrendingUp size={16} className="text-[#E4572E]" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#E4572E] font-mono">
                {fin.irrPct}
              </span>
              <span className="text-xs font-bold text-slate-600">% / năm</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Dò nhị phân dòng tiền 20 năm</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase mb-1">
              <span>Tiết Kiệm Năm 1</span>
              <Sparkles size={16} className="text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1 mt-1 truncate">
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 font-mono truncate">
                {Math.round(fin.year1SavingsVnd / 1000000).toLocaleString('vi-VN')}
              </span>
              <span className="text-xs font-bold text-slate-600">triệu đ</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              ~{Math.round(fin.year1SavingsVnd / 12).toLocaleString('vi-VN')} đ/tháng
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase mb-1">
              <span>Giảm Phát Thải CO₂</span>
              <ShieldCheck size={16} className="text-teal-600" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-teal-700 font-mono">
                {fin.co2ReductionTonsYear}
              </span>
              <span className="text-xs font-bold text-slate-600">tấn / năm</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Tương đương {fin.treesEquivalentYear} cây xanh
            </div>
          </div>
        </div>
      )}

      {/* Financial Charts Section - Screen Only */}
      {fin && (
        <div className="space-y-3 print:hidden">
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E4572E]"></span>
              <span className="text-xs font-bold text-[#0F2A45] uppercase tracking-wide">
                Mô Phỏng Tài Chính Dài Hạn (10 - 20 Năm)
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setActiveChartTab('recharts_roi')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all ${
                  activeChartTab === 'recharts_roi'
                    ? 'bg-[#0F2A45] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 size={13} />
                <span>Biểu Đồ Recharts (ROI & Tiết Kiệm)</span>
              </button>

              <button
                onClick={() => setActiveChartTab('cashflow')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all ${
                  activeChartTab === 'cashflow'
                    ? 'bg-[#0F2A45] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LineChart size={13} />
                <span>Đường Dòng Tiền Lũy Kế</span>
              </button>
            </div>
          </div>

          {activeChartTab === 'recharts_roi' ? (
            <RechartsRoiSavingsChart financial={fin} />
          ) : (
            <CashflowChart financial={fin} />
          )}
        </div>
      )}

      {/* DOCUMENT PREVIEW SWITCHER (TÁCH BIỆT MẪU BẢNG KÊ A-B-C-D, CHECKLIST & GIÁ TRỊ) */}
      <div className="bg-slate-100 p-1.5 rounded-xl flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveDocView('sample_bom')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition-all ${
              activeDocView === 'sample_bom'
                ? 'bg-[#0F2A45] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-white/50'
            }`}
          >
            <FileSpreadsheet size={14} className={activeDocView === 'sample_bom' ? 'text-amber-400' : 'text-[#E4572E]'} />
            <span>1. Bảng Kê Vật Tư Thiết Bị (Phần A - B - C - D)</span>
          </button>

          <button
            onClick={() => setActiveDocView('value_proposal')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition-all ${
              activeDocView === 'value_proposal'
                ? 'bg-[#0F2A45] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-white/50'
            }`}
          >
            <Sparkles size={14} className={activeDocView === 'value_proposal' ? 'text-amber-300' : 'text-amber-500'} />
            <span>2. Hồ Sơ Đề Xuất Giá Trị Khách Hàng (Proposal)</span>
          </button>

          <button
            onClick={() => setActiveDocView('checklist')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition-all ${
              activeDocView === 'checklist'
                ? 'bg-[#0F2A45] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-white/50'
            }`}
          >
            <ClipboardCheck size={14} className={activeDocView === 'checklist' ? 'text-blue-300' : 'text-blue-600'} />
            <span>3. Phiếu Khảo Sát Hiện Trường (Checklist)</span>
          </button>

          <button
            onClick={() => setShowDocModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all shadow-xs ml-1"
            title="Xem toàn bộ tài liệu nghiệp vụ, công thức tính toán và logic bóc tách vật tư"
          >
            <BookOpen size={14} className="text-amber-600" />
            <span>Sổ Tay Nghiệp Vụ & Công Thức</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden xl:block pr-2 font-medium">
          {activeDocView === 'sample_bom' && '📋 Bảng Kê Vật Tư Thiết Bị Chuẩn theo mẫu file (ON-GRID / HYBRID) của công ty'}
          {activeDocView === 'value_proposal' && '✨ Tập trung 4 Lợi ích & Giá trị cốt lõi cho Chủ Đầu Tư'}
          {activeDocView === 'checklist' && '✅ Phiếu khảo sát hiện trường chuẩn quy trình 4 bước HGC'}
        </div>
      </div>

      {/* DOCUMENT DISPLAY AREA (HIỂN THỊ TRÊN MÀN HÌNH & XUẤT IN RA PDF) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-8 print:p-0 print:border-none print:shadow-none">
        {selectedPrintDoc === 'full_bundle' ? (
          <div className="space-y-8">
            <CustomerValueProposalPrint project={project} />
            <div className="page-break my-8 border-t-2 border-dashed border-slate-300 print:border-none print:m-0" style={{ pageBreakBefore: 'always' }}>
              <DetailedBomPrint project={project} viewType={viewType} />
            </div>
            <div className="page-break my-8 border-t-2 border-dashed border-slate-300 print:border-none print:m-0" style={{ pageBreakBefore: 'always' }}>
              <SurveyChecklistPrint
                project={project}
                onUpdateChecklist={(updated) => onUpdate({ surveyChecklist: updated })}
              />
            </div>
          </div>
        ) : activeDocView === 'sample_bom' || selectedPrintDoc === 'sample_bom' ? (
          /* 1. Mẫu Bảng Kê Vật Tư Thiết Bị theo mẫu file Excel A-B-C-D */
          <DetailedBomPrint project={project} viewType={viewType} />
        ) : activeDocView === 'checklist' || selectedPrintDoc === 'checklist' ? (
          /* 2. Phiếu Khảo Sát Hiện Trường Checklist */
          <SurveyChecklistPrint
            project={project}
            onUpdateChecklist={(updated) => onUpdate({ surveyChecklist: updated })}
          />
        ) : (
          /* 3. Hồ Sơ Đề Xuất Giá Trị Khách Hàng */
          <CustomerValueProposalPrint project={project} />
        )}
      </div>

      {/* Action Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all"
        >
          <ArrowLeft size={16} />
          <span>Quay lại: Bước 4 (Kỹ thuật)</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Xuất Bảng Kê Mẫu A-B-C-D */}
          <button
            onClick={handleExportSampleExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border-2 border-[#E4572E] text-[#E4572E] hover:bg-orange-50 font-bold text-xs shadow-xs transition-all"
            title="Xuất file Excel / CSV bám sát 100% mẫu file Bảng Kê Vật Tư dự án (Phần A - B - C - D)"
          >
            <FileSpreadsheet size={15} />
            <span>Xuất Excel Mẫu Bảng Kê (A-B-C-D)</span>
          </button>

          {/* Xuất Checklist Hiện Trường */}
          <button
            onClick={handleExportChecklistExcel}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-xs transition-all"
            title="Xuất phiếu khảo sát hiện trường chuẩn theo sheet CHECKLIST"
          >
            <ClipboardCheck size={15} />
            <span>Xuất Checklist Khảo Sát</span>
          </button>

          {/* Xuất ERP */}
          <button
            onClick={handleExportErpExcel}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-xs shadow-xs transition-all"
            title="Xuất file Excel / CSV 17 cột chuẩn phần mềm ERP"
          >
            <FileSpreadsheet size={15} />
            <span>Xuất Excel ERP</span>
          </button>

          {/* In PDF */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E4572E] hover:bg-[#d04922] text-white font-bold text-xs shadow transition-all"
          >
            <Printer size={16} />
            <span>In / Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL CHỌN ĐỊNH DẠNG TÀI LIỆU IN PDF                                     */}
      {/* ========================================================================= */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-scaleUp my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#E4572E] flex items-center justify-center font-bold">
                  <Printer size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F2A45]">Tùy Chọn In & Xuất Hồ Sơ PDF</h3>
                  <p className="text-xs text-slate-500">Chọn tài liệu phù hợp theo mục đích gửi khách hàng, thi công hoặc lưu trữ</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Document Options */}
            <div className="space-y-2.5 mb-6">
              {/* Option 1: Bảng Kê Vật Tư Thiết Bị (Phần A-B-C-D) */}
              <div
                onClick={() => setSelectedPrintDoc('sample_bom')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all relative ${
                  selectedPrintDoc === 'sample_bom'
                    ? 'border-[#E4572E] bg-orange-50/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E4572E] text-white">
                      Mẫu Chuẩn Công Ty
                    </span>
                    <strong className="text-sm text-[#0F2A45]">
                      1. Bảng Kê Vật Tư Thiết Bị (Phần A - B - C - D)
                    </strong>
                  </div>
                  {selectedPrintDoc === 'sample_bom' && (
                    <div className="w-5 h-5 rounded-full bg-[#E4572E] text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Bảng kê vật tư bám sát 100% mẫu file <code>docs/Bảng kê vật tư mẫu.xlsx</code> (ON-GRID / HYBRID): Thiết bị chính, Hệ rail nhôm, Giàn khung, Thiết bị ngoại vi và Chi phí khác.
                </p>
              </div>

              {/* Option 2: Hồ Sơ Giá Trị Khách Hàng */}
              <div
                onClick={() => setSelectedPrintDoc('value_proposal')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all relative ${
                  selectedPrintDoc === 'value_proposal'
                    ? 'border-[#E4572E] bg-orange-50/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                      Khuyên Dùng Gửi Khách
                    </span>
                    <strong className="text-sm text-[#0F2A45]">
                      2. Hồ Sơ Đề Xuất Giá Trị & Báo Giá (Proposal)
                    </strong>
                  </div>
                  {selectedPrintDoc === 'value_proposal' && (
                    <div className="w-5 h-5 rounded-full bg-[#E4572E] text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Làm rõ 4 Giá trị cốt lõi, biểu đồ tiết kiệm điện, suất đầu tư trọn gói công khai và cam kết bảo hành. Xuất đồng thời PDF và Excel.
                </p>
              </div>

              {/* Option 3: Phiếu Khảo Sát Hiện Trường */}
              <div
                onClick={() => setSelectedPrintDoc('checklist')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all relative ${
                  selectedPrintDoc === 'checklist'
                    ? 'border-blue-600 bg-blue-50/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                      Khảo Sát Hiện Trường
                    </span>
                    <strong className="text-sm text-[#0F2A45]">
                      3. Phiếu Khảo Sát Hiện Trường & Dự Án (Checklist)
                    </strong>
                  </div>
                  {selectedPrintDoc === 'checklist' && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Phiếu in khảo sát hiện trường chuẩn theo sheet CHECKLIST với 15 tiêu chuẩn khảo sát mặt bằng, điện áp, đổ bóng và thi công.
                </p>
              </div>

              {/* Option 4: Trọn Bộ Tất Cả */}
              <div
                onClick={() => setSelectedPrintDoc('full_bundle')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all relative ${
                  selectedPrintDoc === 'full_bundle'
                    ? 'border-[#0F2A45] bg-slate-100 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F2A45] text-white">
                      Trọn Bộ Trình Ký
                    </span>
                    <strong className="text-sm text-[#0F2A45]">
                      4. Bộ Hồ Sơ Dự Án Đầy Đủ (Proposal + Bảng Kê Vật Tư Mẫu + Checklist)
                    </strong>
                  </div>
                  {selectedPrintDoc === 'full_bundle' && (
                    <div className="w-5 h-5 rounded-full bg-[#0F2A45] text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  In tự động cả 3 tài liệu: Hồ sơ đề xuất giá trị khách hàng, Bảng kê chi tiết theo mẫu file công ty, và Phiếu khảo sát hiện trường.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleConfirmPrint(selectedPrintDoc)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E4572E] hover:bg-[#d04922] text-white font-bold text-xs shadow transition-all"
              >
                <Printer size={15} />
                <span>{selectedPrintDoc === 'value_proposal' ? 'Xuất PDF + Excel Ngay' : 'Tiến Hành In PDF Ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sổ Tay Nghiệp Vụ & Toàn Bộ Công Thức Tính Toán Modal */}
      <SystemTechnicalDocModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
      />
    </div>
  );
};
