import { apiRoute, notFound, readJson } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { getClient, updateClient } from '@/lib/clients';
import { listLeadsForClient } from '@/lib/leads';
import { optionalString } from '@/lib/validation';

export const GET = apiRoute<RouteContext<'/api/clients/[id]'>>(async (_request, context) => {
  const session = await requireUser();
  const { id } = await context.params;

  const client = await getClient(id);
  if (!client) throw notFound('Клиент');

  // Список заявок клиента сужается по правам: менеджер видит только свои.
  return Response.json({ client, leads: await listLeadsForClient(id, session) });
});

export const PATCH = apiRoute<RouteContext<'/api/clients/[id]'>>(async (request, context) => {
  await requireUser();
  const { id } = await context.params;

  const client = await getClient(id);
  if (!client) throw notFound('Клиент');

  const body = await readJson(request);
  await updateClient(id, {
    name: optionalString(body, 'name', 'Имя', 200) ?? undefined,
    phone: optionalString(body, 'phone', 'Телефон', 50) ?? undefined,
    email: optionalString(body, 'email', 'Email', 200),
    notes: optionalString(body, 'notes', 'Заметки'),
  });

  return Response.json(await getClient(id));
});
