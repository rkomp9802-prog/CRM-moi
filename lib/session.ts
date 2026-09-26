import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySession, type SessionPayload } from '@/lib/auth';
import { forbidden, unauthorized } from '@/lib/api';
import { queryOne } from '@/lib/turso';
import type { User } from '@/types/crm.types';

/** Текущая сессия из httpOnly-cookie или null. Подходит и для server components, и для API. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/**
 * Сессия или 401. Каждый защищённый route зовёт это сам и не доверяет заголовкам:
 * proxy.ts отсекает неавторизованных, но право на конкретное действие проверяется здесь.
 */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw unauthorized();
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== 'admin') throw forbidden();
  return session;
}

/** Полная запись текущего пользователя — для шапки, списков «мои задачи» и т.п. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const row = await queryOne<{
    id: string;
    name: string;
    email: string;
    role: User['role'];
    created_at: string;
    is_active: number;
    avatar_url: string | null;
  }>('select id, name, email, role, created_at, is_active, avatar_url from users where id = ?', [
    session.userId,
  ]);
  if (!row) return null;
  return { ...row, is_active: row.is_active === 1 };
}
