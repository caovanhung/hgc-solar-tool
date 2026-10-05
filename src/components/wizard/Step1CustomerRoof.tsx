import React, { useState } from 'react';
import { Project, CustomerType, RoofType, RoofDirection, RoofShape } from '../../types/solar';
import { VIETNAM_PROVINCES, getProvinceByCode } from '../../data/provinces';
import { getCustomerTypeLabel } from '../../data/tariffs';
import { Sun, MapPin, Building, UploadCloud, Compass, ArrowRight, Check, HelpCircle, Info } from 'lucide-react';

interface Step1Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onNext: () => void;
}

export const Step1CustomerRoof: React.FC<Step1Props> = ({ project, onUpdate, onNext }) => {
  const [billInputType, setBillInputType] = useState<'bill' | 'kwh'>('bill');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [showDirGuide, setShowDirGuide] = useState<boolean>(false);

  const selectedProvince = getProvinceByCode(project.provinceCode);

  const handleProvinceChange = (code: string) => {
    onUpdate({ provinceCode: code });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFileName(e.target.files[0].name);
    }
  };

  // Định dạng tiền tệ kiểu Việt Nam có dấu chấm: 100.000.000
  const formatVndNumber = (val?: number): string => {
    if (!val || isNaN(val)) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleBillTextChange = (text: string) => {
    // Chỉ giữ lại chữ số
    const cleanDigits = text.replace(/[^\d]/g, '');
    const num = cleanDigits ? parseInt(cleanDigits, 10) : 0;
    onUpdate({
      monthlyElectricityBillVnd: num,
      monthlyConsumptionKwh: Math.round(num / 2800),
    });
  };

  // Tính sơ bộ diện tích mái
  const l1 = project.roofL1M || project.roofLengthM || 15;
  const w1 = project.roofW1M || Math.round(project.roofWidthM * 0.6) || 8;
  const l2 = project.roofL2M || 10;
  const w2 = project.roofW2M || 6;

  const calculatedArea =
    project.roofShape === 'manual'
      ? project.manualAreaM2 || 0
      : project.roofShape === 'l'
      ? Math.round((l1 * w1) + (l2 * w2))
      : Math.round(project.roofLengthM * project.roofWidthM);

  const directionInfo: Record<RoofDirection, { label: string; angle: string; factor: string; desc: string }> = {
    s: {
      label: 'Chính Nam (180°)',
      angle: '180°',
      factor: '100% (Tối ưu nhất)',
      desc: 'Hướng lý tưởng nhất tại Việt Nam (Bắc bán cầu), đón trọn vẹn năng lượng mặt trời cả ngày từ sáng đến chiều.',
    },
    se: {
      label: 'Đông Nam (135°)',
      angle: '135°',
      factor: '95% bức xạ',
      desc: 'Đón nắng sớm buổi sáng rất tốt, nhiệt độ panel mát mẻ giúp hiệu suất phát điện cao.',
    },
    sw: {
      label: 'Tây Nam (225°)',
      angle: '225°',
      factor: '95% bức xạ',
      desc: 'Đón nắng mạnh vào buổi chiều, phù hợp cơ sở hoạt động cao điểm từ trưa đến chiều tối.',
    },
    e: {
      label: 'Chính Đông (90°)',
      angle: '90°',
      factor: '85% bức xạ',
      desc: 'Đón bức xạ tốt từ 6h - 11h30 trưa, buổi chiều bị khuất bóng nắng.',
    },
    w: {
      label: 'Chính Tây (270°)',
      angle: '270°',
      factor: '85% bức xạ',
      desc: 'Buổi sáng ít nắng, buổi chiều từ 12h30 - 17h nắng chiếu trực diện cường độ cao.',
    },
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section 1: Thông tin khách hàng & Địa điểm */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <span className="w-6 h-6 rounded-full bg-[#E4572E] text-white flex items-center justify-center text-xs font-bold">
            1
          </span>
          <h3 className="text-base font-bold text-[#0F2A45]">Thông Tin Khách Hàng & Nhu Cầu Điện</h3>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">· Chuẩn QĐ 1279/QĐ-BCT</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tên khách hàng */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Tên Khách Hàng / Công Trình <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={project.customerName}
              onChange={(e) => onUpdate({ customerName: e.target.value, name: e.target.value || 'Dự án mới' })}
              placeholder="VD: Cty TNHH Sản Xuất HGC hoặc Hộ Gia Đình"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none transition-all"
            />
          </div>

          {/* Loại khách hàng điện */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Loại Biểu Giá Điện EVN <span className="text-red-500">*</span>
            </label>
            <select
              value={project.custType}
              onChange={(e) => onUpdate({ custType: e.target.value as CustomerType })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none transition-all"
            >
              {(
                [
                  'sinh_hoat',
                  'kd_tren22kv',
                  'kd_6_22kv',
                  'kd_duoi6kv',
                  'sx_tren110kv',
                  'sx_22_110kv',
                  'sx_6_22kv',
                  'sx_duoi6kv',
                  'hcsn_ytegd',
                  'hcsn_khac',
                ] as CustomerType[]
              ).map((type) => (
                <option key={type} value={type}>
                  {getCustomerTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Tỉnh / Thành phố */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
              <span>Tỉnh / Thành Phố <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-0.5">
                <Sun size={11} /> {selectedProvince.dailyIrradianceKwhM2} kWh/m²/ngày
              </span>
            </label>
            <select
              value={project.provinceCode}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none transition-all"
            >
              {VIETNAM_PROVINCES.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.dailyIrradianceKwhM2} kWh/m²)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nhu cầu điện hàng tháng với định dạng phân cách hàng nghìn có dấu chấm: 100.000.000 */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Nhu Cầu Tiêu Thụ Điện Hàng Tháng
              </label>
              <div className="flex text-xs bg-slate-100 p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => setBillInputType('bill')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    billInputType === 'bill' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  Theo tiền điện (VNĐ)
                </button>
                <button
                  type="button"
                  onClick={() => setBillInputType('kwh')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    billInputType === 'kwh' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  Theo sản lượng (kWh)
                </button>
              </div>
            </div>

            {billInputType === 'bill' ? (
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatVndNumber(project.monthlyElectricityBillVnd)}
                  onChange={(e) => handleBillTextChange(e.target.value)}
                  placeholder="VD: 100.000.000"
                  className="w-full px-3 py-2 text-sm font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">VNĐ / tháng</span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatVndNumber(project.monthlyConsumptionKwh)}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^\d]/g, '');
                    const kwh = clean ? parseInt(clean, 10) : 0;
                    onUpdate({
                      monthlyConsumptionKwh: kwh,
                      monthlyElectricityBillVnd: Math.round(kwh * 2800),
                    });
                  }}
                  placeholder="VD: 35.000"
                  className="w-full px-3 py-2 text-sm font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">kWh / tháng</span>
              </div>
            )}
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Định dạng tự động theo chuẩn tiền tệ Việt Nam (VD: 100.000.000 đ)</span>
              {project.monthlyElectricityBillVnd ? (
                <span className="font-semibold text-emerald-600 font-mono">
                  ~{(project.monthlyElectricityBillVnd / 1000000).toFixed(1)} triệu đ
                </span>
              ) : null}
            </div>
          </div>

          {/* Đính kèm hóa đơn điện */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Đính Kèm Hóa Đơn Điện / Ảnh Mái (Tùy chọn)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 hover:border-[#E4572E] rounded-lg bg-slate-50 hover:bg-orange-50/30 transition-all text-xs text-slate-600 font-medium">
                <UploadCloud size={16} className="text-[#E4572E]" />
                <span>{attachedFileName ? attachedFileName : 'Tải lên ảnh hoặc PDF hóa đơn'}</span>
                <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
              </label>
              {attachedFileName && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <Check size={14} /> Đã chọn
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Mặt bằng & Loại mái */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#E4572E] text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            <h3 className="text-base font-bold text-[#0F2A45]">Mặt Bằng & Kết Cấu Mái</h3>
          </div>
          <span className="text-xs font-bold text-[#0F2A45] bg-slate-100 px-2.5 py-1 rounded-md">
            Diện tích tính toán: <span className="text-[#E4572E] font-mono">{calculatedArea} m²</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Loại mái */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Loại Mái Nhà <span className="text-red-500">*</span>
            </label>
            <select
              value={project.roofType}
              onChange={(e) => onUpdate({ roofType: e.target.value as RoofType })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none"
            >
              <option value="tole">Mái tôn (Tôn sóng vuông / Cliplock / Seam)</option>
              <option value="concrete">Mái bê tông cốt thép (Bằng phẳng)</option>
              <option value="tile">Mái ngói (Ngói xi măng / ngói đất nung)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {project.roofType === 'tole'
                ? '✓ Sử dụng kẹp Seam / chân L bắn xà gồ'
                : project.roofType === 'concrete'
                ? '✓ Cần khung giàn nâng góc nghiêng 10-15°'
                : '✓ Sử dụng móc ngói inox chuyên dụng'}
            </p>
          </div>

          {/* Hướng mái chính + Nút hướng dẫn cách tính */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                <span>Hướng Mái Chính</span>
              </label>
              <button
                type="button"
                onClick={() => setShowDirGuide(!showDirGuide)}
                className="text-[11px] text-[#E4572E] hover:underline flex items-center gap-1 font-semibold"
              >
                <HelpCircle size={13} />
                <span>Cách tính hướng?</span>
              </button>
            </div>

            <select
              value={project.roofDir}
              onChange={(e) => onUpdate({ roofDir: e.target.value as RoofDirection })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none"
            >
              <option value="s">Chính Nam (180°) — Tối ưu 100% bức xạ</option>
              <option value="se">Đông Nam (135°) — Hệ số 95% (Nắng sáng)</option>
              <option value="sw">Tây Nam (225°) — Hệ số 95% (Nắng chiều)</option>
              <option value="e">Chính Đông (90°) — Hệ số 85%</option>
              <option value="w">Chính Tây (270°) — Hệ số 85%</option>
            </select>

            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Compass size={12} className="text-[#E4572E]" />
              <span>{directionInfo[project.roofDir].factor}</span>
            </div>
          </div>

          {/* Hình dạng mái */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Hình Dạng Mái <span className="text-red-500">*</span>
            </label>
            <select
              value={project.roofShape}
              onChange={(e) => onUpdate({ roofShape: e.target.value as RoofShape })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none font-medium"
            >
              <option value="rect">Hình chữ nhật (Dài × Rộng)</option>
              <option value="l">Mái hình chữ L (Nhập chính xác 2 khối)</option>
              <option value="manual">Nhập diện tích khả dụng thủ công (m²)</option>
            </select>
          </div>
        </div>

        {/* Hộp Giải Thích Cách Xác Định Hướng Mái Chính */}
        {showDirGuide && (
          <div className="mt-4 p-4 rounded-xl bg-orange-50/60 border border-orange-200 text-xs text-slate-700 space-y-2 animate-fadeIn">
            <div className="font-bold text-[#0F2A45] flex items-center gap-1.5 text-sm">
              <Compass size={16} className="text-[#E4572E]" />
              <span>Hướng Mái Chính Được Tính Như Thế Nào?</span>
            </div>
            <p className="leading-relaxed">
              <strong>Hướng mái chính</strong> là <u>hướng mặt dốc của mái quay về để hứng ánh sáng mặt trời</u> (Góc phương vị Azimuth).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px]">
              <div className="p-2.5 bg-white rounded-lg border border-orange-100">
                <span className="font-bold text-slate-900 block mb-0.5">☀️ Vì sao Chính Nam (180°) là tốt nhất?</span>
                <span>Do Việt Nam nằm hoàn toàn ở Bắc bán cầu, mặt trời quanh năm có xu hướng ngả về phía Nam. Mái dốc hướng về Nam sẽ đón lượng quang năng cực đại cả năm.</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-orange-100">
                <span className="font-bold text-slate-900 block mb-0.5">🧭 Cách đo thực tế tại công trình:</span>
                <span>Đứng tại mép mái nhìn theo hướng dốc chảy xuống, bật ứng dụng la bàn trên điện thoại: nếu la bàn chỉ 180° thì mái quay hướng Nam.</span>
              </div>
            </div>
          </div>
        )}

        {/* CHI TIẾT KÍCH THƯỚC MÁI */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          {/* TRƯỜNG HỢP 1: MÁI HÌNH CHỮ L */}
          {project.roofShape === 'l' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F2A45] uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E4572E]"></span>
                  Thông số chi tiết 2 khối mái chữ L (Cánh 1 & Cánh 2):
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  S = (L₁ × W₁) + (L₂ × W₂) = <strong className="text-[#E4572E]">{calculatedArea} m²</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* Cánh 1 (Khối chính) */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-[#0F2A45]">Khối Mái 1 (Cánh Chính)</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {((project.roofL1M || 15) * (project.roofW1M || 8)).toFixed(0)} m²
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Chiều Dài L₁ (m) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="2"
                        step="0.5"
                        value={project.roofL1M || 15}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          onUpdate({
                            roofL1M: val,
                            roofLengthM: Math.max(val, project.roofL2M || 10),
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg outline-none focus:border-[#E4572E]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Chiều Rộng W₁ (m) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="2"
                        step="0.5"
                        value={project.roofW1M || 8}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          onUpdate({
                            roofW1M: val,
                            roofWidthM: val + (project.roofW2M || 6),
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg outline-none focus:border-[#E4572E]"
                      />
                    </div>
                  </div>
                </div>

                {/* Cánh 2 (Khối nhánh chữ L) */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-[#0F2A45]">Khối Mái 2 (Cánh Nhánh Chữ L)</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {((project.roofL2M || 10) * (project.roofW2M || 6)).toFixed(0)} m²
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Chiều Dài L₂ (m) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="2"
                        step="0.5"
                        value={project.roofL2M || 10}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          onUpdate({
                            roofL2M: val,
                            roofLengthM: Math.max(project.roofL1M || 15, val),
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg outline-none focus:border-[#E4572E]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Chiều Rộng W₂ (m) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="2"
                        step="0.5"
                        value={project.roofW2M || 6}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          onUpdate({
                            roofW2M: val,
                            roofWidthM: (project.roofW1M || 8) + val,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg outline-none focus:border-[#E4572E]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : project.roofShape === 'rect' ? (
            /* TRƯỜNG HỢP 2: MÁI HÌNH CHỮ NHẬT */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Chiều Dài Mái (m) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="2"
                  step="0.5"
                  value={project.roofLengthM || ''}
                  onChange={(e) => onUpdate({ roofLengthM: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Chiều Rộng Mái (m) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="2"
                  step="0.5"
                  value={project.roofWidthM || ''}
                  onChange={(e) => onUpdate({ roofWidthM: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Chiều Cao Công Trình (m)
                </label>
                <input
                  type="number"
                  min="2"
                  step="0.5"
                  value={project.roofHeightM || ''}
                  onChange={(e) => onUpdate({ roofHeightM: Math.max(1, Number(e.target.value)) })}
                  placeholder="VD: 12 (ước tính tuyến cáp)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none"
                />
              </div>
            </div>
          ) : (
            /* TRƯỜNG HỢP 3: NHẬP DIỆN TÍCH THỦ CÔNG */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Diện Tích Khả Dụng Lắp Pin (m²) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={project.manualAreaM2 || ''}
                  onChange={(e) => onUpdate({ manualAreaM2: Math.max(1, Number(e.target.value)) })}
                  placeholder="VD: 150"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Chiều Cao Công Trình (m)
                </label>
                <input
                  type="number"
                  min="2"
                  step="0.5"
                  value={project.roofHeightM || ''}
                  onChange={(e) => onUpdate({ roofHeightM: Math.max(1, Number(e.target.value)) })}
                  placeholder="VD: 12"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E] outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-500">
          Bước 1 / 5 · <span className="font-semibold text-slate-700">Khách hàng & Mái</span>
        </div>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E4572E] hover:bg-[#d04922] text-white font-bold text-sm shadow-sm transition-all"
        >
          <span>Tiếp tục: Cấu hình hệ thống</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
