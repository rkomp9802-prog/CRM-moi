import { query, queryOne } from '@/lib/turso';
import type { SessionPayload } from '@/lib/auth';
import type { AnalyticsResponse, LeadSource, LeadStatus } from '@/types/crm.types';

/**
 * Все агрегаты для дашборда одним вызовом.
 * Менеджер видит только свои показатели: условие по assigned_to подмешивается
 * в каждый запрос, а teamPerformance ему не возвращается вовсе.
 */
export async function getAnalytics(session: SessionPayload): Promise<AnalyticsResponse> {
  const isAdmin = session.role === 'admin';
  const where = isAdmin ? '' : ' and assigned_to = ?';
  const args: string[] = isAdmin ? [] : [session.userId];

  const since = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [overTime, statuses, sources, totals, closed] = await Promise.all([
    query<{ date: string; count: number }>(
      `select date(created_at) as date, count(*) as count
       from leads
       where date(created_at) >= ?${where}
       group by date(created_at)
       order by date(created_at)`,
      [since, ...args],
    ),
    query<{ status: LeadStatus; count: number }>(
      `select status, count(*) as count from leads where 1 = 1${where} group by status`,
      args,
    ),
    query<{ source: LeadSource; count: number }>(
      `select source, count(*) as count from leads where 1 = 1${where} group by source`,
      args,
    ),
    queryOne<{ total: number; won: number; lost: number }>(
      `select count(*) as total,
              sum(case when status = 'won' then 1 else 0 end) as won,
              sum(case when status = 'lost' then 1 else 0 end) as lost
       from leads where 1 = 1${where}`,
      args,
    ),
    queryOne<{ avg_days: number | null }>(
      `select avg(julianday(updated_at) - julianday(created_at)) as avg_days
       from leads
       where status in ('won', 'lost')${where}`,
      args,
    ),
  ]);

  const won = totals?.won ?? 0;
  const lost = totals?.lost ?? 0;
  const closedCount = won + lost;

  const response: AnalyticsResponse = {
    leadsOverTime: overTime,
    statusBreakdown: statuses,
    sourceBreakdown: sources,
    // Конверсия считается от закрытых заявок; пока закрытых нет — показываем 0, а не NaN.
    conversionRate: closedCount === 0 ? 0 : Math.round((won / closedCount) * 1000) / 10,
    totalLeads: totals?.total ?? 0,
    avgCloseDays:
      closed?.avg_days == null ? null : Math.round(closed.avg_days * 10) / 10,
  };

  if (isAdmin) {
    response.teamPerformance = await query<{
      userId: string;
      userName: string;
      won: number;
      total: number;
    }>(
      `select users.id as userId, users.name as userName,
              sum(case when leads.status = 'won' then 1 else 0 end) as won,
              count(leads.id) as total
       from users
       left join leads on leads.assigned_to = users.id
       where users.is_active = 1
       group by users.id, users.name
       order by won desc, total desc`,
    );
  }

  return response;
}
