import { UserProfile } from '../types/user';

const AUTH_USER_KEY = 'hgc_solar_auth_user_v1';

export async function loginUser(email: string, password: string):Promise<{
  success: boolean;
  user?: UserProfile;
  requiresVerification?: boolean;
  email?: string;
  message?: string;
}> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
    return {
      success: false,
      requiresVerification: data.requiresVerification,
      email: data.email,
      message: data.message || data.error || 'Đăng nhập không thành công',
    };
  } catch (err) {
    console.error('Error logging in:', err);
    return { success: false, message: 'Không thể kết nối đến máy chủ xác thực.' };
  }
}

export async function registerUser(params: {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}): Promise<{
  success: boolean;
  message?: string;
  email?: string;
  verificationCode?: string;
}> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message,
        email: data.email,
        verificationCode: data.verificationCode,
      };
    }
    return {
      success: false,
      message: data.message || data.error || 'Đăng ký tài khoản không thành công',
    };
  } catch (err) {
    console.error('Error registering:', err);
    return { success: false, message: 'Lỗi mạng khi kết nối máy chủ.' };
  }
}

export async function verifyEmail(email: string, code: string): Promise<{
  success: boolean;
  user?: UserProfile;
  message?: string;
}> {
  try {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return { success: true, user: data.user, message: data.message };
    }
    return {
      success: false,
      message: data.message || data.error || 'Mã xác nhận không đúng hoặc đã hết hạn',
    };
  } catch (err) {
    console.error('Error verifying email:', err);
    return { success: false, message: 'Lỗi mạng khi xác thực email.' };
  }
}

export async function resendVerificationCode(email: string): Promise<{
  success: boolean;
  message?: string;
  verificationCode?: string;
}> {
  try {
    const res = await fetch('/api/auth/resend-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return {
      success: !!data.success,
      message: data.message,
      verificationCode: data.verificationCode,
    };
  } catch (err) {
    return { success: false, message: 'Lỗi gửi lại mã.' };
  }
}

export function getLocalStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function removeLocalStoredUser(): void {
  localStorage.removeItem(AUTH_USER_KEY);
}
