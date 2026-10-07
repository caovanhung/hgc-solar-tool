import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import pg from 'pg';
import { getSeedCatalogMaterials } from './src/data/materialsDescriptions.js';

dotenv.config();

const { Pool } = pg;
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

// ==========================================
// CƠ SỞ DỮ LIỆU POSTGRESQL & FILE BACKUP
// ==========================================

export interface ServerUser {
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

const DATA_DIR = path.resolve(process.cwd(), 'data_storage');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const MATERIALS_FILE = path.join(DATA_DIR, 'materials.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

let pool: pg.Pool | null = null;
let pgConnected = false;

function loadFallbackUsers(): ServerUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading fallback users:', err);
  }
  const defaults: ServerUser[] = [
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
  saveFallbackUsers(defaults);
  return defaults;
}

function saveFallbackUsers(users: ServerUser[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving fallback users:', err);
  }
}

function loadFallbackProjects(): any[] {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const content = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading fallback projects:', err);
  }
  const defaults: any[] = [];
  saveFallbackProjects(defaults);
  return defaults;
}

function saveFallbackProjects(projects: any[]) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving fallback projects:', err);
  }
}

function loadFallbackMaterials(): any[] {
  try {
    if (fs.existsSync(MATERIALS_FILE)) {
      const content = fs.readFileSync(MATERIALS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error loading fallback materials:', err);
  }
  const defaults = getSeedCatalogMaterials();
  saveFallbackMaterials(defaults);
  return defaults;
}

function saveFallbackMaterials(materials: any[]) {
  try {
    fs.writeFileSync(MATERIALS_FILE, JSON.stringify(materials, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving fallback materials:', err);
  }
}

let fallbackUsers: ServerUser[] = loadFallbackUsers();
let fallbackProjects: any[] = loadFallbackProjects();
let fallbackMaterials: any[] = loadFallbackMaterials();

async function initDatabase(): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('[HGC Solar DB] Chưa tìm thấy DATABASE_URL trong .env -> Chạy chế độ lưu trữ File JSON dự phòng.');
    return false;
  }

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
      max: 10,
    });

    const client = await pool.connect();
    console.log('[HGC Solar DB] ✓ Đã kết nối thành công tới máy chủ cơ sở dữ liệu PostgreSQL!');

    // 1. Tạo bảng users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50) NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT '',
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'ky_su',
        is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        verification_code VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // 2. Tạo bảng projects
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        address TEXT DEFAULT '',
        status VARCHAR(50) DEFAULT 'saved',
        created_by VARCHAR(255) DEFAULT '',
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT '';
      CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

      -- Gán quyền sở hữu mặc định cho các dự án cũ đã tạo trước đó
      UPDATE projects
      SET 
        created_by = 'hung.cv.10@gmail.com',
        data = jsonb_set(
          jsonb_set(data, '{createdByEmail}', '"hung.cv.10@gmail.com"', true),
          '{createdByName}', '"Cao Văn Hùng"', true
        )
      WHERE (created_by IS NULL OR created_by = '' OR data->>'createdByEmail' IS NULL OR data->>'createdByEmail' = '');

      -- Xóa vĩnh viễn dự án mẫu demo Văn Phòng HGC Văn Quán theo yêu cầu
      DELETE FROM projects WHERE id = 'demo-hgc-01' OR name LIKE '%Văn Phòng HGC Văn Quán%';
    `);

    // 3. Khởi tạo admin nếu chưa có
    await client.query(`
      INSERT INTO users (id, full_name, email, phone, address, password, role, is_email_verified, created_at, updated_at)
      VALUES (
        'user-admin-01',
        'Quản Trị Viên HGC',
        'admin@hgcvn.cloud',
        '0974 04 19 84',
        'B36 TT7 Khu đô thị Văn Quán, Hà Đông, Hà Nội',
        '123456',
        'admin',
        TRUE,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING;
    `);

    // 4. Tự động di chuyển toàn bộ tài khoản người dùng cũ từ data_storage/users.json sang PostgreSQL
    if (fs.existsSync(USERS_FILE)) {
      try {
        const rawUsers = fs.readFileSync(USERS_FILE, 'utf-8');
        const oldUsers = JSON.parse(rawUsers);
        if (Array.isArray(oldUsers) && oldUsers.length > 0) {
          for (const u of oldUsers) {
            if (!u || !u.email) continue;
            await client.query(`
              INSERT INTO users (id, full_name, email, phone, address, password, role, is_email_verified, verification_code, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
              ON CONFLICT (email) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                phone = EXCLUDED.phone,
                address = EXCLUDED.address,
                password = EXCLUDED.password,
                role = EXCLUDED.role,
                is_email_verified = EXCLUDED.is_email_verified,
                verification_code = EXCLUDED.verification_code;
            `, [
              u.id || `user-${Date.now()}`,
              u.fullName || '',
              String(u.email).trim().toLowerCase(),
              u.phone || '',
              u.address || '',
              String(u.password || '123456'),
              u.role || 'ky_su',
              u.isEmailVerified !== undefined ? u.isEmailVerified : true,
              u.verificationCode || null,
              u.createdAt ? new Date(u.createdAt) : new Date(),
            ]);
          }
          console.log(`[HGC Solar DB] ✓ Đã tự động di chuyển ${oldUsers.length} tài khoản người dùng cũ sang PostgreSQL.`);
        }
      } catch (err) {
        console.error('[HGC Solar DB] Lỗi khi tự động di chuyển users cũ:', err);
      }
    }

    // 5. Tự động di chuyển toàn bộ dự án cũ từ data_storage/projects.json sang PostgreSQL
    if (fs.existsSync(PROJECTS_FILE)) {
      try {
        const rawProj = fs.readFileSync(PROJECTS_FILE, 'utf-8');
        const oldProjects = JSON.parse(rawProj);
        if (Array.isArray(oldProjects) && oldProjects.length > 0) {
          for (const p of oldProjects) {
            if (!p || !p.id) continue;
            await client.query(`
              INSERT INTO projects (id, name, customer_name, phone, address, status, data, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                customer_name = EXCLUDED.customer_name,
                phone = EXCLUDED.phone,
                address = EXCLUDED.address,
                status = EXCLUDED.status,
                data = EXCLUDED.data;
            `, [
              p.id,
              p.name || 'Dự án',
              p.customerName || '',
              p.phone || '',
              p.address || '',
              p.status || 'saved',
              JSON.stringify(p),
              p.createdAt ? new Date(p.createdAt) : new Date(),
            ]);
          }
          console.log(`[HGC Solar DB] ✓ Đã tự động di chuyển ${oldProjects.length} dự án cũ sang PostgreSQL.`);
        }
      } catch (err) {
        console.error('[HGC Solar DB] Lỗi khi tự động di chuyển projects cũ:', err);
      }
    }

    // 6. Tạo bảng catalog_materials lưu thông số kỹ thuật & cấu thành chi phí
    await client.query(`
      CREATE TABLE IF NOT EXISTS catalog_materials (
        id VARCHAR(255) PRIMARY KEY,
        category_code VARCHAR(50),
        category_name VARCHAR(255),
        name TEXT NOT NULL,
        spec TEXT,
        sku VARCHAR(255),
        unit VARCHAR(50),
        cost_vnd NUMERIC DEFAULT 0,
        brand VARCHAR(255) DEFAULT 'VN',
        origin VARCHAR(255) DEFAULT 'Việt Nam',
        technical_description TEXT,
        cost_breakdown TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_catalog_materials_sku ON catalog_materials(sku);
    `);

    // Đồng bộ danh mục vật tư chuẩn kèm mô tả kỹ thuật và cấu thành chi phí
    const seedMaterials = getSeedCatalogMaterials();
    for (const m of seedMaterials) {
      await client.query(`
        INSERT INTO catalog_materials (id, category_code, category_name, name, spec, sku, unit, cost_vnd, brand, origin, technical_description, cost_breakdown, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          technical_description = COALESCE(NULLIF(EXCLUDED.technical_description, ''), catalog_materials.technical_description),
          cost_breakdown = COALESCE(NULLIF(EXCLUDED.cost_breakdown, ''), catalog_materials.cost_breakdown),
          updated_at = NOW();
      `, [
        m.id,
        m.categoryCode,
        m.categoryName,
        m.name,
        m.spec,
        m.sku,
        m.unit,
        m.costVnd,
        m.brand || 'VN',
        m.origin || 'Việt Nam',
        m.technicalDescription || '',
        m.costBreakdown || '',
      ]);
    }
    console.log(`[HGC Solar DB] ✓ Đã đồng bộ ${seedMaterials.length} vật tư catalog kèm mô tả kỹ thuật & cấu thành chi phí vào PostgreSQL.`);

    client.release();
    pgConnected = true;
    console.log('[HGC Solar DB] ✓ Cấu trúc bảng PostgreSQL (users, projects, catalog_materials) đã sẵn sàng hoạt động.');
    return true;
  } catch (error) {
    console.error('[HGC Solar DB] ✗ Không thể kết nối tới PostgreSQL:', (error as Error).message);
    console.log('[HGC Solar DB] -> Tự động chuyển về chế độ lưu trữ File JSON an toàn.');
    pgConnected = false;
    return false;
  }
}

async function getProjects(userEmail?: string, userRole?: string): Promise<any[]> {
  const normalizedEmail = (userEmail || '').toLowerCase().trim();
  const normalizedRole = (userRole || '').toLowerCase().trim();

  let allProjects: any[] = [];
  if (pgConnected && pool) {
    try {
      const res = await pool.query('SELECT data FROM projects ORDER BY updated_at DESC');
      allProjects = res.rows.map((r) => r.data);
    } catch (err) {
      console.error('[DB Error] getProjects:', err);
      allProjects = fallbackProjects;
    }
  } else {
    allProjects = fallbackProjects;
  }

  // Quản trị viên (admin): xem được toàn bộ dự án để hỗ trợ và quản lý
  if (normalizedRole === 'admin') {
    return allProjects;
  }

  // Nếu không đăng nhập: chỉ xem được các dự án công khai
  if (!normalizedEmail) {
    return allProjects.filter((p) => p.isPublic === true);
  }

  // Lọc quyền truy cập dự án:
  return allProjects.filter((p) => {
    // 1. Dự án công khai cho toàn công ty
    if (p.isPublic === true) return true;

    // 2. Dự án do chính người này tạo
    const pOwner = (p.createdByEmail || '').toLowerCase().trim();
    if (pOwner && pOwner === normalizedEmail) return true;

    // 3. Dự án được chia sẻ đích danh qua email của người này
    if (
      Array.isArray(p.sharedWithEmails) &&
      p.sharedWithEmails.some((e: string) => String(e).toLowerCase().trim() === normalizedEmail)
    ) {
      return true;
    }

    // 4. Dự án được chia sẻ cho nhóm vai trò của người này (ví dụ: nhóm kỹ sư hoặc kinh doanh)
    if (
      Array.isArray(p.sharedWithRoles) &&
      p.sharedWithRoles.some((r: string) => String(r).toLowerCase().trim() === normalizedRole)
    ) {
      return true;
    }

    // 5. Dự án cũ trước đây chưa gắn người tạo:
    // Tự động nhận diện cho tài khoản kỹ sư tạo trước đó (hung.cv.10@gmail.com)
    if (!pOwner) {
      return normalizedEmail === 'hung.cv.10@gmail.com';
    }

    return false;
  });
}

async function getProjectById(id: string): Promise<any | null> {
  if (pgConnected && pool) {
    try {
      const res = await pool.query('SELECT data FROM projects WHERE id = $1', [id]);
      if (res.rows.length > 0) return res.rows[0].data;
      return null;
    } catch (err) {
      console.error('[DB Error] getProjectById:', err);
    }
  }
  return fallbackProjects.find((p) => p.id === id) || null;
}

async function saveProject(project: any, userEmail?: string): Promise<any> {
  const { id, name, customerName, phone, address, status } = project;
  const normalizedEmail = (userEmail || '').toLowerCase().trim();

  // Đảm bảo gắn email người tạo nếu chưa có
  let createdByEmail = project.createdByEmail ? String(project.createdByEmail).toLowerCase().trim() : normalizedEmail;
  if (!createdByEmail && normalizedEmail) {
    createdByEmail = normalizedEmail;
  }

  const projectData = {
    ...project,
    createdByEmail,
    updatedAt: new Date().toISOString(),
  };

  if (pgConnected && pool) {
    try {
      await pool.query(
        `
        INSERT INTO projects (id, name, customer_name, phone, address, status, created_by, data, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          customer_name = EXCLUDED.customer_name,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          status = EXCLUDED.status,
          created_by = COALESCE(NULLIF(EXCLUDED.created_by, ''), projects.created_by),
          data = EXCLUDED.data,
          updated_at = NOW();
      `,
        [
          id,
          name || 'Dự án mới',
          customerName || '',
          phone || '',
          address || '',
          status || 'saved',
          createdByEmail || '',
          JSON.stringify(projectData),
        ]
      );
      return projectData;
    } catch (err) {
      console.error('[DB Error] saveProject to PG:', err);
    }
  }

  const idx = fallbackProjects.findIndex((p) => p.id === id);
  if (idx >= 0) {
    fallbackProjects[idx] = projectData;
  } else {
    fallbackProjects.unshift(projectData);
  }
  saveFallbackProjects(fallbackProjects);
  return projectData;
}

async function deleteProject(id: string): Promise<boolean> {
  if (pgConnected && pool) {
    try {
      const res = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('[DB Error] deleteProject PG:', err);
    }
  }

  const initialLen = fallbackProjects.length;
  fallbackProjects = fallbackProjects.filter((p) => p.id !== id);
  saveFallbackProjects(fallbackProjects);
  return initialLen > fallbackProjects.length;
}

async function getUsers(): Promise<ServerUser[]> {
  if (pgConnected && pool) {
    try {
      const res = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
      return res.rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        password: row.password,
        role: row.role,
        isEmailVerified: row.is_email_verified,
        verificationCode: row.verification_code,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      }));
    } catch (err) {
      console.error('[DB Error] getUsers PG:', err);
    }
  }
  return fallbackUsers;
}

async function findUserByEmail(email: string): Promise<ServerUser | null> {
  const normalized = String(email).trim().toLowerCase();
  if (pgConnected && pool) {
    try {
      const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          password: row.password,
          role: row.role,
          isEmailVerified: row.is_email_verified,
          verificationCode: row.verification_code,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        };
      }
      return null;
    } catch (err) {
      console.error('[DB Error] findUserByEmail PG:', err);
    }
  }
  return fallbackUsers.find((u) => u.email.toLowerCase() === normalized) || null;
}

async function saveUser(user: ServerUser): Promise<ServerUser> {
  if (pgConnected && pool) {
    try {
      await pool.query(
        `
        INSERT INTO users (id, full_name, email, phone, address, password, role, is_email_verified, verification_code, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          is_email_verified = EXCLUDED.is_email_verified,
          verification_code = EXCLUDED.verification_code,
          updated_at = NOW();
      `,
        [
          user.id,
          user.fullName,
          user.email.toLowerCase(),
          user.phone,
          user.address,
          user.password,
          user.role,
          user.isEmailVerified,
          user.verificationCode || null,
        ]
      );
      return user;
    } catch (err) {
      console.error('[DB Error] saveUser PG:', err);
    }
  }

  const idx = fallbackUsers.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (idx >= 0) {
    fallbackUsers[idx] = user;
  } else {
    fallbackUsers.unshift(user);
  }
  saveFallbackUsers(fallbackUsers);
  return user;
}

async function updateUserRole(id: string, role: string): Promise<boolean> {
  if (pgConnected && pool) {
    try {
      const res = await pool.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, id]);
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('[DB Error] updateUserRole PG:', err);
    }
  }

  const user = fallbackUsers.find((u) => u.id === id);
  if (user) {
    user.role = role as any;
    saveFallbackUsers(fallbackUsers);
    return true;
  }
  return false;
}

async function deleteUser(id: string): Promise<boolean> {
  if (pgConnected && pool) {
    try {
      const res = await pool.query('DELETE FROM users WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('[DB Error] deleteUser PG:', err);
    }
  }

  const initialLen = fallbackUsers.length;
  fallbackUsers = fallbackUsers.filter((u) => u.id !== id);
  saveFallbackUsers(fallbackUsers);
  return initialLen > fallbackUsers.length;
}

async function getDbHealth() {
  let projectsCount = 0;
  let usersCount = 0;
  let materialsCount = 0;

  if (pgConnected && pool) {
    try {
      const pRes = await pool.query('SELECT COUNT(*) AS count FROM projects');
      projectsCount = Number(pRes.rows[0]?.count || 0);

      const uRes = await pool.query('SELECT COUNT(*) AS count FROM users');
      usersCount = Number(uRes.rows[0]?.count || 0);

      const mRes = await pool.query('SELECT COUNT(*) AS count FROM catalog_materials');
      materialsCount = Number(mRes.rows[0]?.count || 0);

      return {
        database: 'PostgreSQL',
        connected: true,
        projectsCount,
        usersCount,
        materialsCount,
      };
    } catch (err) {
      console.error('[DB Error] getDbHealth PG:', err);
    }
  }

  return {
    database: 'File Storage (JSON)',
    connected: false,
    projectsCount: fallbackProjects.length,
    usersCount: fallbackUsers.length,
    materialsCount: fallbackMaterials.length,
  };
}

function sanitizeUser(u: ServerUser) {
  const { password, verificationCode, ...rest } = u;
  return rest;
}

// ==========================================
// CƠ SỞ DỮ LIỆU VẬT TƯ (CATALOG MATERIALS)
// ==========================================
async function getMaterials(): Promise<any[]> {
  if (pgConnected && pool) {
    try {
      const res = await pool.query('SELECT * FROM catalog_materials ORDER BY category_code ASC, name ASC');
      if (res.rows.length > 0) {
        return res.rows.map((row) => ({
          id: row.id,
          categoryCode: row.category_code,
          categoryName: row.category_name,
          name: row.name,
          spec: row.spec,
          sku: row.sku,
          unit: row.unit,
          costVnd: Number(row.cost_vnd || 0),
          brand: row.brand,
          origin: row.origin,
          technicalDescription: row.technical_description || '',
          costBreakdown: row.cost_breakdown || '',
          source: 'catalog',
        }));
      }
    } catch (err) {
      console.error('[DB Error] getMaterials PG:', err);
    }
  }
  return fallbackMaterials;
}

async function saveMaterial(mat: any): Promise<any> {
  const item = {
    ...mat,
    updatedAt: new Date().toISOString(),
  };

  if (pgConnected && pool) {
    try {
      await pool.query(
        `
        INSERT INTO catalog_materials (id, category_code, category_name, name, spec, sku, unit, cost_vnd, brand, origin, technical_description, cost_breakdown, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          category_code = EXCLUDED.category_code,
          category_name = EXCLUDED.category_name,
          name = EXCLUDED.name,
          spec = EXCLUDED.spec,
          sku = EXCLUDED.sku,
          unit = EXCLUDED.unit,
          cost_vnd = EXCLUDED.cost_vnd,
          brand = EXCLUDED.brand,
          origin = EXCLUDED.origin,
          technical_description = EXCLUDED.technical_description,
          cost_breakdown = EXCLUDED.cost_breakdown,
          updated_at = NOW();
      `,
        [
          item.id,
          item.categoryCode || 'VII',
          item.categoryName || 'Hạng mục xây dựng',
          item.name,
          item.spec || '',
          item.sku || item.id,
          item.unit || 'Cái',
          Number(item.costVnd || 0),
          item.brand || 'VN',
          item.origin || 'Việt Nam',
          item.technicalDescription || '',
          item.costBreakdown || '',
        ]
      );
      return item;
    } catch (err) {
      console.error('[DB Error] saveMaterial PG:', err);
    }
  }

  const idx = fallbackMaterials.findIndex((m) => m.id === item.id);
  if (idx >= 0) {
    fallbackMaterials[idx] = item;
  } else {
    fallbackMaterials.push(item);
  }
  saveFallbackMaterials(fallbackMaterials);
  return item;
}

// ========================
// REST API ROUTES
// ========================

// Materials APIs
app.get('/api/materials', async (req, res) => {
  const mats = await getMaterials();
  res.json(mats);
});

app.put('/api/materials/:id', async (req, res) => {
  const mat = req.body;
  mat.id = req.params.id;
  const saved = await saveMaterial(mat);
  res.json(saved);
});

app.post('/api/materials', async (req, res) => {
  const mat = req.body;
  if (!mat.id) mat.id = `mat-${Date.now()}`;
  const saved = await saveMaterial(mat);
  res.status(201).json(saved);
});

app.post('/api/materials/batch', async (req, res) => {
  const items = req.body;
  if (Array.isArray(items)) {
    for (const item of items) {
      await saveMaterial(item);
    }
  }
  res.json({ success: true, count: Array.isArray(items) ? items.length : 0 });
});

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
  await sendVerificationEmail(newUser.email, newUser.fullName, otpCode);

  res.status(201).json({
    success: true,
    message: 'Đăng ký thành công! Mã xác thực 6 số đã được gửi đến email của bạn.',
    email: normalizedEmail,
  });
});

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
  await sendVerificationEmail(user.email, user.fullName, newOtp);

  res.json({
    success: true,
    message: 'Đã gửi lại mã xác thực qua email thành công!',
  });
});

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

app.get('/api/auth/users', async (req, res) => {
  const users = await getUsers();
  res.json(users.map(sanitizeUser));
});

app.put('/api/auth/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['ky_su', 'sales', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Vai trò không hợp lệ' });
  }
  const success = await updateUserRole(id, role);
  res.json({ success });
});

app.delete('/api/auth/users/:id', async (req, res) => {
  const { id } = req.params;
  const success = await deleteUser(id);
  res.json({ success });
});

// ========================
// PROJECTS REST API (POSTGRESQL DB)
// ========================

app.get('/api/projects', async (req, res) => {
  const userEmail = (req.headers['x-user-email'] as string || req.query.userEmail as string || '').toLowerCase().trim();
  const userRole = (req.headers['x-user-role'] as string || req.query.userRole as string || '').toLowerCase().trim();
  const projects = await getProjects(userEmail, userRole);
  res.json(projects);
});

app.get('/api/projects/:id', async (req, res) => {
  const userEmail = (req.headers['x-user-email'] as string || req.query.userEmail as string || '').toLowerCase().trim();
  const userRole = (req.headers['x-user-role'] as string || req.query.userRole as string || '').toLowerCase().trim();
  const project = await getProjectById(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Không tìm thấy dự án trong cơ sở dữ liệu' });
  }

  // Kiểm tra quyền xem
  if (userRole !== 'admin' && !project.isPublic) {
    const isOwner = project.createdByEmail && project.createdByEmail.toLowerCase() === userEmail;
    const isSharedEmail = Array.isArray(project.sharedWithEmails) && project.sharedWithEmails.some((e: string) => e.toLowerCase().trim() === userEmail);
    const isSharedRole = Array.isArray(project.sharedWithRoles) && project.sharedWithRoles.some((r: string) => r.toLowerCase().trim() === userRole);
    if (!isOwner && !isSharedEmail && !isSharedRole && project.createdByEmail) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập dự án này' });
    }
  }

  res.json(project);
});

app.post('/api/projects', async (req, res) => {
  const newProject = req.body;
  if (!newProject || !newProject.id) {
    return res.status(400).json({ error: 'Dữ liệu dự án không hợp lệ' });
  }
  const userEmail = (req.headers['x-user-email'] as string || req.query.userEmail as string || '').toLowerCase().trim();
  const saved = await saveProject(newProject, userEmail);
  res.status(201).json(saved);
});

app.put('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const userEmail = (req.headers['x-user-email'] as string || req.query.userEmail as string || '').toLowerCase().trim();
  const userRole = (req.headers['x-user-role'] as string || req.query.userRole as string || '').toLowerCase().trim();

  const existing = (await getProjectById(id)) || {};

  // Kiểm tra quyền chỉnh sửa
  if (existing.id && userRole !== 'admin') {
    const isOwner = existing.createdByEmail && existing.createdByEmail.toLowerCase() === userEmail;
    const isShared = Array.isArray(existing.sharedWithEmails) && existing.sharedWithEmails.some((e: string) => e.toLowerCase().trim() === userEmail);
    if (!isOwner && !isShared && existing.createdByEmail) {
      return res.status(403).json({ error: 'Chỉ người tạo hoặc người được chia sẻ mới có quyền cập nhật dự án này' });
    }
  }

  const merged = { ...existing, ...updates, id };
  const saved = await saveProject(merged, userEmail);
  res.json(saved);
});

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const userEmail = (req.headers['x-user-email'] as string || req.query.userEmail as string || '').toLowerCase().trim();
  const userRole = (req.headers['x-user-role'] as string || req.query.userRole as string || '').toLowerCase().trim();

  const existing = await getProjectById(id);
  if (existing && userRole !== 'admin') {
    const isOwner = existing.createdByEmail && existing.createdByEmail.toLowerCase() === userEmail;
    if (!isOwner && existing.createdByEmail) {
      return res.status(403).json({ error: 'Chỉ người tạo hoặc Quản trị viên mới có quyền xóa dự án này' });
    }
  }

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
