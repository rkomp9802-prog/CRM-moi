import { execute, query, queryOne } from '@/lib/turso';
import { badRequest, forbidden, notFound } from '@/lib/api';
import type { SessionPayload } from '@/lib/auth';
import type { Task, TaskStatus, TaskWithRelations, User } from '@/types/crm.types';

const SELECT_WITH_RELATIONS = `
  select tasks.*, users.name as assigned_to_name, clients.name as client_name
  from tasks
  join users on users.id = tasks.assigned_to
  left join leads on leads.id = tasks.lead_id
  left join clients on clients.id = coalesce(tasks.client_id, leads.client_id)`;

/** Дата «сегодня» в том же формате, в каком хранится due_date (ГГГГ-ММ-ДД). */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(task: Pick<Task, 'due_date' | 'status'>): boolean {
  return task.status === 'pending' && !!task.due_date && task.due_date < today();
}

export function listTasks(session: SessionPayload, onlyMine: boolean): Promise<TaskWithRelations[]> {
  // «Все задачи» доступны только админу; менеджеру фильтр всегда сужается до своих.
  const mine = onlyMine || session.role !== 'admin';
  return query<TaskWithRelations>(
    `${SELECT_WITH_RELATIONS}
     ${mine ? 'where tasks.assigned_to = ?' : ''}
     order by tasks.status asc,
              case when tasks.due_date is null then 1 else 0 end,
              tasks.due_date asc,
              tasks.created_at desc`,
    mine ? [session.userId] : [],
  );
}

export function listTasksForLead(leadId: string): Promise<TaskWithRelations[]> {
  return query<TaskWithRelations>(
    `${SELECT_WITH_RELATIONS} where tasks.lead_id = ? order by tasks.status asc, tasks.due_date asc`,
    [leadId],
  );
}

export async function countOverdueTasks(user: User): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `select count(*) as count from tasks
     where status = 'pending' and due_date is not null and due_date < ?
     ${user.role === 'admin' ? '' : 'and assigned_to = ?'}`,
    user.role === 'admin' ? [today()] : [today(), user.id],
  );
  return row?.count ?? 0;
}

export interface TaskInput {
  title: string;
  assigned_to?: string;
  lead_id?: string | null;
  client_id?: string | null;
  due_date?: string | null;
}

export async function createTask(input: TaskInput, session: SessionPayload): Promise<Task> {
  // Менеджер может ставить задачи только себе — чужие задачи он всё равно не увидит.
  const assignedTo =
    session.role === 'admin' ? (input.assigned_to ?? session.userId) : session.userId;

  const user = await queryOne<{ id: string }>('select id from users where id = ? and is_active = 1', [
    assignedTo,
  ]);
  if (!user) throw badRequest('Указанный сотрудник не найден или деактивирован');

  if (input.lead_id) {
    const lead = await queryOne<{ id: string; assigned_to: string | null }>(
      'select id, assigned_to from leads where id = ?',
      [input.lead_id],
    );
    if (!lead) throw badRequest('Заявка не найдена');
    if (session.role !== 'admin' && lead.assigned_to !== session.userId) throw forbidden();
  }

  const task: Task = {
    id: crypto.randomUUID(),
    lead_id: input.lead_id ?? null,
    client_id: input.client_id ?? null,
    assigned_to: assignedTo,
    title: input.title,
    due_date: input.due_date ?? null,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  await execute(
    `insert into tasks (id, lead_id, client_id, assigned_to, title, due_date, status, created_at)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.lead_id,
      task.client_id,
      task.assigned_to,
      task.title,
      task.due_date,
      task.status,
      task.created_at,
    ],
  );

  return task;
}

export interface TaskPatch {
  status?: TaskStatus;
  due_date?: string | null;
  title?: string;
}

export async function updateTask(
  id: string,
  patch: TaskPatch,
  session: SessionPayload,
): Promise<Task> {
  const task = await queryOne<Task>('select * from tasks where id = ?', [id]);
  if (!task) throw notFound('Задача');
  if (session.role !== 'admin' && task.assigned_to !== session.userId) throw forbidden();

  const fields: string[] = [];
  const args: (string | null)[] = [];

  for (const key of ['status', 'due_date', 'title'] as const) {
    if (patch[key] !== undefined) {
      fields.push(`${key} = ?`);
      args.push(patch[key] ?? null);
    }
  }
  if (fields.length === 0) throw badRequest('Нечего обновлять');

  await execute(`update tasks set ${fields.join(', ')} where id = ?`, [...args, id]);
  return (await queryOne<Task>('select * from tasks where id = ?', [id]))!;
}
