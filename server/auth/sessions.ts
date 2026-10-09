import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import {
  saveSessionRecord,
  findSessionRecord,
  touchSessionRecord,
  deleteSessionRecord,
  deleteAllUserSessions,
  ServerUser,
} from '../db.js';

export const SESSION_COOKIE_NAME = 'hgc_sid';
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SLIDING_THRESHOLD_MS = 6 * 24 * 60 * 60 * 1000; // if < 6 days remaining, refresh to 7 days

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(
  userId: string,
  userAgent = ''
): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString('base64url');
  const idHash = hashSessionToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);

  await saveSessionRecord({
    idHash,
    userId,
    createdAt: now,
    expiresAt,
    lastSeenAt: now,
    userAgent,
  });

  return { token, expiresAt };
}

export async function lookupSession(token: string): Promise<ServerUser | null> {
  if (!token || typeof token !== 'string') return null;
  const idHash = hashSessionToken(token);
  const found = await findSessionRecord(idHash);
  if (!found) return null;

  const { session, user } = found;
  const remainingMs = session.expiresAt.getTime() - Date.now();

  // Sliding session extension: if less than 6 days remaining, refresh to 7 days
  if (remainingMs < SLIDING_THRESHOLD_MS) {
    const newExpiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
    await touchSessionRecord(idHash, newExpiresAt).catch((err) => {
      console.warn('Could not touch session:', err);
    });
  }

  return user;
}

export async function revokeSession(token: string): Promise<void> {
  if (!token) return;
  const idHash = hashSessionToken(token);
  await deleteSessionRecord(idHash);
}

export async function revokeAllSessionsForUser(userId: string, exceptToken?: string): Promise<void> {
  const exceptHash = exceptToken ? hashSessionToken(exceptToken) : undefined;
  await deleteAllUserSessions(userId, exceptHash);
}

export function parseSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  for (const c of cookies) {
    const [name, ...val] = c.trim().split('=');
    if (name === SESSION_COOKIE_NAME) {
      return decodeURIComponent(val.join('='));
    }
  }
  return null;
}

export function setSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieSecure = process.env.COOKIE_SECURE !== 'false' && isProd;
  const maxAgeSec = 7 * 24 * 60 * 60; // 7 days

  let cookieString = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}`;
  if (cookieSecure) {
    cookieString += '; Secure';
  }

  res.setHeader('Set-Cookie', cookieString);
}

export function clearSessionCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieSecure = process.env.COOKIE_SECURE !== 'false' && isProd;

  let cookieString = `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  if (cookieSecure) {
    cookieString += '; Secure';
  }

  res.setHeader('Set-Cookie', cookieString);
}
