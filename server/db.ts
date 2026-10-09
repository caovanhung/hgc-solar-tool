import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import { hashPassword, isHashed } from './auth/password.js';
import { INITIAL_MATERIALS, INITIAL_PANELS, INITIAL_INVERTERS } from '../src/data/catalog.js';
import { getItemDescriptionAndCostBreakdown } from '../src/data/materialsDescriptions.js';

const { Pool } = pg;

export interface ServerUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  role: 'admin' | 'sales';
  isEmailVerified: boolean;
  verificationCode?: string;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SessionRecord {
  idHash: string; // sha256(token) hex
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
  userAgent: string;
}

export interface CatalogItemRecord {
  kind: 'material' | 'panel' | 'inverter';
  id: string;
  sku?: string;
  data: any;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
  updatedBy: string;
}

export interface PricingSettings {
  defaultMarginPct: number;
  defaultDiscountPct: number;
  canopyUnitCostVnd: number;
  transportCostVnd: number;
  installCostVndPerKwp: number;
}

export interface CatalogChangeRecord {
  id: number;
  kind: 'material' | 'panel' | 'inverter' | 'settings';
  itemId: string;
  action: 'seed' | 'create' | 'update' | 'deactivate' | 'reactivate';
  before: any | null;
  after: any | null;
  batchId?: string;
  changedBy: string;
  changedAt: string;
}

export const DEFAULT_PRICING: PricingSettings = {
  defaultMarginPct: 18,
  defaultDiscountPct: 0,
  canopyUnitCostVnd: 450000,
  transportCostVnd: 3500000,
  installCostVndPerKwp: 550000,
};

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data_storage');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

let pool: pg.Pool | null = null;
let isPg = false;

// Fallback in-memory session map for JSON mode
const memorySessions = new Map<string, SessionRecord>();

// Fallback memory state for JSON mode
interface JsonCatalogStore {
  items: CatalogItemRecord[];
  pricing: PricingSettings;
  pricingUpdatedAt: string;
  pricingUpdatedBy: string;
  changes: CatalogChangeRecord[];
  nextChangeId: number;
}

function loadJsonUsers(): ServerUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading fallback users:', err);
  }
  return [];
}

function saveJsonUsers(users: ServerUser[]) {
  try {
    const tempFile = `${USERS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf-8');
    fs.renameSync(tempFile, USERS_FILE);
  } catch (err) {
    console.error('Error saving fallback users:', err);
  }
}

function loadJsonProjects(): any[] {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const content = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading fallback projects:', err);
  }
  return [];
}

function saveJsonProjects(projects: any[]) {
  try {
    const tempFile = `${PROJECTS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(projects, null, 2), 'utf-8');
    fs.renameSync(tempFile, PROJECTS_FILE);
  } catch (err) {
    console.error('Error saving fallback projects:', err);
  }
}

function loadJsonCatalog(): JsonCatalogStore {
  try {
    if (fs.existsSync(CATALOG_FILE)) {
      const content = fs.readFileSync(CATALOG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.items)) return parsed;
    }
  } catch (err) {
    console.error('Error loading fallback catalog:', err);
  }
  return {
    items: [],
    pricing: { ...DEFAULT_PRICING },
    pricingUpdatedAt: new Date().toISOString(),
    pricingUpdatedBy: 'system',
    changes: [],
    nextChangeId: 1,
  };
}

function saveJsonCatalog(store: JsonCatalogStore) {
  try {
    const tempFile = `${CATALOG_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tempFile, CATALOG_FILE);
  } catch (err) {
    console.error('Error saving fallback catalog:', err);
  }
}

export function getPool(): pg.Pool | null {
  return pool;
}

export function isUsingPostgres(): boolean {
  return isPg;
}

export async function initDatabase(): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      pool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 5000,
        max: 10,
      });

      const client = await pool.connect();
      isPg = true;
      console.log('[HGC Solar DB] ✓ Kết nối thành công PostgreSQL!');

      // 1. Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(50) NOT NULL DEFAULT '',
          address TEXT NOT NULL DEFAULT '',
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'sales',
          is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
          verification_code VARCHAR(50),
          must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
      `);

      // Migration: ky_su -> sales
      await client.query(`
        UPDATE users SET role = 'sales' WHERE role = 'ky_su';
        ALTER TABLE users ALTER COLUMN role SET DEFAULT 'sales';
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','sales'));
      `);

      // 2. Sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id_hash CHAR(64) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL,
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          user_agent TEXT DEFAULT ''
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
      `);

      // 3. Projects table
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
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
      `);

      // Migration projects: sharedWithRoles ky_su -> sales
      await client.query(`
        UPDATE projects
        SET data = jsonb_set(
          data,
          '{sharedWithRoles}',
          (SELECT COALESCE(jsonb_agg(DISTINCT CASE WHEN r = 'ky_su' THEN 'sales' ELSE r END), '[]'::jsonb)
           FROM jsonb_array_elements_text(data->'sharedWithRoles') r)
        )
        WHERE data ? 'sharedWithRoles' AND data->'sharedWithRoles' @> '["ky_su"]';
      `);

      // 4. Catalog Tables (Part 2)
      await client.query(`
        CREATE TABLE IF NOT EXISTS catalog_items (
          kind VARCHAR(16) NOT NULL CHECK (kind IN ('material','panel','inverter')),
          id VARCHAR(255) NOT NULL,
          sku VARCHAR(255),
          data JSONB NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_by VARCHAR(255) NOT NULL DEFAULT '',
          PRIMARY KEY (kind, id)
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_material_sku
          ON catalog_items (lower(sku)) WHERE kind = 'material';

        CREATE TABLE IF NOT EXISTS pricing_settings (
          id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_by VARCHAR(255) NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS catalog_changes (
          id BIGSERIAL PRIMARY KEY,
          kind VARCHAR(16) NOT NULL,
          item_id VARCHAR(255) NOT NULL,
          action VARCHAR(16) NOT NULL CHECK (action IN ('seed','create','update','deactivate','reactivate')),
          before JSONB,
          after JSONB,
          batch_id UUID,
          changed_by VARCHAR(255) NOT NULL,
          changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_catalog_changes_item ON catalog_changes (kind, item_id, id DESC);
      `);

      // Migration: Hash unhashed passwords in PostgreSQL
      const unhashedUsers = await client.query(`SELECT id, password FROM users WHERE password NOT LIKE 'scrypt$%'`);
      for (const u of unhashedUsers.rows) {
        const hashed = await hashPassword(u.password);
        const mustChange = u.password === '123456';
        await client.query(`UPDATE users SET password = $1, must_change_password = $2 WHERE id = $3`, [
          hashed,
          mustChange,
          u.id,
        ]);
      }

      // Admin Seed if no admin exists
      const adminRes = await client.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
      if (adminRes.rowCount === 0) {
        const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || crypto.randomBytes(8).toString('hex');
        if (!process.env.ADMIN_INITIAL_PASSWORD) {
          console.log(`\n======================================================`);
          console.log(`[HGC Solar Security] KHỞI TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH:`);
          console.log(`Email: admin@hgcvn.cloud`);
          console.log(`Mật khẩu ngẫu nhiên: >>> ${initialPassword} <<<`);
          console.log(`Vui lòng đổi mật khẩu ngay sau khi đăng nhập!`);
          console.log(`======================================================\n`);
        }
        const hashedPassword = await hashPassword(initialPassword);
        await client.query(`
          INSERT INTO users (id, full_name, email, phone, address, password, role, is_email_verified, must_change_password)
          VALUES ($1, $2, $3, $4, $5, $6, 'admin', TRUE, TRUE)
          ON CONFLICT (email) DO UPDATE SET role = 'admin', password = $6, must_change_password = TRUE
        `, [
          'user-admin-01',
          'Quản Trị Viên HGC',
          'admin@hgcvn.cloud',
          '0974 04 19 84',
          'Hà Nội',
          hashedPassword,
        ]);
      }

      // Seed Catalog Items if empty
      const catalogCountRes = await client.query(`SELECT COUNT(*) FROM catalog_items`);
      if (parseInt(catalogCountRes.rows[0].count, 10) === 0) {
        console.log('[HGC Solar DB] Bảng catalog_items trống -> Tiến hành seed danh mục gốc từ catalog.ts...');
        await seedCatalogDb(client);
      } else {
        // Backfill missing descriptions in PostgreSQL
        const needDesc = await client.query(`
          SELECT kind, id, sku, data FROM catalog_items
          WHERE NOT (data ? 'technicalDescription') OR NOT (data ? 'costBreakdown')
        `);
        for (const row of needDesc.rows) {
          const d = { ...(row.data || {}) };
          const desc = getItemDescriptionAndCostBreakdown(row.id || row.sku, d.categoryCode || 'I', d.name || d.model);
          d.technicalDescription = d.technicalDescription || desc.technicalDescription;
          d.costBreakdown = d.costBreakdown || desc.costBreakdown;
          await client.query(`UPDATE catalog_items SET data = $1 WHERE kind = $2 AND id = $3`, [
            JSON.stringify(d),
            row.kind,
            row.id,
          ]);
        }
      }

      // Clean expired sessions
      await client.query(`DELETE FROM sessions WHERE expires_at < NOW()`);

      client.release();
      return true;
    } catch (err) {
      console.error('[HGC Solar DB] Lỗi khởi tạo PostgreSQL:', err);
      console.log('[HGC Solar DB] Chuyển sang chế độ lưu trữ JSON file dự phòng.');
      isPg = false;
    }
  } else {
    console.log('[HGC Solar DB] Không có DATABASE_URL -> Chạy chế độ JSON file.');
  }

  // Fallback JSON mode migration & seed
  await initJsonStore();
  return true;
}

async function seedCatalogDb(client: pg.PoolClient) {
  await client.query('BEGIN');
  try {
    let sortOrder = 0;

    // Materials
    for (const m of INITIAL_MATERIALS) {
      sortOrder++;
      await client.query(`
        INSERT INTO catalog_items (kind, id, sku, data, is_active, sort_order, updated_at, updated_by)
        VALUES ('material', $1, $2, $3, TRUE, $4, NOW(), 'system')
      `, [m.id, m.sku, JSON.stringify(m), sortOrder]);
    }

    // Panels
    for (const p of INITIAL_PANELS) {
      sortOrder++;
      await client.query(`
        INSERT INTO catalog_items (kind, id, sku, data, is_active, sort_order, updated_at, updated_by)
        VALUES ('panel', $1, NULL, $2, TRUE, $3, NOW(), 'system')
      `, [p.id, JSON.stringify(p), sortOrder]);
    }

    // Inverters
    for (const inv of INITIAL_INVERTERS) {
      sortOrder++;
      await client.query(`
        INSERT INTO catalog_items (kind, id, sku, data, is_active, sort_order, updated_at, updated_by)
        VALUES ('inverter', $1, NULL, $2, TRUE, $3, NOW(), 'system')
      `, [inv.id, JSON.stringify(inv), sortOrder]);
    }

    // Pricing settings
    await client.query(`
      INSERT INTO pricing_settings (id, data, updated_at, updated_by)
      VALUES (1, $1, NOW(), 'system')
      ON CONFLICT (id) DO UPDATE SET data = $1
    `, [JSON.stringify(DEFAULT_PRICING)]);

    // Catalog changes record for seed
    await client.query(`
      INSERT INTO catalog_changes (kind, item_id, action, before, after, changed_by, changed_at)
      VALUES ('material', 'seed-all', 'seed', NULL, $1, 'system', NOW())
    `, [JSON.stringify({ materials: INITIAL_MATERIALS.length, panels: INITIAL_PANELS.length, inverters: INITIAL_INVERTERS.length })]);

    await client.query('COMMIT');
    console.log(`[HGC Solar DB] ✓ Đã seed thành công ${INITIAL_MATERIALS.length} vật tư, ${INITIAL_PANELS.length} pin, ${INITIAL_INVERTERS.length} inverter vào PostgreSQL!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[HGC Solar DB] Lỗi khi seed catalog vào PostgreSQL:', err);
    throw err;
  }
}

async function initJsonStore() {
  const users = loadJsonUsers();
  let usersChanged = false;

  // Migrate roles and passwords
  for (const u of users) {
    if ((u.role as string) === 'ky_su') {
      u.role = 'sales';
      usersChanged = true;
    }
    if (!isHashed(u.password)) {
      if (u.password === '123456') u.mustChangePassword = true;
      u.password = await hashPassword(u.password);
      usersChanged = true;
    }
  }

  // Ensure default admin exists
  const hasAdmin = users.some((u) => u.role === 'admin');
  if (!hasAdmin) {
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || crypto.randomBytes(8).toString('hex');
    if (!process.env.ADMIN_INITIAL_PASSWORD) {
      console.log(`\n======================================================`);
      console.log(`[HGC Solar Security] KHỞI TẠO TÀI KHOẢN ADMIN JSON:`);
      console.log(`Email: admin@hgcvn.cloud`);
      console.log(`Mật khẩu ngẫu nhiên: >>> ${initialPassword} <<<`);
      console.log(`======================================================\n`);
    }
    const hashed = await hashPassword(initialPassword);
    users.push({
      id: 'user-admin-01',
      fullName: 'Quản Trị Viên HGC',
      email: 'admin@hgcvn.cloud',
      phone: '0974 04 19 84',
      address: 'Hà Nội',
      password: hashed,
      role: 'admin',
      isEmailVerified: true,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    });
    usersChanged = true;
  }

  if (usersChanged || users.length === 0) {
    saveJsonUsers(users);
  }

  // Migrate projects sharedWithRoles ky_su -> sales
  const projects = loadJsonProjects();
  let projectsChanged = false;
  for (const p of projects) {
    if (Array.isArray(p.sharedWithRoles) && p.sharedWithRoles.includes('ky_su')) {
      p.sharedWithRoles = Array.from(new Set(p.sharedWithRoles.map((r: string) => (r === 'ky_su' ? 'sales' : r))));
      projectsChanged = true;
    }
  }
  if (projectsChanged) saveJsonProjects(projects);

  // Seed JSON catalog if empty
  const catalogStore = loadJsonCatalog();
  if (!catalogStore.items || catalogStore.items.length === 0) {
    console.log('[HGC Solar DB] Seed danh mục gốc vào catalog.json...');
    let sortOrder = 0;
    const items: CatalogItemRecord[] = [];
    const now = new Date().toISOString();

    for (const m of INITIAL_MATERIALS) {
      sortOrder++;
      items.push({ kind: 'material', id: m.id, sku: m.sku, data: m, isActive: true, sortOrder, updatedAt: now, updatedBy: 'system' });
    }
    for (const p of INITIAL_PANELS) {
      sortOrder++;
      items.push({ kind: 'panel', id: p.id, data: p, isActive: true, sortOrder, updatedAt: now, updatedBy: 'system' });
    }
    for (const inv of INITIAL_INVERTERS) {
      sortOrder++;
      items.push({ kind: 'inverter', id: inv.id, data: inv, isActive: true, sortOrder, updatedAt: now, updatedBy: 'system' });
    }

    catalogStore.items = items;
    catalogStore.pricing = { ...DEFAULT_PRICING };
    catalogStore.pricingUpdatedAt = now;
    catalogStore.pricingUpdatedBy = 'system';
    catalogStore.changes = [
      {
        id: 1,
        kind: 'material',
        itemId: 'seed-all',
        action: 'seed',
        before: null,
        after: { count: items.length },
        changedBy: 'system',
        changedAt: now,
      },
    ];
    catalogStore.nextChangeId = 2;
    saveJsonCatalog(catalogStore);
  }
}

// -------------------------------------------------------------
// USER STORE REPOSITORY
// -------------------------------------------------------------
export async function findUserByEmail(email: string): Promise<ServerUser | null> {
  const normalized = email.toLowerCase().trim();
  if (isPg && pool) {
    const res = await pool.query(
      `SELECT id, full_name as "fullName", email, phone, address, password, role, is_email_verified as "isEmailVerified",
              verification_code as "verificationCode", must_change_password as "mustChangePassword", created_at as "createdAt"
       FROM users WHERE lower(email) = $1`,
      [normalized]
    );
    return res.rows[0] || null;
  }
  const users = loadJsonUsers();
  return users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function findUserById(id: string): Promise<ServerUser | null> {
  if (isPg && pool) {
    const res = await pool.query(
      `SELECT id, full_name as "fullName", email, phone, address, password, role, is_email_verified as "isEmailVerified",
              verification_code as "verificationCode", must_change_password as "mustChangePassword", created_at as "createdAt"
       FROM users WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }
  const users = loadJsonUsers();
  return users.find((u) => u.id === id) || null;
}

export async function saveUser(user: ServerUser): Promise<void> {
  if (isPg && pool) {
    await pool.query(
      `INSERT INTO users (id, full_name, email, phone, address, password, role, is_email_verified, verification_code, must_change_password, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (id) DO UPDATE SET
         full_name = $2, email = $3, phone = $4, address = $5, password = $6, role = $7,
         is_email_verified = $8, verification_code = $9, must_change_password = $10, updated_at = NOW()`,
      [
        user.id,
        user.fullName,
        user.email.toLowerCase().trim(),
        user.phone || '',
        user.address || '',
        user.password,
        user.role,
        user.isEmailVerified,
        user.verificationCode || null,
        user.mustChangePassword || false,
      ]
    );
    return;
  }

  const users = loadJsonUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push(user);
  }
  saveJsonUsers(users);
}

export async function getAllUsers(): Promise<ServerUser[]> {
  if (isPg && pool) {
    const res = await pool.query(
      `SELECT id, full_name as "fullName", email, phone, address, password, role, is_email_verified as "isEmailVerified",
              must_change_password as "mustChangePassword", created_at as "createdAt"
       FROM users ORDER BY created_at ASC`
    );
    return res.rows;
  }
  return loadJsonUsers();
}

export async function countAdmins(): Promise<number> {
  if (isPg && pool) {
    const res = await pool.query(`SELECT COUNT(*) FROM users WHERE role = 'admin'`);
    return parseInt(res.rows[0].count, 10);
  }
  return loadJsonUsers().filter((u) => u.role === 'admin').length;
}

export async function updateUserRole(id: string, role: 'admin' | 'sales'): Promise<boolean> {
  if (isPg && pool) {
    const res = await pool.query(`UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`, [role, id]);
    return (res.rowCount ?? 0) > 0;
  }
  const users = loadJsonUsers();
  const u = users.find((x) => x.id === id);
  if (u) {
    u.role = role;
    saveJsonUsers(users);
    return true;
  }
  return false;
}

export async function deleteUserById(id: string): Promise<boolean> {
  if (isPg && pool) {
    const res = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }
  const users = loadJsonUsers();
  const next = users.filter((x) => x.id !== id);
  if (next.length !== users.length) {
    saveJsonUsers(next);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// SESSION STORE REPOSITORY
// -------------------------------------------------------------
export async function saveSessionRecord(session: SessionRecord): Promise<void> {
  if (isPg && pool) {
    await pool.query(
      `INSERT INTO sessions (id_hash, user_id, created_at, expires_at, last_seen_at, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [session.idHash, session.userId, session.createdAt, session.expiresAt, session.lastSeenAt, session.userAgent]
    );
    return;
  }
  memorySessions.set(session.idHash, session);
}

export async function findSessionRecord(idHash: string): Promise<{ session: SessionRecord; user: ServerUser } | null> {
  if (isPg && pool) {
    const res = await pool.query(
      `SELECT s.id_hash as "idHash", s.user_id as "userId", s.created_at as "createdAt", s.expires_at as "expiresAt",
              s.last_seen_at as "lastSeenAt", s.user_agent as "userAgent",
              u.id, u.full_name as "fullName", u.email, u.phone, u.address, u.password, u.role,
              u.is_email_verified as "isEmailVerified", u.must_change_password as "mustChangePassword", u.created_at as "userCreatedAt"
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id_hash = $1 AND s.expires_at > NOW()`,
      [idHash]
    );
    if (res.rowCount === 0) return null;
    const row = res.rows[0];
    return {
      session: {
        idHash: row.idHash,
        userId: row.userId,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        lastSeenAt: row.lastSeenAt,
        userAgent: row.userAgent,
      },
      user: {
        id: row.id,
        fullName: row.fullName,
        email: row.email,
        phone: row.phone,
        address: row.address,
        password: row.password,
        role: row.role,
        isEmailVerified: row.isEmailVerified,
        mustChangePassword: row.mustChangePassword,
        createdAt: row.userCreatedAt,
      },
    };
  }

  const sess = memorySessions.get(idHash);
  if (!sess) return null;
  if (sess.expiresAt.getTime() < Date.now()) {
    memorySessions.delete(idHash);
    return null;
  }
  const user = await findUserById(sess.userId);
  if (!user) return null;
  return { session: sess, user };
}

export async function touchSessionRecord(idHash: string, newExpiresAt: Date): Promise<void> {
  if (isPg && pool) {
    await pool.query(
      `UPDATE sessions SET expires_at = $1, last_seen_at = NOW() WHERE id_hash = $2`,
      [newExpiresAt, idHash]
    );
    return;
  }
  const s = memorySessions.get(idHash);
  if (s) {
    s.expiresAt = newExpiresAt;
    s.lastSeenAt = new Date();
  }
}

export async function deleteSessionRecord(idHash: string): Promise<void> {
  if (isPg && pool) {
    await pool.query(`DELETE FROM sessions WHERE id_hash = $1`, [idHash]);
    return;
  }
  memorySessions.delete(idHash);
}

export async function deleteAllUserSessions(userId: string, exceptIdHash?: string): Promise<void> {
  if (isPg && pool) {
    if (exceptIdHash) {
      await pool.query(`DELETE FROM sessions WHERE user_id = $1 AND id_hash != $2`, [userId, exceptIdHash]);
    } else {
      await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    }
    return;
  }
  for (const [hash, s] of memorySessions.entries()) {
    if (s.userId === userId && (!exceptIdHash || hash !== exceptIdHash)) {
      memorySessions.delete(hash);
    }
  }
}

// -------------------------------------------------------------
// PROJECTS STORE REPOSITORY
// -------------------------------------------------------------
export async function getProjectsForUser(userEmail: string, userRole: 'admin' | 'sales'): Promise<any[]> {
  const normEmail = userEmail.toLowerCase().trim();
  if (isPg && pool) {
    if (userRole === 'admin') {
      const res = await pool.query(`SELECT data FROM projects ORDER BY updated_at DESC`);
      return res.rows.map((r) => r.data);
    }
    const res = await pool.query(
      `SELECT data FROM projects
       WHERE lower(created_by) = $1
          OR data->>'isPublic' = 'true'
          OR data->'sharedWithRoles' @> jsonb_build_array($2::text)
          OR data->'sharedWithEmails' @> jsonb_build_array($1::text)
       ORDER BY updated_at DESC`,
      [normEmail, userRole]
    );
    return res.rows.map((r) => r.data);
  }

  const all = loadJsonProjects();
  if (userRole === 'admin') return all;
  return all.filter((p) => {
    if (p.createdByEmail && p.createdByEmail.toLowerCase() === normEmail) return true;
    if (p.isPublic) return true;
    if (Array.isArray(p.sharedWithRoles) && p.sharedWithRoles.includes(userRole)) return true;
    if (Array.isArray(p.sharedWithEmails) && p.sharedWithEmails.some((e: string) => e.toLowerCase() === normEmail)) return true;
    return false;
  });
}

export async function getProjectRecordById(id: string): Promise<any | null> {
  if (isPg && pool) {
    const res = await pool.query(`SELECT data FROM projects WHERE id = $1`, [id]);
    return res.rows[0]?.data || null;
  }
  const all = loadJsonProjects();
  return all.find((p) => p.id === id) || null;
}

export async function saveProjectRecord(project: any): Promise<any> {
  const updatedProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  const ownerEmail = (project.createdByEmail || '').toLowerCase().trim();

  if (isPg && pool) {
    await pool.query(
      `INSERT INTO projects (id, name, customer_name, phone, address, status, created_by, data, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = $2, customer_name = $3, phone = $4, address = $5, status = $6,
         created_by = $7, data = $8, updated_at = NOW()`,
      [
        updatedProject.id,
        updatedProject.name || 'Dự án chưa đặt tên',
        updatedProject.customerName || '',
        updatedProject.phone || '',
        updatedProject.address || '',
        updatedProject.status || 'saved',
        ownerEmail,
        JSON.stringify(updatedProject),
      ]
    );
    return updatedProject;
  }

  const projects = loadJsonProjects();
  const idx = projects.findIndex((p) => p.id === updatedProject.id);
  if (idx >= 0) {
    projects[idx] = updatedProject;
  } else {
    projects.push(updatedProject);
  }
  saveJsonProjects(projects);
  return updatedProject;
}

export async function deleteProjectRecord(id: string): Promise<boolean> {
  if (isPg && pool) {
    const res = await pool.query(`DELETE FROM projects WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }
  const projects = loadJsonProjects();
  const next = projects.filter((p) => p.id !== id);
  if (next.length !== projects.length) {
    saveJsonProjects(next);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// CATALOG STORE REPOSITORY (PART 2)
// -------------------------------------------------------------
export async function getCatalogVersion(): Promise<number> {
  if (isPg && pool) {
    const res = await pool.query(`SELECT COALESCE(MAX(id), 0) as version FROM catalog_changes`);
    return parseInt(res.rows[0].version, 10);
  }
  const store = loadJsonCatalog();
  const max = store.changes.reduce((acc, c) => Math.max(acc, c.id), 0);
  return max;
}

export async function getCatalogSnapshot(includeInactive = false): Promise<{
  version: number;
  materials: any[];
  panels: any[];
  inverters: any[];
  pricing: PricingSettings;
}> {
  const version = await getCatalogVersion();

  if (isPg && pool) {
    const query = includeInactive
      ? `SELECT kind, id, data, is_active as "isActive", updated_at as "updatedAt", updated_by as "updatedBy" FROM catalog_items ORDER BY sort_order ASC`
      : `SELECT kind, id, data, is_active as "isActive", updated_at as "updatedAt", updated_by as "updatedBy" FROM catalog_items WHERE is_active = TRUE ORDER BY sort_order ASC`;
    const itemsRes = await pool.query(query);

    const materials: any[] = [];
    const panels: any[] = [];
    const inverters: any[] = [];

    for (const r of itemsRes.rows) {
      const itemWithMeta = {
        ...r.data,
        id: r.id,
        isActive: r.isActive,
        updatedAt: r.updatedAt?.toISOString ? r.updatedAt.toISOString() : r.updatedAt,
        updatedBy: r.updatedBy,
      };
      if (r.kind === 'material') materials.push(itemWithMeta);
      else if (r.kind === 'panel') panels.push(itemWithMeta);
      else if (r.kind === 'inverter') inverters.push(itemWithMeta);
    }

    const pricingRes = await pool.query(`SELECT data, updated_at as "updatedAt", updated_by as "updatedBy" FROM pricing_settings WHERE id = 1`);
    const pricingData = pricingRes.rows[0]?.data || DEFAULT_PRICING;

    return {
      version,
      materials,
      panels,
      inverters,
      pricing: pricingData,
    };
  }

  const store = loadJsonCatalog();
  const filtered = includeInactive ? store.items : store.items.filter((i) => i.isActive);

  return {
    version,
    materials: filtered.filter((i) => i.kind === 'material').map((i) => ({ ...i.data, id: i.id, isActive: i.isActive, updatedAt: i.updatedAt, updatedBy: i.updatedBy })),
    panels: filtered.filter((i) => i.kind === 'panel').map((i) => ({ ...i.data, id: i.id, isActive: i.isActive, updatedAt: i.updatedAt, updatedBy: i.updatedBy })),
    inverters: filtered.filter((i) => i.kind === 'inverter').map((i) => ({ ...i.data, id: i.id, isActive: i.isActive, updatedAt: i.updatedAt, updatedBy: i.updatedBy })),
    pricing: store.pricing || DEFAULT_PRICING,
  };
}

export async function findCatalogItem(kind: string, id: string): Promise<CatalogItemRecord | null> {
  if (isPg && pool) {
    const res = await pool.query(
      `SELECT kind, id, sku, data, is_active as "isActive", sort_order as "sortOrder", updated_at as "updatedAt", updated_by as "updatedBy"
       FROM catalog_items WHERE kind = $1 AND id = $2`,
      [kind, id]
    );
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      updatedAt: r.updatedAt?.toISOString ? r.updatedAt.toISOString() : r.updatedAt,
    };
  }
  const store = loadJsonCatalog();
  return store.items.find((i) => i.kind === kind && i.id === id) || null;
}

export async function saveCatalogItem(
  kind: 'material' | 'panel' | 'inverter',
  id: string,
  data: any,
  action: 'create' | 'update' | 'deactivate' | 'reactivate',
  userEmail: string,
  batchId?: string
): Promise<{ item: any; version: number }> {
  const now = new Date().toISOString();
  const sku = kind === 'material' ? data.sku || null : null;

  if (isPg && pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existingRes = await client.query(
        `SELECT kind, id, sku, data, is_active as "isActive", updated_at as "updatedAt" FROM catalog_items WHERE kind = $1 AND id = $2 FOR UPDATE`,
        [kind, id]
      );
      const existing = existingRes.rows[0] || null;

      let isActive = true;
      if (action === 'deactivate') isActive = false;
      else if (action === 'reactivate') isActive = true;
      else if (existing) isActive = existing.isActive;

      await client.query(
        `INSERT INTO catalog_items (kind, id, sku, data, is_active, sort_order, updated_at, updated_by)
         VALUES ($1, $2, $3, $4, $5, 9999, NOW(), $6)
         ON CONFLICT (kind, id) DO UPDATE SET
           sku = $3, data = $4, is_active = $5, updated_at = NOW(), updated_by = $6`,
        [kind, id, sku, JSON.stringify(data), isActive, userEmail]
      );

      const changeRes = await client.query(
        `INSERT INTO catalog_changes (kind, item_id, action, before, after, batch_id, changed_by, changed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        [kind, id, action, existing ? JSON.stringify(existing.data) : null, JSON.stringify(data), batchId || null, userEmail]
      );

      const version = parseInt(changeRes.rows[0].id, 10);
      await client.query('COMMIT');
      return { item: { ...data, id, isActive, updatedAt: now, updatedBy: userEmail }, version };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  const store = loadJsonCatalog();
  const existingIdx = store.items.findIndex((i) => i.kind === kind && i.id === id);
  const existing = existingIdx >= 0 ? store.items[existingIdx] : null;

  let isActive = true;
  if (action === 'deactivate') isActive = false;
  else if (action === 'reactivate') isActive = true;
  else if (existing) isActive = existing.isActive;

  const itemRecord: CatalogItemRecord = {
    kind,
    id,
    sku,
    data,
    isActive,
    sortOrder: existing ? existing.sortOrder : 9999,
    updatedAt: now,
    updatedBy: userEmail,
  };

  if (existingIdx >= 0) {
    store.items[existingIdx] = itemRecord;
  } else {
    store.items.push(itemRecord);
  }

  const version = store.nextChangeId++;
  store.changes.push({
    id: version,
    kind,
    itemId: id,
    action,
    before: existing ? existing.data : null,
    after: data,
    batchId,
    changedBy: userEmail,
    changedAt: now,
  });

  saveJsonCatalog(store);
  return { item: { ...data, id, isActive, updatedAt: now, updatedBy: userEmail }, version };
}

export async function savePricingSettings(
  settings: PricingSettings,
  userEmail: string
): Promise<{ pricing: PricingSettings; version: number }> {
  const now = new Date().toISOString();

  if (isPg && pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existingRes = await client.query(`SELECT data FROM pricing_settings WHERE id = 1 FOR UPDATE`);
      const before = existingRes.rows[0]?.data || null;

      await client.query(
        `INSERT INTO pricing_settings (id, data, updated_at, updated_by)
         VALUES (1, $1, NOW(), $2)
         ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW(), updated_by = $2`,
        [JSON.stringify(settings), userEmail]
      );

      const changeRes = await client.query(
        `INSERT INTO catalog_changes (kind, item_id, action, before, after, changed_by, changed_at)
         VALUES ('settings', 'pricing', 'update', $1, $2, $3, NOW())
         RETURNING id`,
        [before ? JSON.stringify(before) : null, JSON.stringify(settings), userEmail]
      );

      const version = parseInt(changeRes.rows[0].id, 10);
      await client.query('COMMIT');
      return { pricing: settings, version };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  const store = loadJsonCatalog();
  const before = store.pricing;
  store.pricing = settings;
  store.pricingUpdatedAt = now;
  store.pricingUpdatedBy = userEmail;
  const version = store.nextChangeId++;
  store.changes.push({
    id: version,
    kind: 'settings',
    itemId: 'pricing',
    action: 'update',
    before,
    after: settings,
    changedBy: userEmail,
    changedAt: now,
  });
  saveJsonCatalog(store);
  return { pricing: settings, version };
}

export async function getCatalogChanges(params: {
  kind?: string;
  itemId?: string;
  limit?: number;
  beforeId?: number;
}): Promise<CatalogChangeRecord[]> {
  const limit = Math.min(100, Math.max(1, params.limit || 50));

  if (isPg && pool) {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.kind) {
      conditions.push(`kind = $${idx++}`);
      values.push(params.kind);
    }
    if (params.itemId) {
      conditions.push(`item_id = $${idx++}`);
      values.push(params.itemId);
    }
    if (params.beforeId) {
      conditions.push(`id < $${idx++}`);
      values.push(params.beforeId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await pool.query(
      `SELECT id, kind, item_id as "itemId", action, before, after, batch_id as "batchId", changed_by as "changedBy", changed_at as "changedAt"
       FROM catalog_changes
       ${whereClause}
       ORDER BY id DESC
       LIMIT ${limit}`,
      values
    );

    return res.rows.map((r) => ({
      ...r,
      id: parseInt(r.id, 10),
      changedAt: r.changedAt?.toISOString ? r.changedAt.toISOString() : r.changedAt,
    }));
  }

  const store = loadJsonCatalog();
  let list = [...store.changes].reverse();
  if (params.kind) list = list.filter((c) => c.kind === params.kind);
  if (params.itemId) list = list.filter((c) => c.itemId === params.itemId);
  if (params.beforeId) list = list.filter((c) => c.id < params.beforeId!);
  return list.slice(0, limit);
}
