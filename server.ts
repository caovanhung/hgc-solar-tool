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
    timestamp: new Date().toISOString(),
  });
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
