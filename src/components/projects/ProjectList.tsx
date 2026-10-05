import React, { useState } from 'react';
import { Project } from '../../types/solar';
import { Plus, Search, Filter, Trash2, Copy, ArrowUpRight, Building2, Sun, Calendar, Clock, CheckCircle2 } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: (name: string, customerType: any) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onDuplicateProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'saved' | 'draft'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), 'sinh_hoat');
    setNewProjectName('');
    setShowNewModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F2A45]">Quản Lý Hồ Sơ Dự Án Điện Mặt Trời</h2>
          <p className="text-xs text-slate-500 mt-1">
            Danh sách thiết kế kỹ thuật, dự toán và hồ sơ báo giá cho khách hàng HGC Power
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E4572E] to-[#F2A65A] text-white font-bold text-sm shadow hover:brightness-105 active:scale-95 transition-all"
        >
          <Plus size={18} />
          <span>Tạo Dự Án Mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên khách hàng, công trình..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#E4572E] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter size={13} /> Lọc:
          </span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'all' ? 'bg-white shadow-2xs text-[#0F2A45] font-bold' : 'text-slate-600'
              }`}
            >
              Tất cả ({projects.length})
            </button>
            <button
              onClick={() => setStatusFilter('saved')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'saved' ? 'bg-white shadow-2xs text-emerald-700 font-bold' : 'text-slate-600'
              }`}
            >
              Đã lưu
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'draft' ? 'bg-white shadow-2xs text-amber-700 font-bold' : 'text-slate-600'
              }`}
            >
              Bản nháp
            </button>
          </div>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((proj) => {
          const kwp = proj.layoutResult?.installedKwp || 0;
          const panels = proj.layoutResult?.panelQty || 0;
          const grandTotal = proj.financial?.grandTotalVnd || 0;

          return (
            <div
              key={proj.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#1E4C7C]/60 transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#E4572E] flex items-center justify-center font-bold">
                      <Sun size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F2A45] group-hover:text-[#E4572E] transition-colors truncate max-w-[200px]">
                        {proj.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{proj.customerName}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      proj.status === 'saved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {proj.status === 'saved' ? 'Đã lưu' : 'Bản nháp'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50 rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Công suất:</span>
                    <strong className="text-sm font-bold text-[#0F2A45] font-mono">{kwp} kWp</strong>
                    <span className="text-[10px] text-slate-500 block">({panels} tấm)</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Báo giá:</span>
                    <strong className="text-sm font-bold text-[#E4572E] font-mono">
                      {grandTotal > 0 ? `${(grandTotal / 1000000).toFixed(0)} tr` : 'Chưa tính'}
                    </strong>
                    <span className="text-[10px] text-slate-500 block">Gồm VAT</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {new Date(proj.updatedAt).toLocaleDateString('vi-VN')}
                  </span>
                  <span>{proj.roofLengthM * proj.roofWidthM} m² mái</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onSelectProject(proj)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#0F2A45] hover:bg-[#1E4C7C] text-white text-xs font-bold transition-all shadow-2xs"
                >
                  <span>Mở thiết kế</span>
                  <ArrowUpRight size={14} />
                </button>

                <button
                  onClick={() => onDuplicateProject(proj)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Nhân bản dự án"
                >
                  <Copy size={14} />
                </button>

                <button
                  onClick={() => setProjectToDelete(proj)}
                  className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Xóa dự án"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <Sun size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Chưa có dự án nào</h3>
          <p className="text-xs text-slate-500 mt-1">Bấm nút "Tạo Dự Án Mới" để bắt đầu thiết kế hệ thống</p>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Dự Án (In-App Modal thay thế window.confirm) */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scaleUp border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">Xác Nhận Xóa Dự Án?</h3>
            <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa hồ sơ dự án <strong className="text-slate-800">"{projectToDelete.name}"</strong>? Dữ liệu tính toán kỹ thuật và báo giá liên quan sẽ bị xóa.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Dự Án Mới */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-[#0F2A45] mb-1">Tạo Hồ Sơ Dự Án Mới</h3>
            <p className="text-xs text-slate-500 mb-4">
              Nhập tên khách hàng hoặc tên công trình để bắt đầu quá trình tính toán
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên Khách Hàng / Dự Án <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="VD: Nhà máy may HGC hoặc Hộ gia đình Anh Hưng"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4572E]/30 focus:border-[#E4572E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#E4572E] text-white hover:bg-[#d04922] shadow"
                >
                  Bắt đầu thiết kế
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
