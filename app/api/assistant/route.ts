import { apiRoute, badRequest, readJson } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { askGemini, type ChatMessage } from '@/lib/gemini';
import { getAnalytics } from '@/lib/analytics';
import { listLeads } from '@/lib/leads';
import { listTasks, today } from '@/lib/tasks';
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  USER_ROLE_LABELS,
  type UserRole,
} from '@/types/crm.types';

const MAX_HISTORY = 12;

/**
 * Срез данных CRM для ассистента. Собирается теми же функциями, что и страницы,
 * поэтому менеджер получает в контекст только свои заявки и задачи — модель
 * физически не видит чужих клиентов.
 */
async function buildContext(session: { userId: string; role: UserRole }): Promise<string> {
  const [analytics, leads, tasks] = await Promise.all([
    getAnalytics(session),
    listLeads(session),
    listTasks(session, session.role !== 'admin'),
  ]);

  const now = today();
  const overdue = tasks.filter((task) => task.status === 'pending' && task.due_date && task.due_date < now);

  const byStatus = analytics.statusBreakdown
    .map((item) => `${LEAD_STATUS_LABELS[item.status]}: ${item.count}`)
    .join(', ');

  const bySource = analytics.sourceBreakdown
    .map((item) => `${LEAD_SOURCE_LABELS[item.source]}: ${item.count}`)
    .join(', ');

  const recentLeads = leads
    .slice(0, 15)
    .map(
      (lead) =>
        `- ${lead.client_name} (${lead.client_phone || 'без телефона'}), статус: ${
          LEAD_STATUS_LABELS[lead.status]
        }, источник: ${LEAD_SOURCE_LABELS[lead.source]}, сумма: ${
          lead.value ? `${lead.value} сум` : 'не указана'
        }, исполнитель: ${lead.assigned_to_name ?? 'не назначен'}${
          lead.notes ? `, заметки: ${lead.notes.slice(0, 200)}` : ''
        }`,
    )
    .join('\n');

  const openTasks = tasks
    .filter((task) => task.status === 'pending')
    .slice(0, 15)
    .map(
      (task) =>
        `- ${task.title}${task.due_date ? `, до ${task.due_date}` : ''}${
          task.client_name ? `, клиент: ${task.client_name}` : ''
        }, исполнитель: ${task.assigned_to_name}`,
    )
    .join('\n');

  return [
    `Сегодня: ${now}.`,
    `Всего заявок в зоне видимости: ${analytics.totalLeads}. Конверсия: ${analytics.conversionRate}%.`,
    analytics.avgCloseDays !== null ? `Среднее время закрытия: ${analytics.avgCloseDays} дн.` : '',
    byStatus ? `Заявки по статусам — ${byStatus}.` : 'Заявок пока нет.',
    bySource ? `Заявки по источникам — ${bySource}.` : '',
    '',
    recentLeads ? `Последние заявки:\n${recentLeads}` : '',
    '',
    openTasks ? `Незакрытые задачи:\n${openTasks}` : 'Незакрытых задач нет.',
    overdue.length > 0 ? `Просроченных задач: ${overdue.length}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export const POST = apiRoute<unknown>(async (request) => {
  const session = await requireUser();
  const body = await readJson(request);

  if (!Array.isArray(body.messages)) throw badRequest('Ожидался список сообщений');

  const messages: ChatMessage[] = body.messages
    .slice(-MAX_HISTORY)
    .map((item: unknown) => {
      const message = item as { role?: unknown; text?: unknown };
      if (typeof message.text !== 'string' || message.text.trim() === '') {
        throw badRequest('Пустое сообщение');
      }
      return {
        role: message.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        text: message.text.slice(0, 4000),
      };
    });

  if (messages.length === 0) throw badRequest('Нечего отправлять');

  const context = await buildContext(session);

  const system = [
    'Ты — встроенный помощник CRM-системы небольшой компании. Отвечай по-русски,',
    'коротко и по делу, без вступлений и лишней вежливости.',
    `Роль собеседника: ${USER_ROLE_LABELS[session.role]}.`,
    'Ниже — актуальные данные из CRM. Отвечай на их основе и не выдумывай того, чего в них нет.',
    'Если данных для ответа не хватает, так и скажи.',
    'Ты можешь советовать, что делать с заявками, составлять тексты писем и сообщений клиентам,',
    'но сам ничего в системе не меняешь — только подсказываешь.',
    '',
    '=== ДАННЫЕ CRM ===',
    context,
  ].join('\n');

  const answer = await askGemini(system, messages);
  return Response.json({ answer });
});
