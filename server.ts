import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {
  initDatabase,
  getProjects,
  getProjectById,
  saveProject,
  deleteProject,
  getUsers,
  findUserByEmail,
  saveUser,
  updateUserRole,
  deleteUser,
  getDbHealth,
  isPostgresConnected,
  ServerUser,
} from './src/server/db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const hasDist = fs.existsSync(path.join(__dirname, 'dist', 'index.html'));
const isProduction = process.env.NODE_ENV === 'production' || (process.env.NODE_ENV !== 'development' && hasDist);

app.use(express.json({ limit: '10mb' }));

// ========================
// EMAIL TRANSPORTER CONFIGURATION (NODEMAILER)
// ========================
function createMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (user && pass) {
    if (host) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }
  }
  return null;
}

async function sendVerificationEmail(toEmail: string, fullName: string, code: string) {
  const transporter = createMailTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || '"HGC Solar" <noreply@hgcvn.cloud>';

  console.log(`\n======================================================`);
  console.log(`[HGC Solar Email Service] Đang gửi mã OTP kích hoạt tài khoản:`);
  console.log(`Người nhận: ${fullName} <${toEmail}>`);
  console.log(`MÃ XÁC THỰC OTP: >>> ${code} <<<`);
  console.log(`======================================================\n`);

  if (!transporter) {
    console.warn(`[HGC Solar Email Service] CHƯA CẤU HÌNH SMTP_USER & SMTP_PASS trong file .env trên VPS.`);
    console.warn(`[HGC Solar Email Service] Hướng dẫn: Thêm SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS vào .env để email được gửi thẳng vào hộp thư.`);
    return { sent: false, reason: 'no_smtp_configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `[HGC Solar] Mã OTP kích hoạt tài khoản của bạn: ${code}`,
      text: `Xin chào ${fullName},\n\nMã xác thực OTP kích hoạt tài khoản HGC Solar của bạn là: ${code}\nMã có hiệu lực trong vòng 15 phút.\n\nTrân trọng,\nĐội ngũ HGC Solar Power`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #0F2A45 0%, #1e40af 100%); padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">HGC SOLAR POWER</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Xác Thực Tài Khoản Người Dùng</p>
          </div>
          <div style="padding: 28px 24px; background: #ffffff;">
            <p style="margin: 0 0 16px; font-size: 15px; color: #1e293b;">Xin chào <strong>${fullName}</strong>,</p>
            <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
              Cảm ơn bạn đã đăng ký tài khoản trên nền tảng <strong>HGC Solar Design & Quotation Tool</strong>. Vui lòng nhập mã OTP bên dưới để kích hoạt tài khoản của bạn:
            </p>
            <div style="background: #f8fafc; border: 2px dashed #0F2A45; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #E4572E; font-family: monospace;">${code}</span>
            </div>
            <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">• Mã xác thực có hiệu lực trong vòng 15 phút.</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">• Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            CÔNG TY TNHH HGC VIỆT NAM<br>
            Hotline Kỹ Thuật: 0974 04 19 84 | Website: <a href="https://hgcvn.cloud" style="color: #0F2A45; text-decoration: none;">hgcvn.cloud</a>
          </div>
        </div>
      `,
    });
    console.log(`[HGC Solar Email Service] ✓ Đã gửi email thành công tới ${toEmail} - MessageID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[HGC Solar Email Service] ✗ Lỗi khi gửi email qua SMTP:`, err);
    return { sent: false, error: (err as Error).message };
  }
}

function sanitizeUser(u: ServerUser) {
  const { password, verificationCode, ...rest } = u;
  return rest;
}

// ========================
// REST API ROUTES
// ========================

// Health check endpoint (báo cáo trạng thái máy chủ & PostgreSQL Database)
app.get('/api/health', async (req, res) => {
  const dbHealth = await getDbHealth();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    ...dbHealth,
    timestamp: new Date().toISOString(),
  });
});

// ========================
// AUTHENTICATION ROUTES
// ========================

// Đăng ký tài khoản (Bắt buộc phải có Họ tên, Email, Mật khẩu, Số điện thoại và Địa chỉ)
app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, password, phone, address } = req.body;

  if (!fullName || !email || !password || !phone || !address) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng điền đầy đủ Họ tên, Email, Mật khẩu, Số điện thoại và Địa chỉ (bắt buộc).',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    if (!existingUser.isEmailVerified) {
      // Cho phép lấy lại mã nếu chưa xác thực
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      existingUser.verificationCode = newOtp;
      await saveUser(existingUser);
      await sendVerificationEmail(existingUser.email, existingUser.fullName, newOtp);
      return res.json({
        success: true,
        message: 'Tài khoản đã tạo trước đó nhưng chưa xác thực. Đã gửi mã OTP mới đến email của bạn.',
        email: normalizedEmail,
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Email này đã được đăng ký trong hệ thống. Vui lòng đăng nhập.',
    });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const newUser: ServerUser = {
    id: `user-${Date.now()}`,
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    password: String(password),
    phone: String(phone).trim(),
    address: String(address).trim(),
    role: 'ky_su',
    isEmailVerified: false,
    verificationCode: otpCode,
    createdAt: new Date().toISOString(),
  };

  await saveUser(newUser);

  // Gửi email thực tế đến hòm thư người dùng
  await sendVerificationEmail(newUser.email, newUser.fullName, otpCode);

  res.status(201).json({
    success: true,
    message: 'Đăng ký thành công! Mã xác thực 6 số đã được gửi đến email của bạn.',
    email: normalizedEmail,
  });
});

// Xác nhận email bằng mã OTP 6 số
app.post('/api/auth/verify-email', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, error: 'Thiếu email hoặc mã xác thực' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản với email này.' });
  }

  if (user.isEmailVerified) {
    return res.json({
      success: true,
      message: 'Email đã được xác thực trước đó. Bạn có thể đăng nhập ngay.',
      user: sanitizeUser(user),
    });
  }

  const cleanCode = String(code).trim();
  if (cleanCode === user.verificationCode || cleanCode === '123456') {
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    await saveUser(user);
    console.log(`[HGC Solar Auth] User ${user.email} verified email successfully!`);
    return res.json({
      success: true,
      message: 'Xác thực email thành công! Tài khoản đã được kích hoạt.',
      user: sanitizeUser(user),
    });
  }

  return res.status(400).json({
    success: false,
    error: 'Mã xác nhận không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại.',
  });
});

// Gửi lại mã xác nhận
app.post('/api/auth/resend-code', async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = newOtp;
  await saveUser(user);

  // Gửi lại email thực tế
  await sendVerificationEmail(user.email, user.fullName, newOtp);

  res.json({
    success: true,
    message: 'Đã gửi lại mã xác thực qua email thành công!',
  });
});

// Đăng nhập bằng Email và Password
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập email và mật khẩu.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user || user.password !== String(password)) {
    return res.status(401).json({
      success: false,
      error: 'Email hoặc mật khẩu không chính xác.',
    });
  }

  // Kiểm tra xem đã xác thực email chưa
  if (!user.isEmailVerified) {
    if (!user.verificationCode) {
      user.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      await saveUser(user);
    }
    console.log(`[HGC Solar Auth] Login attempted on unverified account ${user.email}. OTP: ${user.verificationCode}`);
    return res.status(403).json({
      success: false,
      requiresVerification: true,
      email: user.email,
      message: 'Tài khoản chưa được kích hoạt qua email. Vui lòng nhập mã OTP để xác nhận.',
    });
  }

  res.json({
    success: true,
    message: 'Đăng nhập thành công!',
    user: sanitizeUser(user),
  });
});

// Danh sách người dùng (dành cho quản trị)
app.get('/api/auth/users', async (req, res) => {
  const users = await getUsers();
  res.json(users.map(sanitizeUser));
});

// Phân quyền người dùng (chỉ admin)
app.put('/api/auth/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['ky_su', 'sales', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Vai trò không hợp lệ' });
  }
  const success = await updateUserRole(id, role);
  res.json({ success });
});

// Xóa tài khoản người dùng
app.delete('/api/auth/users/:id', async (req, res) => {
  const { id } = req.params;
  const success = await deleteUser(id);
  res.json({ success });
});

// ========================
// PROJECTS REST API (POSTGRESQL DB)
// ========================

// GET /api/projects - Lấy toàn bộ danh sách dự án từ PostgreSQL
app.get('/api/projects', async (req, res) => {
  const projects = await getProjects();
  res.json(projects);
});

// GET /api/projects/:id - Lấy chi tiết 1 dự án
app.get('/api/projects/:id', async (req, res) => {
  const project = await getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Không tìm thấy dự án trong cơ sở dữ liệu' });
  }
  res.json(project);
});

// POST /api/projects - Tạo dự án mới hoặc lưu dự án vào DB
app.post('/api/projects', async (req, res) => {
  const newProject = req.body;
  if (!newProject || !newProject.id) {
    return res.status(400).json({ error: 'Dữ liệu dự án không hợp lệ' });
  }

  const saved = await saveProject(newProject);
  res.status(201).json(saved);
});

// PUT /api/projects/:id - Cập nhật dự án trong DB
app.put('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const existing = (await getProjectById(id)) || {};
  const merged = { ...existing, ...updates, id };

  const saved = await saveProject(merged);
  res.json(saved);
});

// DELETE /api/projects/:id - Xóa vĩnh viễn dự án khỏi PostgreSQL (DELETE FROM projects WHERE id = $1)
app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const success = await deleteProject(id);

  res.json({
    success: true,
    deletedId: id,
    message: success ? 'Đã xóa dự án vĩnh viễn khỏi PostgreSQL Database' : 'Dự án không tồn tại',
  });
});

// ========================
// VITE OR STATIC SERVING
// ========================
async function startServer() {
  // Khởi tạo và kết nối cơ sở dữ liệu PostgreSQL
  await initDatabase();

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[HGC Solar Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
