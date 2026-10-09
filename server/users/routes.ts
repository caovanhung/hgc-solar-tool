import { Router } from 'express';
import {
  getAllUsers,
  findUserById,
  countAdmins,
  updateUserRole,
  deleteUserById,
} from '../db.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { revokeAllSessionsForUser } from '../auth/sessions.js';
import { sanitizeUser } from '../auth/routes.js';

export const usersRouter = Router();

// All users routes require admin role
usersRouter.use(requireAuth, requireRole('admin'));

// GET /api/auth/users
usersRouter.get('/', async (req, res) => {
  const users = await getAllUsers();
  res.json(users.map(sanitizeUser));
});

// PUT /api/auth/users/:id/role
usersRouter.put('/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== 'admin' && role !== 'sales') {
    return res.status(400).json({ error: 'Vai trò không hợp lệ. Chỉ chấp nhận admin hoặc sales.' });
  }

  const currentUser = req.user!;
  if (currentUser.id === id) {
    return res.status(409).json({
      error: 'SELF_ACTION',
      message: 'Bạn không thể tự thay đổi vai trò của chính mình.',
    });
  }

  const targetUser = await findUserById(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  }

  if (targetUser.role === 'admin' && role === 'sales') {
    const adminCount = await countAdmins();
    if (adminCount <= 1) {
      return res.status(409).json({
        error: 'LAST_ADMIN',
        message: 'Không thể hạ quyền Admin cuối cùng trong hệ thống.',
      });
    }
  }

  const updated = await updateUserRole(id, role);
  // Revoke all sessions of target user to force session refresh with new role
  await revokeAllSessionsForUser(id);

  res.json({ success: updated });
});

// DELETE /api/auth/users/:id
usersRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const currentUser = req.user!;

  if (currentUser.id === id) {
    return res.status(409).json({
      error: 'SELF_ACTION',
      message: 'Bạn không thể tự xóa tài khoản của chính mình.',
    });
  }

  const targetUser = await findUserById(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  }

  if (targetUser.role === 'admin') {
    const adminCount = await countAdmins();
    if (adminCount <= 1) {
      return res.status(409).json({
        error: 'LAST_ADMIN',
        message: 'Không thể xóa Admin cuối cùng trong hệ thống.',
      });
    }
  }

  const deleted = await deleteUserById(id);
  await revokeAllSessionsForUser(id);

  res.json({
    success: deleted,
    message: deleted ? 'Đã xóa người dùng thành công.' : 'Không thể xóa người dùng.',
  });
});
