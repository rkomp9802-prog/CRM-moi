import { apiRoute, badRequest, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { updateUser } from '@/lib/users';
import { optionalEnum, optionalString } from '@/lib/validation';

export const PATCH = apiRoute<RouteContext<'/api/users/[id]'>>(async (request, context) => {
  const session = await requireAdmin();
  const { id } = await context.params;
  const body = await readJson(request);

  if ('is_active' in body && typeof body.is_active !== 'boolean') {
    throw badRequest('Поле «Активен» должно быть true или false');
  }
  if ('password' in body && typeof body.password !== 'string') {
    throw badRequest('Пароль должен быть строкой');
  }

  const user = await updateUser(
    id,
    {
      name: optionalString(body, 'name', 'Имя', 200) ?? undefined,
      role: optionalEnum(body, 'role', 'Роль', ['admin', 'manager'] as const),
      is_active: 'is_active' in body ? (body.is_active as boolean) : undefined,
      password: 'password' in body ? (body.password as string) : undefined,
    },
    session.userId,
  );

  return Response.json(user);
});
