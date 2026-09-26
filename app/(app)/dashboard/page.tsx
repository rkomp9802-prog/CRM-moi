import { getAnalytics } from '@/lib/analytics';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { LeadsOverTimeChart } from '@/components/charts/LeadsOverTimeChart';
import { StatusBreakdownChart } from '@/components/charts/StatusBreakdownChart';
import { SourceBreakdownChart } from '@/components/charts/SourceBreakdownChart';
import { TeamPerformanceChart } from '@/components/charts/TeamPerformanceChart';

export const metadata = { title: 'Дашборд — CRM' };

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 text-xs font-medium tracking-wide text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default async function DashboardPage() {
  const session = await requireUser();
  const analytics = await getAnalytics(session);

  return (
    <>
      <PageHeader
        title="Дашборд"
        subtitle={
          session.role === 'admin' ? 'Показатели по всей компании' : 'Показатели по вашим заявкам'
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Metric label="Всего заявок" value={String(analytics.totalLeads)} />
        <Metric
          label="Конверсия"
          value={`${analytics.conversionRate}%`}
          hint="Успешные от числа закрытых"
        />
        <Metric
          label="Среднее время закрытия"
          value={analytics.avgCloseDays === null ? '—' : `${analytics.avgCloseDays} дн.`}
          hint="От создания до успеха или отказа"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Panel title="Заявки за 30 дней">
            <LeadsOverTimeChart data={analytics.leadsOverTime} />
          </Panel>
        </div>

        <Panel title="Статусы заявок">
          <StatusBreakdownChart data={analytics.statusBreakdown} />
        </Panel>

        <Panel title="Источники заявок">
          <SourceBreakdownChart data={analytics.sourceBreakdown} />
        </Panel>

        {analytics.teamPerformance && (
          <div className="lg:col-span-2">
            <Panel title="Сотрудники">
              <TeamPerformanceChart data={analytics.teamPerformance} />
            </Panel>
          </div>
        )}
      </div>
    </>
  );
}
