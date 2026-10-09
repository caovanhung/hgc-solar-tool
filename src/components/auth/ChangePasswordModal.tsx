import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { changePassword } from '../../services/authApi';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isForced?: boolean;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  isForced = false,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Đổi mật khẩu thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } else {
      setError(res.message || 'Không thể đổi mật khẩu.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-[#0F2A45] to-[#1E4C7C] p-6 text-white text-center relative">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="text-white" size={24} />
          </div>
          <h2 className="text-xl font-bold">
            {isForced ? 'Yêu Cầu Đổi Mật Khẩu' : 'Đổi Mật Khẩu Tài Khoản'}
          </h2>
          <p className="text-slate-300 text-xs mt-1">
            {isForced
              ? 'Tài khoản của bạn đang dùng mật khẩu mặc định. Vui lòng thiết lập mật khẩu mới an toàn để tiếp tục.'
              : 'Thiết lập mật khẩu mới để bảo vệ tài khoản của bạn.'}
          </p>

          {!isForced && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white text-xl"
            >
              ✕
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu hiện tại</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                required
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0F2A45] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu mới (tối thiểu 8 ký tự)</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                required
                minLength={8}
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0F2A45] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
                minLength={8}
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0F2A45] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isForced && (
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
              <ShieldAlert size={14} className="shrink-0 text-amber-600" />
              <span>Bạn cần đổi mật khẩu mới để tiếp tục sử dụng hệ thống.</span>
            </p>
          )}

          <div className="pt-2 flex items-center gap-2">
            {!isForced && (
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`${
                isForced ? 'w-full' : 'w-1/2'
              } py-2 bg-[#E4572E] hover:bg-[#d04922] text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50`}
            >
              {loading ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
