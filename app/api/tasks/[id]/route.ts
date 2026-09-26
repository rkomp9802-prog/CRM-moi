import { apiRoute, readJson } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { updateTask } from '@/lib/tasks';
import { optionalDate, optionalEnum, optionalString } from '@/lib/validation';

export const PATCH = apiRoute<RouteContext<'/api/tasks/[id]'>>(async (request, context) => {
  const session = await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);

  const task = await updateTask(
    id,
    {
      status: optionalEnum(body, 'status', 'Статус', ['pending', 'done'] as const),
      due_date: optionalDate(body, 'due_date', 'Срок'),
      title: optionalString(body, 'title', 'Название задачи', 300) ?? undefined,
    },
    session,
  );

  return Response.json(task);
});
