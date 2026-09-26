import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from '@/types/crm.types';

export interface SessionPayload {
  userId: string;
  role: UserRole;
}

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET не задан в окружении');
  return new TextEncoder().encode(secret);
}

// bcryptjs работает только в Node-рантайме. Эти две функции нельзя звать из proxy.ts.
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

/** Проверяет подпись и срок жизни токена. Невалидный токен — null, без исключения. */
export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    const role = payload.role;
    if (!payload.sub || (role !== 'admin' && role !== 'manager')) return null;
    return { userId: payload.sub, role };
  } catch {
    return null;
  }
}
