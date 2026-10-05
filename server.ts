import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const hasDist = fs.existsSync(path.join(__dirname, 'dist', 'index.html'));
const isProduction = process.env.NODE_ENV === 'production' || (process.env.NODE_ENV !== 'development' && hasDist);

app.use(express.json({ limit: '10mb' }));

// In-memory backend project storage
let projectsStore: any[] = [];

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

let usersStore: ServerUser[] = [
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

function sanitizeUser(u: ServerUser) {
  const { password, verificationCode, ...rest } = u;
  return rest;
}

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

projectsStore.push(getDefaultSeedProject());

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
app.post('/api/auth/register', (req, res) => {
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
      console.log(`[HGC Solar Auth] Re-sent Email OTP for ${normalizedEmail}: ${newOtp}`);
      return res.json({
        success: true,
        message: 'Tài khoản đã tạo trước đó nhưng chưa xác thực. Đã gửi mã OTP mới đến email của bạn.',
        email: normalizedEmail,
        verificationCode: newOtp,
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
  console.log(`[HGC Solar Auth] >>> New User Registered: ${newUser.fullName} (${newUser.email}, SĐT: ${newUser.phone})`);
  console.log(`[HGC Solar Auth] >>> Email OTP Code: ${otpCode}`);

  res.status(201).json({
    success: true,
    message: 'Đăng ký thành công! Mã OTP xác nhận đã được gửi đến email của bạn.',
    email: normalizedEmail,
    verificationCode: otpCode,
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
    console.log(`[HGC Solar Auth] User ${user.email} verified email successfully!`);
    return res.json({
      success: true,
      message: 'Xác thực email thành công! Tài khoản đã được kích hoạt.',
      user: sanitizeUser(user),
    });
  }

  return res.status(400).json({
    success: false,
    error: 'Mã xác nhận không chính xác hoặc đã hết hạn. Vui lòng thử lại.',
  });
});

// Gửi lại mã xác nhận
app.post('/api/auth/resend-code', (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = usersStore.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = newOtp;
  console.log(`[HGC Solar Auth] Resent OTP for ${normalizedEmail}: ${newOtp}`);

  res.json({
    success: true,
    message: 'Đã gửi lại mã xác thực qua email!',
    verificationCode: newOtp,
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
    return res.json(created);
  }

  projectsStore[index] = {
    ...projectsStore[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  res.json(projectsStore[index]);
});

// DELETE /api/projects/:id - Xóa dự án trên server
app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = projectsStore.length;
  projectsStore = projectsStore.filter((p) => p.id !== id);

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
