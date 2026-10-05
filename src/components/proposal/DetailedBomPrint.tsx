import React from 'react';
import { Project } from '../../types/solar';
import { getStandardGroupedBom } from '../../engine/bom';
import { Logo } from '../common/Logo';
import { Coins, Zap, Wrench } from 'lucide-react';

interface DetailedBomPrintProps {
  project: Project;
  viewType?: 'customer' | 'internal';
}

export const DetailedBomPrint: React.FC<DetailedBomPrintProps> = ({
  project,
  viewType = 'customer',
}) => {
  const fin = project.financial;
  const layout = project.layoutResult;
  const bomLines = project.bomLines || [];
  const installedKwp = layout?.installedKwp || 1;

  const standardGroups = getStandardGroupedBom(bomLines);

  const ratePreVat = fin?.investmentRatePreVatVndPerKwp || Math.round((fin?.capexSellVnd || 0) / installedKwp);
  const ratePostVat = fin?.investmentRatePostVatVndPerKwp || Math.round((fin?.grandTotalVnd || 0) / installedKwp);

  return (
    <div className="bg-white text-slate-900 font-sans print:p-0 print:border-none print:shadow-none text-xs leading-normal">
      {/* Letterhead */}
      <div className="flex items-start justify-between border-b-2 border-[#0F2A45] pb-4 mb-4">
        <div className="flex items-center gap-3">
          <Logo size="lg" />
        </div>

        <div className="text-right text-[11px] text-slate-600">
          <div className="font-bold text-sm text-[#0F2A45]">CÔNG TY CỔ PHẦN CÔNG NGHỆ HGC</div>
          <div>Phòng Kỹ Thuật & Đấu Thầu EPC · Hotline: 1900-xxxx</div>
          <div>Website: www.hgc.vn · Email: kythuat@hgc.vn</div>
          <div className="text-slate-400 font-mono text-[10px] mt-1">
            Mã BOM: HGC-BOM-{project.id.slice(0, 6).toUpperCase()} · Ngày: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>

      {/* Document Title */}
      <div className="text-center my-3">
        <div className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-slate-200 mb-1.5">
          TÀI LIỆU KỸ THUẬT & DỰ TOÁN BÓC TÁCH KHỐI LƯỢNG
        </div>
        <h2 className="text-lg sm:text-xl font-black text-[#0F2A45] uppercase tracking-wide">
          BẢNG DỰ TOÁN CHI TIẾT 8 NHÓM VẬT TƯ & THIẾT BỊ (ENGINEERING BOM)
        </h2>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
          Áp dụng cho công tác nghiệm thu vật tư, quản trị kho và giám sát thi công công trình
        </p>
      </div>

      {/* Quick Project Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px]">Chủ Đầu Tư:</span>
          <strong className="text-slate-900">{project.customerName || 'Khách Hàng'}</strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Công Suất:</span>
          <strong className="text-[#E4572E] font-mono font-bold">{installedKwp} kWp</strong>
          <span className="text-[10px] text-slate-500"> ({layout?.panelQty} tấm pin)</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Địa Điểm:</span>
          <strong className="text-slate-900">{project.provinceCode}</strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Cơ Chế:</span>
          <strong className="text-emerald-700 font-semibold">Zero-Export (Bám tải)</strong>
        </div>
      </div>

      {/* STANDARDIZED DETAILED 8 BOM GROUPS TABLE */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 mb-4">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0F2A45] text-white text-[10.5px] uppercase font-bold font-mono">
            <tr>
              <th className="px-2.5 py-2 w-10 text-center">STT</th>
              <th className="px-2.5 py-2">Tên Vật Tư / Thiết Bị</th>
              <th className="px-2.5 py-2">Thông Số Kỹ Thuật / Model</th>
              <th className="px-2.5 py-2 text-center w-14">ĐVT</th>
              <th className="px-2.5 py-2 text-right w-14">SL</th>
              {viewType === 'internal' && (
                <>
                  <th className="px-2.5 py-2 text-right text-slate-300">Giá Vốn (đ)</th>
                  <th className="px-2.5 py-2 text-right text-slate-300">Tổng Vốn (đ)</th>
                </>
              )}
              <th className="px-2.5 py-2 text-right">Đơn Giá (đ)</th>
              <th className="px-2.5 py-2 text-right">Thành Tiền (đ)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {standardGroups.map((gData) => (
              <React.Fragment key={gData.group.code}>
                {/* Header Nhóm La Mã */}
                <tr className="bg-emerald-50/80 font-bold text-slate-900 text-[11px] border-t-2 border-slate-200">
                  <td className="px-2.5 py-1.5 text-center font-mono text-[#065f46] font-bold">
                    {gData.group.code}
                  </td>
                  <td colSpan={2} className="px-2.5 py-1.5 text-[#065f46] uppercase">
                    {gData.group.name}
                    <span className="text-[10px] text-slate-500 font-normal ml-1">· {gData.group.description}</span>
                  </td>
                  <td className="px-2.5 py-1.5 text-center text-slate-500 font-mono">Lot</td>
                  <td className="px-2.5 py-1.5 text-right font-mono font-bold text-slate-700">1</td>
                  {viewType === 'internal' && (
                    <>
                      <td className="px-2.5 py-1.5 text-right font-mono text-slate-600">
                        {gData.subtotalCostVnd.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-mono text-slate-700 font-bold">
                        {gData.subtotalCostVnd.toLocaleString('vi-VN')}
                      </td>
                    </>
                  )}
                  <td className="px-2.5 py-1.5 text-right font-mono text-[#065f46] font-bold">
                    {gData.subtotalSellVnd.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono text-[#065f46] font-bold">
                    {gData.subtotalSellVnd.toLocaleString('vi-VN')}
                  </td>
                </tr>

                {/* Từng dòng vật tư chi tiết */}
                {gData.items.map((line, idx) => (
                  <tr key={line.id} className="hover:bg-slate-50 transition-colors text-[10.5px]">
                    <td className="px-2.5 py-1.5 text-center text-slate-400 font-mono">
                      {gData.group.code}.{idx + 1}
                    </td>
                    <td className="px-2.5 py-1.5 pl-5">
                      <div className="font-semibold text-slate-900">{line.name}</div>
                      {line.note && <div className="text-[9.5px] text-slate-400">{line.note}</div>}
                    </td>
                    <td className="px-2.5 py-1.5 text-slate-600 font-mono text-[10px]">
                      {line.spec}
                    </td>
                    <td className="px-2.5 py-1.5 text-center text-slate-600">{line.unit}</td>
                    <td className="px-2.5 py-1.5 text-right font-mono font-bold text-slate-800">
                      {line.qty}
                    </td>
                    {viewType === 'internal' && (
                      <>
                        <td className="px-2.5 py-1.5 text-right font-mono text-slate-500">
                          {line.unitCostVnd.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono text-slate-600 font-semibold">
                          {line.totalCostVnd.toLocaleString('vi-VN')}
                        </td>
                      </>
                    )}
                    <td className="px-2.5 py-1.5 text-right font-mono text-slate-700">
                      {line.unitSellVnd.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono font-bold text-slate-900">
                      {line.totalSellVnd.toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}

            {/* Suất đầu tư Chưa VAT */}
            <tr className="bg-emerald-100/70 border-t-2 border-emerald-400 font-bold text-xs text-emerald-950">
              <td colSpan={viewType === 'internal' ? 6 : 4} className="px-2.5 py-2">
                <div className="flex items-center gap-1.5 uppercase tracking-wide">
                  <Coins size={13} className="text-emerald-700" />
                  <span>TỈ SUẤT ĐẦU TƯ (CHƯA VAT) / kWp:</span>
                </div>
              </td>
              <td colSpan={viewType === 'internal' ? 3 : 2} className="px-2.5 py-2 text-right font-mono font-black text-emerald-900 text-sm">
                {ratePreVat.toLocaleString('vi-VN')} Vnđ / kWp
              </td>
            </tr>

            {/* Suất đầu tư Có VAT */}
            <tr className="bg-orange-100/70 border-t border-orange-300 font-bold text-xs text-orange-950">
              <td colSpan={viewType === 'internal' ? 6 : 4} className="px-2.5 py-2">
                <div className="flex items-center gap-1.5 uppercase tracking-wide">
                  <Zap size={13} className="text-[#E4572E]" />
                  <span>TỈ SUẤT ĐẦU TƯ TRỌN GÓI (ĐÃ GỒM VAT 10%) / kWp:</span>
                </div>
              </td>
              <td colSpan={viewType === 'internal' ? 3 : 2} className="px-2.5 py-2 text-right font-mono font-black text-[#E4572E] text-base">
                {ratePostVat.toLocaleString('vi-VN')} Vnđ / kWp
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Commercial Total Summary Calculation Box */}
      {fin && (
        <div className="flex justify-end mb-6">
          <div className="w-full sm:w-80 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Tổng cộng vật tư & dịch vụ:</span>
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

            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
              <span>Thuế VAT (10%):</span>
              <span className="font-mono font-bold text-slate-800">
                +{fin.vatVnd.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-between py-1.5 text-sm border-t-2 border-[#0F2A45]">
              <span className="font-bold text-[#0F2A45] uppercase">Tổng Cộng Dự Toán:</span>
              <span className="font-mono font-extrabold text-[#E4572E] text-base">
                {fin.grandTotalVnd.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Engineering Signatures */}
      <div className="grid grid-cols-3 gap-6 text-center text-xs pt-4 border-t border-slate-200">
        <div>
          <div className="font-bold text-slate-900 uppercase">NGƯỜI LẬP DỰ TOÁN</div>
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
    </div>
  );
};
