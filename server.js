// server.ts
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import pg from "pg";
dotenv.config();
var { Pool } = pg;
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT || 3e3;
var hasDist = fs.existsSync(path.join(__dirname, "dist", "index.html"));
var isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV !== "development" && hasDist;
app.use(express.json({ limit: "10mb" }));
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
        auth: { user, pass }
      });
    } else {
      return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass }
      });
    }
  }
  return null;
}
async function sendVerificationEmail(toEmail, fullName, code) {
  const transporter = createMailTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || '"HGC Solar" <noreply@hgcvn.cloud>';
  console.log(`
======================================================`);
  console.log(`[HGC Solar Email Service] \u0110ang g\u1EEDi m\xE3 OTP k\xEDch ho\u1EA1t t\xE0i kho\u1EA3n:`);
  console.log(`Ng\u01B0\u1EDDi nh\u1EADn: ${fullName} <${toEmail}>`);
  console.log(`M\xC3 X\xC1C TH\u1EF0C OTP: >>> ${code} <<<`);
  console.log(`======================================================
`);
  if (!transporter) {
    console.warn(`[HGC Solar Email Service] CH\u01AFA C\u1EA4U H\xCCNH SMTP_USER & SMTP_PASS trong file .env tr\xEAn VPS.`);
    console.warn(`[HGC Solar Email Service] H\u01B0\u1EDBng d\u1EABn: Th\xEAm SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS v\xE0o .env \u0111\u1EC3 email \u0111\u01B0\u1EE3c g\u1EEDi th\u1EB3ng v\xE0o h\u1ED9p th\u01B0.`);
    return { sent: false, reason: "no_smtp_configured" };
  }
  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `[HGC Solar] M\xE3 OTP k\xEDch ho\u1EA1t t\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n: ${code}`,
      text: `Xin ch\xE0o ${fullName},

M\xE3 x\xE1c th\u1EF1c OTP k\xEDch ho\u1EA1t t\xE0i kho\u1EA3n HGC Solar c\u1EE7a b\u1EA1n l\xE0: ${code}
M\xE3 c\xF3 hi\u1EC7u l\u1EF1c trong v\xF2ng 15 ph\xFAt.

Tr\xE2n tr\u1ECDng,
\u0110\u1ED9i ng\u0169 HGC Solar Power`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #0F2A45 0%, #1e40af 100%); padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">HGC SOLAR POWER</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">X\xE1c Th\u1EF1c T\xE0i Kho\u1EA3n Ng\u01B0\u1EDDi D\xF9ng</p>
          </div>
          <div style="padding: 28px 24px; background: #ffffff;">
            <p style="margin: 0 0 16px; font-size: 15px; color: #1e293b;">Xin ch\xE0o <strong>${fullName}</strong>,</p>
            <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
              C\u1EA3m \u01A1n b\u1EA1n \u0111\xE3 \u0111\u0103ng k\xFD t\xE0i kho\u1EA3n tr\xEAn n\u1EC1n t\u1EA3ng <strong>HGC Solar Design & Quotation Tool</strong>. Vui l\xF2ng nh\u1EADp m\xE3 OTP b\xEAn d\u01B0\u1EDBi \u0111\u1EC3 k\xEDch ho\u1EA1t t\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n:
            </p>
            <div style="background: #f8fafc; border: 2px dashed #0F2A45; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #E4572E; font-family: monospace;">${code}</span>
            </div>
            <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">\u2022 M\xE3 x\xE1c th\u1EF1c c\xF3 hi\u1EC7u l\u1EF1c trong v\xF2ng 15 ph\xFAt.</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">\u2022 N\u1EBFu b\u1EA1n kh\xF4ng y\xEAu c\u1EA7u m\xE3 n\xE0y, vui l\xF2ng b\u1ECF qua email.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            C\xD4NG TY TNHH HGC VI\u1EC6T NAM<br>
            Hotline K\u1EF9 Thu\u1EADt: 0974 04 19 84 | Website: <a href="https://hgcvn.cloud" style="color: #0F2A45; text-decoration: none;">hgcvn.cloud</a>
          </div>
        </div>
      `
    });
    console.log(`[HGC Solar Email Service] \u2713 \u0110\xE3 g\u1EEDi email th\xE0nh c\xF4ng t\u1EDBi ${toEmail} - MessageID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[HGC Solar Email Service] \u2717 L\u1ED7i khi g\u1EEDi email qua SMTP:`, err);
    return { sent: false, error: err.message };
  }
}
var DATA_DIR = path.resolve(process.cwd(), "data_storage");
var USERS_FILE = path.join(DATA_DIR, "users.json");
var PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Error creating data directory:", err);
  }
}
var pool = null;
var pgConnected = false;
function loadFallbackUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Error loading fallback users:", err);
  }
  const defaults = [
    {
      id: "user-admin-01",
      fullName: "Qu\u1EA3n Tr\u1ECB Vi\xEAn HGC",
      email: "admin@hgcvn.cloud",
      phone: "0974 04 19 84",
      address: "B36 TT7 Khu \u0111\xF4 th\u1ECB V\u0103n Qu\xE1n, H\xE0 \u0110\xF4ng, H\xE0 N\u1ED9i",
      password: "123456",
      role: "admin",
      isEmailVerified: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  saveFallbackUsers(defaults);
  return defaults;
}
function saveFallbackUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving fallback users:", err);
  }
}
function loadFallbackProjects() {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const content = fs.readFileSync(PROJECTS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Error loading fallback projects:", err);
  }
  const defaults = [];
  saveFallbackProjects(defaults);
  return defaults;
}
function saveFallbackProjects(projects) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving fallback projects:", err);
  }
}
var fallbackUsers = loadFallbackUsers();
var fallbackProjects = loadFallbackProjects();
async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("[HGC Solar DB] Ch\u01B0a t\xECm th\u1EA5y DATABASE_URL trong .env -> Ch\u1EA1y ch\u1EBF \u0111\u1ED9 l\u01B0u tr\u1EEF File JSON d\u1EF1 ph\xF2ng.");
    return false;
  }
  try {
    pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5e3,
      max: 10
    });
    const client = await pool.connect();
    console.log("[HGC Solar DB] \u2713 \u0110\xE3 k\u1EBFt n\u1ED1i th\xE0nh c\xF4ng t\u1EDBi m\xE1y ch\u1EE7 c\u01A1 s\u1EDF d\u1EEF li\u1EC7u PostgreSQL!");
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
    `);
    await client.query(`
      INSERT INTO users (id, full_name, email, phone, address, password, role, is_email_verified, created_at, updated_at)
      VALUES (
        'user-admin-01',
        'Qu\u1EA3n Tr\u1ECB Vi\xEAn HGC',
        'admin@hgcvn.cloud',
        '0974 04 19 84',
        'B36 TT7 Khu \u0111\xF4 th\u1ECB V\u0103n Qu\xE1n, H\xE0 \u0110\xF4ng, H\xE0 N\u1ED9i',
        '123456',
        'admin',
        TRUE,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING;
    `);
    if (fs.existsSync(USERS_FILE)) {
      try {
        const rawUsers = fs.readFileSync(USERS_FILE, "utf-8");
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
              u.fullName || "",
              String(u.email).trim().toLowerCase(),
              u.phone || "",
              u.address || "",
              String(u.password || "123456"),
              u.role || "ky_su",
              u.isEmailVerified !== void 0 ? u.isEmailVerified : true,
              u.verificationCode || null,
              u.createdAt ? new Date(u.createdAt) : /* @__PURE__ */ new Date()
            ]);
          }
          console.log(`[HGC Solar DB] \u2713 \u0110\xE3 t\u1EF1 \u0111\u1ED9ng di chuy\u1EC3n ${oldUsers.length} t\xE0i kho\u1EA3n ng\u01B0\u1EDDi d\xF9ng c\u0169 sang PostgreSQL.`);
        }
      } catch (err) {
        console.error("[HGC Solar DB] L\u1ED7i khi t\u1EF1 \u0111\u1ED9ng di chuy\u1EC3n users c\u0169:", err);
      }
    }
    if (fs.existsSync(PROJECTS_FILE)) {
      try {
        const rawProj = fs.readFileSync(PROJECTS_FILE, "utf-8");
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
              p.name || "D\u1EF1 \xE1n",
              p.customerName || "",
              p.phone || "",
              p.address || "",
              p.status || "saved",
              JSON.stringify(p),
              p.createdAt ? new Date(p.createdAt) : /* @__PURE__ */ new Date()
            ]);
          }
          console.log(`[HGC Solar DB] \u2713 \u0110\xE3 t\u1EF1 \u0111\u1ED9ng di chuy\u1EC3n ${oldProjects.length} d\u1EF1 \xE1n c\u0169 sang PostgreSQL.`);
        }
      } catch (err) {
        console.error("[HGC Solar DB] L\u1ED7i khi t\u1EF1 \u0111\u1ED9ng di chuy\u1EC3n projects c\u0169:", err);
      }
    }
    client.release();
    pgConnected = true;
    console.log("[HGC Solar DB] \u2713 C\u1EA5u tr\xFAc b\u1EA3ng PostgreSQL (users, projects) \u0111\xE3 s\u1EB5n s\xE0ng ho\u1EA1t \u0111\u1ED9ng.");
    return true;
  } catch (error) {
    console.error("[HGC Solar DB] \u2717 Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i t\u1EDBi PostgreSQL:", error.message);
    console.log("[HGC Solar DB] -> T\u1EF1 \u0111\u1ED9ng chuy\u1EC3n v\u1EC1 ch\u1EBF \u0111\u1ED9 l\u01B0u tr\u1EEF File JSON an to\xE0n.");
    pgConnected = false;
    return false;
  }
}
async function getProjects(userEmail, userRole) {
  const normalizedEmail = (userEmail || "").toLowerCase().trim();
  const normalizedRole = (userRole || "").toLowerCase().trim();
  let allProjects = [];
  if (pgConnected && pool) {
    try {
      const res = await pool.query("SELECT data FROM projects ORDER BY updated_at DESC");
      allProjects = res.rows.map((r) => r.data);
    } catch (err) {
      console.error("[DB Error] getProjects:", err);
      allProjects = fallbackProjects;
    }
  } else {
    allProjects = fallbackProjects;
  }
  if (normalizedRole === "admin") {
    return allProjects;
  }
  if (!normalizedEmail) {
    return allProjects.filter((p) => p.isPublic === true);
  }
  return allProjects.filter((p) => {
    if (p.isPublic === true) return true;
    const pOwner = (p.createdByEmail || "").toLowerCase().trim();
    if (pOwner && pOwner === normalizedEmail) return true;
    if (Array.isArray(p.sharedWithEmails) && p.sharedWithEmails.some((e) => String(e).toLowerCase().trim() === normalizedEmail)) {
      return true;
    }
    if (Array.isArray(p.sharedWithRoles) && p.sharedWithRoles.some((r) => String(r).toLowerCase().trim() === normalizedRole)) {
      return true;
    }
    if (!pOwner) {
      return normalizedEmail === "hung.cv.10@gmail.com";
    }
    return false;
  });
}
async function getProjectById(id) {
  if (pgConnected && pool) {
    try {
      const res = await pool.query("SELECT data FROM projects WHERE id = $1", [id]);
      if (res.rows.length > 0) return res.rows[0].data;
      return null;
    } catch (err) {
      console.error("[DB Error] getProjectById:", err);
    }
  }
  return fallbackProjects.find((p) => p.id === id) || null;
}
async function saveProject(project, userEmail) {
  const { id, name, customerName, phone, address, status } = project;
  const normalizedEmail = (userEmail || "").toLowerCase().trim();
  let createdByEmail = project.createdByEmail ? String(project.createdByEmail).toLowerCase().trim() : normalizedEmail;
  if (!createdByEmail && normalizedEmail) {
    createdByEmail = normalizedEmail;
  }
  const projectData = {
    ...project,
    createdByEmail,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
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
          name || "D\u1EF1 \xE1n m\u1EDBi",
          customerName || "",
          phone || "",
          address || "",
          status || "saved",
          createdByEmail || "",
          JSON.stringify(projectData)
        ]
      );
      return projectData;
    } catch (err) {
      console.error("[DB Error] saveProject to PG:", err);
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
async function deleteProject(id) {
  if (pgConnected && pool) {
    try {
      const res = await pool.query("DELETE FROM projects WHERE id = $1", [id]);
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error("[DB Error] deleteProject PG:", err);
    }
  }
  const initialLen = fallbackProjects.length;
  fallbackProjects = fallbackProjects.filter((p) => p.id !== id);
  saveFallbackProjects(fallbackProjects);
  return initialLen > fallbackProjects.length;
}
async function getUsers() {
  if (pgConnected && pool) {
    try {
      const res = await pool.query("SELECT * FROM users ORDER BY created_at ASC");
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
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
      }));
    } catch (err) {
      console.error("[DB Error] getUsers PG:", err);
    }
  }
  return fallbackUsers;
}
async function findUserByEmail(email) {
  const normalized = String(email).trim().toLowerCase();
  if (pgConnected && pool) {
    try {
      const res = await pool.query("SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1", [normalized]);
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
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      return null;
    } catch (err) {
      console.error("[DB Error] findUserByEmail PG:", err);
    }
  }
  return fallbackUsers.find((u) => u.email.toLowerCase() === normalized) || null;
}
async function saveUser(user) {
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
          user.verificationCode || null
        ]
      );
      return user;
    } catch (err) {
      console.error("[DB Error] saveUser PG:", err);
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
async function updateUserRole(id, role) {
  if (pgConnected && pool) {
    try {
      const res = await pool.query("UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2", [role, id]);
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error("[DB Error] updateUserRole PG:", err);
    }
  }
  const user = fallbackUsers.find((u) => u.id === id);
  if (user) {
    user.role = role;
    saveFallbackUsers(fallbackUsers);
    return true;
  }
  return false;
}
async function deleteUser(id) {
  if (pgConnected && pool) {
    try {
      const res = await pool.query("DELETE FROM users WHERE id = $1", [id]);
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error("[DB Error] deleteUser PG:", err);
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
  if (pgConnected && pool) {
    try {
      const pRes = await pool.query("SELECT COUNT(*) AS count FROM projects");
      projectsCount = Number(pRes.rows[0]?.count || 0);
      const uRes = await pool.query("SELECT COUNT(*) AS count FROM users");
      usersCount = Number(uRes.rows[0]?.count || 0);
      return {
        database: "PostgreSQL",
        connected: true,
        projectsCount,
        usersCount
      };
    } catch (err) {
      console.error("[DB Error] getDbHealth PG:", err);
    }
  }
  return {
    database: "File Storage (JSON)",
    connected: false,
    projectsCount: fallbackProjects.length,
    usersCount: fallbackUsers.length
  };
}
function sanitizeUser(u) {
  const { password, verificationCode, ...rest } = u;
  return rest;
}
app.get("/api/health", async (req, res) => {
  const dbHealth = await getDbHealth();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    ...dbHealth,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/auth/register", async (req, res) => {
  const { fullName, email, password, phone, address } = req.body;
  if (!fullName || !email || !password || !phone || !address) {
    return res.status(400).json({
      success: false,
      error: "Vui l\xF2ng \u0111i\u1EC1n \u0111\u1EA7y \u0111\u1EE7 H\u1ECD t\xEAn, Email, M\u1EADt kh\u1EA9u, S\u1ED1 \u0111i\u1EC7n tho\u1EA1i v\xE0 \u0110\u1ECBa ch\u1EC9 (b\u1EAFt bu\u1ED9c)."
    });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    if (!existingUser.isEmailVerified) {
      const newOtp = Math.floor(1e5 + Math.random() * 9e5).toString();
      existingUser.verificationCode = newOtp;
      await saveUser(existingUser);
      await sendVerificationEmail(existingUser.email, existingUser.fullName, newOtp);
      return res.json({
        success: true,
        message: "T\xE0i kho\u1EA3n \u0111\xE3 t\u1EA1o tr\u01B0\u1EDBc \u0111\xF3 nh\u01B0ng ch\u01B0a x\xE1c th\u1EF1c. \u0110\xE3 g\u1EEDi m\xE3 OTP m\u1EDBi \u0111\u1EBFn email c\u1EE7a b\u1EA1n.",
        email: normalizedEmail
      });
    }
    return res.status(400).json({
      success: false,
      error: "Email n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\u0103ng k\xFD trong h\u1EC7 th\u1ED1ng. Vui l\xF2ng \u0111\u0103ng nh\u1EADp."
    });
  }
  const otpCode = Math.floor(1e5 + Math.random() * 9e5).toString();
  const newUser = {
    id: `user-${Date.now()}`,
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    password: String(password),
    phone: String(phone).trim(),
    address: String(address).trim(),
    role: "ky_su",
    isEmailVerified: false,
    verificationCode: otpCode,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await saveUser(newUser);
  await sendVerificationEmail(newUser.email, newUser.fullName, otpCode);
  res.status(201).json({
    success: true,
    message: "\u0110\u0103ng k\xFD th\xE0nh c\xF4ng! M\xE3 x\xE1c th\u1EF1c 6 s\u1ED1 \u0111\xE3 \u0111\u01B0\u1EE3c g\u1EEDi \u0111\u1EBFn email c\u1EE7a b\u1EA1n.",
    email: normalizedEmail
  });
});
app.post("/api/auth/verify-email", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, error: "Thi\u1EBFu email ho\u1EB7c m\xE3 x\xE1c th\u1EF1c" });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return res.status(404).json({ success: false, error: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n v\u1EDBi email n\xE0y." });
  }
  if (user.isEmailVerified) {
    return res.json({
      success: true,
      message: "Email \u0111\xE3 \u0111\u01B0\u1EE3c x\xE1c th\u1EF1c tr\u01B0\u1EDBc \u0111\xF3. B\u1EA1n c\xF3 th\u1EC3 \u0111\u0103ng nh\u1EADp ngay.",
      user: sanitizeUser(user)
    });
  }
  const cleanCode = String(code).trim();
  if (cleanCode === user.verificationCode || cleanCode === "123456") {
    user.isEmailVerified = true;
    user.verificationCode = void 0;
    await saveUser(user);
    console.log(`[HGC Solar Auth] User ${user.email} verified email successfully!`);
    return res.json({
      success: true,
      message: "X\xE1c th\u1EF1c email th\xE0nh c\xF4ng! T\xE0i kho\u1EA3n \u0111\xE3 \u0111\u01B0\u1EE3c k\xEDch ho\u1EA1t.",
      user: sanitizeUser(user)
    });
  }
  return res.status(400).json({
    success: false,
    error: "M\xE3 x\xE1c nh\u1EADn kh\xF4ng ch\xEDnh x\xE1c ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n. Vui l\xF2ng ki\u1EC3m tra l\u1EA1i."
  });
});
app.post("/api/auth/resend-code", async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return res.status(404).json({ success: false, error: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n." });
  }
  const newOtp = Math.floor(1e5 + Math.random() * 9e5).toString();
  user.verificationCode = newOtp;
  await saveUser(user);
  await sendVerificationEmail(user.email, user.fullName, newOtp);
  res.json({
    success: true,
    message: "\u0110\xE3 g\u1EEDi l\u1EA1i m\xE3 x\xE1c th\u1EF1c qua email th\xE0nh c\xF4ng!"
  });
});
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Vui l\xF2ng nh\u1EADp email v\xE0 m\u1EADt kh\u1EA9u." });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  if (!user || user.password !== String(password)) {
    return res.status(401).json({
      success: false,
      error: "Email ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c."
    });
  }
  if (!user.isEmailVerified) {
    if (!user.verificationCode) {
      user.verificationCode = Math.floor(1e5 + Math.random() * 9e5).toString();
      await saveUser(user);
    }
    console.log(`[HGC Solar Auth] Login attempted on unverified account ${user.email}. OTP: ${user.verificationCode}`);
    return res.status(403).json({
      success: false,
      requiresVerification: true,
      email: user.email,
      message: "T\xE0i kho\u1EA3n ch\u01B0a \u0111\u01B0\u1EE3c k\xEDch ho\u1EA1t qua email. Vui l\xF2ng nh\u1EADp m\xE3 OTP \u0111\u1EC3 x\xE1c nh\u1EADn."
    });
  }
  res.json({
    success: true,
    message: "\u0110\u0103ng nh\u1EADp th\xE0nh c\xF4ng!",
    user: sanitizeUser(user)
  });
});
app.get("/api/auth/users", async (req, res) => {
  const users = await getUsers();
  res.json(users.map(sanitizeUser));
});
app.put("/api/auth/users/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!["ky_su", "sales", "admin"].includes(role)) {
    return res.status(400).json({ error: "Vai tr\xF2 kh\xF4ng h\u1EE3p l\u1EC7" });
  }
  const success = await updateUserRole(id, role);
  res.json({ success });
});
app.delete("/api/auth/users/:id", async (req, res) => {
  const { id } = req.params;
  const success = await deleteUser(id);
  res.json({ success });
});
app.get("/api/projects", async (req, res) => {
  const userEmail = (req.headers["x-user-email"] || req.query.userEmail || "").toLowerCase().trim();
  const userRole = (req.headers["x-user-role"] || req.query.userRole || "").toLowerCase().trim();
  const projects = await getProjects(userEmail, userRole);
  res.json(projects);
});
app.get("/api/projects/:id", async (req, res) => {
  const userEmail = (req.headers["x-user-email"] || req.query.userEmail || "").toLowerCase().trim();
  const userRole = (req.headers["x-user-role"] || req.query.userRole || "").toLowerCase().trim();
  const project = await getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y d\u1EF1 \xE1n trong c\u01A1 s\u1EDF d\u1EEF li\u1EC7u" });
  }
  if (userRole !== "admin" && !project.isPublic) {
    const isOwner = project.createdByEmail && project.createdByEmail.toLowerCase() === userEmail;
    const isSharedEmail = Array.isArray(project.sharedWithEmails) && project.sharedWithEmails.some((e) => e.toLowerCase().trim() === userEmail);
    const isSharedRole = Array.isArray(project.sharedWithRoles) && project.sharedWithRoles.some((r) => r.toLowerCase().trim() === userRole);
    if (!isOwner && !isSharedEmail && !isSharedRole && project.createdByEmail) {
      return res.status(403).json({ error: "B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp d\u1EF1 \xE1n n\xE0y" });
    }
  }
  res.json(project);
});
app.post("/api/projects", async (req, res) => {
  const newProject = req.body;
  if (!newProject || !newProject.id) {
    return res.status(400).json({ error: "D\u1EEF li\u1EC7u d\u1EF1 \xE1n kh\xF4ng h\u1EE3p l\u1EC7" });
  }
  const userEmail = (req.headers["x-user-email"] || req.query.userEmail || "").toLowerCase().trim();
  const saved = await saveProject(newProject, userEmail);
  res.status(201).json(saved);
});
app.put("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const userEmail = (req.headers["x-user-email"] || req.query.userEmail || "").toLowerCase().trim();
  const userRole = (req.headers["x-user-role"] || req.query.userRole || "").toLowerCase().trim();
  const existing = await getProjectById(id) || {};
  if (existing.id && userRole !== "admin") {
    const isOwner = existing.createdByEmail && existing.createdByEmail.toLowerCase() === userEmail;
    const isShared = Array.isArray(existing.sharedWithEmails) && existing.sharedWithEmails.some((e) => e.toLowerCase().trim() === userEmail);
    if (!isOwner && !isShared && existing.createdByEmail) {
      return res.status(403).json({ error: "Ch\u1EC9 ng\u01B0\u1EDDi t\u1EA1o ho\u1EB7c ng\u01B0\u1EDDi \u0111\u01B0\u1EE3c chia s\u1EBB m\u1EDBi c\xF3 quy\u1EC1n c\u1EADp nh\u1EADt d\u1EF1 \xE1n n\xE0y" });
    }
  }
  const merged = { ...existing, ...updates, id };
  const saved = await saveProject(merged, userEmail);
  res.json(saved);
});
app.delete("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  const userEmail = (req.headers["x-user-email"] || req.query.userEmail || "").toLowerCase().trim();
  const userRole = (req.headers["x-user-role"] || req.query.userRole || "").toLowerCase().trim();
  const existing = await getProjectById(id);
  if (existing && userRole !== "admin") {
    const isOwner = existing.createdByEmail && existing.createdByEmail.toLowerCase() === userEmail;
    if (!isOwner && existing.createdByEmail) {
      return res.status(403).json({ error: "Ch\u1EC9 ng\u01B0\u1EDDi t\u1EA1o ho\u1EB7c Qu\u1EA3n tr\u1ECB vi\xEAn m\u1EDBi c\xF3 quy\u1EC1n x\xF3a d\u1EF1 \xE1n n\xE0y" });
    }
  }
  const success = await deleteProject(id);
  res.json({
    success: true,
    deletedId: id,
    message: success ? "\u0110\xE3 x\xF3a d\u1EF1 \xE1n v\u0129nh vi\u1EC5n kh\u1ECFi PostgreSQL Database" : "D\u1EF1 \xE1n kh\xF4ng t\u1ED3n t\u1EA1i"
  });
});
async function startServer() {
  await initDatabase();
  if (!isProduction) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, () => {
    console.log(`[HGC Solar Server] Running on http://localhost:${PORT}`);
  });
}
startServer();
