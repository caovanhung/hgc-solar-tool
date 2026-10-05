import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Send,
} from 'lucide-react';
import { UserProfile } from '../../types/user';
import { loginUser, registerUser, verifyEmail, resendVerificationCode } from '../../services/authApi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Verification state
  const [verifyEmailTarget, setVerifyEmailTarget] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!email || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setIsLoading(true);
    const result = await loginUser(email.trim(), password);
    setIsLoading(false);

    if (result.success && result.user) {
      onLoginSuccess(result.user);
      onClose();
    } else if (result.requiresVerification) {
      setVerifyEmailTarget(result.email || email.trim());
      setErrorMessage('');
      setSuccessMessage('Tài khoản của bạn chưa xác thực email. Vui lòng nhập mã OTP để kích hoạt.');
      setMode('verify');
    } else {
      setErrorMessage(result.message || 'Email hoặc mật khẩu không chính xác.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Vui lòng nhập Số điện thoại (Bắt buộc).');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Vui lòng nhập Địa chỉ (Bắt buộc).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Vui lòng nhập Email hợp lệ.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsLoading(true);
    const result = await registerUser({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim(),
      address: address.trim(),
    });
    setIsLoading(false);

    if (result.success) {
      setVerifyEmailTarget(email.trim().toLowerCase());
      setSuccessMessage('Đăng ký thành công! Mã xác thực 6 số đã được gửi đến email của bạn.');
      setMode('verify');
    } else {
      setErrorMessage(result.message || 'Đăng ký không thành công.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMessage('Vui lòng nhập mã xác thực OTP.');
      return;
    }

    setIsLoading(true);
    const result = await verifyEmail(verifyEmailTarget, otpCode.trim());
    setIsLoading(false);

    if (result.success && result.user) {
      setSuccessMessage('Kích hoạt tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        onLoginSuccess(result.user!);
        onClose();
      }, 1000);
    } else {
      setErrorMessage(result.message || 'Mã xác nhận không đúng hoặc đã hết hạn.');
    }
  };

  const handleResend = async () => {
    if (!verifyEmailTarget) return;
    setIsLoading(true);
    const result = await resendVerificationCode(verifyEmailTarget);
    setIsLoading(false);
    if (result.success) {
      setSuccessMessage('Đã gửi lại mã xác nhận thành công! Vui lòng kiểm tra hòm thư.');
    } else {
      setErrorMessage(result.message || 'Không thể gửi lại mã lúc này.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0F2A45] border border-[#1E4C7C] rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A1C2E] border-b border-[#1E4C7C] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E4572E] to-amber-500 flex items-center justify-center text-white shadow-md">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {mode === 'login' && 'Đăng nhập Hệ thống HGC'}
                {mode === 'register' && 'Đăng ký Tài khoản Kỹ sư/Khách hàng'}
                {mode === 'verify' && 'Xác thực Email Kích hoạt'}
              </h2>
              <p className="text-xs text-slate-400">HGC Solar Engine & Proposal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher (Login vs Register) */}
        {mode !== 'verify' && (
          <div className="grid grid-cols-2 p-1.5 mx-6 mt-4 bg-[#07131F] rounded-xl border border-[#1E4C7C]/60 text-xs font-semibold">
            <button
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-[#E4572E] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => {
                setMode('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-[#E4572E] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Đăng ký mới
            </button>
          </div>
        )}

        {/* Alert Messages */}
        <div className="px-6 pt-3">
          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Form Body with scroll */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* TAB 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Email đăng nhập <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hung.cv.10@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#07131F] border border-[#1E4C7C] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Mật khẩu <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#07131F] border border-[#1E4C7C] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-700 text-[#E4572E]" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <span className="text-cyan-400 hover:underline cursor-pointer">Quên mật khẩu?</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#E4572E] to-[#f27449] text-white font-bold hover:brightness-110 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                <span>Đăng nhập</span>
              </button>

              <div className="p-3 rounded-lg bg-[#07131F]/70 border border-[#1E4C7C]/60 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Tài khoản quản trị viên sẵn có:</p>
                <p>• Admin: <span className="text-cyan-300 font-mono">admin@hgcvn.cloud</span> / <span className="text-amber-300 font-mono">123456</span></p>
                <p>• Hoặc bấm <strong className="text-orange-400">Đăng ký mới</strong> để tạo tài khoản bằng email của bạn.</p>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Họ và tên <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Cao Văn Hùng"
                    className="w-full pl-9 pr-3 py-2 bg-[#07131F] border border-[#1E4C7C] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* BẮT BUỘC: SỐ ĐIỆN THOẠI */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-slate-300">
                    Số điện thoại liên hệ <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] bg-red-950/90 text-red-300 border border-red-500/40 px-1.5 py-0.5 rounded font-bold">
                    Bắt buộc
                  </span>
                </div>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0974 04 19 84"
                    className="w-full pl-9 pr-3 py-2 bg-[#07131F] border border-[#1E4C7C] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* BẮT BUỘC: ĐỊA CHỈ */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-slate-300">
                    Địa chỉ công trình / trụ sở <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] bg-red-950/90 text-red-300 border border-red-500/40 px-1.5 py-0.5 rounded font-bold">
                    Bắt buộc
                  </span>
                </div>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="B36 TT7 Khu đô thị Văn Quán, Hà Đông, Hà Nội"
                    className="w-full pl-9 pr-3 py-2 bg-[#07131F] border border-[#1E4C7C] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Email nhận mã xác thực <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tenban@congty.com"
                    className="w-full pl-9 pr-3 py-2 bg-[#07131F] border border-[#1E4C7C] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Mật khẩu <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full pl-9 pr-2 py-2 bg-[#07131F] border border-[#1E4C7C] rounded-lg text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Nhập lại mật khẩu <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Khớp mật khẩu"
                      className="w-full pl-9 pr-2 py-2 bg-[#07131F] border border-[#1E4C7C] rounded-lg text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 mt-2 rounded-lg bg-[#E4572E] text-white font-bold hover:brightness-110 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                <span>Đăng ký & Nhận mã OTP qua Email</span>
              </button>
            </form>
          )}

          {/* TAB 3: VERIFY EMAIL OTP */}
          {mode === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
                  <Mail size={28} />
                </div>
                <h3 className="text-sm font-bold text-white">Kiểm tra Hộp thư Email</h3>
                <p className="text-slate-300">
                  Chúng tôi đã gửi mã xác thực 6 chữ số đến địa chỉ email:
                </p>
                <p className="font-mono font-bold text-cyan-300 bg-[#07131F] py-1 px-3 rounded-md border border-[#1E4C7C] inline-block">
                  {verifyEmailTarget}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#07131F] border border-[#1E4C7C] text-slate-300 text-center space-y-1">
                <p className="text-[12px] text-slate-200">
                  Mã xác thực gồm <strong>6 chữ số</strong> đã được gửi qua email. Vui lòng mở hòm thư và điền vào ô bên dưới.
                </p>
                <p className="text-[11px] text-slate-400">
                  (Nếu không thấy trong Hộp thư đến, vui lòng kiểm tra thêm mục <strong>Thư rác / Spam</strong>)
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1 text-center">
                  Nhập mã OTP 6 số:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full text-center tracking-[0.5em] text-xl font-mono py-2.5 bg-[#07131F] border-2 border-cyan-500/60 rounded-xl text-white focus:outline-none focus:border-cyan-300"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>Xác nhận & Kích hoạt Tài khoản</span>
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-[#1E4C7C]/60 text-[11px]">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>Gửi lại mã OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  Quay lại Đăng nhập
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
