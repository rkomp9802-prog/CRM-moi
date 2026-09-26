import { execute, query, queryOne } from '@/lib/turso';
import { badRequest, forbidden, notFound } from '@/lib/api';
import { createClient, type ClientInput } from '@/lib/clients';
import type { SessionPayload } from '@/lib/auth';
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  type Lead,
  type LeadSource,
  type LeadStatus,
  type LeadWithRelations,
} from '@/types/crm.types';

const SELECT_WITH_RELATIONS = `
  select leads.*, clients.name as client_name, clients.phone as client_phone,
         users.name as assigned_to_name
  from leads
  join clients on clients.id = leads.client_id
  left join users on users.id = leads.assigned_to`;

/** Менеджер видит только назначенные на него заявки — условие подмешивается в каждый запрос. */
function scope(session: SessionPayload): { sql: string; args: string[] } {
  return session.role === 'admin'
    ? { sql: '', args: [] }
    : { sql: ' and leads.assigned_to = ?', args: [session.userId] };
}

export function listLeads(session: SessionPayload): Promise<LeadWithRelations[]> {
  const { sql, args } = scope(session);
  return query<LeadWithRelations>(
    `${SELECT_WITH_RELATIONS} where 1 = 1${sql} order by leads.updated_at desc`,
    args,
  );
}

export function listLeadsForClient(
  clientId: string,
  session: SessionPayload,
): Promise<LeadWithRelations[]> {
  const { sql, args } = scope(session);
  return query<LeadWithRelations>(
    `${SELECT_WITH_RELATIONS} where leads.client_id = ?${sql} order by leads.created_at desc`,
    [clientId, ...args],
  );
}

/** Заявка с проверкой доступа: чужая заявка для менеджера — 403, а не «не найдено». */
export async function getLead(id: string, session: SessionPayload): Promise<LeadWithRelations> {
  const lead = await queryOne<LeadWithRelations>(`${SELECT_WITH_RELATIONS} where leads.id = ?`, [id]);
  if (!lead) throw notFound('Заявка');
  if (session.role !== 'admin' && lead.assigned_to !== session.userId) throw forbidden();
  return lead;
}

export interface LeadInput {
  client_id?: string;
  /** Новый клиент прямо из формы заявки — тогда client_id не нужен. */
  new_client?: ClientInput;
  source: LeadSource;
  status?: LeadStatus;
  assigned_to?: string | null;
  value?: number | null;
  notes?: string | null;
}

/**
 * Создание заявки, при необходимости вместе с новым клиентом.
 * Единая точка записи лида: сюда же придут заявки с формы сайта и из Telegram-бота
 * (см. разделы 13.1 и 13.2 спеки) — им нужно будет только передать другой source.
 */
export async function createLead(input: LeadInput, session: SessionPayload): Promise<Lead> {
  let clientId = input.client_id;

  if (!clientId && input.new_client) {
    const client = await createClient(input.new_client);
    clientId = client.id;
  }
  if (!clientId) throw badRequest('Заявку нельзя создать без клиента');

  const exists = await queryOne<{ id: string }>('select id from clients where id = ?', [clientId]);
  if (!exists) throw badRequest('Указанный клиент не найден');

  // Менеджер всегда назначает заявку на себя: иначе он создал бы её и тут же потерял,
  // потому что видит только свои заявки.
  const assignedTo =
    session.role === 'admin' ? (input.assigned_to ?? null) : session.userId;

  if (assignedTo) {
    const user = await queryOne<{ id: string }>(
      'select id from users where id = ? and is_active = 1',
      [assignedTo],
    );
    if (!user) throw badRequest('Указанный сотрудник не найден или деактивирован');
  }

  return insertLead({
    client_id: clientId,
    source: input.source,
    status: input.status ?? 'new',
    assigned_to: assignedTo,
    value: input.value ?? null,
    notes: input.notes ?? null,
  });
}

/** Сама запись в таблицу — общая для заявок из интерфейса и из внешних источников. */
async function insertLead(params: {
  client_id: string;
  source: LeadSource;
  status: LeadStatus;
  assigned_to: string | null;
  value: number | null;
  notes: string | null;
}): Promise<Lead> {
  const now = new Date().toISOString();
  const lead: Lead = { id: crypto.randomUUID(), ...params, created_at: now, updated_at: now };

  await execute(
    `insert into leads (id, client_id, source, status, assigned_to, value, notes, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lead.id,
      lead.client_id,
      lead.source,
      lead.status,
      lead.assigned_to,
      lead.value,
      lead.notes,
      lead.created_at,
      lead.updated_at,
    ],
  );

  return lead;
}

export interface ExternalLeadInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
  /** Форма на сайте или Telegram-бот — остальные источники заводятся из интерфейса. */
  source?: Extract<LeadSource, 'website_form' | 'telegram_bot'>;
}

/**
 * Заявка из внешнего источника — формы обратной связи на сайте (раздел 13.1 спеки).
 * Сессии здесь нет: вызывающий код сам отвечает за проверку ключа доступа.
 * Клиент ищется по телефону и почте, чтобы повторные обращения одного человека
 * не плодили дубликаты в базе.
 */
export async function createLeadFromWebsite(
  input: ExternalLeadInput,
): Promise<{ lead: Lead; clientId: string; clientCreated: boolean }> {
  const phone = input.phone?.trim() || '';
  const email = input.email?.trim().toLowerCase() || null;

  if (!phone && !email) throw badRequest('Нужен телефон или email клиента');

  let existing: { id: string } | null = null;
  if (phone) {
    existing = await queryOne<{ id: string }>('select id from clients where phone = ?', [phone]);
  }
  if (!existing && email) {
    existing = await queryOne<{ id: string }>('select id from clients where email = ?', [email]);
  }

  const clientId =
    existing?.id ?? (await createClient({ name: input.name, phone, email })).id;

  // Исполнителя не назначаем: заявку с сайта разбирает админ и раздаёт сам.
  const lead = await insertLead({
    client_id: clientId,
    source: input.source ?? 'website_form',
    status: 'new',
    assigned_to: null,
    value: null,
    notes: input.message?.trim() || null,
  });

  return { lead, clientId, clientCreated: !existing };
}

export interface LeadPatch {
  status?: LeadStatus;
  assigned_to?: string | null;
  value?: number | null;
  notes?: string | null;
  source?: LeadSource;
}

export async function updateLead(
  id: string,
  patch: LeadPatch,
  session: SessionPayload,
): Promise<LeadWithRelations> {
  await getLead(id, session); // проверка существования и доступа

  if (patch.assigned_to !== undefined && session.role !== 'admin') {
    throw forbidden();
  }
  if (patch.status && !LEAD_STATUSES.includes(patch.status)) {
    throw badRequest('Недопустимый статус заявки');
  }
  if (patch.source && !LEAD_SOURCES.includes(patch.source)) {
    throw badRequest('Недопустимый источник заявки');
  }
  if (patch.assigned_to) {
    const user = await queryOne<{ id: string }>(
      'select id from users where id = ? and is_active = 1',
      [patch.assigned_to],
    );
    if (!user) throw badRequest('Указанный сотрудник не найден или деактивирован');
  }

  const fields: string[] = [];
  const args: (string | number | null)[] = [];

  for (const key of ['status', 'assigned_to', 'value', 'notes', 'source'] as const) {
    if (patch[key] !== undefined) {
      fields.push(`${key} = ?`);
      args.push(patch[key] ?? null);
    }
  }
  if (fields.length === 0) throw badRequest('Нечего обновлять');

  fields.push('updated_at = ?');
  args.push(new Date().toISOString());

  await execute(`update leads set ${fields.join(', ')} where id = ?`, [...args, id]);
  return getLead(id, session);
}
