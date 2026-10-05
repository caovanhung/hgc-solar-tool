// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT || 3e3;
var isProduction = process.env.NODE_ENV === "production";
app.use(express.json({ limit: "10mb" }));
var projectsStore = [];
function getDefaultSeedProject() {
  return {
    id: "demo-hgc-01",
    name: "V\u0103n Ph\xF2ng HGC - Solar 42kWp",
    customerName: "T\u1EADp \u0110o\xE0n C\xF4ng Ngh\u1EC7 HGC (Tr\u1EE5 S\u1EDF Ch\xEDnh)",
    phone: "0912345678",
    address: "Khu C\xF4ng Ngh\u1EC7 Cao H\xF2a L\u1EA1c, H\xE0 N\u1ED9i",
    status: "saved",
    module: "solar",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    custType: "sinh_hoat",
    provinceCode: "HAN",
    monthlyElectricityBillVnd: 185e5,
    monthlyConsumptionKwh: 5800,
    roofType: "tole",
    roofDir: "s",
    roofShape: "rect",
    roofLengthM: 20,
    roofWidthM: 12,
    roofHeightM: 14,
    sysType: "zero_export",
    phases: "3",
    installMode: "full_roof",
    selectedPanelId: "cs-585t",
    marginPct: 18,
    discountPct: 0,
    pricingTier: "recommended"
  };
}
projectsStore.push(getDefaultSeedProject());
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    projectsCount: projectsStore.length,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
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
  res.status(201).json(newProject);
});
app.put("/api/projects/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = projectsStore.findIndex((p) => p.id === id);
  if (index === -1) {
    const created = { ...updates, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    projectsStore.unshift(created);
    return res.json(created);
  }
  projectsStore[index] = {
    ...projectsStore[index],
    ...updates,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  res.json(projectsStore[index]);
});
app.delete("/api/projects/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = projectsStore.length;
  projectsStore = projectsStore.filter((p) => p.id !== id);
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
      server: { middlewareMode: true },
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
