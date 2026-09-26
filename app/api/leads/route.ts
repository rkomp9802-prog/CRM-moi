import { apiRoute, badRequest, readJson } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { createLead, listLeads } from '@/lib/leads';
import {
  optionalNumber,
  optionalString,
  requireEnum,
  requireString,
} from '@/lib/validation';
import { LEAD_SOURCES, LEAD_STATUSES } from '@/types/crm.types';

export const GET = apiRoute<unknown>(async () => {
  const session = await requireUser();
  return Response.json(await listLeads(session));
});

export const POST = apiRoute<unknown>(async (request) => {
  const session = await requireUser();
  const body = await readJson(request);

  const clientId = optionalString(body, 'client_id', 'Клиент', 64);
  const newClientRaw = body.new_client;
  const hasNewClient = !!newClientRaw && typeof newClientRaw === 'object';

  if (!clientId && !hasNewClient) {
    throw badRequest('Заявку нельзя создать без клиента');
  }

  const newClient = hasNewClient
    ? (() => {
        const raw = newClientRaw as Record<string, unknown>;
        return {
          name: requireString(raw, 'name', 'Имя клиента', 200),
          phone: requireString(raw, 'phone', 'Телефон', 50),
          email: optionalString(raw, 'email', 'Email клиента', 200) ?? null,
          notes: optionalString(raw, 'notes', 'Заметки о клиенте') ?? null,
        };
      })()
    : undefined;

  const lead = await createLead(
    {
      client_id: clientId ?? undefined,
      new_client: newClient,
      source: requireEnum(body, 'source', 'Источник', LEAD_SOURCES),
      status: 'status' in body ? requireEnum(body, 'status', 'Статус', LEAD_STATUSES) : undefined,
      assigned_to: optionalString(body, 'assigned_to', 'Исполнитель', 64),
      value: optionalNumber(body, 'value', 'Сумма'),
      notes: optionalString(body, 'notes', 'Заметки'),
    },
    session,
  );

  return Response.json(lead, { status: 201 });
});
