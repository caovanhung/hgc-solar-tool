import type { Request, Response, NextFunction } from 'express';
import { parseSessionToken, lookupSession } from './sessions.js';
import type { ServerUser } from '../db.js';

declare global {
  namespace Express {
    interface Request {
      user?: ServerUser | null;
      sessionToken?: string | null;
    }
  }
}

export async function loadSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = parseSessionToken(req);
    if (!token) {
      req.user = null;
      req.sessionToken = null;
      return next();
    }

    const user = await lookupSession(token);
    req.user = user || null;
    req.sessionToken = user ? token : null;
    next();
  } catch (err) {
    console.error('Error in loadSession middleware:', err);
    req.user = null;
    req.sessionToken = null;
    next();
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
    return;
  }
  next();
}

export function requireRole(role: 'admin' | 'sales') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHENTICATED' });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' });
      return;
    }
    next();
  };
}

export function requireJson(req: Request, res: Response, next: NextFunction): void {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutatingMethods.includes(req.method.toUpperCase())) {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      res.status(415).json({
        error: 'JSON_REQUIRED',
        message: 'Content-Type must be application/json',
      });
      return;
    }
  }
  next();
}
