import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  Compass,
  Activity,
  Layers,
  Wrench,
  Check,
} from 'lucide-react';

interface HgcCommissioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
  installedKwp?: number;
  sysType?: 'zero_export' | 'on_grid' | 'hybrid' | 'off_grid';
}

export const HgcCommissioningModal: React.FC<HgcCommissioningModalProps> = ({
  isOpen,
  onClose,
  projectName = 'Dự án HGC Solar',
  installedKwp = 10,
  sysType = 'hybrid',
}) => {
  const [activeTab, setActiveTab] = useState<'commissioning' | 'operation' | 'troubleshoot' | 'om'>('commissioning');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#0F2A45] to-[#1E3A5F] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E4572E] text-white flex items-center justify-center font-black shadow-sm">
              <FileCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold">Cẩm Nang Kỹ Thuật Đào Tạo & Nghiệm Thu Nội Bộ HGC</h3>
              <p className="text-xs text-slate-300">
                Quy trình 6 bước đóng điện · Cài đặt Inverter Hybrid & CT · Xử lý sự cố hiện trường
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('commissioning')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'commissioning'
                ? 'border-[#E4572E] text-[#E4572E]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap size={14} />
            <span>1. Đóng Điện 6 Bước (Commissioning)</span>
          </button>

          <button
            onClick={() => setActiveTab('operation')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'operation'
                ? 'border-[#E4572E] text-[#E4572E]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass size={14} />
            <span>2. Chuẩn Kẹp CT & Chế Độ Hybrid</span>
          </button>

          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'troubleshoot'
                ? 'border-[#E4572E] text-[#E4572E]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle size={14} />
            <span>3. Xử Lý 5 Sự Cố Thường Gặp</span>
          </button>

          <button
            onClick={() => setActiveTab('om')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'om'
                ? 'border-[#E4572E] text-[#E4572E]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity size={14} />
            <span>4. Quy Trình Bảo Trì O&M</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* TAB 1: COMMISSIONING 6 BƯỚC */}
          {activeTab === 'commissioning' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 font-medium">
                ✓ <strong>Tiêu chuẩn nghiệm thu cốt lõi:</strong> Điện trở tiếp địa an toàn{' '}
                <span className="font-mono font-bold">R &lt; 4 Ω</span> (TCVN 9207), Điện trở cách điện chuỗi PV{' '}
                <span className="font-mono font-bold">R_cd &gt; 1 MΩ</span>, Điện áp N-PE{' '}
                <span className="font-mono font-bold">V_N-PE &lt; 3 V</span>.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#0F2A45] text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#0F2A45] text-white flex items-center justify-center text-xs">
                      1
                    </span>
                    <span>Bước 1: Kiểm Tra Vật Lý</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Dùng cờ-lê cân lực kiểm tra siết cọc đầu cos tủ điện và bu-lông khung rail M8 (8 - 10 N.m).</li>
                    <li>Kiểm tra đúng cực tính (+/-) giắc MC4 DC và đúng thứ tự pha L/N/PE ngõ AC.</li>
                    <li>Kiểm tra liên tục dây tiếp địa bảo vệ toàn hệ thống.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#0F2A45] text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#0F2A45] text-white flex items-center justify-center text-xs">
                      2
                    </span>
                    <span>Bước 2: Đo Đạc Chuỗi PV</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Đo Voc từng chuỗi bằng VOM: giá trị mang dấu (+) và nằm trong ngưỡng thiết kế (~430V).</li>
                    <li>Dùng ampe kìm đo dòng ngắn mạch Isc trong điều kiện đủ nắng.</li>
                    <li>Đo điện trở cách điện Megohmmeter giữa (+) và (-) với vỏ đất PE (&gt; 1 MΩ).</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#0F2A45] text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#0F2A45] text-white flex items-center justify-center text-xs">
                      3
                    </span>
                    <span>Bước 3: Đo Đạc Nguồn AC</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Điện áp pha - trung tính: 220V ± 10% (hoặc 380V ± 10% đối với 3 pha).</li>
                    <li>Tần số lưới: 50 Hz ± 0.5 Hz.</li>
                    <li>Kiểm tra độ chênh điện áp N-PE: V_N-PE &lt; 3 V.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#E4572E] text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#E4572E] text-white flex items-center justify-center text-xs">
                      4
                    </span>
                    <span>Bước 4: Trình Tự Đóng Điện Khởi Động</span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-600 font-medium">
                    <li>Bật CB AC ngõ <strong>Back-up</strong> (tải ưu tiên).</li>
                    <li>Bật CB AC ngõ <strong>On-Grid</strong> (hòa lưới).</li>
                    <li>Bật CB Máy phát (nếu có cổng GEN).</li>
                    <li>Bật CB DC các chuỗi tấm pin PV.</li>
                    <li>Xoay công tắc <strong>DC Switch</strong> trên thân Inverter sang <strong>ON</strong>.</li>
                    <li>Đóng CB Battery, nhấn giữ nút Power 3-5 giây trên khối pin để kích hoạt BMS.</li>
                  </ol>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-[#0F2A45]">Bước 5 & 6: Vận Hành Thử Nghiệm & Bàn Giao</div>
                <p className="text-slate-600">
                  Kết nối Bluetooth/Wifi Inverter qua ứng dụng cấu hình (SolarGo / SolaX Cloud). Thử nghiệm cắt CB On-Grid để kiểm tra tính năng chuyển mạch tự động tức thời (&lt; 20ms) của ATS sang cổng Back-up. Lập biên bản Commissioning và bàn giao tài khoản giám sát cho khách hàng.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: QUY CHUẨN KẸP CT & CHẾ ĐỘ HYBRID */}
          {activeTab === 'operation' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border-2 border-cyan-500/30 bg-cyan-50/50 space-y-3">
                <div className="font-bold text-cyan-950 flex items-center gap-2 text-sm">
                  <Compass size={16} className="text-cyan-700" />
                  <span>Quy Chuẩn Kỹ Thuật Kẹp Biến Dòng (CT) Bám Tải</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-cyan-200">
                    <strong className="text-slate-900 block mb-1">1. Chiều mũi tên kẹp:</strong>
                    Mũi tên trên thân kẹp CT bắt buộc phải hướng thẳng về phía{' '}
                    <span className="text-[#E4572E] font-bold">LƯỚI ĐIỆN QUỐC GIA (K → L)</span>.
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-cyan-200">
                    <strong className="text-slate-900 block mb-1">2. Vị trí kẹp:</strong>
                    Kẹp duy nhất trên dây Pha (L), nằm trước toàn bộ phụ tải và điểm hòa lưới của biến tần.
                  </div>
                </div>
                <div className="text-[11px] text-cyan-900">
                  ⚠️ <em>Lưu ý tuyến dây:</em> Tuyến cáp CT đi kèm thường &lt; 5m (mở rộng tối đa 15m). Nếu tủ điện cách xa biến tần &gt; 15m, bắt buộc phải sử dụng Smart Meter truyền thông RS485 Modbus RTU.
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-[#0F2A45] text-sm">4 Chế Độ Hoạt Động (Operation Modes) Của Inverter Hybrid:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-emerald-700">1. Tự Dùng (Self-Consumption - Mặc định)</span>
                    <p className="text-[11px] text-slate-600">
                      Pin mặt trời ưu tiên cấp tải gia đình → sạc đầy pin lưu trữ → pin đầy thì dừng phát ngược (Zero-Export). Ban đêm xả pin nuôi tải đến ngưỡng DoD đã cài đặt.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-blue-700">2. Dự Phòng (Backup Mode)</span>
                    <p className="text-[11px] text-slate-600">
                      Pin lưu trữ luôn duy trì sạc đầy 100%, không xả ban đêm; chỉ kích hoạt xả điện nuôi tải ưu tiên khi xảy ra mất điện lưới EVN.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-amber-700">3. Biểu Giá Theo Giờ (TOU - Time of Use)</span>
                    <p className="text-[11px] text-slate-600">
                      Sạc điện lưới vào khung giờ thấp điểm (đêm), xả nuôi tải vào khung giờ cao điểm (sáng/tối) để tối ưu hóa hóa đơn tiền điện.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-purple-700">4. Cắt Đỉnh Phụ Tải (Peak Shaving)</span>
                    <p className="text-[11px] text-slate-600">
                      Đặt trần công suất tối đa nhận từ lưới. Khi phụ tải vượt ngưỡng, pin lưu trữ tự động xả phụ thêm vào để gọt phần đỉnh nhọn đồ thị phụ tải.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: XỬ LÝ 5 SỰ CỐ THƯỜNG GẶP */}
          {activeTab === 'troubleshoot' && (
            <div className="space-y-3">
              <div className="border border-red-200 bg-red-50/40 rounded-xl p-3 space-y-1">
                <div className="font-bold text-red-900 flex items-center justify-between">
                  <span>1. Lỗi Ngược Chiều CT / "CT Loss" / Công Suất Tải Hiển Thị Sai</span>
                  <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded-full">Phổ biến nhất</span>
                </div>
                <p className="text-slate-700 text-[11px]">
                  <strong>Hiện tượng:</strong> Buổi trưa nắng gắt phát điện mạnh nhưng biểu đồ tải trên App tăng vọt bằng công suất PV, hoặc Inverter cảnh báo truyền thông CT.
                </p>
                <p className="text-slate-700 text-[11px]">
                  <strong>Khắc phục:</strong> Kiểm tra và xoay ngược mũi tên CT về phía điện lưới EVN; kiểm tra kẹp đúng dây Pha (L), không kẹp dây Trung tính (N); siết chặt cọc domino truyền thông.
                </p>
              </div>

              <div className="border border-slate-200 bg-white rounded-xl p-3 space-y-1">
                <div className="font-bold text-slate-900">2. Lỗi "BMS Lost" (Mất Giao Tiếp Pin Lưu Trữ)</div>
                <p className="text-slate-700 text-[11px]">
                  <strong>Nguyên nhân:</strong> Cáp truyền thông CAN/RS485 cắm sai cổng; bấm sai thứ tự dây mạng; hoặc cấu hình sai model pin trên App.
                </p>
                <p className="text-slate-700 text-[11px]">
                  <strong>Khắc phục:</strong> Kiểm tra sơ đồ chân (Pinout) cáp; cắm đúng cổng BMS trên Inverter và cổng CAN trên Pin; khởi động lại pin và Inverter.
                </p>
              </div>

              <div className="border border-slate-200 bg-white rounded-xl p-3 space-y-1">
                <div className="font-bold text-slate-900">3. Lỗi "Ground Fault" / "PV Isolation Fault" (Lỗi Chạm Đất / Cách Điện PV)</div>
                <p className="text-slate-700 text-[11px]">
                  <strong>Nguyên nhân:</strong> Vỏ cáp DC bị rách xước chạm rail nhôm hoặc mặt tôn; giắc MC4 bị đọng nước; hoặc SPD DC bị đánh thủng.
                </p>
                <p className="text-slate-700 text-[11px]">
                  <strong>Khắc phục:</strong> Ngắt chuỗi PV, dùng Megohmmeter đo điện trở cách điện từng cực (+) và (-) với vỏ đất PE để cô lập chuỗi rò rỉ; thay giắc MC4 hỏng.
                </p>
              </div>

              <div className="border border-slate-200 bg-white rounded-xl p-3 space-y-1">
                <div className="font-bold text-slate-900">4. Lỗi "Grid Overvoltage" (Quá Áp Lưới AC Buổi Trưa)</div>
                <p className="text-slate-700 text-[11px]">
                  <strong>Nguyên nhân:</strong> Điện áp lưới tăng cao do gần trạm biến áp hoặc tiết diện dây AC từ tủ điện đến điểm đấu nối quá nhỏ khiến Inverter phát điện làm tăng sụt áp ngược.
                </p>
                <p className="text-slate-700 text-[11px]">
                  <strong>Khắc phục:</strong> Tăng tiết diện dây AC; mở rộng dải điện áp làm việc trên Inverter (trong giới hạn cho phép của EVN); đề xuất điện lực cân pha phụ tải ngoài cột.
                </p>
              </div>

              <div className="border border-slate-200 bg-white rounded-xl p-3 space-y-1">
                <div className="font-bold text-slate-900">5. Lỗi "Backup Overload" (Quá Tải Cổng Back-up Khi Mất Lưới)</div>
                <p className="text-slate-700 text-[11px]">
                  <strong>Nguyên nhân:</strong> Tổng công suất các thiết bị cắm vào cổng Back-up vượt quá ngưỡng định mức của Inverter.
                </p>
                <p className="text-slate-700 text-[11px]">
                  <strong>Khắc phục:</strong> Tách các phụ tải công suất lớn (bếp từ, bình nóng lạnh, điều hòa công suất lớn) ra khỏi nhánh điện ưu tiên của tủ ATS.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: QUY TRÌNH O&M BẢO TRÌ */}
          {activeTab === 'om' && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F2A45] text-white">
                    <tr>
                      <th className="p-2.5 w-28">Tần Suất</th>
                      <th className="p-2.5 w-44">Khu Vực Thiết Bị</th>
                      <th className="p-2.5">Nội Dung Kiểm Tra & Tiêu Chuẩn Đánh Giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">Hàng tháng</td>
                      <td className="p-2.5 font-medium text-[#0F2A45]">Inverter & Battery</td>
                      <td className="p-2.5 text-slate-600">
                        Vệ sinh khe gió và quạt tản nhiệt Inverter. Kiểm tra nhiệt độ bề mặt thiết bị. Đăng nhập App kiểm tra nhật ký vận hành và các cảnh báo ẩn.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">Mỗi 3 tháng</td>
                      <td className="p-2.5 font-medium text-[#0F2A45]">Giàn Pin PV & Phụ Kiện</td>
                      <td className="p-2.5 text-slate-600">
                        Rửa bề mặt kính tấm PV bằng nước sạch và chổi lau mềm (không rửa buổi trưa nắng gắt tránh sốc nhiệt). Kiểm tra ống luồn dây và độ bám dính đai thít cáp ngoài trời.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">Mỗi 6 tháng</td>
                      <td className="p-2.5 font-medium text-[#0F2A45]">Hệ Kết Cấu Mái</td>
                      <td className="p-2.5 text-slate-600">
                        Kiểm tra độ siết lực bu-lông chân L, kẹp giữa, kẹp biên. Đánh giá độ ăn mòn khung nhôm. Kiểm tra lớp keo trung tính Sikaflex chống dột mái tôn.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">Mỗi 6 tháng</td>
                      <td className="p-2.5 font-medium text-[#0F2A45]">Tủ Điện & Tiếp Địa</td>
                      <td className="p-2.5 text-slate-600">
                        Dùng camera nhiệt kiểm tra điểm phát nhiệt bất thường tại các cọc đấu dây CB, ATS. Đo kiểm tra lại điện trở tiếp địa hệ thống (bắt buộc R &lt; 4 Ω).
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Dự án: <strong className="text-slate-800">{projectName}</strong> · Quy mô:{' '}
            <strong className="text-[#E4572E]">{installedKwp} kWp</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0F2A45] hover:bg-[#1a3f65] text-white font-bold text-xs shadow-sm transition-all"
          >
            Đóng Cẩm Nang
          </button>
        </div>
      </div>
    </div>
  );
};
