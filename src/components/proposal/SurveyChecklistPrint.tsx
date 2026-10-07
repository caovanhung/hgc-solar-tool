import React from 'react';
import { Project, DEFAULT_SURVEY_CHECKLIST } from '../../types/solar';
import { Logo } from '../common/Logo';
import { ClipboardCheck, MapPin, Home, User, CheckCircle2 } from 'lucide-react';

interface SurveyChecklistPrintProps {
  project: Project;
  onUpdateChecklist?: (updated: any[]) => void;
}

export const SurveyChecklistPrint: React.FC<SurveyChecklistPrintProps> = ({
  project,
  onUpdateChecklist,
}) => {
  const checklist = project.surveyChecklist && project.surveyChecklist.length > 0
    ? project.surveyChecklist
    : DEFAULT_SURVEY_CHECKLIST;

  const handleNoteChange = (id: string, note: string) => {
    if (!onUpdateChecklist) return;
    const next = checklist.map((item) => (item.id === id ? { ...item, note } : item));
    onUpdateChecklist(next);
  };

  const handleToggleCheck = (id: string) => {
    if (!onUpdateChecklist) return;
    const next = checklist.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
    onUpdateChecklist(next);
  };

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
            Mã Checklist: HGC-SURVEY-{project.id.slice(0, 6).toUpperCase()} · Ngày: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>

      {/* Document Title */}
      <div className="text-center my-3">
        <div className="inline-block bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-emerald-200 mb-1.5">
          QUY TRÌNH TIÊU CHUẨN HIỆN TRƯỜNG (4 BƯỚC CHUẨN)
        </div>
        <h2 className="text-lg sm:text-xl font-black text-[#0F2A45] uppercase tracking-wide">
          PHIẾU KHẢO SÁT HIỆN TRƯỜNG & THÔNG TIN DỰ ÁN (SURVEY CHECKLIST)
        </h2>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
          Chuẩn theo tài liệu kỹ thuật HGC & Mẫu file kiểm tra 'CHECKLIST' trong hồ sơ dự án
        </p>
      </div>

      {/* Quick Project Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px]">Chủ Hộ / Doanh Nghiệp:</span>
          <strong className="text-slate-900">{project.customerName || 'Khách Hàng'}</strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Địa Điểm / Tỉnh Thành:</span>
          <strong className="text-slate-900">{project.provinceCode}</strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Hệ Thống Đề Xuất:</span>
          <strong className="text-[#E4572E] font-bold">
            {project.layoutResult?.installedKwp || 0} kWp ({project.sysType === 'hybrid' ? 'Hybrid ESS' : 'On-Grid Zero-Export'})
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Lưới Điện:</span>
          <strong className="text-emerald-700 font-semibold">{project.phases === '3' ? '3 Pha 380V' : '1 Pha 220V'}</strong>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 mb-6">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0F2A45] text-white text-[10.5px] uppercase font-bold font-mono">
            <tr>
              <th className="px-2.5 py-2 w-10 text-center">STT</th>
              <th className="px-3 py-2 w-48">Hạng Mục Khảo Sát</th>
              <th className="px-3 py-2">Thông Tin / Tiêu Chuẩn Cần Thu Thập</th>
              <th className="px-3 py-2 w-72">Ghi Chú / Hiện Trạng Thực Tế</th>
              <th className="px-2.5 py-2 text-center w-16 print:hidden">Xác Nhận</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {checklist.map((item, idx) => {
              const isFirstOfCategory = idx === 0 || checklist[idx - 1].category !== item.category;

              return (
                <React.Fragment key={item.id}>
                  {isFirstOfCategory && (
                    <tr className="bg-slate-100 font-bold text-slate-800 text-[11px] border-t border-slate-200">
                      <td colSpan={5} className="px-3 py-1.5 uppercase text-[#0F2A45] tracking-wide">
                        📌 {item.category}
                      </td>
                    </tr>
                  )}
                  <tr className="hover:bg-slate-50 transition-colors text-[11px]">
                    <td className="px-2.5 py-2 text-center font-mono text-slate-500 font-semibold">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-700">
                      {item.category}
                    </td>
                    <td className="px-3 py-2 text-slate-900 font-medium">
                      {item.item}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.note || ''}
                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                        placeholder="Nhập ghi chú hiện trường..."
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-[#E4572E] focus:outline-none print:border-none print:p-0 print:bg-transparent"
                      />
                    </td>
                    <td className="px-2.5 py-2 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => handleToggleCheck(item.id)}
                        className={`p-1 rounded transition-colors ${
                          item.checked ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title="Đánh dấu đã hoàn thành kiểm tra"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Field Inspection Signatures */}
      <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-200">
        <div>
          <div className="font-bold text-slate-900 uppercase">KỸ SƯ KHẢO SÁT HIỆN TRƯỜNG</div>
          <div className="text-[10px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên & ngày khảo sát)</div>
          <div className="h-20"></div>
        </div>
        <div>
          <div className="font-bold text-slate-900 uppercase">CHỦ NHÀ / ĐẠI DIỆN CHỦ ĐẦU TƯ</div>
          <div className="text-[10px] text-slate-400 mt-0.5">(Ký xác nhận thông tin hiện trường)</div>
          <div className="h-20"></div>
        </div>
      </div>
    </div>
  );
};
