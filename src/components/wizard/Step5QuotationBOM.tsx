import React, { useState } from 'react';
import { Project, BomLine } from '../../types/solar';
import { getStandardGroupedBom, exportErpBomCsv } from '../../engine/bom';
import { CashflowChart } from '../financial/CashflowChart';
import { RechartsRoiSavingsChart } from '../financial/RechartsRoiSavingsChart';
import { CustomerValueProposalPrint } from '../proposal/CustomerValueProposalPrint';
import { DetailedBomPrint } from '../proposal/DetailedBomPrint';
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
} from 'lucide-react';

interface Step5Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onBack: () => void;
  onPrint: () => void;
  userRole: 'ky_su' | 'sales' | 'admin';
}

export type PrintDocumentType = 'value_proposal' | 'detailed_bom' | 'full_bundle';

export const Step5QuotationBOM: React.FC<Step5Props> = ({
  project,
  onUpdate,
  onBack,
  onPrint,
  userRole,
}) => {
  // Chế độ xem trên màn hình: 'value_proposal' (Hồ sơ giá trị khách hàng) vs 'detailed_bom' (Dự toán kỹ thuật chi tiết)
  const [activeDocView, setActiveDocView] = useState<'value_proposal' | 'detailed_bom'>('value_proposal');
  // Chế độ xem nội bộ (hiện giá vốn) hay xem khách hàng
  const [viewType, setViewType] = useState<'customer' | 'internal'>('customer');
  // Modal chọn loại tài liệu in PDF
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [selectedPrintDoc, setSelectedPrintDoc] = useState<PrintDocumentType>('value_proposal');

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

  // Xuất file BOM ERP
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

  // Thực hiện in theo loại tài liệu đã chọn
  const handleConfirmPrint = (docType: PrintDocumentType) => {
    setSelectedPrintDoc(docType);
    setShowPrintModal(false);
    // Đồng bộ view hiển thị tương ứng
    if (docType === 'detailed_bom') {
      setActiveDocView('detailed_bom');
    } else if (docType === 'value_proposal') {
      setActiveDocView('value_proposal');
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
                Định Giá Thương Mại & Báo Giá 8 Nhóm BOM
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chuẩn hóa 8 nhóm BOM · Tách riêng Hồ sơ Giá trị Khách hàng & Dự toán chi tiết · Suất đầu tư rõ ràng
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

      {/* DOCUMENT PREVIEW SWITCHER (TÁCH BIỆT HỒ SƠ GIÁ TRỊ KHÁCH HÀNG & DỰ TOÁN KỸ THUẬT) */}
      <div className="bg-slate-100 p-1.5 rounded-xl flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveDocView('value_proposal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
              activeDocView === 'value_proposal'
                ? 'bg-white text-[#0F2A45] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={14} className="text-[#E4572E]" />
            <span>1. Hồ Sơ Đề Xuất Giá Trị & Báo Giá Khách Hàng (Customer Value Proposal)</span>
          </button>

          <button
            onClick={() => setActiveDocView('detailed_bom')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
              activeDocView === 'detailed_bom'
                ? 'bg-white text-[#0F2A45] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={14} className="text-emerald-700" />
            <span>2. Bảng Dự Toán Kỹ Thuật Chi Tiết (Engineering BOM)</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden md:block">
          {activeDocView === 'value_proposal'
            ? '✨ Tài liệu tập trung làm rõ Lợi Ích & Giá Trị cho Chủ Đầu Tư'
            : '📋 File bóc tách chi tiết từng thiết bị, cáp, phụ kiện'}
        </div>
      </div>

      {/* DOCUMENT DISPLAY AREA (HIỂN THỊ TRÊN MÀN HÌNH & XUẤT IN RA PDF) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-8 print:p-0 print:border-none print:shadow-none">
        {/* Trường hợp in Trọn Gói (Full Bundle): In cả 2 tài liệu */}
        {selectedPrintDoc === 'full_bundle' ? (
          <div className="space-y-8">
            <CustomerValueProposalPrint project={project} />
            <div className="page-break my-8 border-t-2 border-dashed border-slate-300 print:border-none print:m-0" style={{ pageBreakBefore: 'always' }}>
              <DetailedBomPrint project={project} viewType={viewType} />
            </div>
          </div>
        ) : activeDocView === 'value_proposal' || selectedPrintDoc === 'value_proposal' ? (
          /* Chỉ in/xem Hồ Sơ Đề Xuất Giá Trị Khách Hàng */
          <CustomerValueProposalPrint project={project} />
        ) : (
          /* Chỉ in/xem Bảng Dự Toán Kỹ Thuật Chi Tiết */
          <DetailedBomPrint project={project} viewType={viewType} />
        )}
      </div>

      {/* Action Navigation Footer */}
      <div className="flex items-center justify-between pt-2 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-all"
        >
          <ArrowLeft size={16} />
          <span>Quay lại: Bước 4 (Kỹ thuật)</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportErpExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-sm shadow-sm transition-all"
          >
            <FileSpreadsheet size={16} />
            <span>Xuất Excel ERP</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E4572E] hover:bg-[#d04922] text-white font-bold text-sm shadow transition-all"
          >
            <Printer size={16} />
            <span>In / Xuất PDF Báo Giá</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL CHỌN ĐỊNH DẠNG TÀI LIỆU IN PDF (TÁCH BIỆT GIÁ TRỊ vs DỰ TOÁN)       */}
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
                  <p className="text-xs text-slate-500">Chọn tài liệu phù hợp theo mục đích gửi khách hàng hoặc nội bộ</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* 3 Document Options */}
            <div className="space-y-3 mb-6">
              {/* Option 1: Hồ Sơ Giá Trị Khách Hàng (Khuyến nghị) */}
              <div
                onClick={() => setSelectedPrintDoc('value_proposal')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all relative ${
                  selectedPrintDoc === 'value_proposal'
                    ? 'border-[#E4572E] bg-orange-50/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E4572E] text-white">
                      Khuyên Dùng Gửi Khách
                    </span>
                    <strong className="text-sm text-[#0F2A45]">
                      1. Hồ Sơ Đề Xuất Giá Trị & Báo Giá (Customer Value Proposal)
                    </strong>
                  </div>
                  {selectedPrintDoc === 'value_proposal' && (
                    <div className="w-5 h-5 rounded-full bg-[#E4572E] text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Làm rõ <strong>4 Giá trị & Lợi ích cốt lõi</strong> (Tiết kiệm tiền điện hàng năm, Chống nóng hạ nhiệt mái 3-5°C, Đạt chuẩn xanh ESG / I-REC xuất khẩu, An toàn Zero-Export). Báo giá 8 nhóm dạng Lot 1 tóm tắt, suất đầu tư công khai và cam kết bảo hành. Không làm rối khách bằng danh mục ốc vít nhỏ.
                </p>
              </div>

              {/* Option 2: Bảng Dự Toán Kỹ Thuật Chi Tiết (BOM) */}
              <div
                onClick={() => setSelectedPrintDoc('detailed_bom')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all relative ${
                  selectedPrintDoc === 'detailed_bom'
                    ? 'border-emerald-600 bg-emerald-50/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white">
                      Kỹ Thuật / Mua Hàng
                    </span>
                    <strong className="text-sm text-[#0F2A45]">
                      2. Bảng Dự Toán Kỹ Thuật Chi Tiết (Engineering BOM)
                    </strong>
                  </div>
                  {selectedPrintDoc === 'detailed_bom' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Tài liệu riêng biệt bóc tách toàn bộ linh kiện của cả 8 nhóm: mã SKU, quy cách, xuất xứ, số lượng mét cáp, bu lông, cọc tiếp địa và đơn giá. Thích hợp in làm phụ lục kỹ thuật đính kèm hoặc bàn giao cho tổ thi công/mua hàng.
                </p>
              </div>

              {/* Option 3: Trọn Bộ Cả Hai */}
              <div
                onClick={() => setSelectedPrintDoc('full_bundle')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all relative ${
                  selectedPrintDoc === 'full_bundle'
                    ? 'border-indigo-600 bg-indigo-50/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-700 text-white">
                      Trọn Bộ Trình Ký
                    </span>
                    <strong className="text-sm text-[#0F2A45]">
                      3. Bộ Hồ Sơ Đầy Đủ (Cả Đề Xuất Giá Trị + Dự Toán Chi Tiết)
                    </strong>
                  </div>
                  {selectedPrintDoc === 'full_bundle' && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Bao gồm toàn bộ Hồ sơ đề xuất giá trị khách hàng ở các trang đầu và tự động đính kèm Bảng dự toán kỹ thuật chi tiết ở các trang sau.
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
                <span>Tiến Hành In PDF Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
