import { apiRoute, badRequest, readJson } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { updateOwnProfile } from '@/lib/users';
import { normalizeAvatar } from '@/lib/avatar';
import { normalizeEmail, optionalString } from '@/lib/validation';

export const PATCH = apiRoute<unknown>(async (request) => {
  const session = await requireUser();
  const body = await readJson(request);

  if ('password' in body && typeof body.password !== 'string') {
    throw badRequest('Пароль должен быть строкой');
  }

  const user = await updateOwnProfile(session.userId, {
    name: optionalString(body, 'name', 'Имя', 200) ?? undefined,
    email: 'email' in body ? normalizeEmail(body.email) : undefined,
    // avatar: null снимает аватар, отсутствие ключа — оставляет как было.
    avatar_url: 'avatar_url' in body ? normalizeAvatar(body.avatar_url) : undefined,
    currentPassword: typeof body.current_password === 'string' ? body.current_password : undefined,
    newPassword: typeof body.password === 'string' && body.password !== '' ? body.password : undefined,
  });

  return Response.json(user);
});
