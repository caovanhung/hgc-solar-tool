import { Router } from 'express';
import crypto from 'node:crypto';
import {
  getCatalogSnapshot,
  getCatalogVersion,
  findCatalogItem,
  saveCatalogItem,
  savePricingSettings,
  getCatalogChanges,
} from '../db.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { validateCatalogItem } from './validate.js';

export const catalogRouter = Router();

// All catalog endpoints require authentication
catalogRouter.use(requireAuth);

// GET /api/catalog/version
catalogRouter.get('/version', async (req, res) => {
  const version = await getCatalogVersion();
  res.json({ version });
});

// GET /api/catalog
catalogRouter.get('/', async (req, res) => {
  const version = await getCatalogVersion();
  const etag = `"v${version}"`;

  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch && ifNoneMatch === etag) {
    return res.status(304).end();
  }

  const includeInactive = req.user?.role === 'admin' && req.query.includeInactive === '1';
  const snapshot = await getCatalogSnapshot(includeInactive);

  res.setHeader('ETag', etag);
  res.json(snapshot);
});

// GET /api/catalog/changes (Admin only)
catalogRouter.get('/changes', requireRole('admin'), async (req, res) => {
  const { kind, itemId, limit, before } = req.query;
  const changes = await getCatalogChanges({
    kind: kind as string,
    itemId: itemId as string,
    limit: limit ? parseInt(limit as string, 10) : 50,
    beforeId: before ? parseInt(before as string, 10) : undefined,
  });
  res.json(changes);
});

// PUT /api/catalog/settings (Admin only)
catalogRouter.put('/settings', requireRole('admin'), async (req, res) => {
  const settingsData = req.body;
  const validation = validateCatalogItem('settings', settingsData);
  if (!validation.valid) {
    return res.status(400).json({ error: 'VALIDATION_FAILED', errors: validation.errors });
  }

  const userEmail = req.user!.email;
  const result = await savePricingSettings(settingsData, userEmail);
  res.json(result);
});

// POST /api/catalog/import (Admin only)
catalogRouter.post('/import', requireRole('admin'), async (req, res) => {
  const { rows, kind = 'material' } = req.body;
  const isDryRun = req.query.dryRun === '1' || req.query.dryRun === 'true';

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Danh sách dòng import trống' });
  }

  const create: any[] = [];
  const update: any[] = [];
  const unchanged: any[] = [];
  const errors: Array<{ row: number; field: string; message: string }> = [];

  const existingSnapshot = await getCatalogSnapshot(true);
  const existingMap = new Map<string, any>();
  const existingSkuMap = new Map<string, any>();

  for (const item of (existingSnapshot as any)[kind === 'material' ? 'materials' : kind === 'panel' ? 'panels' : 'inverters']) {
    existingMap.set(item.id, item);
    if (item.sku) existingSkuMap.set(item.sku.toLowerCase().trim(), item);
  }

  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const validation = validateCatalogItem(kind, row);
    if (!validation.valid) {
      for (const err of validation.errors) {
        errors.push({ row: rowNum, field: err.field, message: err.message });
      }
      return;
    }

    const existing = existingMap.get(row.id);
    if (existing) {
      // Check if unchanged
      const isSame =
        existing.costVnd === row.costVnd &&
        existing.name === row.name &&
        existing.spec === row.spec &&
        existing.unit === row.unit &&
        existing.categoryCode === row.categoryCode &&
        existing.sku === row.sku &&
        (existing.brand || '') === (row.brand || '') &&
        (existing.origin || '') === (row.origin || '');

      if (isSame) {
        unchanged.push(row);
      } else {
        update.push({
          id: row.id,
          incoming: row,
          existing,
        });
      }
    } else {
      // New item, check duplicate SKU
      if (row.sku && existingSkuMap.has(row.sku.toLowerCase().trim())) {
        errors.push({ row: rowNum, field: 'sku', message: `Mã SKU "${row.sku}" đã được sử dụng bởi vật tư khác.` });
      } else {
        create.push(row);
      }
    }
  });

  if (isDryRun) {
    return res.json({
      dryRun: true,
      createCount: create.length,
      updateCount: update.length,
      unchangedCount: unchanged.length,
      errorCount: errors.length,
      create,
      update: update.map((u) => ({ id: u.id, changes: u.incoming })),
      unchanged,
      errors,
    });
  }

  // Real import: All or nothing
  if (errors.length > 0) {
    return res.status(422).json({
      error: 'IMPORT_VALIDATION_FAILED',
      message: `File CSV có ${errors.length} lỗi. Không có bản ghi nào được lưu.`,
      errors,
    });
  }

  const batchId = crypto.randomUUID();
  const userEmail = req.user!.email;
  let finalVersion = 0;

  for (const item of create) {
    const resSave = await saveCatalogItem(kind, item.id, item, 'create', userEmail, batchId);
    finalVersion = resSave.version;
  }

  for (const u of update) {
    const resSave = await saveCatalogItem(kind, u.id, u.incoming, 'update', userEmail, batchId);
    finalVersion = resSave.version;
  }

  res.json({
    success: true,
    batchId,
    createdCount: create.length,
    updatedCount: update.length,
    unchangedCount: unchanged.length,
    version: finalVersion,
  });
});

// POST /api/catalog/:kind (Admin only)
catalogRouter.post('/:kind', requireRole('admin'), async (req, res) => {
  const { kind } = req.params;
  if (!['material', 'panel', 'inverter'].includes(kind)) {
    return res.status(400).json({ error: 'Loại catalog không hợp lệ' });
  }

  const itemData = req.body;
  const validation = validateCatalogItem(kind as any, itemData);
  if (!validation.valid) {
    return res.status(400).json({ error: 'VALIDATION_FAILED', errors: validation.errors });
  }

  const existing = await findCatalogItem(kind, itemData.id);
  if (existing) {
    return res.status(409).json({ error: 'DUPLICATE_ID', message: `Mã id "${itemData.id}" đã tồn tại.` });
  }

  const userEmail = req.user!.email;
  const result = await saveCatalogItem(kind as any, itemData.id, itemData, 'create', userEmail);
  res.status(201).json(result);
});

// PUT /api/catalog/:kind/:id (Admin only)
catalogRouter.put('/:kind/:id', requireRole('admin'), async (req, res) => {
  const { kind, id } = req.params;
  if (!['material', 'panel', 'inverter'].includes(kind)) {
    return res.status(400).json({ error: 'Loại catalog không hợp lệ' });
  }

  const { data: itemData, expectedUpdatedAt } = req.body;
  const targetData = itemData || req.body;

  const validation = validateCatalogItem(kind as any, { ...targetData, id });
  if (!validation.valid) {
    return res.status(400).json({ error: 'VALIDATION_FAILED', errors: validation.errors });
  }

  const existing = await findCatalogItem(kind, id);
  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy mục catalog cần sửa.' });
  }

  // Optimistic concurrency check
  if (expectedUpdatedAt && existing.updatedAt && expectedUpdatedAt !== existing.updatedAt) {
    return res.status(409).json({
      error: 'STALE',
      message: 'Mục này đã được người khác chỉnh sửa trước đó. Vui lòng tải lại dữ liệu mới nhất.',
      latest: existing,
    });
  }

  const userEmail = req.user!.email;
  const result = await saveCatalogItem(kind as any, id, { ...targetData, id }, 'update', userEmail);
  res.json(result);
});

// POST /api/catalog/:kind/:id/deactivate (Admin only)
catalogRouter.post('/:kind/:id/deactivate', requireRole('admin'), async (req, res) => {
  const { kind, id } = req.params;
  const existing = await findCatalogItem(kind, id);
  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy mục catalog.' });
  }

  const userEmail = req.user!.email;
  const result = await saveCatalogItem(kind as any, id, existing.data, 'deactivate', userEmail);
  res.json(result);
});

// POST /api/catalog/:kind/:id/reactivate (Admin only)
catalogRouter.post('/:kind/:id/reactivate', requireRole('admin'), async (req, res) => {
  const { kind, id } = req.params;
  const existing = await findCatalogItem(kind, id);
  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy mục catalog.' });
  }

  const userEmail = req.user!.email;
  const result = await saveCatalogItem(kind as any, id, existing.data, 'reactivate', userEmail);
  res.json(result);
});
