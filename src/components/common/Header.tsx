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
  LogOut,
  Phone,
  MapPin,
  Mail,
  BookOpen,
} from 'lucide-react';
import { Project } from '../../types/solar';
import { UserProfile, UserRole } from '../../types/user';

interface HeaderProps {
  currentProject?: Project;
  onOpenProjects: () => void;
  onOpenAdmin: () => void;
  onOpenQuickProposal: () => void;
  onOpenDocModal?: () => void;
  onPrint: () => void;
  onClearCache?: () => void;
  activeView: 'wizard' | 'projects' | 'admin';
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  saveStatus: 'saved' | 'saving';
  currentUser?: UserProfile | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  onOpenProjects,
  onOpenAdmin,
  onOpenQuickProposal,
  onOpenDocModal,
  onPrint,
  onClearCache,
  activeView,
  userRole,
  setUserRole,
  saveStatus,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0F2A45] text-white border-b border-[#1E4C7C] shadow-md select-none print:hidden">
      {/* Main Top Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Solar Tag */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div
            onClick={onOpenProjects}
            className="cursor-pointer flex items-center py-1 transition-opacity hover:opacity-95"
            title="Về trang tổng quan"
          >
            <Logo size="md" lightText={true} />
          </div>

          <div className="hidden sm:flex items-center px-2.5 py-1 bg-[#0A1C2E] rounded-md border border-[#1E4C7C]/60 text-xs font-semibold text-amber-300">
            ☀ Hệ Thống Điện Mặt Trời Áp Mái
          </div>
        </div>

        {/* Center: Active Project Pill (Desktop / Tablet) - Only when logged in */}
        {currentUser && currentProject && activeView === 'wizard' && (
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

        {/* Right: Actions, User Auth & Roles */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentUser ? (
            <>
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

              {/* Tài liệu & Công thức tính toán Button */}
              {onOpenDocModal && (
                <button
                  onClick={onOpenDocModal}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0A1C2E] border border-amber-500/40 text-amber-300 hover:bg-[#153454] transition-colors"
                  title="Tra cứu toàn bộ tài liệu nghiệp vụ, công thức tính toán 1P/3P & bảng kê BOM"
                >
                  <BookOpen size={14} className="text-amber-400" />
                  <span className="hidden lg:inline">Tài liệu & Công thức</span>
                </button>
              )}

              {/* Xóa Cache Button */}
              {onClearCache && (
                <button
                  onClick={onClearCache}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0A1C2E] border border-emerald-500/40 text-emerald-300 hover:bg-[#153454] transition-colors"
                  title="Làm mới bộ nhớ đệm trình duyệt"
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
                  <span className="hidden lg:inline">In PDF</span>
                </button>
              )}

              {/* Role Switcher Pill */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => {
                    setRoleDropdownOpen(!roleDropdownOpen);
                    setUserDropdownOpen(false);
                  }}
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
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 rounded-lg border border-[#1E4C7C] bg-[#0A1C2E] text-slate-200 hover:text-white hover:bg-[#153454] text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <User size={13} />
                <span>Đăng nhập</span>
              </button>
              <button
                onClick={onOpenAuthModal}
                className="px-3.5 py-1.5 rounded-lg bg-[#E4572E] hover:bg-[#d04922] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>Đăng ký</span>
              </button>
            </div>
          )}

          {/* USER LOGIN / PROFILE BUTTON */}
          <div className="relative">
            {currentUser ? (
              <div>
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setRoleDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 bg-[#0A1C2E] border border-cyan-500/60 rounded-lg text-xs hover:bg-[#153454] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-[11px] text-white shadow-sm">
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="font-semibold text-slate-100 max-w-[110px] truncate leading-tight">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                      <CheckCircle2 size={10} /> Đã xác thực
                    </span>
                  </div>
                  <ChevronDown size={12} className="text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-72 bg-[#0A1C2E] border border-[#1E4C7C] rounded-xl shadow-2xl p-3 z-50 text-xs text-slate-200 animate-fadeIn">
                    <div className="flex items-start gap-2.5 pb-3 border-b border-[#1E4C7C]">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                        {currentUser.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-white truncate text-sm">{currentUser.fullName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                          <Mail size={11} className="shrink-0 text-cyan-400" />
                          <span className="truncate">{currentUser.email}</span>
                        </div>
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                          <CheckCircle2 size={10} /> Email đã xác thực hợp lệ
                        </div>
                      </div>
                    </div>

                    <div className="py-2.5 space-y-1.5 border-b border-[#1E4C7C] text-[11px]">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone size={12} className="text-amber-400 shrink-0" />
                        <span className="text-slate-400">SĐT:</span>
                        <span className="font-semibold text-slate-200">{currentUser.phone || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-300">
                        <MapPin size={12} className="text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-slate-400">Đ/C:</span>
                        <span className="font-semibold text-slate-200 truncate">{currentUser.address || 'Chưa cập nhật'}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          onLogout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 rounded-lg text-red-200 font-semibold transition-colors"
                      >
                        <LogOut size={13} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E4572E] hover:bg-[#d44820] text-white rounded-lg text-xs font-bold shadow-sm transition-all"
              >
                <User size={14} />
                <span>Đăng nhập</span>
              </button>
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
          {currentUser ? (
            <div className="p-2.5 rounded-lg bg-[#0F2A45] border border-[#1E4C7C] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="truncate">
                  <span className="font-bold text-white block truncate">{currentUser.fullName}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{currentUser.phone} · {currentUser.email}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-red-400 font-semibold ml-2"
              >
                Thoát
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAuthModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#E4572E] text-white font-bold rounded-lg text-xs"
            >
              <User size={15} />
              <span>Đăng nhập / Đăng ký tài khoản</span>
            </button>
          )}

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
            {onOpenDocModal && (
              <button
                onClick={() => {
                  onOpenDocModal();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0F2A45] text-amber-300 font-semibold"
              >
                <BookOpen size={16} /> Tài liệu nghiệp vụ & Công thức
              </button>
            )}
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
