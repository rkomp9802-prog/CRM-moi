import { cookies } from 'next/headers';
import { apiRoute, badRequest, readJson } from '@/lib/api';
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifyPassword } from '@/lib/auth';
import { queryOne } from '@/lib/turso';
import type { UserRole } from '@/types/crm.types';

interface UserRow {
  id: string;
  password_hash: string;
  role: UserRole;
  is_active: number;
}

export const POST = apiRoute<unknown>(async (request) => {
  const body = await readJson(request);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    throw badRequest('Введите email и пароль');
  }

  const user = await queryOne<UserRow>(
    'select id, password_hash, role, is_active from users where email = ?',
    [email],
  );

  // Несуществующий пользователь, неверный пароль и деактивированный аккаунт дают
  // одинаковый ответ — иначе по разнице сообщений можно перебирать существующие email.
  const passwordOk = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !passwordOk || user.is_active !== 1) {
    return Response.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  const token = await signSession({ userId: user.id, role: user.role });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return Response.json({ ok: true, role: user.role });
});
