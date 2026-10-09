import { Router } from 'express';
import {
  getProjectsForUser,
  getProjectRecordById,
  saveProjectRecord,
  deleteProjectRecord,
  getCatalogSnapshot,
  DEFAULT_PRICING,
} from '../db.js';
import { requireAuth } from '../auth/middleware.js';
import { sanitizeProjectWrite } from './sanitize.js';

export const projectsRouter = Router();

// All projects routes require authentication
projectsRouter.use(requireAuth);

// GET /api/projects
projectsRouter.get('/', async (req, res) => {
  const user = req.user!;
  const projects = await getProjectsForUser(user.email, user.role);
  res.json(projects);
});

// GET /api/projects/:id
projectsRouter.get('/:id', async (req, res) => {
  const user = req.user!;
  const project = await getProjectRecordById(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Không tìm thấy dự án trong cơ sở dữ liệu' });
  }

  // Access check
  if (user.role !== 'admin' && !project.isPublic) {
    const isOwner = project.createdByEmail && project.createdByEmail.toLowerCase() === user.email.toLowerCase();
    const isSharedEmail =
      Array.isArray(project.sharedWithEmails) &&
      project.sharedWithEmails.some((e: string) => e.toLowerCase().trim() === user.email.toLowerCase());
    const isSharedRole =
      Array.isArray(project.sharedWithRoles) &&
      project.sharedWithRoles.some((r: string) => r.toLowerCase().trim() === user.role);

    if (!isOwner && !isSharedEmail && !isSharedRole && project.createdByEmail) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Bạn không có quyền truy cập dự án này' });
    }
  }

  res.json(project);
});

// POST /api/projects
projectsRouter.post('/', async (req, res) => {
  const newProject = req.body;
  if (!newProject || !newProject.id) {
    return res.status(400).json({ error: 'Dữ liệu dự án không hợp lệ (thiếu id dự án)' });
  }

  const catalog = await getCatalogSnapshot().catch(() => ({ pricing: DEFAULT_PRICING }));
  const pricing = catalog?.pricing || DEFAULT_PRICING;

  const sanitized = sanitizeProjectWrite(null, newProject, req.user!, pricing);
  const saved = await saveProjectRecord(sanitized);
  res.status(201).json(saved);
});

// PUT /api/projects/:id
projectsRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const user = req.user!;

  const existing = await getProjectRecordById(id);

  if (existing && user.role !== 'admin') {
    const isOwner = existing.createdByEmail && existing.createdByEmail.toLowerCase() === user.email.toLowerCase();
    const isSharedEmail =
      Array.isArray(existing.sharedWithEmails) &&
      existing.sharedWithEmails.some((e: string) => e.toLowerCase().trim() === user.email.toLowerCase());
    const isSharedRole =
      Array.isArray(existing.sharedWithRoles) &&
      existing.sharedWithRoles.some((r: string) => r.toLowerCase().trim() === user.role);

    if (!isOwner && !isSharedEmail && !isSharedRole && existing.createdByEmail) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Chỉ người tạo hoặc người được chia sẻ mới có quyền cập nhật dự án này',
      });
    }
  }

  const catalog = await getCatalogSnapshot().catch(() => ({ pricing: DEFAULT_PRICING }));
  const pricing = catalog?.pricing || DEFAULT_PRICING;

  const sanitized = sanitizeProjectWrite(existing, { ...updates, id }, user, pricing);
  const saved = await saveProjectRecord(sanitized);
  res.json(saved);
});

// DELETE /api/projects/:id
projectsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  const existing = await getProjectRecordById(id);
  if (existing && user.role !== 'admin') {
    const isOwner = existing.createdByEmail && existing.createdByEmail.toLowerCase() === user.email.toLowerCase();
    if (!isOwner && existing.createdByEmail) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Chỉ người tạo hoặc Quản trị viên mới có quyền xóa dự án này',
      });
    }
  }

  const success = await deleteProjectRecord(id);
  res.json({
    success,
    deletedId: id,
    message: success ? 'Đã xóa dự án thành công.' : 'Dự án không tồn tại.',
  });
});
