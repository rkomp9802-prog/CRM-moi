import { apiRoute, badRequest, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { createUser, listUsers } from '@/lib/users';
import { normalizeEmail, requireEnum, requireString } from '@/lib/validation';

// Пароль не возвращается ни в одном ответе: listUsers/createUser отдают только
// публичные поля, password_hash в выборку не попадает.

export const GET = apiRoute<unknown>(async () => {
  await requireAdmin();
  return Response.json(await listUsers());
});

export const POST = apiRoute<unknown>(async (request) => {
  await requireAdmin();
  const body = await readJson(request);

  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 8) throw badRequest('Пароль должен быть не короче 8 символов');

  const user = await createUser({
    name: requireString(body, 'name', 'Имя', 200),
    email: normalizeEmail(body.email),
    password,
    role: requireEnum(body, 'role', 'Роль', ['admin', 'manager'] as const),
  });

  return Response.json(user, { status: 201 });
});
