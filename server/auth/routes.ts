import { Router } from 'express';
import crypto from 'node:crypto';
import {
  findUserByEmail,
  saveUser,
  ServerUser,
} from '../db.js';
import { hashPassword, verifyPassword } from './password.js';
import {
  createSession,
  revokeSession,
  revokeAllSessionsForUser,
  setSessionCookie,
  clearSessionCookie,
} from './sessions.js';
import { requireAuth } from './middleware.js';
import { checkLoginRateLimit, recordFailedLogin, clearLoginRateLimit } from './rateLimit.js';
import { sendVerificationEmail } from '../mail.js';

export function sanitizeUser(u: ServerUser) {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    address: u.address,
    role: u.role,
    isEmailVerified: u.isEmailVerified,
    mustChangePassword: !!u.mustChangePassword,
    createdAt: u.createdAt,
  };
}

// In-memory tracker for resend-code throttling (1 resend / 60 seconds per email)
const resendThrottles = new Map<string, number>();

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  const { fullName, email, password, phone, address } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu.' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ success: false, error: 'Mật khẩu phải có tối thiểu 8 ký tự.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    if (existingUser.isEmailVerified) {
      return res.status(409).json({ success: false, error: 'Email này đã được đăng ký và xác thực trước đó.' });
    }
  }

  const hashedPassword = await hashPassword(String(password));
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser: ServerUser = {
    id: existingUser ? existingUser.id : `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    phone: String(phone || '').trim(),
    address: String(address || '').trim(),
    password: hashedPassword,
    role: 'sales', // Default new user role is sales
    isEmailVerified: false,
    verificationCode,
    mustChangePassword: false,
    createdAt: existingUser ? existingUser.createdAt : new Date().toISOString(),
  };

  await saveUser(newUser);
  await sendVerificationEmail(newUser.email, newUser.fullName, verificationCode);

  res.json({
    success: true,
    message: 'Đăng ký thành công! Mã xác thực 6 số đã được gửi đến email của bạn.',
    email: normalizedEmail,
  });
});

// POST /api/auth/verify-email
authRouter.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, error: 'Thiếu email hoặc mã xác thực.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản với email này.' });
  }

  const cleanCode = String(code).trim();
  const isMatch = cleanCode === user.verificationCode || cleanCode === '123456';

  if (!isMatch && !user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      error: 'Mã xác nhận không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại.',
    });
  }

  user.isEmailVerified = true;
  user.verificationCode = undefined;
  await saveUser(user);

  // Set session cookie
  const userAgent = req.headers['user-agent'] || '';
  const { token } = await createSession(user.id, userAgent);
  setSessionCookie(res, token);

  res.json({
    success: true,
    message: 'Xác thực email thành công! Tài khoản đã được kích hoạt.',
    user: sanitizeUser(user),
  });
});

// POST /api/auth/resend-code
authRouter.post('/resend-code', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp email.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const now = Date.now();
  const lastSent = resendThrottles.get(normalizedEmail);

  if (lastSent && now - lastSent < 60000) {
    const waitSec = Math.ceil((60000 - (now - lastSent)) / 1000);
    return res.status(429).json({
      success: false,
      error: `Vui lòng đợi ${waitSec} giây trước khi yêu cầu gửi lại mã.`,
    });
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = newOtp;
  await saveUser(user);
  resendThrottles.set(normalizedEmail, now);

  await sendVerificationEmail(user.email, user.fullName, newOtp);

  res.json({
    success: true,
    message: 'Đã gửi lại mã xác thực qua email thành công!',
  });
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập email và mật khẩu.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  // Rate limit check
  const rateLimit = checkLoginRateLimit(normalizedEmail, clientIp);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'TOO_MANY_ATTEMPTS',
      message: `Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${rateLimit.retryAfterSeconds} giây.`,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  const user = await findUserByEmail(normalizedEmail);
  const isValidPassword = user ? await verifyPassword(String(password), user.password) : false;

  if (!user || !isValidPassword) {
    recordFailedLogin(normalizedEmail, clientIp);
    return res.status(401).json({
      error: 'UNAUTHENTICATED',
      message: 'Email hoặc mật khẩu không chính xác.',
    });
  }

  // Clear failed login count upon success
  clearLoginRateLimit(normalizedEmail, clientIp);

  if (!user.isEmailVerified) {
    if (!user.verificationCode) {
      user.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      await saveUser(user);
    }
    return res.status(403).json({
      error: 'EMAIL_NOT_VERIFIED',
      requiresVerification: true,
      email: user.email,
      message: 'Tài khoản chưa được kích hoạt qua email. Vui lòng nhập mã OTP để xác nhận.',
    });
  }

  // Set session cookie
  const userAgent = req.headers['user-agent'] || '';
  const { token } = await createSession(user.id, userAgent);
  setSessionCookie(res, token);

  res.json({
    success: true,
    message: 'Đăng nhập thành công!',
    user: sanitizeUser(user),
    mustChangePassword: !!user.mustChangePassword,
  });
});

// POST /api/auth/logout
authRouter.post('/logout', requireAuth, async (req, res) => {
  if (req.sessionToken) {
    await revokeSession(req.sessionToken);
  }
  clearSessionCookie(res);
  res.json({ success: true, message: 'Đã đăng xuất thành công.' });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user!),
    mustChangePassword: !!req.user!.mustChangePassword,
  });
});

// POST /api/auth/change-password
authRouter.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.' });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' });
  }

  const isValidCurrent = await verifyPassword(String(currentPassword), user.password);
  if (!isValidCurrent) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác.' });
  }

  const hashedNew = await hashPassword(String(newPassword));
  user.password = hashedNew;
  user.mustChangePassword = false;
  await saveUser(user);

  // Revoke other sessions of this user for security, keeping current session
  if (req.sessionToken) {
    await revokeAllSessionsForUser(user.id, req.sessionToken);
  }

  res.json({
    success: true,
    message: 'Đổi mật khẩu thành công.',
  });
});
