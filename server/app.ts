import express, { Express } from 'express';
import { isUsingPostgres, getCatalogSnapshot, saveCatalogItem } from './db.js';
import { loadSession, requireJson, requireAuth, requireRole } from './auth/middleware.js';
import { authRouter } from './auth/routes.js';
import { usersRouter } from './users/routes.js';
import { projectsRouter } from './projects/routes.js';
import { catalogRouter } from './catalog/routes.js';

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // Global API middlewares
  app.use('/api', loadSession);
  app.use('/api', requireJson);

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      database: isUsingPostgres() ? 'postgresql' : 'json_fallback',
    });
  });

  // Mount modular route groups
  app.use('/api/auth/users', usersRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/catalog', catalogRouter);

  // Legacy materials endpoints for backward compatibility
  app.get('/api/materials', async (req, res) => {
    try {
      const snapshot = await getCatalogSnapshot(false);
      res.json(snapshot.materials);
    } catch (err) {
      console.error('Error in GET /api/materials:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/materials/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const userEmail = req.user?.email || 'admin@hgcvn.cloud';
      const result = await saveCatalogItem('material', id, { ...req.body, id }, 'update', userEmail);
      res.json({ success: true, item: result.item });
    } catch (err) {
      console.error('Error in PUT /api/materials/:id:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/materials/batch', requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const materials = req.body;
      if (!Array.isArray(materials)) {
        return res.status(400).json({ error: 'Dữ liệu phải là một mảng' });
      }
      const userEmail = req.user?.email || 'admin@hgcvn.cloud';
      for (const m of materials) {
        await saveCatalogItem('material', m.id, m, 'update', userEmail);
      }
      res.json({ success: true, count: materials.length });
    } catch (err) {
      console.error('Error in POST /api/materials/batch:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return app;
}
