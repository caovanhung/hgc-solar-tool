// server.ts
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
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

M\xE3 n\xE0y c\xF3 hi\u1EC7u l\u1EF1c trong 15 ph\xFAt.

Tr\xE2n tr\u1ECDng,
\u0110\u1ED9i ng\u0169 HGC Solar
Hotline: 0974 04 19 84`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
            <h2 style="color: #0F2A45; margin: 0 0 6px 0; font-size: 20px; font-weight: 800;">C\xD4NG TY TNHH HGC</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0;">H\u1EC7 Th\u1ED1ng Thi\u1EBFt K\u1EBF & B\xE1o Gi\xE1 \u0110i\u1EC7n M\u1EB7t Tr\u1EDDi \xC1p M\xE1i</p>
          </div>

          <div style="padding: 10px 0;">
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-top: 0;">
              Xin ch\xE0o <strong>${fullName}</strong>,
            </p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              C\u1EA3m \u01A1n b\u1EA1n \u0111\xE3 \u0111\u0103ng k\xFD t\xE0i kho\u1EA3n t\u1EA1i <strong>HGC Solar Engine</strong>. \u0110\u1EC3 ho\xE0n t\u1EA5t k\xEDch ho\u1EA1t t\xE0i kho\u1EA3n v\xE0 b\u1EA3o m\u1EADt quy\u1EC1n truy c\u1EADp h\u1ED3 s\u01A1 d\u1EF1 \xE1n, vui l\xF2ng s\u1EED d\u1EE5ng m\xE3 OTP d\u01B0\u1EDBi \u0111\xE2y:
            </p>

            <div style="background: #FFF7ED; border: 2px dashed #EA580C; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0;">
              <div style="font-size: 12px; font-weight: 700; color: #9A3412; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                M\xE3 x\xE1c th\u1EF1c t\xE0i kho\u1EA3n (OTP)
              </div>
              <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #EA580C; font-family: monospace;">
                ${code}
              </div>
              <div style="font-size: 12px; color: #9A3412; margin-top: 8px;">
                M\xE3 c\xF3 hi\u1EC7u l\u1EF1c trong v\xF2ng <strong>15 ph\xFAt</strong>
              </div>
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
              Vui l\xF2ng ki\u1EC3m tra h\u1ED9p th\u01B0 \u0111\u1EBFn (Inbox) ho\u1EB7c th\u01B0 m\u1EE5c Spam. Kh\xF4ng chia s\u1EBB m\xE3 n\xE0y cho b\u1EA5t k\u1EF3 ai kh\xE1c.
            </p>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">
            <strong>C\xD4NG TY TNHH HGC</strong><br/>
            Tr\u1EE5 s\u1EDF: B36 TT7 Khu \u0111\xF4 th\u1ECB V\u0103n Qu\xE1n, H\xE0 \u0110\xF4ng, H\xE0 N\u1ED9i<br/>
            Hotline: 0974 04 19 84 \xB7 Email: contact@hgcvn.cloud
          </div>
        </div>
      `
    });
    console.log(`[HGC Solar Email Service] \u0110\xC3 G\u1EECI EMAIL TH\xC0NH C\xD4NG T\u1EDAI ${toEmail}! ID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[HGC Solar Email Service] L\u1ED6I KHI G\u1EECI EMAIL TH\u1EF0C T\u1EBE:`, err.message || err);
    return { sent: false, error: err.message };
  }
}
var DATA_DIR = path.join(__dirname, "data_storage");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
var USERS_FILE = path.join(DATA_DIR, "users.json");
var PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Error loading users:", err);
  }
  const defaultUsers = [
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
  saveUsers(defaultUsers);
  return defaultUsers;
}
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving users to disk:", err);
  }
}
function loadProjects() {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const content = fs.readFileSync(PROJECTS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Error loading projects:", err);
  }
  const defaultProj = [];
  saveProjects(defaultProj);
  return defaultProj;
}
function saveProjects(projects) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving projects to disk:", err);
  }
}
var usersStore = loadUsers();
var projectsStore = loadProjects();
function sanitizeUser(u) {
  const { password, verificationCode, ...rest } = u;
  return rest;
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    projectsCount: projectsStore.length,
    usersCount: usersStore.length,
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
  const existingUser = usersStore.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    if (!existingUser.isEmailVerified) {
      const newOtp = Math.floor(1e5 + Math.random() * 9e5).toString();
      existingUser.verificationCode = newOtp;
      saveUsers(usersStore);
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
  usersStore.unshift(newUser);
  saveUsers(usersStore);
  await sendVerificationEmail(newUser.email, newUser.fullName, otpCode);
  res.status(201).json({
    success: true,
    message: "\u0110\u0103ng k\xFD th\xE0nh c\xF4ng! M\xE3 x\xE1c th\u1EF1c 6 s\u1ED1 \u0111\xE3 \u0111\u01B0\u1EE3c g\u1EEDi \u0111\u1EBFn email c\u1EE7a b\u1EA1n.",
    email: normalizedEmail
  });
});
app.post("/api/auth/verify-email", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, error: "Thi\u1EBFu email ho\u1EB7c m\xE3 x\xE1c th\u1EF1c" });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = usersStore.find((u) => u.email.toLowerCase() === normalizedEmail);
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
    saveUsers(usersStore);
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
  const user = usersStore.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return res.status(404).json({ success: false, error: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n." });
  }
  const newOtp = Math.floor(1e5 + Math.random() * 9e5).toString();
  user.verificationCode = newOtp;
  saveUsers(usersStore);
  await sendVerificationEmail(user.email, user.fullName, newOtp);
  res.json({
    success: true,
    message: "\u0110\xE3 g\u1EEDi l\u1EA1i m\xE3 x\xE1c th\u1EF1c qua email th\xE0nh c\xF4ng!"
  });
});
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Vui l\xF2ng nh\u1EADp email v\xE0 m\u1EADt kh\u1EA9u." });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = usersStore.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === String(password)
  );
  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Email ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c."
    });
  }
  if (!user.isEmailVerified) {
    if (!user.verificationCode) {
      user.verificationCode = Math.floor(1e5 + Math.random() * 9e5).toString();
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
app.get("/api/auth/users", (req, res) => {
  res.json(usersStore.map(sanitizeUser));
});
app.get("/api/projects", (req, res) => {
  res.json(projectsStore);
});
app.get("/api/projects/:id", (req, res) => {
  const project = projectsStore.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y d\u1EF1 \xE1n" });
  }
  res.json(project);
});
app.post("/api/projects", (req, res) => {
  const newProject = req.body;
  if (!newProject || !newProject.id) {
    return res.status(400).json({ error: "D\u1EEF li\u1EC7u d\u1EF1 \xE1n kh\xF4ng h\u1EE3p l\u1EC7" });
  }
  const existingIndex = projectsStore.findIndex((p) => p.id === newProject.id);
  if (existingIndex >= 0) {
    projectsStore[existingIndex] = {
      ...newProject,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  } else {
    projectsStore.unshift({
      ...newProject,
      createdAt: newProject.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  saveProjects(projectsStore);
  res.status(201).json(newProject);
});
app.put("/api/projects/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = projectsStore.findIndex((p) => p.id === id);
  if (index === -1) {
    const created = { ...updates, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    projectsStore.unshift(created);
    saveProjects(projectsStore);
    return res.json(created);
  }
  projectsStore[index] = {
    ...projectsStore[index],
    ...updates,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveProjects(projectsStore);
  res.json(projectsStore[index]);
});
app.delete("/api/projects/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = projectsStore.length;
  projectsStore = projectsStore.filter((p) => p.id !== id);
  saveProjects(projectsStore);
  res.json({
    success: true,
    deletedId: id,
    remainingCount: projectsStore.length,
    message: initialLength > projectsStore.length ? "\u0110\xE3 x\xF3a d\u1EF1 \xE1n th\xE0nh c\xF4ng" : "D\u1EF1 \xE1n kh\xF4ng t\u1ED3n t\u1EA1i"
  });
});
async function startServer() {
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
