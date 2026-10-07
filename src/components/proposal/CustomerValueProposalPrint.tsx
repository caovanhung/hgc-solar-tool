import React from 'react';
import { Project } from '../../types/solar';
import { getHgcSectionGroupedBom } from '../../engine/bom';
import { Logo } from '../common/Logo';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  Sparkles,
  Zap,
  Building,
  CheckCircle2,
  Coins,
  SunMedium,
  Leaf,
  Layers,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';

interface CustomerValueProposalPrintProps {
  project: Project;
}

export const CustomerValueProposalPrint: React.FC<CustomerValueProposalPrintProps> = ({ project }) => {
  const fin = project.financial;
  const layout = project.layoutResult;
  const bomLines = project.bomLines || [];
  const installedKwp = layout?.installedKwp || 1;

  // 4 Phần Chuẩn Mẫu File 'Bảng kê vật tư mẫu.xlsx' của công ty (Phần A, B, C, D)
  const hgcSections = getHgcSectionGroupedBom(bomLines).filter(
    (s) => s.items.length > 0
  );

  const ratePreVat = fin?.investmentRatePreVatVndPerKwp || Math.round((fin?.capexSellVnd || 0) / installedKwp);
  const ratePostVat = fin?.investmentRatePostVatVndPerKwp || Math.round((fin?.grandTotalVnd || 0) / installedKwp);
  const ratePerWp = Math.round(ratePostVat / 1000);
  const initialCapexMillion = Number(((fin?.grandTotalVnd || 0) / 1000000).toFixed(1));

  // Dữ liệu biểu đồ Recharts dự phóng 20 năm
  const proposalChartData = fin?.cashflow20Years
    ? fin.cashflow20Years.map((cf) => ({
        yearLabel: `N.${cf.year}`,
        yearNum: cf.year,
        annualSavingsMillion: Number((cf.annualSavingsVnd / 1000000).toFixed(1)),
        cumulativeSavingsMillion: Number((cf.cumulativeSavingsVnd / 1000000).toFixed(1)),
        netCashflowMillion: Number((cf.netCashflowVnd / 1000000).toFixed(1)),
        generatedKwh: cf.generatedKwh,
      }))
    : [];

  const ProposalCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isRecovered = data.cumulativeSavingsMillion >= initialCapexMillion;
      const diffMillion = Number((data.cumulativeSavingsMillion - initialCapexMillion).toFixed(1));
      return (
        <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-xl text-xs text-slate-800 min-w-[210px]">
          <div className="font-bold text-[#0F2A45] border-b border-slate-100 pb-1 mb-1.5 flex justify-between gap-4">
            <span>Năm thứ {data.yearNum}</span>
            <span className="text-slate-500 font-mono text-[10.5px]">
              {data.generatedKwh.toLocaleString('vi-VN')} kWh
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500 font-sans">Tiết kiệm năm:</span>
              <strong className="text-emerald-700">+{data.annualSavingsMillion} tr đ</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500 font-sans">Lũy kế tiết kiệm:</span>
              <strong className="text-sky-700">+{data.cumulativeSavingsMillion} tr đ</strong>
            </div>
            <div className="flex justify-between gap-3 pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-sans">Vốn ban đầu:</span>
              <strong className="text-[#E4572E]">{initialCapexMillion} tr đ</strong>
            </div>
            <div className="flex justify-between gap-3 pt-0.5">
              <span className="text-slate-500 font-sans">Hoàn vốn:</span>
              {isRecovered ? (
                <strong className="text-emerald-600 font-bold">
                  Đã hoàn vốn (+{diffMillion} tr)
                </strong>
              ) : (
                <strong className="text-amber-600 font-bold">
                  Đang thu hồi ({Math.round((data.cumulativeSavingsMillion / initialCapexMillion) * 100)}%)
                </strong>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Lọc một số năm tiêu biểu trong dòng tiền 20 năm
  const keyCashflowYears = fin?.cashflow20Years
    ? fin.cashflow20Years.filter((cf) => [1, 2, 3, 4, 5, 10, 15, 20].includes(cf.year))
    : [];

  return (
    <div className="bg-white text-slate-900 font-sans print:p-0 print:border-none print:shadow-none text-xs leading-normal">
      {/* ========================================================================= */}
      {/* TRANG 1: BÌA & TỔNG QUAN GIẢI PHÁP + 4 TRỤ CỘT GIÁ TRỊ DOANH NGHIỆP      */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-slate-200 pb-6 mb-6">
        {/* Letterhead */}
        <div className="flex items-start justify-between border-b-2 border-red-600 pb-3 mb-5">
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
              Mã hồ sơ: HGC-PROPOSAL-{project.id.slice(0, 6).toUpperCase()} · Ngày phát hành: {new Date().toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center my-4">
          <div className="inline-block bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-emerald-200 mb-2">
            HỒ SƠ ĐỀ XUẤT ĐẦU TƯ & BÁO GIÁ THƯƠNG MẠI
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F2A45] uppercase tracking-wide">
            HỆ THỐNG ĐIỆN MẶT TRỜI ÁP MÁI TỰ DÙNG (ZERO-EXPORT)
          </h1>
          <p className="text-[11.5px] text-slate-500 font-medium mt-1">
            Giải pháp cắt giảm chi phí điện, chống nóng công trình & nâng cao chỉ số phát triển bền vững ESG
          </p>
        </div>

        {/* Project Profile Summary Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 my-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10.5px]">Chủ Đầu Tư:</span>
            <strong className="text-slate-900 text-sm">{project.customerName || 'Quý Khách Hàng'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10.5px]">Công Suất Đề Xuất:</span>
            <strong className="text-[#E4572E] text-sm font-mono font-bold">
              {installedKwp} kWp
            </strong>
            <span className="text-[10px] text-slate-500 block">({layout?.panelQty} tấm pin)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10.5px]">Địa Điểm Lắp Đặt:</span>
            <strong className="text-slate-900">{project.provinceCode}</strong>
            <span className="text-[10px] text-slate-500 block">Mái {project.roofType === 'tole' ? 'Tôn' : project.roofType === 'tile' ? 'Ngói' : 'Bê tông'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10.5px]">Cơ Chế Đấu Nối:</span>
            <strong className="text-emerald-700">Zero-Export (Bám tải)</strong>
            <span className="text-[10px] text-slate-500 block">Tuân thủ QĐ 1279/QĐ-BCT</span>
          </div>
        </div>

        {/* 4 TRỤ CỘT GIÁ TRỊ & LỢI ÍCH TRỌNG YẾU (VALUE PROPOSITION) */}
        <div className="mt-5">
          <div className="text-xs font-bold text-[#0F2A45] uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Sparkles size={15} className="text-[#E4572E]" />
            <span>4 Giá Trị & Lợi Ích Cốt Lõi Dự Án Mang Lại Cho Khách Hàng:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Value 1: Tiết kiệm tiền điện */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">1</div>
                <span className="uppercase">Cắt Giảm Tiền Điện & Tự Chủ Chi Phí</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tự sản xuất điện sạch vào khung giờ làm việc ban ngày. Ước tính tiết kiệm ngay <strong>{fin ? Math.round(fin.year1SavingsVnd / 1000000).toLocaleString('vi-VN') : 0} triệu đồng</strong> trong năm đầu tiên (~{fin ? Math.round(fin.year1SavingsVnd / 12 / 1000000).toFixed(1) : 0} tr/tháng), phòng ngừa rủi ro giá điện EVN tăng lũy tiến hàng năm.
              </p>
            </div>

            {/* Value 2: Giảm nhiệt mái */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">2</div>
                <span className="uppercase">Hạ Nhiệt Mái Nhà & Bảo Vệ Tài Sản</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Hệ thống tấm pin hoạt động như một lớp mái kép cản xạ 85% ánh nắng trực tiếp, giúp <strong>hạ nhiệt độ mái tôn từ 3°C - 5°C</strong>. Không gian nhà xưởng mát hơn, giảm 15-25% điện năng tiêu thụ cho điều hòa/quạt hút và kéo dài tuổi thọ tôn mái.
              </p>
            </div>

            {/* Value 3: ESG & Tín chỉ Carbon */}
            <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 space-y-1.5">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                <div className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-bold">3</div>
                <span className="uppercase">Tiêu Chuẩn Xanh ESG & Tín Chỉ I-REC</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Giảm phát thải <strong>{fin?.co2ReductionTonsYear} tấn CO₂/năm</strong> (tương đương trồng {fin?.treesEquivalentYear} cây xanh). Đủ điều kiện đăng ký chứng chỉ năng lượng tái tạo I-REC quốc tế, tạo lợi thế cạnh tranh xuất khẩu sang EU (thuế carbon CBAM) và Mỹ.
              </p>
            </div>

            {/* Value 4: An toàn Zero-Export */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <div className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold">4</div>
                <span className="uppercase">Vận Hành Bám Tải & An Toàn Tuyệt Đối</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Thiết bị Smart Meter thông minh kiểm soát công suất phát tức thời trong &lt;0.2 giây, <strong>triệt tiêu phát ngược lên lưới điện 100%</strong>. Tủ điện AC phân phối tích hợp bảo vệ chống sét lan truyền Type 1+2 và ngắt sự cố hồ quang AFCI.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TRANG 2: HIỆU QUẢ TÀI CHÍNH, SUẤT ĐẦU TƯ & DÒNG TIỀN HOÀN VỐN          */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-slate-200 pb-6 mb-6">
        <div className="text-xs font-bold text-[#0F2A45] uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <TrendingUp size={15} className="text-[#E4572E]" />
          <span>Hiệu Quả Kinh Tế & Phân Tích Dòng Tiền Đầu Tư:</span>
        </div>

        {/* 4 Financial Highlight Metric Cards */}
        {fin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-300 text-center">
              <span className="text-[10px] text-emerald-800 font-bold uppercase block">Suất Đầu Tư Trọn Gói</span>
              <strong className="text-base sm:text-lg font-black text-emerald-950 font-mono block mt-0.5">
                {ratePostVat.toLocaleString('vi-VN')}
              </strong>
              <span className="text-[10px] text-emerald-700 font-mono">đ / kWp (VAT) · ~{ratePerWp} đ/Wp</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Thời Gian Hoàn Vốn</span>
              <strong className="text-base sm:text-lg font-black text-[#0F2A45] font-mono block mt-0.5">
                {fin.paybackYears} năm
              </strong>
              <span className="text-[10px] text-slate-400">Thu hồi 100% vốn đầu tư</span>
            </div>

            <div className="bg-orange-50/80 p-3 rounded-xl border border-orange-300 text-center">
              <span className="text-[10px] text-orange-900 font-bold uppercase block">Tỷ Suất Sinh Lời IRR</span>
              <strong className="text-base sm:text-lg font-black text-[#E4572E] font-mono block mt-0.5">
                {fin.irrPct} % / năm
              </strong>
              <span className="text-[10px] text-orange-700">Cao gấp 3-4 lần lãi suất tiền gửi</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Tiết Kiệm Năm Đầu</span>
              <strong className="text-base sm:text-lg font-black text-emerald-600 font-mono block mt-0.5">
                {Math.round(fin.year1SavingsVnd / 1000000).toLocaleString('vi-VN')} triệu
              </strong>
              <span className="text-[10px] text-slate-400">~{Math.round(fin.year1SavingsVnd / 12).toLocaleString('vi-VN')} đ/tháng</span>
            </div>
          </div>
        )}

        {/* Biểu đồ Recharts: Dự Phóng Dòng Tiền & Tích Lũy Tiết Kiệm (20 Năm) - LỰA CHỌN A */}
        {proposalChartData.length > 0 && (
          <div className="mb-4 p-3.5 bg-slate-50/90 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <BarChart3 size={15} className="text-[#E4572E]" />
                <span className="text-[11px] font-bold text-[#0F2A45] uppercase tracking-wide">
                  BIỂU ĐỒ RECHARTS DỰ PHÓNG TIẾT KIỆM TÍCH LŨY & HOÀN VỐN ĐẦU TƯ (20 NĂM)
                </span>
              </div>
              <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                🎯 Mốc hòa vốn: {fin?.paybackYears} năm · {20 - Math.ceil(fin?.paybackYears || 4)} năm sau sinh lời tự do 100%
              </div>
            </div>

            {/* Chú giải ý nghĩa các đường */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-slate-600 mb-2 px-1">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#E4572E] inline-block"></span>
                  <strong className="text-[#E4572E]">Mức Vốn Đầu Tư ({initialCapexMillion} tr đ)</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-xs bg-[#0284C7] inline-block"></span>
                  <strong className="text-[#0284C7]">Lũy Kế Tiết Kiệm (Tăng dần theo năm)</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-[#10B981] inline-block"></span>
                  <span className="text-emerald-700 font-medium">Tiền điện tiết kiệm từng năm</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 border-l-2 border-dashed border-[#059669] inline-block"></span>
                  <span className="text-emerald-800 font-medium">Cột mốc hòa vốn ({fin?.paybackYears} năm)</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 italic">
                (Đã tính tỷ lệ suy hao tấm pin 0.7%/năm)
              </span>
            </div>

            {/* Vùng vẽ Biểu đồ Recharts */}
            <div className="w-full h-64 print:h-60" style={{ minHeight: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={proposalChartData}
                  margin={{ top: 16, right: 15, bottom: 5, left: 10 }}
                >
                  <defs>
                    <linearGradient id="cumulativeSavingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284C7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" opacity={0.6} />
                  <XAxis
                    dataKey="yearLabel"
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#0284C7"
                    fontSize={10}
                    tickLine={false}
                    domain={[0, 'auto']}
                    tickFormatter={(v) => `${v} tr`}
                  />
                  <Tooltip content={<ProposalCustomTooltip />} />
                  {/* Đường mức vốn đầu tư ban đầu cố định */}
                  <ReferenceLine
                    y={initialCapexMillion}
                    stroke="#E4572E"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{
                      value: `Vốn ban đầu: ${initialCapexMillion} tr đ`,
                      fill: '#E4572E',
                      fontSize: 10,
                      fontWeight: 'bold',
                      position: 'insideTopLeft',
                    }}
                  />
                  {/* Cột mốc hoàn vốn thẳng đứng */}
                  <ReferenceLine
                    x={`N.${Math.ceil(fin?.paybackYears || 4)}`}
                    stroke="#059669"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    label={{
                      value: `🎯 Hòa vốn (${fin?.paybackYears} năm)`,
                      fill: '#059669',
                      fontSize: 10,
                      fontWeight: 'bold',
                      position: 'insideTopRight',
                    }}
                  />
                  {/* Vùng diện tích tích lũy dốc lên */}
                  <Area
                    type="monotone"
                    dataKey="cumulativeSavingsMillion"
                    name="Lũy kế tiết kiệm (tr đ)"
                    stroke="#0284C7"
                    strokeWidth={3}
                    fill="url(#cumulativeSavingsGradient)"
                    dot={{ r: 2.5, fill: '#0284C7' }}
                  />
                  {/* Đường tiết kiệm từng năm mỏng ở dưới */}
                  <Line
                    type="monotone"
                    dataKey="annualSavingsMillion"
                    name="Tiết kiệm trong năm (tr đ)"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[10px] text-slate-500 italic text-right mt-1">
              * Dự toán tính toán chính xác có trừ suy hao công suất tấm pin 0.7%/năm theo cam kết hiệu suất 25 năm của hãng sản xuất.
            </div>
          </div>
        )}

        {/* Cashflow Forecast Table (10-20 years preview) */}
        {keyCashflowYears.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>BẢNG DỰ PHÓNG DÒNG TIỀN TIẾT KIỆM (TÍNH TỶ LỆ SUY HAO TẤM PIN 0.7%/NĂM):</span>
              <span className="text-slate-400 font-normal">Đơn vị: VNĐ</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#0F2A45] text-white uppercase text-[10px] font-mono">
                  <tr>
                    <th className="px-2.5 py-2 text-center">Năm</th>
                    <th className="px-2.5 py-2 text-right">Sản Lượng Phát (kWh)</th>
                    <th className="px-2.5 py-2 text-right">Tiết Kiệm Năm (đ)</th>
                    <th className="px-2.5 py-2 text-right">Lũy Kế Tiết Kiệm (đ)</th>
                    <th className="px-2.5 py-2 text-right">Dòng Tiền Ròng (đ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {keyCashflowYears.map((cf) => {
                    const isBreakeven = cf.netCashflowVnd >= 0;
                    return (
                      <tr key={cf.year} className={isBreakeven && cf.year <= 5 ? 'bg-emerald-50/70 font-semibold' : ''}>
                        <td className="px-2.5 py-1.5 text-center font-bold">Năm {cf.year}</td>
                        <td className="px-2.5 py-1.5 text-right">{cf.generatedKwh.toLocaleString('vi-VN')}</td>
                        <td className="px-2.5 py-1.5 text-right text-emerald-700">+{cf.annualSavingsVnd.toLocaleString('vi-VN')}</td>
                        <td className="px-2.5 py-1.5 text-right">{cf.cumulativeSavingsVnd.toLocaleString('vi-VN')}</td>
                        <td className={`px-2.5 py-1.5 text-right font-bold ${cf.netCashflowVnd >= 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {cf.netCashflowVnd.toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TRANG 3: BẢNG BÁO GIÁ TỔNG HỢP THEO MẪU BẢNG KÊ VẬT TƯ & BẢO HÀNH        */}
      {/* ========================================================================= */}
      <div>
        <div className="text-xs font-bold text-[#0F2A45] uppercase tracking-wide mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet size={15} className="text-[#E4572E]" />
            <span>Bảng Dự Toán Báo Giá Theo Mẫu Bảng Kê Vật Tư Thiết Bị (Phần A - B - C - D):</span>
          </div>
          <span className="text-[10.5px] text-slate-500 font-normal italic">
            (Bản tóm tắt · Chi tiết từng mã hàng xem tại Bảng Kê Vật Tư đính kèm)
          </span>
        </div>

        {/* 4-Section High-Level Summary Table (Lot 1 Format) */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 mb-4">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0F2A45] text-white text-[11px] uppercase font-bold font-mono">
              <tr>
                <th className="px-3 py-2 w-12 text-center">STT</th>
                <th className="px-3 py-2">Tên Hạng Mục Đầu Tư</th>
                <th className="px-3 py-2">Quy Cách / Thành Phần Chính</th>
                <th className="px-3 py-2 text-center w-14">ĐVT</th>
                <th className="px-3 py-2 text-right w-12">SL</th>
                <th className="px-3 py-2 text-right">Đơn Giá (đ)</th>
                <th className="px-3 py-2 text-right">Thành Tiền (đ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hgcSections.map((secGroup) => {
                const sampleItems = secGroup.items.slice(0, 3).map((it) => it.name).join(', ');
                const desc = sampleItems ? `${sampleItems}... (${secGroup.items.length} hạng mục)` : '';
                return (
                  <tr key={secGroup.section.code} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-700">
                      {secGroup.section.code}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-[#0F2A45]">
                      {secGroup.section.name}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-600">
                      {desc}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-500">Lot</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-700">1</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-800">
                      {secGroup.subtotalSellVnd.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-[#0F2A45]">
                      {secGroup.subtotalSellVnd.toLocaleString('vi-VN')}
                    </td>
                  </tr>
                );
              })}

              {/* Dòng Suất đầu tư Chưa VAT */}
              <tr className="bg-emerald-100/70 border-t-2 border-emerald-400 font-bold text-xs text-emerald-950">
                <td colSpan={4} className="px-3 py-2">
                  <div className="flex items-center gap-1.5 uppercase tracking-wide">
                    <Coins size={13} className="text-emerald-700" />
                    <span>TỈ SUẤT ĐẦU TƯ (CHƯA VAT) / kWp:</span>
                  </div>
                </td>
                <td colSpan={3} className="px-3 py-2 text-right font-mono font-black text-emerald-900 text-sm">
                  {ratePreVat.toLocaleString('vi-VN')} Vnđ / kWp
                </td>
              </tr>

              {/* Dòng Suất đầu tư Trọn gói Có VAT */}
              <tr className="bg-orange-100/70 border-t border-orange-300 font-bold text-xs text-orange-950">
                <td colSpan={4} className="px-3 py-2">
                  <div className="flex items-center gap-1.5 uppercase tracking-wide">
                    <Zap size={13} className="text-[#E4572E]" />
                    <span>TỈ SUẤT ĐẦU TƯ TRỌN GÓI (ĐÃ GỒM VAT 10%) / kWp:</span>
                  </div>
                </td>
                <td colSpan={3} className="px-3 py-2 text-right font-mono font-black text-[#E4572E] text-base">
                  {ratePostVat.toLocaleString('vi-VN')} Vnđ / kWp
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Commercial Total Summary Calculation Box */}
        {fin && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
            <div className="text-[11px] text-slate-500 italic max-w-md">
              * Báo giá đã bao gồm toàn bộ thiết bị chính hãng, phụ kiện mounting nhôm Anodized Al6005-T5, cáp điện Cadivi, tủ điện bám tải Zero-Export, nhân công lắp đặt và hồ sơ thỏa thuận Điện lực EVN.
            </div>

            <div className="w-full sm:w-80 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Tổng cộng (chưa VAT):</span>
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
                <span className="font-bold text-[#0F2A45] uppercase">Tổng Cộng Thanh Toán:</span>
                <span className="font-mono font-extrabold text-[#E4572E] text-base">
                  {fin.grandTotalVnd.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Cam kết & Chính sách bảo hành */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-6">
          <div className="text-xs font-bold text-[#0F2A45] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-700" />
            <span>Cam Kết Chất Lượng & Chính Sách Bảo Hành Chính Hãng:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-start gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Tấm pin quang điện:</strong> Bảo hành hiệu suất 25 - 30 năm (&gt;80% công suất danh định).</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Biến tần Inverter:</strong> Bảo hành tiêu chuẩn 5 năm chính hãng (hỗ trợ kỹ thuật 24/7).</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Khung giàn ray nhôm Al6005-T5:</strong> Bảo hành 12 năm chống ăn mòn, chịu gió bão cấp 12.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Hồ sơ pháp lý:</strong> Đồng hành nghiệm thu kỹ thuật đấu nối và ký thỏa thuận với Điện lực EVN.</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-200">
          <div>
            <div className="font-bold text-slate-900 uppercase">ĐẠI DIỆN KHÁCH HÀNG</div>
            <div className="text-[11px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên & đóng dấu)</div>
            <div className="h-16"></div>
          </div>
          <div>
            <div className="font-bold text-slate-900 uppercase">ĐẠI DIỆN CÔNG TY TNHH HGC</div>
            <div className="text-[11px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên & đóng dấu)</div>
            <div className="h-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
