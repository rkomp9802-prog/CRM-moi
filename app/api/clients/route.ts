import { apiRoute, readJson } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { createClient, listClients } from '@/lib/clients';
import { optionalString, requireString } from '@/lib/validation';

export const GET = apiRoute<unknown>(async (request) => {
  await requireUser();
  const search = request.nextUrl.searchParams.get('search') ?? undefined;
  return Response.json(await listClients(search));
});

export const POST = apiRoute<unknown>(async (request) => {
  await requireUser();
  const body = await readJson(request);

  const client = await createClient({
    name: requireString(body, 'name', 'Имя', 200),
    phone: requireString(body, 'phone', 'Телефон', 50),
    email: optionalString(body, 'email', 'Email', 200) ?? null,
    notes: optionalString(body, 'notes', 'Заметки') ?? null,
  });

  return Response.json(client, { status: 201 });
});
