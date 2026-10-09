import { UserProfile } from '../types/user';

const AUTH_USER_KEY = 'hgc_solar_auth_user_v1';

export async function fetchMe(): Promise<{
  success: boolean;
  user?: UserProfile;
  mustChangePassword?: boolean;
}> {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'same-origin',
    });
    if (!res.ok) {
      removeLocalStoredUser();
      return { success: false };
    }
    const data = await res.json();
    if (data.success && data.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return {
        success: true,
        user: data.user,
        mustChangePassword: !!data.mustChangePassword,
      };
    }
    return { success: false };
  } catch (err) {
    console.warn('[AuthApi] fetchMe error:', err);
    return { success: false };
  }
}

export async function loginUser(email: string, password: string): Promise<{
  success: boolean;
  user?: UserProfile;
  mustChangePassword?: boolean;
  requiresVerification?: boolean;
  email?: string;
  message?: string;
}> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return {
        success: true,
        user: data.user,
        mustChangePassword: !!data.mustChangePassword,
      };
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
}> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message,
        email: data.email,
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
  mustChangePassword?: boolean;
  message?: string;
}> {
  try {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return {
        success: true,
        user: data.user,
        mustChangePassword: !!data.mustChangePassword,
        message: data.message,
      };
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
}> {
  try {
    const res = await fetch('/api/auth/resend-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return {
      success: !!data.success,
      message: data.message || data.error,
    };
  } catch (err) {
    return { success: false, message: 'Lỗi gửi lại mã.' };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    });
  } catch (err) {
    console.warn('Error logging out:', err);
  } finally {
    removeLocalStoredUser();
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: data.message || 'Đổi mật khẩu thành công.' };
    }
    return { success: false, message: data.message || data.error || 'Không thể đổi mật khẩu.' };
  } catch (err) {
    return { success: false, message: 'Lỗi mạng khi đổi mật khẩu.' };
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
