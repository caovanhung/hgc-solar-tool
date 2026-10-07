import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Zap,
  Calculator,
  Layers,
  Coins,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  Printer,
  Search,
  Cpu,
  ShieldCheck,
  Building,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface SystemTechnicalDocModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DocTab = 'overview' | 'layout' | 'equipment' | 'bom' | 'finance' | 'cheatsheet';

export const SystemTechnicalDocModal: React.FC<SystemTechnicalDocModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<DocTab>('overview');
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleCopyDocSummary = () => {
    const summaryText = `TÀI LIỆU NGHIỆP VỤ & CÔNG THỨC TÍNH TOÁN SOLAR (1P & 3P)
Chi tiết tài liệu đã được lưu trữ tại file: docs/TAI_LIEU_NGHIEP_VU_VA_CONG_THUC_TINH_TOAN.md trong dự án.
Bao gồm:
1. Đặc tính lưới điện 1 Pha (220V) và 3 Pha (380V).
2. Công thức tính công suất theo hóa đơn (bù trừ 70% ban ngày) & Layout diện tích mái.
3. Logic chọn Inverter (tỷ lệ DC/AC 115-130%, Voc/Vmpp nhiệt độ cực trị), Pin lưu trữ Lithium 16-32kWh.
4. Bảng tính chọn cáp Cadivi CV, sụt áp < 2.5%, CB/MCCB x1.25 dòng tải, SPD Type 2, Smart Meter Zero-Export.
5. Bóc tách BOM chuẩn 4 nhóm (A. Thiết bị chính, B. Hệ rail nhôm, C. Thiết bị ngoại vi, D. Nhân công).
6. Mô hình tài chính 20 năm tính suy hao 0.7%/năm, giá điện EVN, thời gian hoàn vốn & tỷ suất IRR.`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800 font-sans">
        {/* Modal Header */}
        <div className="bg-[#0F2A45] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E4572E] to-amber-500 flex items-center justify-center text-white shadow-md">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Tài Liệu Nghiệp Vụ Kỹ Thuật & Toàn Bộ Công Thức Tính Toán</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Chuẩn 1P & 3P
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Toàn bộ logic tính toán bóc tách thiết bị, công thức điện lực, bóc tách BOM mẫu công ty & dự toán tài chính
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDocSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition-colors"
              title="Sao chép tóm tắt tài liệu"
            >
              {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E4572E] hover:bg-[#d04620] text-xs font-semibold text-white transition-colors"
              title="In tài liệu"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">In / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#0F2A45] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Building size={14} />
              <span>1. Tổng Quan & 1P vs 3P</span>
            </button>
            <button
              onClick={() => setActiveTab('layout')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'layout'
                  ? 'bg-[#0F2A45] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Layers size={14} />
              <span>2. Sản Lượng & Bố Trí Pin</span>
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'equipment'
                  ? 'bg-[#0F2A45] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Zap size={14} />
              <span>3. Chọn Thiết Bị (1P & 3P)</span>
            </button>
            <button
              onClick={() => setActiveTab('bom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'bom'
                  ? 'bg-[#0F2A45] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <FileSpreadsheet size={14} />
              <span>4. Bóc Tách BOM (A-B-C-D)</span>
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'finance'
                  ? 'bg-[#0F2A45] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Coins size={14} />
              <span>5. Giá & Dòng Tiền 20 Năm</span>
            </button>
            <button
              onClick={() => setActiveTab('cheatsheet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'cheatsheet'
                  ? 'bg-[#0F2A45] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Calculator size={14} />
              <span>6. Tra Cứu Nhanh (Cheatsheet)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 italic hidden md:block">
            File gốc: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">docs/TAI_LIEU_NGHIEP_VU_VA_CONG_THUC_TINH_TOAN.md</code>
          </div>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: TỔNG QUAN & LƯỚI 1P VS 3P */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                <h4 className="font-bold text-[#0F2A45] text-base mb-2 flex items-center gap-2">
                  <Building size={18} className="text-[#E4572E]" />
                  PHẦN 1: TỔNG QUAN HỆ THỐNG & ĐẶC TÍNH LƯỚI ĐIỆN 1 PHA VS 3 PHA
                </h4>
                <p className="text-slate-600 text-xs">
                  Hệ thống điện mặt trời áp mái được thiết kế để chuyển đổi năng lượng bức xạ mặt trời thành nguồn điện xoay chiều AC cung cấp trực tiếp cho tải tiêu thụ của công trình, tự động hòa đồng bộ với lưới điện quốc gia EVN.
                </p>
              </div>

              {/* So sánh On-grid vs Hybrid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800">
                    Giải Pháp 1: Hòa Lưới Bám Tải (Zero-Export)
                  </span>
                  <h5 className="font-bold text-[#0F2A45] text-sm mt-2 mb-1.5">On-Grid Zero-Export</h5>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                    <li><strong>Nguyên lý:</strong> Điện mặt trời phát ra được ưu tiên dùng cho tải. Khi dư điện, biến tần tự động giảm công suất theo cảm biến CT/Smart Meter để không phát ngược lên lưới EVN.</li>
                    <li><strong>Ưu điểm:</strong> Chi phí đầu tư thấp nhất, tỷ suất hoàn vốn nhanh (3.5 - 4.5 năm).</li>
                    <li><strong>Bảo vệ:</strong> Tự động ngắt khi mất lưới EVN (Anti-Islanding) để bảo vệ nhân viên điện lực.</li>
                  </ul>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-100 text-amber-800">
                    Giải Pháp 2: Hòa Lưới Có Lưu Trữ (Hybrid ESS)
                  </span>
                  <h5 className="font-bold text-[#0F2A45] text-sm mt-2 mb-1.5">Hybrid Energy Storage System</h5>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                    <li><strong>Nguyên lý:</strong> Ban ngày cấp tải và sạc pin Lithium; ban đêm xả pin nuôi tải. Khi mất điện lưới, bộ chuyển mạch ATS tự động chuyển sang cổng Back-up/EPS trong &lt; 20ms.</li>
                    <li><strong>Ưu điểm:</strong> Độc lập năng lượng 24/7, có nguồn dự phòng khi cúp điện, tỷ lệ tự dùng điện đạt 85% - 95%.</li>
                    <li><strong>Thiết bị đi kèm:</strong> Bộ pin lưu trữ Lithium LFP (16kWh - 32kWh) và tủ ATS chuyển nguồn.</li>
                  </ul>
                </div>
              </div>

              {/* Bảng so sánh 1 Pha vs 3 Pha */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-[#0F2A45] text-white px-4 py-2 font-bold text-xs uppercase tracking-wide">
                  BẢNG ĐỐI CHIẾU KỸ THUẬT: HỆ THỐNG 1 PHA (220V) VS 3 PHA (380V)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 w-48">Tiêu chí kỹ thuật</th>
                        <th className="px-3 py-2">Hệ Thống 1 Pha (1-Phase)</th>
                        <th className="px-3 py-2">Hệ Thống 3 Pha (3-Phase)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr>
                        <td className="px-3 py-2 font-bold text-[#0F2A45]">Điện áp danh định (U)</td>
                        <td className="px-3 py-2 font-mono">220 VAC (Pha - Trung tính)</td>
                        <td className="px-3 py-2 font-mono">380 VAC (Pha - Pha) / 220 VAC (Pha - N)</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-[#0F2A45]">Đối tượng khách hàng</td>
                        <td className="px-3 py-2">Hộ gia đình, nhà phố nhỏ, phụ tải &lt; 10kW</td>
                        <td className="px-3 py-2">Biệt thự dùng điều hòa trung tâm VRV, nhà hàng, nhà xưởng</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-[#0F2A45]">Dải công suất lắp đặt</td>
                        <td className="px-3 py-2 font-mono">3 kWp - 12 kWp (Inverter tối đa 10kW)</td>
                        <td className="px-3 py-2 font-mono">10 kWp - 50 kWp - 100 kWp+</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-[#0F2A45]">Công thức dòng điện (Ib)</td>
                        <td className="px-3 py-2 font-mono text-emerald-700 font-bold">
                          Ib = (P_AC * 1000) / (220 * cosφ)
                        </td>
                        <td className="px-3 py-2 font-mono text-emerald-700 font-bold">
                          Ib = (P_AC * 1000) / (√3 * 380 * cosφ)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-[#0F2A45]">Số lượng dây dẫn AC</td>
                        <td className="px-3 py-2">3 dây: 1L + 1N + 1PE</td>
                        <td className="px-3 py-2">5 dây: 3L (L1, L2, L3) + 1N + 1PE</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-[#0F2A45]">Đo bám tải (Zero-Export)</td>
                        <td className="px-3 py-2">1 biến dòng CT 1 Pha kẹp dây L</td>
                        <td className="px-3 py-2">Smart Meter 3 Pha + 3 cuộn CT kẹp 3 pha (L1, L2, L3)</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-[#0F2A45]">Pin lưu trữ Hybrid</td>
                        <td className="px-3 py-2">Lithium Áp Thấp 51.2V (5.12kWh - 16kWh)</td>
                        <td className="px-3 py-2">Lithium Áp Thấp 51.2V (ghép song song) hoặc Áp Cao 150V - 600V</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SẢN LƯỢNG & BỐ TRÍ PIN */}
          {activeTab === 'layout' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-bold text-[#0F2A45] text-base mb-2 flex items-center gap-2">
                  <Layers size={18} className="text-[#E4572E]" />
                  PHẦN 2: CÔNG THỨC & LOGIC TÍNH TOÁN SẢN LƯỢNG VÀ BỐ TRÍ PIN (LAYOUT ENGINE)
                </h4>
                <p className="text-slate-600 text-xs">
                  Mô-đun layout tính toán công suất đề xuất dựa trên tỷ lệ tự dùng ban ngày 70%, kết hợp tọa độ bức xạ mặt trời địa phương (GHI) và thuật toán tự động xếp tấm pin tối ưu trên mặt bằng mái.
                </p>
              </div>

              {/* Khối công thức tính công suất theo hóa đơn */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-mono text-xs">
                <div className="font-bold text-[#0F2A45] text-sm font-sans flex items-center gap-2">
                  <Calculator size={16} className="text-emerald-600" />
                  1. Công thức tính công suất đề xuất từ Hóa đơn tiền điện (kWp):
                </div>
                <div className="p-3 bg-white border border-slate-300 rounded-lg space-y-2">
                  <div>
                    <span className="text-slate-500 font-sans">Sản lượng tháng: </span>
                    <strong className="text-sky-800">A_thang = Tiền điện / Giá điện TB (kWh)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans">Mục tiêu bù trừ ban ngày (70%): </span>
                    <strong className="text-emerald-800">A_ngay = (A_thang * 0.70) / 30 (kWh/ngày)</strong>
                  </div>
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded font-bold text-emerald-950 text-sm">
                    P_recommended (kWp) = A_ngay / (GHI * K_huong * η_sys)
                  </div>
                  <div className="text-[11px] font-sans text-slate-500">
                    Trong đó:
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li><strong>GHI:</strong> Số giờ nắng đỉnh trung bình ngày của địa phương (kWh/m²/ngày). Miền Nam ~4.5 - 5.0h, Miền Bắc ~3.8 - 4.2h.</li>
                      <li><strong>K_huong:</strong> Hệ số hướng mái. Hướng Nam = 1.0 (tối ưu), Đông Nam / Tây Nam = 0.95, Đông / Tây = 0.85.</li>
                      <li><strong>η_sys:</strong> Hiệu suất vận hành thực tế hệ thống (mặc định 85% = 0.85).</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Thuật toán bố trí pin */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-[#0F2A45] text-sm flex items-center gap-2">
                  <Layers size={16} className="text-[#E4572E]" />
                  2. Thuật toán bố trí tấm pin trên mái (Panel Layout Algorithm):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Kích thước tấm pin (620Wp)</span>
                    <strong className="text-slate-900 font-mono text-sm">2.382m × 1.134m</strong>
                    <span className="text-slate-400 block text-[10px]">Diện tích ~2.70 m²/tấm</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Hành lang an toàn biên mái</span>
                    <strong className="text-slate-900 font-mono text-sm">0.3m - 0.5m offset</strong>
                    <span className="text-slate-400 block text-[10px]">Tránh gió xoáy mép mái & lối đi</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Khe hở giữa các tấm pin</span>
                    <strong className="text-slate-900 font-mono text-sm">0.02m (20mm)</strong>
                    <span className="text-slate-400 block text-[10px]">Vừa vặn độ dày kẹp Mid Clamp</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono space-y-1">
                  <div>Số cột (Cols) = floor((Chiều dài mái - 2*offset) / (Chiều rộng pin + 0.02m))</div>
                  <div>Số hàng (Rows) = floor((Chiều rộng mái - 2*offset) / (Chiều dài pin + 0.05m))</div>
                  <div className="font-bold text-sky-800">Tổng công suất lắp đặt P_DC = Số tấm * Công suất tấm pin (Wp)</div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                  <strong>Dự báo sản lượng phát điện:</strong>
                  <ul className="list-disc list-inside mt-1 font-mono text-[11px] space-y-0.5">
                    <li>Sản lượng ngày: E_ngay = P_DC * GHI * K_huong * η_sys (kWh/ngày)</li>
                    <li>Sản lượng tháng: E_thang = E_ngay * 30 (kWh/tháng)</li>
                    <li>Sản lượng năm đầu: E_nam_1 = E_ngay * 365 (kWh/năm)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LỰA CHỌN THIẾT BỊ */}
          {activeTab === 'equipment' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <h4 className="font-bold text-[#0F2A45] text-base mb-2 flex items-center gap-2">
                  <Zap size={18} className="text-[#E4572E]" />
                  PHẦN 3: LOGIC VÀ CÔNG THỨC LỰA CHỌN THIẾT BỊ CHO HỆ 1 PHA & 3 PHA
                </h4>
                <p className="text-slate-600 text-xs">
                  Hướng dẫn chi tiết cách tính chọn Inverter, kiểm tra dải điện áp nhiệt độ Voc/Vmpp, dung lượng pin lưu trữ Lithium, tính chọn tiết diện cáp Cadivi, bảo vệ MCB/MCCB và chống sét lan truyền SPD.
                </p>
              </div>

              {/* 3.1 Inverter */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h5 className="font-bold text-[#0F2A45] text-sm flex items-center gap-2">
                  <Cpu size={16} className="text-sky-600" />
                  3.1. Tính chọn Biến tần (Inverter Selection) & Ghép chuỗi String:
                </h5>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong>1. Tỷ lệ quá công suất DC/AC (Oversizing Ratio):</strong>
                    <div className="font-mono text-emerald-800 font-bold mt-1">
                      Ratio_DC/AC = P_DC / P_AC_inverter (Khuyến nghị: 1.15 đến 1.30, tối ưu 1.20)
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong>2. Kiểm tra điện áp hở mạch cực đại khi trời lạnh (Voc_cold):</strong>
                    <div className="font-mono text-slate-800 mt-1">
                      Voc_cold = Voc_stc * [1 + β_Voc/100 * (T_min - 25°C)] ≤ Vdc_max của Inverter
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Số tấm cực đại trong 1 chuỗi: N_series_max = floor(Vdc_max / Voc_cold). Hệ 1P thường tối đa 11-12 tấm; Hệ 3P tối đa 18-20 tấm.
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong>3. Kiểm tra điện áp điểm MPPT cực tiểu khi cell nóng gắt (Vmpp_hot):</strong>
                    <div className="font-mono text-slate-800 mt-1">
                      Vmpp_hot = Vmpp_stc * [1 + γ_Vmpp/100 * (T_cell_max - 25°C)] ≥ Vmppt_min của Inverter
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Số tấm cực tiểu trong 1 chuỗi: N_series_min = ceil(Vmppt_min / Vmpp_hot). Thường cần tối thiểu 6-7 tấm để MPPT khởi động tốt.
                    </span>
                  </div>
                </div>
              </div>

              {/* 3.2 Battery */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h5 className="font-bold text-[#0F2A45] text-sm flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" />
                  3.2. Tính chọn Pin lưu trữ Lithium (Battery ESS) cho hệ Hybrid:
                </h5>
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1 font-mono">
                  <div>Nhu cầu ban đêm: A_dem = A_ngay * 30% (kWh)</div>
                  <div>Độ xả sâu DoD = 90%; Hiệu suất pin η_battery = 95%</div>
                  <div className="font-bold text-amber-900 text-sm">
                    Dung lượng pin: C_battery = A_dem / (0.90 * 0.95) (kWh)
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong className="text-[#0F2A45] block">Cấu hình Hệ 1 Pha Hybrid:</strong>
                    <span className="text-slate-600 block mt-1">
                      Pin Lithium Áp Thấp 51.2V / 314Ah (Dung lượng 16.08 kWh) hoặc Module 51.2V / 100Ah (5.12 kWh).
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong className="text-[#0F2A45] block">Cấu hình Hệ 3 Pha Hybrid:</strong>
                    <span className="text-slate-600 block mt-1">
                      2 bộ Pin Lithium 16 kWh (tổng 32 kWh) ghép song song áp thấp hoặc Module Pin Áp Cao High Voltage (150V - 500V).
                    </span>
                  </div>
                </div>
              </div>

              {/* 3.3 Cáp điện & Bảo vệ */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h5 className="font-bold text-[#0F2A45] text-sm flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  3.3. Tính chọn Cáp điện Cadivi CV & Thiết bị đóng cắt bảo vệ (IEC 60364-5-52):
                </h5>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#0F2A45] text-white uppercase text-[10.5px]">
                      <tr>
                        <th className="px-3 py-2">Công suất hệ</th>
                        <th className="px-3 py-2">Pha</th>
                        <th className="px-3 py-2">Dòng Ib (A)</th>
                        <th className="px-3 py-2">Cáp AC Inverter</th>
                        <th className="px-3 py-2">Cáp AC Tổng MSB</th>
                        <th className="px-3 py-2">Aptomat MCB/MCCB</th>
                        <th className="px-3 py-2">Chống sét SPD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      <tr>
                        <td className="px-3 py-1.5 font-bold">5 kW</td>
                        <td className="px-3 py-1.5 font-sans">1 Pha</td>
                        <td className="px-3 py-1.5">25.3 A</td>
                        <td className="px-3 py-1.5">Cadivi CV 6.0 mm²</td>
                        <td className="px-3 py-1.5">Cadivi CV 10.0 mm²</td>
                        <td className="px-3 py-1.5 font-bold text-emerald-700">MCB 2P 32A</td>
                        <td className="px-3 py-1.5 font-sans">SPD AC 2P 275V</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-bold">10 kW</td>
                        <td className="px-3 py-1.5 font-sans">1 Pha</td>
                        <td className="px-3 py-1.5">50.5 A</td>
                        <td className="px-3 py-1.5">Cadivi CV 10.0 mm²</td>
                        <td className="px-3 py-1.5">Cadivi CV 16.0 mm²</td>
                        <td className="px-3 py-1.5 font-bold text-emerald-700">MCB 2P 63A</td>
                        <td className="px-3 py-1.5 font-sans">SPD AC 2P 275V</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-bold">10 kW</td>
                        <td className="px-3 py-1.5 font-sans">3 Pha</td>
                        <td className="px-3 py-1.5">16.9 A</td>
                        <td className="px-3 py-1.5">Cadivi CV 4×6.0 mm²</td>
                        <td className="px-3 py-1.5">Cadivi CV 4×6.0 mm²</td>
                        <td className="px-3 py-1.5 font-bold text-emerald-700">MCB 4P 32A</td>
                        <td className="px-3 py-1.5 font-sans">SPD AC 4P 385V</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-bold">20 kW</td>
                        <td className="px-3 py-1.5 font-sans">3 Pha</td>
                        <td className="px-3 py-1.5">33.8 A</td>
                        <td className="px-3 py-1.5">Cadivi CV 4×10.0 mm²</td>
                        <td className="px-3 py-1.5">Cadivi CV 4×16.0 mm²</td>
                        <td className="px-3 py-1.5 font-bold text-emerald-700">MCB/MCCB 4P 50A</td>
                        <td className="px-3 py-1.5 font-sans">SPD AC 4P 385V</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-bold">30 kW</td>
                        <td className="px-3 py-1.5 font-sans">3 Pha</td>
                        <td className="px-3 py-1.5">50.6 A</td>
                        <td className="px-3 py-1.5">Cadivi CV 4×16.0 mm²</td>
                        <td className="px-3 py-1.5">Cadivi CV 4×25.0 mm²</td>
                        <td className="px-3 py-1.5 font-bold text-emerald-700">MCCB 4P 75A - 100A</td>
                        <td className="px-3 py-1.5 font-sans">SPD AC 4P 385V</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-bold">50 kW</td>
                        <td className="px-3 py-1.5 font-sans">3 Pha</td>
                        <td className="px-3 py-1.5">84.4 A</td>
                        <td className="px-3 py-1.5">Cadivi CV 4×25.0 mm²</td>
                        <td className="px-3 py-1.5">Cadivi CV 4×50.0 mm²</td>
                        <td className="px-3 py-1.5 font-bold text-emerald-700">MCCB 4P 125A - 160A</td>
                        <td className="px-3 py-1.5 font-sans">SPD AC 4P 385V</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  * Dây DC Solar: 1Cx4.0mm² (chuyên dụng 1500V, đồng mạ thiếc cách điện XLPO). Dây tiếp địa PE: Cadivi CV 4 - 16mm² vàng/xanh nối vỏ tủ, khung giàn và biến tần về bãi tiếp địa R &lt; 4Ω.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BÓC TÁCH BOM */}
          {activeTab === 'bom' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h4 className="font-bold text-[#0F2A45] text-base mb-2 flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-[#E4572E]" />
                  PHẦN 4: LOGIC BÓC TÁCH VẬT TƯ (BOM) THEO MẪU BẢNG KÊ CHUẨN 4 NHÓM (A - B - C - D)
                </h4>
                <p className="text-slate-600 text-xs">
                  Cấu trúc bóc tách bám sát 100% mẫu file <code>docs/Bảng kê vật tư mẫu.xlsx</code> của công ty, phân loại rõ ràng 4 nhóm hạng mục và công thức tính toán số lượng từng mã hàng.
                </p>
              </div>

              <div className="space-y-4">
                {/* Phần A */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-[#0F2A45] text-white px-4 py-2 font-bold text-xs uppercase flex justify-between items-center">
                    <span>Phần A: THIẾT BỊ CHÍNH (MAIN EQUIPMENT)</span>
                    <span className="text-amber-400 font-mono text-[11px]">Inverter · Tấm pin · Battery · Tủ điện · CT</span>
                  </div>
                  <div className="p-3 text-xs space-y-1.5 text-slate-700">
                    <p>• <strong>Biến tần (Inverter):</strong> Số lượng theo số bộ thiết kế (thường 1 máy). Tự động lấy Model, công suất AC, số pha (1P/3P) và số lượng MPPT tương ứng.</p>
                    <p>• <strong>Tấm pin năng lượng mặt trời:</strong> Số lượng = Tổng số tấm pin theo Layout. Tự động tính công suất tổng kWp và diện tích chiếm dụng.</p>
                    <p>• <strong>Pin lưu trữ Lithium:</strong> Tự động xuất hiện khi chọn hệ Hybrid ESS. Hệ 1P: 1 bộ 16kWh; Hệ 3P: 2 bộ 16kWh (tổng 32kWh).</p>
                    <p>• <strong>Thiết bị bám tải Zero-Export:</strong> Biến dòng CT 1 Pha hoặc Smart Meter 3 Pha kèm 3 biến dòng CT.</p>
                    <p>• <strong>Tủ điện phân phối đóng cắt:</strong> Tủ điện IP65 chống nước sơn tĩnh điện tích hợp sẵn MCB/MCCB AC, DC, chống sét SPD Type 2 và cầu chì quang điện.</p>
                  </div>
                </div>

                {/* Phần B */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-[#0F2A45] text-white px-4 py-2 font-bold text-xs uppercase flex justify-between items-center">
                    <span>Phần B: HỆ RAIL NHÔM / GIÀN KHUNG (MOUNTING & FRAMES)</span>
                    <span className="text-sky-300 font-mono text-[11px]">Nhôm Al6005-T5 Anodized & Phụ kiện Inox 304</span>
                  </div>
                  <div className="p-3 text-xs space-y-1.5 text-slate-700">
                    <p>• <strong>Thanh rail nhôm chuyên dụng 4.2m / 2.1m:</strong> Chiều dài = 2 * Số hàng * (Số cột * Chiều rộng pin) * 1.05 (m).</p>
                    <p>• <strong>Kẹp biên (End Clamp):</strong> Số kẹp = Số hàng * 4 cái (chốt chặn 2 đầu mỗi thanh ray).</p>
                    <p>• <strong>Kẹp giữa (Mid Clamp):</strong> Số kẹp = (Tổng số tấm pin - Số hàng) * 2 cái.</p>
                    <p>• <strong>Chân L chống dột / Bát kẹp Seamlock:</strong> Số chân L = ceil(Chiều dài rail / 1.1m) (khoảng cách xà gồ ~1.1m).</p>
                    <p>• <strong>Nối rail nhôm:</strong> Số nối rail = max(0, ceil(Chiều dài rail / 4.2m) - Số hàng).</p>
                    <p>• <strong>Kẹp tiếp địa Lug:</strong> Số lượng = Số hàng * 2 cái (đấu dây tiếp địa từ khung nhôm về bãi đất).</p>
                  </div>
                </div>

                {/* Phần C */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-[#0F2A45] text-white px-4 py-2 font-bold text-xs uppercase flex justify-between items-center">
                    <span>Phần C: THIẾT BỊ NGOẠI VI (PERIPHERAL & CABLING)</span>
                    <span className="text-emerald-300 font-mono text-[11px]">Cáp DC Leader · Cáp AC Cadivi · MC4 · Cọc đất</span>
                  </div>
                  <div className="p-3 text-xs space-y-1.5 text-slate-700">
                    <p>• <strong>Cáp DC Solar 1Cx4.0mm² (Đỏ & Đen):</strong> Chiều dài ước tính theo tuyến mái về Inverter (tối thiểu 50m - 100m).</p>
                    <p>• <strong>Cáp AC nguồn Inverter:</strong> Cadivi CV (10mm² cho 1P 10kW; 4x10mm² - 16mm² cho 3P 20kW).</p>
                    <p>• <strong>Cáp tiếp địa PE an toàn:</strong> Cadivi CV 4.0mm² - 10.0mm² vàng/xanh.</p>
                    <p>• <strong>Đầu nối MC4 chuyên dụng 1500V:</strong> Theo số chuỗi string quang điện.</p>
                    <p>• <strong>Cọc tiếp địa đồng D14/D16 dài 2.4m & Mối hàn hóa nhiệt:</strong> Đảm bảo điện trở đất R &lt; 4Ω.</p>
                    <p>• <strong>Ống luồn ruột gà bọc nhựa lõi thép, máng cáp trunking & vật tư phụ:</strong> Đảm bảo mỹ quan và độ bền trên 25 năm ngoài trời.</p>
                  </div>
                </div>

                {/* Phần D */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-[#0F2A45] text-white px-4 py-2 font-bold text-xs uppercase flex justify-between items-center">
                    <span>Phần D: CÁC CHI PHÍ KHÁC (LABOR & PERMITS)</span>
                    <span className="text-amber-300 font-mono text-[11px]">Nhân công · EVN Docs · Vận chuyển</span>
                  </div>
                  <div className="p-3 text-xs space-y-1.5 text-slate-700">
                    <p>• <strong>Nhân công lắp đặt cơ khí & điện:</strong> Đơn giá nhân công theo kWp (thường 400.000 - 600.000 đ/kWp).</p>
                    <p>• <strong>Hồ sơ thỏa thuận đấu nối & thủ tục Điện lực EVN:</strong> Trọn gói hồ sơ kỹ thuật, bản vẽ đơn tuyến và nghiệm thu đóng điện.</p>
                    <p>• <strong>Vận chuyển, bốc xếp, cẩu kéo thiết bị nặng lên mái:</strong> Trọn gói Lot vận chuyển đến công trình.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GIÁ & DÒNG TIỀN */}
          {activeTab === 'finance' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <h4 className="font-bold text-[#0F2A45] text-base mb-2 flex items-center gap-2">
                  <Coins size={18} className="text-[#E4572E]" />
                  PHẦN 5: TOÀN BỘ CÔNG THỨC & LOGIC TÍNH TOÁN GIÁ, DÒNG TIỀN & HIỆU QUẢ KINH TẾ
                </h4>
                <p className="text-slate-600 text-xs">
                  Công thức tính giá vốn, giá bán, chiết khấu, VAT, suất đầu tư/kWp và mô hình tài chính 20 năm có tính tỷ lệ suy hao tấm pin 0.7%/năm theo cam kết hiệu suất 25 năm của nhà sản xuất.
                </p>
              </div>

              {/* 5.1 Giá và chiết khấu */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 font-mono text-xs">
                <div className="font-bold text-[#0F2A45] text-sm font-sans">
                  5.1. Cơ cấu Đơn giá vốn, Giá bán, Chiết khấu & Thuế VAT:
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
                  <div>Giá bán từng vật tư: Sell = Cost * (1 + Margin% / 100)</div>
                  <div>Tổng bán trước chiết khấu: RawSell = ∑ (Sell_i * Qty_i)</div>
                  <div>Chiết khấu thương mại: DiscountVnd = RawSell * (Discount% / 100)</div>
                  <div>Tổng sau chiết khấu (Chưa VAT): Subtotal = RawSell - DiscountVnd</div>
                  <div>Thuế VAT (10%): VatVnd = Subtotal * 10%</div>
                  <div className="font-bold text-[#E4572E] text-sm pt-1 border-t border-slate-200">
                    Tổng cộng trọn gói (Có VAT): GrandTotal = Subtotal + VatVnd
                  </div>
                </div>
              </div>

              {/* 5.2 Suất đầu tư */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                  <span className="text-emerald-800 font-bold block mb-1">Suất đầu tư chưa VAT / kWp:</span>
                  <div className="font-mono text-base font-bold text-emerald-950">
                    Rate_PreVAT = Subtotal / P_installed_kWp (VNĐ/kWp)
                  </div>
                  <span className="text-[11px] text-emerald-700 block mt-1">Phục vụ so sánh giá thầu cạnh tranh</span>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5">
                  <span className="text-orange-800 font-bold block mb-1">Suất đầu tư trọn gói có VAT / kWp:</span>
                  <div className="font-mono text-base font-bold text-[#E4572E]">
                    Rate_PostVAT = GrandTotal / P_installed_kWp (VNĐ/kWp)
                  </div>
                  <span className="text-[11px] text-orange-700 block mt-1">
                    Suất đầu tư trên 1 Wp = Rate_PostVAT / 1000 (VNĐ/Wp)
                  </span>
                </div>
              </div>

              {/* 5.3 Dòng tiền 20 năm */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-[#0F2A45] text-sm">
                  5.2. Mô hình Dòng tiền 20 năm (Tính suy hao tấm pin 0.7%/năm & trượt giá điện 1.0%/năm):
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 font-mono text-[11.5px]">
                  <div>
                    Sản lượng năm t: E_t = E_nam_1 * (1 - 0.007)^(t - 1) (kWh)
                  </div>
                  <div>
                    Giá điện năm t: Tariff_t = Tariff_1 * (1 + 0.01)^(t - 1) (VNĐ/kWh)
                  </div>
                  <div>
                    Tiết kiệm năm t: Savings_t = E_t * 70% (tự dùng) * Tariff_t (VNĐ)
                  </div>
                  <div>
                    Lũy kế tiết kiệm: CumulativeSavings_t = ∑ Savings_1..t (VNĐ)
                  </div>
                  <div className="font-bold text-[#0F2A45]">
                    Dòng tiền ròng: NetCashflow_t = CumulativeSavings_t - GrandTotalVnd (VNĐ)
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-1">
                  <strong>Thời gian hoàn vốn đầu tư (Payback Period):</strong>
                  <p className="font-mono text-[11px]">
                    PaybackYears = (T - 1) + (GrandTotalVnd - CumulativeSavings_(T-1)) / Savings_T
                  </p>
                  <p className="text-[11px]">
                    Hệ On-Grid thông thường hoàn vốn sau <strong>3.5 - 4.5 năm</strong>; hệ Hybrid ESS hoàn vốn sau <strong>4.8 - 6.0 năm</strong>. Sau mốc này là 15 - 20 năm lợi nhuận ròng tự do 100%.
                  </p>
                </div>

                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-sky-950 space-y-1">
                  <strong>Tỷ suất sinh lời nội hoàn (IRR - Internal Rate of Return):</strong>
                  <p className="font-mono text-[11px]">
                    Giải phương trình NPV(r) = -GrandTotalVnd + ∑ [Savings_t / (1 + r)^t] = 0 bằng phương pháp dò nhị phân (Binary Search).
                  </p>
                  <p className="text-[11px]">
                    IRR thực tế các dự án đạt từ <strong>22% đến 32%/năm</strong>, cao gấp 3-4 lần lãi suất tiền gửi tiết kiệm.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BẢNG TRA CỨU NHANH */}
          {activeTab === 'cheatsheet' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900 text-white rounded-xl p-4">
                <h4 className="font-bold text-amber-400 text-base mb-1 flex items-center gap-2">
                  <Calculator size={18} />
                  BẢNG TRA CỨU NHANH CÔNG THỨC & THÔNG SỐ (ENGINEERING CHEATSHEET)
                </h4>
                <p className="text-slate-300 text-xs">
                  Tập hợp tất cả các công thức toán học và bảng tra chuẩn áp dụng trong toàn bộ hệ thống
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0F2A45] text-white uppercase text-[10.5px]">
                    <tr>
                      <th className="px-3 py-2 w-48">Hạng mục tính toán</th>
                      <th className="px-3 py-2">Công thức áp dụng</th>
                      <th className="px-3 py-2 w-28 text-center">Đơn vị</th>
                      <th className="px-3 py-2">Ghi chú kỹ thuật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                    <tr>
                      <td className="px-3 py-2 font-bold font-sans text-[#0F2A45]">Công suất đề xuất</td>
                      <td className="px-3 py-2 text-emerald-700 font-bold">
                        P_rec = (A_thang * 0.70) / (30 * GHI * K_huong * 0.85)
                      </td>
                      <td className="px-3 py-2 text-center">kWp</td>
                      <td className="px-3 py-2 font-sans text-slate-500">Bù trừ 70% điện dùng ban ngày</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold font-sans text-[#0F2A45]">Tỷ lệ quá công suất</td>
                      <td className="px-3 py-2 font-bold text-sky-800">
                        Ratio_DC/AC = P_DC / P_AC_inv
                      </td>
                      <td className="px-3 py-2 text-center">Tỷ số</td>
                      <td className="px-3 py-2 font-sans text-slate-500">Chuẩn tối ưu: 1.15 đến 1.30</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold font-sans text-[#0F2A45]">Dòng điện tải 1 Pha</td>
                      <td className="px-3 py-2 font-bold text-emerald-700">
                        Ib = (P_AC * 1000) / (220 * cosφ)
                      </td>
                      <td className="px-3 py-2 text-center">A</td>
                      <td className="px-3 py-2 font-sans text-slate-500">cosφ = 0.90 mặc định</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold font-sans text-[#0F2A45]">Dòng điện tải 3 Pha</td>
                      <td className="px-3 py-2 font-bold text-emerald-700">
                        Ib = (P_AC * 1000) / (√3 * 380 * cosφ)
                      </td>
                      <td className="px-3 py-2 text-center">A</td>
                      <td className="px-3 py-2 font-sans text-slate-500">√3 * 380 ≈ 658.18V</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold font-sans text-[#0F2A45]">Định mức CB bảo vệ</td>
                      <td className="px-3 py-2 font-bold text-amber-800">
                        I_rated_CB ≥ 1.25 * Ib
                      </td>
                      <td className="px-3 py-2 text-center">A</td>
                      <td className="px-3 py-2 font-sans text-slate-500">Tránh nhảy CB khi tải đầy công suất</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold font-sans text-[#0F2A45]">Dung lượng pin Hybrid</td>
                      <td className="px-3 py-2 font-bold text-indigo-700">
                        C_bat = (A_ngay * 0.30) / (0.90 * 0.95)
                      </td>
                      <td className="px-3 py-2 text-center">kWh</td>
                      <td className="px-3 py-2 font-sans text-slate-500">DoD = 90%, η_pin = 95%</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold font-sans text-[#0F2A45]">Chiều dài rail nhôm</td>
                      <td className="px-3 py-2 font-bold text-slate-800">
                        L_rail = 2 * Rows * (Cols * W_pin) * 1.05
                      </td>
                      <td className="px-3 py-2 text-center">mét</td>
                      <td className="px-3 py-2 font-sans text-slate-500">1 hàng pin cần 2 thanh ray song song</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold font-sans text-[#0F2A45]">Số lượng kẹp biên</td>
                      <td className="px-3 py-2 font-bold text-slate-800">
                        EndClamp = Rows * 4
                      </td>
                      <td className="px-3 py-2 text-center">Cái</td>
                      <td className="px-3 py-2 font-sans text-slate-500">2 đầu mỗi thanh rail nhôm</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold font-sans text-[#0F2A45]">Số lượng kẹp giữa</td>
                      <td className="px-3 py-2 font-bold text-slate-800">
                        MidClamp = (PanelQty - Rows) * 2
                      </td>
                      <td className="px-3 py-2 text-center">Cái</td>
                      <td className="px-3 py-2 font-sans text-slate-500">Kẹp giữa 2 tấm pin liền kề</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold font-sans text-[#0F2A45]">Suất đầu tư có VAT</td>
                      <td className="px-3 py-2 font-bold text-[#E4572E]">
                        Rate_PostVAT = GrandTotalVnd / P_installed_kWp
                      </td>
                      <td className="px-3 py-2 text-center">VNĐ/kWp</td>
                      <td className="px-3 py-2 font-sans text-slate-500">Suất đầu tư trọn gói đến chìa khóa trao tay</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold font-sans text-[#0F2A45]">Suy hao tấm pin năm t</td>
                      <td className="px-3 py-2 font-bold text-sky-800">
                        E_t = E_nam_1 * (1 - 0.007)^(t - 1)
                      </td>
                      <td className="px-3 py-2 text-center">kWh</td>
                      <td className="px-3 py-2 font-sans text-slate-500">Tỷ lệ suy hao 0.7%/năm</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold font-sans text-[#0F2A45]">Thời gian hoàn vốn</td>
                      <td className="px-3 py-2 font-bold text-emerald-800">
                        Payback = (T - 1) + (Capex - Cumul_(T-1)) / Savings_T
                      </td>
                      <td className="px-3 py-2 text-center">Năm</td>
                      <td className="px-3 py-2 font-sans text-slate-500">Nội suy tuyến tính tại năm hòa vốn</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold font-sans text-[#0F2A45]">Tỷ suất hoàn vốn IRR</td>
                      <td className="px-3 py-2 font-bold text-purple-800">
                        NPV(IRR) = -Capex + ∑ [Savings_t / (1 + IRR)^t] = 0
                      </td>
                      <td className="px-3 py-2 text-center">%</td>
                      <td className="px-3 py-2 font-sans text-slate-500">Giải bằng tìm kiếm nhị phân (Binary Search)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Hệ thống tính toán tuân thủ tiêu chuẩn: <strong>TCVN 9207:2012 · IEC 60364-5-52 · IEC 62930 · IEC 60502-1</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0F2A45] text-white font-bold hover:bg-slate-800 transition-colors"
          >
            Đóng Tài Liệu
          </button>
        </div>
      </div>
    </div>
  );
};
