import React, { useState, useRef } from 'react';
import { Project, BomLine } from '../../types/solar';
import { getHgcSectionGroupedBom } from '../../engine/bom';
import { Logo } from '../common/Logo';
import { Coins, Zap, Info, X } from 'lucide-react';

interface DetailedBomPrintProps {
  project: Project;
  viewType?: 'customer' | 'internal';
  initialMode?: string;
}

export const DetailedBomPrint: React.FC<DetailedBomPrintProps> = ({
  project,
  viewType = 'customer',
}) => {
  const fin = project.financial;
  const layout = project.layoutResult;
  const bomLines = project.bomLines || [];
  const installedKwp = layout?.installedKwp || 1;

  // State hiển thị popup chi tiết kỹ thuật & cấu thành chi phí khi trỏ chuột vào tên thiết bị
  const [hoveredInfo, setHoveredInfo] = useState<{
    line: BomLine;
    x: number;
    y: number;
  } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPinned, setIsPinned] = useState(false);

  const calculatePosition = (e: React.MouseEvent<HTMLSpanElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cardWidth = 430;
    const padding = 16;
    let left = rect.left;
    if (left + cardWidth > window.innerWidth - padding) {
      left = Math.max(padding, window.innerWidth - cardWidth - padding);
    }

    const cardHeightEst = 260;
    let top = rect.bottom + 6;
    if (top + cardHeightEst > window.innerHeight && rect.top > cardHeightEst + 20) {
      top = Math.max(10, rect.top - cardHeightEst - 6);
    }
    return { left, top };
  };

  const handleMouseEnter = (line: BomLine, e: React.MouseEvent<HTMLSpanElement>) => {
    if (isPinned) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    const { left, top } = calculatePosition(e);
    setHoveredInfo({
      line,
      x: left,
      y: top,
    });
  };

  const handleMouseLeave = () => {
    if (isPinned) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredInfo(null);
    }, 150);
  };

  const handleToggleClick = (line: BomLine, e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    if (hoveredInfo?.line.id === line.id && isPinned) {
      setIsPinned(false);
      setHoveredInfo(null);
    } else {
      const { left, top } = calculatePosition(e);
      setHoveredInfo({
        line,
        x: left,
        y: top,
      });
      setIsPinned(true);
    }
  };

  // Nhóm theo 4 Phần Chuẩn Mẫu File 'Bảng kê vật tư mẫu.xlsx' của công ty (Phần A, B, C, D)
  const hgcSections = getHgcSectionGroupedBom(bomLines).filter(
    (s) => s.items.length > 0
  );

  const ratePreVat = fin?.investmentRatePreVatVndPerKwp || Math.round((fin?.capexSellVnd || 0) / installedKwp);
  const ratePostVat = fin?.investmentRatePostVatVndPerKwp || Math.round((fin?.grandTotalVnd || 0) / installedKwp);

  return (
    <div className="bg-white text-slate-900 font-sans print:p-0 print:border-none print:shadow-none text-xs leading-normal">
      {/* Letterhead */}
      <div className="flex items-start justify-between border-b-2 border-red-600 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <Logo size="lg" />
        </div>

        <div className="text-right text-[11px] leading-tight space-y-0.5">
          <div className="font-extrabold text-sm sm:text-base text-[#002060] tracking-wide uppercase">
            CÔNG TY TNHH HGC
          </div>
          <div className="text-[#002060] font-medium text-[10.5px]">
            <span className="font-semibold">[Add ]:</span> B36 TT7 Khu đô thị Văn Quán Hà Đông Hà Nội
          </div>
          <div className="text-red-600 font-medium text-[10.5px]">
            <span className="font-semibold">[Web]:</span> https://hgcvn.com - <span className="font-semibold">[Email]:</span> hgc.vn2026@gmail.com
          </div>
          <div className="text-[#002060] font-medium text-[10.5px]">
            <span className="font-semibold">[Head]:</span> 0974 04 19 84 - 0989 09 97 35
          </div>
          <div className="text-slate-400 font-mono text-[9.5px] pt-0.5">
            Mã BOM: HGC-BOM-{project.id.slice(0, 6).toUpperCase()} · Ngày: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>

      {/* Document Title */}
      <div className="text-center my-3">
        <div className="inline-block bg-orange-50 text-[#E4572E] text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-orange-200 mb-1.5">
          HỒ SƠ BẢNG KÊ VẬT TƯ & DỰ TOÁN KỸ THUẬT TIÊU CHUẨN HGC
        </div>
        <h2 className="text-lg sm:text-xl font-black text-[#0F2A45] uppercase tracking-wide">
          BẢNG KÊ VẬT TƯ THIẾT BỊ HỆ THỐNG ĐIỆN NĂNG LƯỢNG MẶT TRỜI
        </h2>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
          Chuẩn theo mẫu file Bảng Kê Vật Tư ({project.sysType === 'hybrid' ? 'HYBRID' : 'ON-GRID'} {project.phases === '3' ? '3P' : '1P'}) của công ty
        </p>
      </div>

      {/* Quick Project Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px]">Chủ Đầu Tư:</span>
          <strong className="text-slate-900">{project.customerName || 'Khách Hàng'}</strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Công Suất Lắp Đặt:</span>
          <strong className="text-[#E4572E] font-mono font-bold">{installedKwp} kWp</strong>
          <span className="text-[10px] text-slate-500"> ({layout?.panelQty} tấm pin)</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Cấu Hình Hệ Thống:</span>
          <strong className="text-slate-900">
            {project.sysType === 'hybrid' ? 'Hybrid ESS (Lưu trữ)' : 'Hòa lưới On-Grid'} ({project.phases === '3' ? '3 Pha 380V' : '1 Pha 220V'})
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Cơ Chế Vận Hành:</span>
          <strong className="text-emerald-700 font-semibold">Zero-Export (Bám tải phụ tải)</strong>
        </div>
      </div>

      {/* BẢNG KÊ VẬT TƯ THIẾT BỊ CHUẨN MẪU FILE (PHẦN A - B - C - D) */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 mb-4">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0F2A45] text-white text-[10px] uppercase font-bold font-mono">
            <tr>
              <th className="px-2 py-2 w-10 text-center">STT</th>
              <th className="px-2.5 py-2">
                <span>TÊN THIẾT BỊ</span>
                <span className="text-[9px] font-medium text-amber-300 normal-case hidden md:inline ml-2 font-sans tracking-normal">
                  ✦ Rê chuột xem mô tả kỹ thuật & chi phí cấu thành
                </span>
              </th>
              <th className="px-2 py-2 w-36">Mã hàng</th>
              <th className="px-2 py-2 w-24">Hãng</th>
              <th className="px-1.5 py-2 text-center w-12">ĐVT</th>
              <th className="px-1.5 py-2 text-right w-12">Số lượng</th>
              {viewType === 'internal' && (
                <>
                  <th className="px-2 py-2 text-right text-slate-300 w-24">Giá vốn (đ)</th>
                  <th className="px-2 py-2 text-right text-slate-300 w-24">Tổng vốn (đ)</th>
                </>
              )}
              <th className="px-2 py-2 text-right w-24">Đơn giá (đ)</th>
              <th className="px-2 py-2 text-right w-24">Thành tiền (đ)</th>
              <th className="px-2 py-2 w-28">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {hgcSections.map((secGroup) => (
              <React.Fragment key={secGroup.section.code}>
                {/* Dòng Header Nhóm lớn A, B, C, D */}
                <tr className="bg-emerald-100/80 font-black text-slate-900 text-[11px] border-t-2 border-emerald-600">
                  <td className="px-2 py-1.5 text-center font-mono text-[#065f46]">
                    {secGroup.section.code}
                  </td>
                  <td colSpan={viewType === 'internal' ? 5 : 3} className="px-2.5 py-1.5 text-[#065f46] uppercase tracking-wide">
                    {secGroup.section.name}
                  </td>
                  {viewType === 'internal' && (
                    <>
                      <td className="px-2 py-1.5 text-right font-mono text-slate-600"></td>
                      <td className="px-2 py-1.5 text-right font-mono text-slate-700 font-bold">
                        {secGroup.subtotalCostVnd.toLocaleString('vi-VN')}
                      </td>
                    </>
                  )}
                  <td className="px-2 py-1.5 text-right font-mono text-[#065f46]"></td>
                  <td className="px-2 py-1.5 text-right font-mono text-[#065f46] font-bold">
                    {secGroup.subtotalSellVnd.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-2 py-1.5"></td>
                </tr>

                {/* Phân mục nếu có (vd Phần B có Hệ Rail Nhôm & Hệ Rail Giàn Khung) */}
                {secGroup.subsections ? (
                  secGroup.subsections.map((subSec) => (
                    <React.Fragment key={subSec.title}>
                      <tr className="bg-slate-100/90 font-bold text-slate-800 text-[10.5px]">
                        <td></td>
                        <td colSpan={viewType === 'internal' ? 9 : 7} className="px-2.5 py-1 text-slate-700 uppercase">
                          ▸ {subSec.title}
                        </td>
                      </tr>

                      {subSec.items.map((line, idx) => (
                        <tr key={line.id} className="hover:bg-slate-50 transition-colors text-[10.5px]">
                          <td className="px-2 py-1.5 text-center text-slate-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="px-2.5 py-1.5 font-medium text-slate-900">
                            <span
                              onMouseEnter={(e) => handleMouseEnter(line, e)}
                              onMouseLeave={handleMouseLeave}
                              onClick={(e) => handleToggleClick(line, e)}
                              className="inline-flex items-center gap-1.5 cursor-pointer border-b border-dotted border-slate-400 hover:border-[#E4572E] hover:text-[#0F2A45] transition-colors group select-none"
                              title="Nhấp hoặc rê chuột xem mô tả kỹ thuật & cấu thành chi phí"
                            >
                              <span>{line.name}</span>
                              <span
                                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-400 group-hover:bg-orange-100 group-hover:text-[#E4572E] text-[9px] font-bold shrink-0 transition-colors print:hidden"
                              >
                                i
                              </span>
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-slate-600 font-mono text-[10px]">
                            {line.sku}
                          </td>
                          <td className="px-2 py-1.5 text-slate-600 font-medium">
                            {line.brand || 'VN'}
                          </td>
                          <td className="px-1.5 py-1.5 text-center text-slate-600">
                            {line.unit}
                          </td>
                          <td className="px-1.5 py-1.5 text-right font-mono font-bold text-slate-900">
                            {line.qty}
                          </td>
                          {viewType === 'internal' && (
                            <>
                              <td className="px-2 py-1.5 text-right font-mono text-slate-500">
                                {line.unitCostVnd.toLocaleString('vi-VN')}
                              </td>
                              <td className="px-2 py-1.5 text-right font-mono text-slate-600 font-semibold">
                                {line.totalCostVnd.toLocaleString('vi-VN')}
                              </td>
                            </>
                          )}
                          <td className="px-2 py-1.5 text-right font-mono text-slate-700">
                            {line.unitSellVnd.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono font-bold text-slate-900">
                            {line.totalSellVnd.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-2 py-1.5 text-slate-400 text-[10px]">
                            {line.note || ''}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  /* Nhóm không có phân mục (A, C, D) */
                  secGroup.items.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-slate-50 transition-colors text-[10.5px]">
                      <td className="px-2 py-1.5 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-2.5 py-1.5 font-medium text-slate-900">
                        <span
                          onMouseEnter={(e) => handleMouseEnter(line, e)}
                          onMouseLeave={handleMouseLeave}
                          onClick={(e) => handleToggleClick(line, e)}
                          className="inline-flex items-center gap-1.5 cursor-pointer border-b border-dotted border-slate-400 hover:border-[#E4572E] hover:text-[#0F2A45] transition-colors group select-none"
                          title="Nhấp hoặc rê chuột xem mô tả kỹ thuật & cấu thành chi phí"
                        >
                          <span>{line.name}</span>
                          <span
                            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-400 group-hover:bg-orange-100 group-hover:text-[#E4572E] text-[9px] font-bold shrink-0 transition-colors print:hidden"
                          >
                            i
                          </span>
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-slate-600 font-mono text-[10px]">
                        {line.sku}
                      </td>
                      <td className="px-2 py-1.5 text-slate-600 font-medium">
                        {line.brand || 'VN'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center text-slate-600">
                        {line.unit}
                      </td>
                      <td className="px-1.5 py-1.5 text-right font-mono font-bold text-slate-900">
                        {line.qty}
                      </td>
                      {viewType === 'internal' && (
                        <>
                          <td className="px-2 py-1.5 text-right font-mono text-slate-500">
                            {line.unitCostVnd.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono text-slate-600 font-semibold">
                            {line.totalCostVnd.toLocaleString('vi-VN')}
                          </td>
                        </>
                      )}
                      <td className="px-2 py-1.5 text-right font-mono text-slate-700">
                        {line.unitSellVnd.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-bold text-slate-900">
                        {line.totalSellVnd.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-2 py-1.5 text-slate-400 text-[10px]">
                        {line.note || ''}
                      </td>
                    </tr>
                  ))
                )}
              </React.Fragment>
            ))}

            {/* Suất đầu tư Trọn gói Đã gồm VAT */}
            <tr className="bg-orange-100/70 border-t-2 border-orange-300 font-bold text-xs text-orange-950">
              <td colSpan={viewType === 'internal' ? 6 : 5} className="px-2.5 py-2.5">
                <div className="flex items-center gap-1.5 uppercase tracking-wide">
                  <Zap size={13} className="text-[#E4572E]" />
                  <span>TỈ SUẤT ĐẦU TƯ TRỌN GÓI (ĐÃ BAO GỒM VAT) / kWp:</span>
                </div>
              </td>
              <td colSpan={viewType === 'internal' ? 4 : 3} className="px-2.5 py-2.5 text-right font-mono font-black text-[#E4572E] text-base">
                {ratePostVat.toLocaleString('vi-VN')} Vnđ / kWp
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Commercial Total Summary Calculation Box */}
      {fin && (
        <div className="flex justify-end mb-6">
          <div className="w-full sm:w-84 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Tổng cộng thiết bị & dịch vụ (đã gồm VAT):</span>
              <span className="font-mono font-bold text-slate-900">
                {fin.capexSellVnd.toLocaleString('vi-VN')} đ
              </span>
            </div>

            {fin.discountVnd > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-600">
                <span>Chiết khấu ({project.discountPct}%):</span>
                <span className="font-mono font-bold">
                  -{fin.discountVnd.toLocaleString('vi-VN')} đ
                </span>
              </div>
            )}

            <div className="flex justify-between py-1.5 text-sm border-t-2 border-[#0F2A45]">
              <span className="font-bold text-[#0F2A45] uppercase">Tổng Cộng Thanh Toán (Đã gồm VAT):</span>
              <span className="font-mono font-extrabold text-[#E4572E] text-base">
                {fin.grandTotalVnd.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="text-[10px] text-slate-500 italic text-right pt-0.5">
              * Giá thiết bị, vật tư và nhân công mặc định đã bao gồm thuế VAT
            </div>
          </div>
        </div>
      )}

      {/* Engineering Signatures */}
      <div className="grid grid-cols-3 gap-6 text-center text-xs pt-4 border-t border-slate-200">
        <div>
          <div className="font-bold text-slate-900 uppercase">NGƯỜI LẬP BẢNG KÊ</div>
          <div className="text-[10px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên)</div>
          <div className="h-16"></div>
        </div>
        <div>
          <div className="font-bold text-slate-900 uppercase">TRƯỞNG PHÒNG KỸ THUẬT</div>
          <div className="text-[10px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên)</div>
          <div className="h-16"></div>
        </div>
        <div>
          <div className="font-bold text-slate-900 uppercase">GIÁM ĐỐC PHÊ DUYỆT</div>
          <div className="text-[10px] text-slate-400 mt-0.5">(Ký tên & đóng dấu)</div>
          <div className="h-16"></div>
        </div>
      </div>

      {/* Popover Chi Tiết Kỹ Thuật & Cấu Thành Chi Phí Khi Rê Chuột (Lưu Trong Database) */}
      {hoveredInfo && (
        <div
          style={{ top: `${hoveredInfo.y}px`, left: `${hoveredInfo.x}px` }}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={() => {
            if (!isPinned) setHoveredInfo(null);
          }}
          className="fixed z-50 w-80 sm:w-96 md:w-[430px] max-w-[92vw] bg-white rounded-xl shadow-2xl border border-slate-200/95 p-4 text-xs text-slate-800 animate-fadeIn backdrop-blur-md pointer-events-auto print:hidden"
        >
          {/* Popover Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-mono">
                  Phần {hoveredInfo.line.hgcSectionCode || 'BOM'} · {hoveredInfo.line.hgcSubsection || 'Vật tư'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Mã: <strong className="text-slate-700">{hoveredInfo.line.sku}</strong>
                </span>
                {isPinned && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    📌 Đã ghim
                  </span>
                )}
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F2A45] mt-1 leading-snug">
                {hoveredInfo.line.name}
              </h4>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                <span>Hãng: <strong className="text-slate-700">{hoveredInfo.line.brand || 'Chính hãng'}</strong></span>
                <span>•</span>
                <span>Xuất xứ: <strong className="text-slate-700">{hoveredInfo.line.origin || 'Việt Nam'}</strong></span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsPinned(false);
                setHoveredInfo(null);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
              title="Đóng"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body Sections */}
          <div className="space-y-2 text-[11px]">
            {/* 1. Mô Tả Kỹ Thuật */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-[#0F2A45] font-bold uppercase text-[10px] mb-1 tracking-wide">
                <span>📋</span>
                <span>Mô Tả Kỹ Thuật Tiêu Chuẩn:</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {hoveredInfo.line.technicalDescription || hoveredInfo.line.spec || 'Vật tư đạt tiêu chuẩn kỹ thuật điện mặt trời TCVN / IEC, đầy đủ chứng chỉ xuất xưởng CO/CQ.'}
              </p>
            </div>

            {/* 2. Chi Phí Cấu Thành Nên Nó Là Gì */}
            <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/60 p-2.5 rounded-lg border border-orange-200/80">
              <div className="flex items-center gap-1.5 text-[#E4572E] font-bold uppercase text-[10px] mb-1 tracking-wide">
                <span>💰</span>
                <span>Chi Phí Cấu Thành & Nội Dung Thực Hiện:</span>
              </div>
              <p className="text-slate-700 leading-relaxed text-[11px] font-normal">
                {hoveredInfo.line.costBreakdown || 'Cấu thành chi phí gồm: vật tư chế tạo, đóng gói bảo quản, kiểm định an toàn và hỗ trợ kỹ thuật bảo hành.'}
              </p>
            </div>
          </div>

          {/* Footer Meta */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-2 font-mono">
              <span>ĐVT: <strong className="text-slate-800">{hoveredInfo.line.unit}</strong></span>
              <span>•</span>
              <span>Số lượng: <strong className="text-slate-900">{hoveredInfo.line.qty}</strong></span>
              <span>•</span>
              <span>{viewType === 'internal' ? `Giá vốn: ${hoveredInfo.line.unitCostVnd.toLocaleString('vi-VN')} đ` : `Đơn giá: ${hoveredInfo.line.unitSellVnd.toLocaleString('vi-VN')} đ`}</span>
            </div>
            <span className="text-[9.5px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50 flex items-center gap-1" title="Dữ liệu được lưu trữ trong cơ sở dữ liệu PostgreSQL & JSON">
              <span>✓</span> Lưu trong DB
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
