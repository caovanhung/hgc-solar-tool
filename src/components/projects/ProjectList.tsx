import React, { useState } from 'react';
import { Project } from '../../types/solar';
import { UserProfile } from '../../types/user';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Copy,
  ArrowUpRight,
  Sun,
  Calendar,
  Share2,
  Users,
  Shield,
  Globe,
  Mail,
  X,
  UserCheck,
  Lock,
} from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  currentUser?: UserProfile | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: (name: string, customerType: any) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (project: Project) => void;
  onUpdateProject?: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  currentUser,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onDuplicateProject,
  onUpdateProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'saved' | 'draft'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'mine' | 'shared'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // State cho Modal Chia sẻ dự án
  const [sharingProject, setSharingProject] = useState<Project | null>(null);
  const [shareEmailInput, setShareEmailInput] = useState('');
  const [shareEmails, setShareEmails] = useState<string[]>([]);
  const [shareRoles, setShareRoles] = useState<('ky_su' | 'sales' | 'admin')[]>([]);
  const [isPublicState, setIsPublicState] = useState(false);

  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const isAdmin = currentUser?.role === 'admin';

  // Lọc theo tìm kiếm, trạng thái và phạm vi quyền sở hữu
  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.createdByEmail && p.createdByEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'all' || p.status === statusFilter;

    const isMine = (p.createdByEmail || '').toLowerCase().trim() === userEmail;
    const isShared = !isMine;

    let matchScope = true;
    if (scopeFilter === 'mine') matchScope = isMine;
    if (scopeFilter === 'shared') matchScope = isShared;

    return matchSearch && matchStatus && matchScope;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), 'sinh_hoat');
    setNewProjectName('');
    setShowNewModal(false);
  };

  // Mở modal chia sẻ
  const handleOpenShare = (proj: Project) => {
    setSharingProject(proj);
    setShareEmails(proj.sharedWithEmails || []);
    setShareRoles(proj.sharedWithRoles || []);
    setIsPublicState(!!proj.isPublic);
    setShareEmailInput('');
  };

  // Thêm email vào danh sách chia sẻ
  const handleAddEmail = () => {
    const emailToAdd = shareEmailInput.trim().toLowerCase();
    if (!emailToAdd || !emailToAdd.includes('@')) return;
    if (emailToAdd === (sharingProject?.createdByEmail || '').toLowerCase()) return;
    if (!shareEmails.includes(emailToAdd)) {
      setShareEmails([...shareEmails, emailToAdd]);
    }
    setShareEmailInput('');
  };

  // Gỡ email khỏi danh sách chia sẻ
  const handleRemoveEmail = (email: string) => {
    setShareEmails(shareEmails.filter((e) => e !== email));
  };

  // Đổi trạng thái chia sẻ nhóm
  const handleToggleRole = (role: 'ky_su' | 'sales' | 'admin') => {
    if (shareRoles.includes(role)) {
      setShareRoles(shareRoles.filter((r) => r !== role));
    } else {
      setShareRoles([...shareRoles, role]);
    }
  };

  // Lưu cài đặt chia sẻ
  const handleSaveShare = () => {
    if (!sharingProject || !onUpdateProject) return;
    const updated: Project = {
      ...sharingProject,
      sharedWithEmails: shareEmails,
      sharedWithRoles: shareRoles,
      isPublic: isPublicState,
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updated);
    setSharingProject(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-[#0F2A45]">Quản Lý Hồ Sơ Dự Án Điện Mặt Trời</h2>
            {isAdmin && (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                Toàn quyền Quản trị
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hồ sơ thiết kế riêng tư cho tài khoản của bạn, kèm tính năng chia sẻ linh hoạt cho đồng nghiệp hoặc phòng ban
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên dự án, khách hàng, email người tạo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#E4572E] transition-all"
          />
        </div>

        {/* Filter Groups */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Scope Filter Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                scopeFilter === 'all' ? 'bg-white shadow-2xs text-[#0F2A45] font-bold' : 'text-slate-600'
              }`}
            >
              Tất cả ({projects.length})
            </button>
            <button
              onClick={() => setScopeFilter('mine')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                scopeFilter === 'mine' ? 'bg-white shadow-2xs text-blue-700 font-bold' : 'text-slate-600'
              }`}
            >
              Của tôi
            </button>
            <button
              onClick={() => setScopeFilter('shared')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                scopeFilter === 'shared' ? 'bg-white shadow-2xs text-purple-700 font-bold' : 'text-slate-600'
              }`}
            >
              Được chia sẻ
            </button>
          </div>

          <span className="text-slate-300">|</span>

          {/* Status Filter */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'all' ? 'bg-white shadow-2xs text-[#0F2A45] font-bold' : 'text-slate-600'
              }`}
            >
              Mọi trạng thái
            </button>
            <button
              onClick={() => setStatusFilter('saved')}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'saved' ? 'bg-white shadow-2xs text-emerald-700 font-bold' : 'text-slate-600'
              }`}
            >
              Đã lưu
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
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
          const isMine = (proj.createdByEmail || '').toLowerCase().trim() === userEmail;
          const hasShares = (proj.sharedWithEmails && proj.sharedWithEmails.length > 0) || (proj.sharedWithRoles && proj.sharedWithRoles.length > 0);

          return (
            <div
              key={proj.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#1E4C7C]/60 transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Header with Title and Ownership Badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#E4572E] flex items-center justify-center font-bold shrink-0">
                      <Sun size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F2A45] group-hover:text-[#E4572E] transition-colors truncate max-w-[180px]">
                        {proj.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{proj.customerName}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      proj.status === 'saved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {proj.status === 'saved' ? 'Đã lưu' : 'Bản nháp'}
                  </span>
                </div>

                {/* Ownership & Sharing Info Badges */}
                <div className="flex flex-wrap items-center gap-1.5 my-2">
                  {isMine ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      <Lock size={10} /> Dự án của tôi
                    </span>
                  ) : proj.id === 'demo-hgc-01' || proj.name.includes('Văn Phòng HGC') ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                      <Sun size={10} /> Dự án mẫu HGC (Tham khảo)
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200"
                      title={`Tạo bởi: ${proj.createdByName || proj.createdByEmail || 'Đồng nghiệp'}`}
                    >
                      <Users size={10} /> Chia sẻ từ {proj.createdByName || proj.createdByEmail?.split('@')[0] || 'Đồng nghiệp'}
                    </span>
                  )}

                  {proj.isPublic && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Globe size={10} /> Công khai
                    </span>
                  )}

                  {isMine && hasShares && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                      <Share2 size={10} /> Đã chia sẻ ({proj.sharedWithEmails?.length || 0})
                    </span>
                  )}
                </div>

                {/* Tech & Financial Specs */}
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

                {/* Date and Area Footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {new Date(proj.updatedAt).toLocaleDateString('vi-VN')}
                  </span>
                  <span>{proj.roofLengthM * proj.roofWidthM} m² mái</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-1.5 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onSelectProject(proj)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#0F2A45] hover:bg-[#1E4C7C] text-white text-xs font-bold transition-all shadow-2xs"
                >
                  <span>Mở thiết kế</span>
                  <ArrowUpRight size={14} />
                </button>

                {/* Nút chia sẻ dự án (Chỉ người tạo hoặc Admin mới cấu hình được chia sẻ) */}
                {(isMine || isAdmin) && (
                  <button
                    onClick={() => handleOpenShare(proj)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                    title="Cấu hình chia sẻ cho đồng nghiệp / nhóm"
                  >
                    <Share2 size={14} />
                  </button>
                )}

                <button
                  onClick={() => onDuplicateProject(proj)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Nhân bản hồ sơ dự án"
                >
                  <Copy size={14} />
                </button>

                {(isMine || isAdmin) && (
                  <button
                    onClick={() => setProjectToDelete(proj)}
                    className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Xóa dự án"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <Sun size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Chưa có dự án nào phù hợp</h3>
          <p className="text-xs text-slate-500 mt-1">
            {scopeFilter === 'mine'
              ? 'Bạn chưa tạo dự án nào. Bấm nút "Tạo Dự Án Mới" để bắt đầu!'
              : scopeFilter === 'shared'
              ? 'Chưa có dự án nào được chia sẻ với bạn.'
              : 'Hãy tạo dự án mới hoặc điều chỉnh bộ lọc tìm kiếm'}
          </p>
        </div>
      )}

      {/* MODAL CẤU HÌNH CHIA SẺ DỰ ÁN */}
      {sharingProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp border border-slate-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#0F2A45] flex items-center gap-2">
                  <Share2 size={18} className="text-[#E4572E]" />
                  <span>Chia Sẻ Quyền Xem & Quản Lý Dự Án</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dự án: <strong className="text-slate-800">{sharingProject.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setSharingProject(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chủ sở hữu */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Shield size={14} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">
                    {sharingProject.createdByName || 'Người tạo dự án'} (Chủ sở hữu)
                  </span>
                  <span className="text-[11px] text-slate-500">{sharingProject.createdByEmail || currentUser?.email}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800">Owner</span>
            </div>

            {/* 1. Chia sẻ theo Email cá nhân */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                1. Chia sẻ đích danh qua Email đồng nghiệp:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="VD: dongnghiep@gmail.com..."
                    value={shareEmailInput}
                    onChange={(e) => setShareEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#E4572E]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all"
                >
                  Thêm
                </button>
              </div>

              {/* Danh sách email đã thêm */}
              {shareEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {shareEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      <UserCheck size={12} />
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="hover:text-red-500 p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Chia sẻ theo Nhóm / Vai trò */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                2. Chia sẻ cho toàn bộ phòng ban / nhóm:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareRoles.includes('ky_su')}
                    onChange={() => handleToggleRole('ky_su')}
                    className="rounded text-[#E4572E] focus:ring-[#E4572E]"
                  />
                  <div>
                    <strong className="block text-slate-800">Nhóm Kỹ Sư</strong>
                    <span className="text-[10px] text-slate-500">Toàn bộ tài khoản Kỹ thuật</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareRoles.includes('sales')}
                    onChange={() => handleToggleRole('sales')}
                    className="rounded text-[#E4572E] focus:ring-[#E4572E]"
                  />
                  <div>
                    <strong className="block text-slate-800">Nhóm Kinh Doanh</strong>
                    <span className="text-[10px] text-slate-500">Tài khoản Bán hàng / Sales</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 3. Công khai cho toàn công ty */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-emerald-600" />
                <div>
                  <strong className="text-xs text-slate-800 block">Công khai cho toàn bộ nhân viên HGC</strong>
                  <span className="text-[11px] text-slate-500">Ai đăng nhập cũng có thể xem dự án này</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPublicState}
                onChange={(e) => setIsPublicState(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSharingProject(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveShare}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-[#0F2A45] hover:bg-[#1E4C7C] text-white shadow transition-all"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Dự Án */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scaleUp border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">Xác Nhận Xóa Dự Án?</h3>
            <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa hồ sơ dự án <strong className="text-slate-800">"{projectToDelete.name}"</strong>? Dữ liệu tính toán kỹ thuật và báo giá liên quan sẽ bị xóa khỏi cơ sở dữ liệu.
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
