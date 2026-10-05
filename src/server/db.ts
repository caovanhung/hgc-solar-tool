import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

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

// Fallback JSON storage if PostgreSQL is not yet configured on VPS
const DATA_DIR = path.resolve(process.cwd(), 'data_storage');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

let pool: pg.Pool | null = null;
let pgConnected = false;

// In-memory fallback stores
let fallbackUsers: ServerUser[] = loadFallbackUsers();
let fallbackProjects: any[] = loadFallbackProjects();

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

export function isPostgresConnected(): boolean {
  return pgConnected;
}

export async function initDatabase(): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('[HGC Solar DB] Chưa tìm thấy biến DATABASE_URL trong .env -> Đang dùng chế độ lưu trữ File JSON dự phòng.');
    console.log('[HGC Solar DB] Để kích hoạt PostgreSQL: Cài PostgreSQL trên VPS và thêm DATABASE_URL="postgres://user:pass@localhost:5432/hgc_solar" vào file .env');
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

    // 1. Tạo bảng users nếu chưa tồn tại
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

    // 2. Tạo bảng projects nếu chưa tồn tại
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        address TEXT DEFAULT '',
        status VARCHAR(50) DEFAULT 'saved',
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
    `);

    // 3. Khởi tạo tài khoản Quản trị viên mặc định nếu chưa có
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

    client.release();
    pgConnected = true;
    console.log('[HGC Solar DB] ✓ Cấu trúc bảng PostgreSQL (users, projects) đã sẵn sàng hoạt động.');
    return true;
  } catch (error) {
    console.error('[HGC Solar DB] ✗ Không thể kết nối tới PostgreSQL:', (error as Error).message);
    console.log('[HGC Solar DB] -> Tự động chuyển về chế độ lưu trữ File JSON an toàn.');
    pgConnected = false;
    return false;
  }
}

// ==========================================
// THAO TÁC CƠ SỞ DỮ LIỆU: DỰ ÁN (PROJECTS)
// ==========================================

export async function getProjects(): Promise<any[]> {
  if (pgConnected && pool) {
    try {
      const res = await pool.query('SELECT data FROM projects ORDER BY updated_at DESC');
      return res.rows.map((r) => r.data);
    } catch (err) {
      console.error('[DB Error] getProjects:', err);
    }
  }
  return fallbackProjects;
}

export async function getProjectById(id: string): Promise<any | null> {
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

export async function saveProject(project: any): Promise<any> {
  const { id, name, customerName, phone, address, status } = project;
  const projectData = {
    ...project,
    updatedAt: new Date().toISOString(),
  };

  if (pgConnected && pool) {
    try {
      await pool.query(
        `
        INSERT INTO projects (id, name, customer_name, phone, address, status, data, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          customer_name = EXCLUDED.customer_name,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          status = EXCLUDED.status,
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
          JSON.stringify(projectData),
        ]
      );
      return projectData;
    } catch (err) {
      console.error('[DB Error] saveProject to PG:', err);
    }
  }

  // Fallback
  const idx = fallbackProjects.findIndex((p) => p.id === id);
  if (idx >= 0) {
    fallbackProjects[idx] = projectData;
  } else {
    fallbackProjects.unshift(projectData);
  }
  saveFallbackProjects(fallbackProjects);
  return projectData;
}

export async function deleteProject(id: string): Promise<boolean> {
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

// ==========================================
// THAO TÁC CƠ SỞ DỮ LIỆU: NGƯỜI DÙNG (USERS)
// ==========================================

export async function getUsers(): Promise<ServerUser[]> {
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

export async function findUserByEmail(email: string): Promise<ServerUser | null> {
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

export async function saveUser(user: ServerUser): Promise<ServerUser> {
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

export async function updateUserRole(id: string, role: string): Promise<boolean> {
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

export async function deleteUser(id: string): Promise<boolean> {
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

export async function getDbHealth() {
  let projectsCount = 0;
  let usersCount = 0;

  if (pgConnected && pool) {
    try {
      const pRes = await pool.query('SELECT COUNT(*) AS count FROM projects');
      projectsCount = Number(pRes.rows[0]?.count || 0);

      const uRes = await pool.query('SELECT COUNT(*) AS count FROM users');
      usersCount = Number(uRes.rows[0]?.count || 0);

      return {
        database: 'PostgreSQL',
        connected: true,
        projectsCount,
        usersCount,
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
  };
}
