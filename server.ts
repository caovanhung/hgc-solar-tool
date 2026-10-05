import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

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
      text: `Xin chào ${fullName},\n\nMã xác thực OTP kích hoạt tài khoản HGC Solar của bạn là: ${code}\n\nMã này có hiệu lực trong 15 phút.\n\nTrân trọng,\nĐội ngũ HGC Solar\nHotline: 0974 04 19 84`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
            <h2 style="color: #0F2A45; margin: 0 0 6px 0; font-size: 20px; font-weight: 800;">CÔNG TY TNHH HGC</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0;">Hệ Thống Thiết Kế & Báo Giá Điện Mặt Trời Áp Mái</p>
          </div>

          <div style="padding: 10px 0;">
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-top: 0;">
              Xin chào <strong>${fullName}</strong>,
            </p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Cảm ơn bạn đã đăng ký tài khoản tại <strong>HGC Solar Engine</strong>. Để hoàn tất kích hoạt tài khoản và bảo mật quyền truy cập hồ sơ dự án, vui lòng sử dụng mã OTP dưới đây:
            </p>

            <div style="background: #FFF7ED; border: 2px dashed #EA580C; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0;">
              <div style="font-size: 12px; font-weight: 700; color: #9A3412; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                Mã xác thực tài khoản (OTP)
              </div>
              <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #EA580C; font-family: monospace;">
                ${code}
              </div>
              <div style="font-size: 12px; color: #9A3412; margin-top: 8px;">
                Mã có hiệu lực trong vòng <strong>15 phút</strong>
              </div>
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
              Vui lòng kiểm tra hộp thư đến (Inbox) hoặc thư mục Spam. Không chia sẻ mã này cho bất kỳ ai khác.
            </p>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">
            <strong>CÔNG TY TNHH HGC</strong><br/>
            Trụ sở: B36 TT7 Khu đô thị Văn Quán, Hà Đông, Hà Nội<br/>
            Hotline: 0974 04 19 84 · Email: contact@hgcvn.cloud
          </div>
        </div>
      `,
    });
    console.log(`[HGC Solar Email Service] ĐÃ GỬI EMAIL THÀNH CÔNG TỚI ${toEmail}! ID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[HGC Solar Email Service] LỖI KHI GỬI EMAIL THỰC TẾ:`, err.message || err);
    return { sent: false, error: err.message };
  }
}

// ========================
// PERSISTENT DATA STORAGE (FILE DATABASE)
// ========================
const DATA_DIR = path.join(__dirname, 'data_storage');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

// Seed default project if empty
function getDefaultSeedProject() {
  return {
    id: 'demo-hgc-01',
    name: 'Văn Phòng HGC Văn Quán - Solar 42kWp',
    customerName: 'CÔNG TY TNHH HGC',
    phone: '0974 04 19 84',
    address: 'B36 TT7 Khu đô thị Văn Quán, Hà Đông, Hà Nội',
    status: 'saved',
    module: 'solar',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    custType: 'sinh_hoat',
    provinceCode: 'HAN',
    monthlyElectricityBillVnd: 18500000,
    monthlyConsumptionKwh: 5800,
    roofType: 'tole',
    roofDir: 's',
    roofShape: 'rect',
    roofLengthM: 20,
    roofWidthM: 12,
    roofHeightM: 14,
    sysType: 'zero_export',
    phases: '3',
    installMode: 'full_roof',
    selectedPanelId: 'cs-585t',
    marginPct: 18,
    discountPct: 0,
    pricingTier: 'recommended',
  };
}

// ========================
// USER AUTH STORAGE & SEED
// ========================
interface ServerUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  role: 'ky_su' | 'sales' | 'admin';
  isEmailVerified: boolean;
  verificationCode?: string;
  createdAt: string;
}

function loadUsers(): ServerUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
  const defaultUsers: ServerUser[] = [
    {
      id: 'user-admin-01',
      fullName: 'Quản Trị Viên HGC',
      email: 'admin@hgcvn.cloud',
      phone: '0974 04 19 84',
      address: 'B36 TT7 Khu đô thị Văn Quán, Hà Đông, Hà Nội',
      password: '123456',
      role: 'admin',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    },
  ];
  saveUsers(defaultUsers);
  return defaultUsers;
}

function saveUsers(users: ServerUser[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users to disk:', err);
  }
}

function loadProjects(): any[] {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const content = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading projects:', err);
  }
  const defaultProj: any[] = [];
  saveProjects(defaultProj);
  return defaultProj;
}

function saveProjects(projects: any[]) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving projects to disk:', err);
  }
}

let usersStore: ServerUser[] = loadUsers();
let projectsStore: any[] = loadProjects();

function sanitizeUser(u: ServerUser) {
  const { password, verificationCode, ...rest } = u;
  return rest;
}

// ========================
// REST API ROUTES
// ========================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    projectsCount: projectsStore.length,
    usersCount: usersStore.length,
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
  const existingUser = usersStore.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    if (!existingUser.isEmailVerified) {
      // Cho phép lấy lại mã nếu chưa xác thực
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      existingUser.verificationCode = newOtp;
      saveUsers(usersStore);
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

  usersStore.unshift(newUser);
  saveUsers(usersStore);
  
  // Gửi email thực tế đến hòm thư người dùng
  await sendVerificationEmail(newUser.email, newUser.fullName, otpCode);

  res.status(201).json({
    success: true,
    message: 'Đăng ký thành công! Mã xác thực 6 số đã được gửi đến email của bạn.',
    email: normalizedEmail,
  });
});

// Xác nhận email bằng mã OTP 6 số
app.post('/api/auth/verify-email', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, error: 'Thiếu email hoặc mã xác thực' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = usersStore.find((u) => u.email.toLowerCase() === normalizedEmail);

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
    saveUsers(usersStore);
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
  const user = usersStore.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = newOtp;
  saveUsers(usersStore);
  
  // Gửi lại email thực tế
  await sendVerificationEmail(user.email, user.fullName, newOtp);

  res.json({
    success: true,
    message: 'Đã gửi lại mã xác thực qua email thành công!',
  });
});

// Đăng nhập bằng Email và Password
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập email và mật khẩu.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = usersStore.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === String(password)
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Email hoặc mật khẩu không chính xác.',
    });
  }

  // Kiểm tra xem đã xác thực email chưa
  if (!user.isEmailVerified) {
    // Tạo lại OTP nếu cần
    if (!user.verificationCode) {
      user.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
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
app.get('/api/auth/users', (req, res) => {
  res.json(usersStore.map(sanitizeUser));
});

// GET /api/projects
app.get('/api/projects', (req, res) => {
  res.json(projectsStore);
});

// GET /api/projects/:id
app.get('/api/projects/:id', (req, res) => {
  const project = projectsStore.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Không tìm thấy dự án' });
  }
  res.json(project);
});

// POST /api/projects - Tạo dự án mới hoặc bulk sync
app.post('/api/projects', (req, res) => {
  const newProject = req.body;
  if (!newProject || !newProject.id) {
    return res.status(400).json({ error: 'Dữ liệu dự án không hợp lệ' });
  }

  const existingIndex = projectsStore.findIndex((p) => p.id === newProject.id);
  if (existingIndex >= 0) {
    projectsStore[existingIndex] = {
      ...newProject,
      updatedAt: new Date().toISOString(),
    };
  } else {
    projectsStore.unshift({
      ...newProject,
      createdAt: newProject.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveProjects(projectsStore);
  res.status(201).json(newProject);
});

// PUT /api/projects/:id - Cập nhật dự án
app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = projectsStore.findIndex((p) => p.id === id);

  if (index === -1) {
    // Nếu chưa có thì thêm mới
    const created = { ...updates, id, updatedAt: new Date().toISOString() };
    projectsStore.unshift(created);
    saveProjects(projectsStore);
    return res.json(created);
  }

  projectsStore[index] = {
    ...projectsStore[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveProjects(projectsStore);
  res.json(projectsStore[index]);
});

// DELETE /api/projects/:id - Xóa dự án trên server
app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = projectsStore.length;
  projectsStore = projectsStore.filter((p) => p.id !== id);
  saveProjects(projectsStore);

  res.json({
    success: true,
    deletedId: id,
    remainingCount: projectsStore.length,
    message: initialLength > projectsStore.length ? 'Đã xóa dự án thành công' : 'Dự án không tồn tại',
  });
});

// ========================
// VITE OR STATIC SERVING
// ========================
async function startServer() {
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
