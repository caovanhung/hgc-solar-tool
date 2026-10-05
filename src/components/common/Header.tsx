import React, { useState } from 'react';
import { Logo } from './Logo';
import {
  FolderOpen,
  Zap,
  Printer,
  Settings,
  User,
  CheckCircle2,
  Menu,
  X,
  Building2,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { Project } from '../../types/solar';

interface HeaderProps {
  currentProject?: Project;
  onOpenProjects: () => void;
  onOpenAdmin: () => void;
  onOpenQuickProposal: () => void;
  onPrint: () => void;
  onClearCache?: () => void;
  activeView: 'wizard' | 'projects' | 'admin';
  userRole: 'ky_su' | 'sales' | 'admin';
  setUserRole: (role: 'ky_su' | 'sales' | 'admin') => void;
  saveStatus: 'saved' | 'saving';
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  onOpenProjects,
  onOpenAdmin,
  onOpenQuickProposal,
  onPrint,
  onClearCache,
  activeView,
  userRole,
  setUserRole,
  saveStatus,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0F2A45] text-white border-b border-[#1E4C7C] shadow-md select-none print:hidden">
      {/* Main Top Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Module Tabs */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div
            onClick={onOpenProjects}
            className="cursor-pointer flex items-center py-1 transition-opacity hover:opacity-95"
            title="Về trang tổng quan"
          >
            <Logo size="md" lightText={true} />
          </div>

          {/* Module Selector: Solar, Bess, Solar+Bess (Hidden on small mobile, visible on tablet/laptop) */}
          <nav className="hidden md:flex items-center p-1 bg-[#0A1C2E] rounded-lg border border-[#1E4C7C]">
            <button
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#E4572E] text-white shadow-sm transition-all"
            >
              ☀ Solar Áp Mái
            </button>
            <button
              onClick={() => alert('Mô-đun BESS (Pin lưu trữ năng lượng công nghiệp) đang được phát triển theo lộ trình Phase 4!')}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-md transition-colors flex items-center gap-1.5"
            >
              <span>🔋 BESS</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">Sắp có</span>
            </button>
            <button
              onClick={() => alert('Mô-đun Solar + BESS Hybrid đang được phát triển theo lộ trình Phase 4!')}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-md transition-colors flex items-center gap-1.5"
            >
              <span>⚡ Solar + BESS</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">Sắp có</span>
            </button>
          </nav>
        </div>

        {/* Center: Active Project Pill (Desktop / Tablet) */}
        {currentProject && activeView === 'wizard' && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#0A1C2E]/80 border border-[#1E4C7C] rounded-full text-xs">
            <Building2 size={13} className="text-[#E4572E]" />
            <span className="font-semibold text-slate-100 max-w-[200px] truncate">
              {currentProject.name}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{currentProject.layoutResult?.installedKwp || 0} kWp</span>
            <span className="text-slate-500">·</span>
            {saveStatus === 'saved' ? (
              <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                <CheckCircle2 size={12} /> Đã lưu
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-300 text-[11px] animate-pulse">
                Đang lưu…
              </span>
            )}
          </div>
        )}

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Quick 3-min Quotation Button */}
          <button
            onClick={onOpenQuickProposal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-[#E4572E] to-[#F2A65A] text-white hover:brightness-110 active:scale-95 transition-all shadow-sm"
            title="Tạo nhanh báo giá 3 phút cho khách hàng"
          >
            <Zap size={14} className="fill-current" />
            <span className="hidden sm:inline">Báo giá nhanh</span>
            <span className="sm:hidden">Nhanh</span>
          </button>

          {/* Project List Switcher */}
          <button
            onClick={onOpenProjects}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              activeView === 'projects'
                ? 'bg-[#1E4C7C] border-cyan-400 text-cyan-200'
                : 'bg-[#0A1C2E] border-[#1E4C7C] text-slate-200 hover:bg-[#153454]'
            }`}
          >
            <FolderOpen size={14} />
            <span className="hidden md:inline">Dự án</span>
          </button>

          {/* Admin Catalog Button */}
          <button
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              activeView === 'admin'
                ? 'bg-[#1E4C7C] border-cyan-400 text-cyan-200'
                : 'bg-[#0A1C2E] border-[#1E4C7C] text-slate-200 hover:bg-[#153454]'
            }`}
            title="Quản lý danh mục thiết bị và đơn giá"
          >
            <Settings size={14} />
            <span className="hidden md:inline">Danh mục</span>
          </button>

          {/* Xóa Cache Button - Đồng bộ chuẩn Etek Power */}
          {onClearCache && (
            <button
              onClick={onClearCache}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0A1C2E] border border-emerald-500/40 text-emerald-300 hover:bg-[#153454] transition-colors"
              title="Làm mới bộ nhớ đệm trình duyệt và đồng bộ danh mục 8 nhóm BOM mới nhất"
            >
              <RotateCcw size={13} />
              <span className="hidden lg:inline">Xóa cache</span>
            </button>
          )}

          {/* Print / Export PDF Button */}
          {activeView === 'wizard' && (
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0A1C2E] border border-[#1E4C7C] text-slate-200 hover:bg-[#153454] transition-colors"
              title="Xuất hồ sơ thiết kế & in PDF"
            >
              <Printer size={14} />
              <span className="hidden lg:inline">In / Xuất PDF</span>
            </button>
          )}

          {/* Role Switcher Pill */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0A1C2E] border border-[#1E4C7C] text-xs text-slate-200 hover:bg-[#153454] transition-colors"
            >
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="font-semibold">
                {userRole === 'ky_su' ? 'Kỹ sư' : userRole === 'sales' ? 'Kinh doanh' : 'Admin'}
              </span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-[#0A1C2E] border border-[#1E4C7C] rounded-lg shadow-xl py-1 z-50 text-xs">
                <div className="px-3 py-1.5 text-slate-400 border-b border-[#1E4C7C] font-semibold text-[10px] uppercase">
                  Chuyển vai trò thử nghiệm
                </div>
                <button
                  onClick={() => {
                    setUserRole('ky_su');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#1E4C7C] ${
                    userRole === 'ky_su' ? 'text-cyan-300 font-bold bg-[#14324f]' : 'text-slate-200'
                  }`}
                >
                  <span>Kỹ sư (Engineer)</span>
                  {userRole === 'ky_su' && <CheckCircle2 size={12} />}
                </button>
                <button
                  onClick={() => {
                    setUserRole('sales');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#1E4C7C] ${
                    userRole === 'sales' ? 'text-cyan-300 font-bold bg-[#14324f]' : 'text-slate-200'
                  }`}
                >
                  <span>Kinh doanh (Sales)</span>
                  {userRole === 'sales' && <CheckCircle2 size={12} />}
                </button>
                <button
                  onClick={() => {
                    setUserRole('admin');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#1E4C7C] ${
                    userRole === 'admin' ? 'text-cyan-300 font-bold bg-[#14324f]' : 'text-slate-200'
                  }`}
                >
                  <span>Quản trị viên (Admin)</span>
                  {userRole === 'admin' && <CheckCircle2 size={12} />}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg bg-[#0A1C2E] border border-[#1E4C7C] text-slate-200 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A1C2E] border-b border-[#1E4C7C] px-4 py-3 space-y-3 animate-fadeIn">
          {currentProject && activeView === 'wizard' && (
            <div className="p-2.5 rounded-lg bg-[#0F2A45] border border-[#1E4C7C] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <Building2 size={14} className="text-[#E4572E] shrink-0" />
                <span className="font-semibold text-white truncate">{currentProject.name}</span>
              </div>
              <span className="text-orange-400 font-bold">{currentProject.layoutResult?.installedKwp || 0} kWp</span>
            </div>
          )}

          <div className="flex flex-col gap-1 text-xs">
            <button
              onClick={() => {
                onOpenProjects();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0F2A45] text-slate-100 font-semibold"
            >
              <FolderOpen size={16} /> Danh sách dự án
            </button>
            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0F2A45] text-slate-100 font-semibold"
            >
              <Settings size={16} /> Cấu hình danh mục thiết bị
            </button>
            <button
              onClick={() => {
                onOpenQuickProposal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E4572E] text-white font-bold"
            >
              <Zap size={16} /> Báo giá nhanh 3 phút
            </button>
          </div>

          <div className="pt-2 border-t border-[#1E4C7C]/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">Vai trò:</span>
            <div className="flex gap-1.5">
              {(['ky_su', 'sales', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRole(r)}
                  className={`px-2 py-1 rounded text-[11px] font-medium ${
                    userRole === r ? 'bg-[#E4572E] text-white' : 'bg-[#0F2A45] text-slate-300'
                  }`}
                >
                  {r === 'ky_su' ? 'Kỹ sư' : r === 'sales' ? 'Sales' : 'Admin'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
