import { apiRoute, readJson } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { createTask, listTasks } from '@/lib/tasks';
import { optionalDate, optionalString, requireString } from '@/lib/validation';

export const GET = apiRoute<unknown>(async (request) => {
  const session = await requireUser();
  // scope=all доступен только админу — listTasks сам сузит выборку менеджеру.
  const onlyMine = request.nextUrl.searchParams.get('scope') !== 'all';
  return Response.json(await listTasks(session, onlyMine));
});

export const POST = apiRoute<unknown>(async (request) => {
  const session = await requireUser();
  const body = await readJson(request);

  const task = await createTask(
    {
      title: requireString(body, 'title', 'Название задачи', 300),
      assigned_to: optionalString(body, 'assigned_to', 'Исполнитель', 64) ?? undefined,
      lead_id: optionalString(body, 'lead_id', 'Заявка', 64) ?? null,
      client_id: optionalString(body, 'client_id', 'Клиент', 64) ?? null,
      due_date: optionalDate(body, 'due_date', 'Срок') ?? null,
    },
    session,
  );

  return Response.json(task, { status: 201 });
});
