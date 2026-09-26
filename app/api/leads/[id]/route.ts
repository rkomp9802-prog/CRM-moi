import { apiRoute, readJson } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { getLead, updateLead } from '@/lib/leads';
import { optionalEnum, optionalNumber, optionalString } from '@/lib/validation';
import { LEAD_SOURCES, LEAD_STATUSES } from '@/types/crm.types';

export const GET = apiRoute<RouteContext<'/api/leads/[id]'>>(async (_request, context) => {
  const session = await requireUser();
  const { id } = await context.params;
  return Response.json(await getLead(id, session));
});

export const PATCH = apiRoute<RouteContext<'/api/leads/[id]'>>(async (request, context) => {
  const session = await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);

  const lead = await updateLead(
    id,
    {
      status: optionalEnum(body, 'status', 'Статус', LEAD_STATUSES),
      source: optionalEnum(body, 'source', 'Источник', LEAD_SOURCES),
      // assigned_to пропускается дальше только для админа — проверка внутри updateLead.
      assigned_to: 'assigned_to' in body ? (optionalString(body, 'assigned_to', 'Исполнитель', 64) ?? null) : undefined,
      value: optionalNumber(body, 'value', 'Сумма'),
      notes: optionalString(body, 'notes', 'Заметки'),
    },
    session,
  );

  return Response.json(lead);
});
