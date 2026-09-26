import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getLead } from '@/lib/leads';
import { listTasksForLead, today } from '@/lib/tasks';
import { listActiveUsers } from '@/lib/users';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { LeadEditor } from '@/components/leads/LeadEditor';
import { TaskList } from '@/components/tasks/TaskList';
import { NewTaskButton } from '@/components/tasks/NewTaskButton';
import { LEAD_SOURCE_LABELS, type LeadWithRelations } from '@/types/crm.types';

export default async function LeadPage({ params }: PageProps<'/leads/[id]'>) {
  const session = await requireUser();
  const { id } = await params;

  let lead: LeadWithRelations;
  try {
    lead = await getLead(id, session);
  } catch (error) {
    // Чужая заявка: API уже вернул бы 403 — на странице показываем понятное сообщение.
    if (error instanceof ApiError && error.status === 403) {
      return (
        <div className="card mx-auto max-w-md px-6 py-10 text-center">
          <h1 className="text-base font-semibold">Нет доступа к заявке</h1>
          <p className="mt-2 text-sm text-muted">
            Эта заявка назначена на другого сотрудника.
          </p>
          <Link href="/leads" className="mt-4 inline-block text-sm text-accent hover:underline">
            Вернуться к заявкам
          </Link>
        </div>
      );
    }
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [tasks, assignees] = await Promise.all([
    listTasksForLead(lead.id),
    session.role === 'admin' ? listActiveUsers() : Promise.resolve(undefined),
  ]);

  return (
    <>
      <PageHeader
        title={`Заявка — ${lead.client_name}`}
        subtitle={`${LEAD_SOURCE_LABELS[lead.source]} · создана ${new Date(
          lead.created_at,
        ).toLocaleDateString('ru-RU')}`}
        actions={<StatusBadge status={lead.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="mb-4 text-xs font-medium tracking-wide text-muted uppercase">Клиент</h2>
            <Link href={`/clients/${lead.client_id}`} className="font-medium hover:text-accent">
              {lead.client_name}
            </Link>
            <p className="mt-1 text-sm text-muted">{lead.client_phone}</p>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="text-xs font-medium tracking-wide text-muted uppercase">
                Задачи по заявке ({tasks.length})
              </h2>
              <NewTaskButton assignees={assignees} leadId={lead.id} variant="secondary" label="+ Задача" />
            </div>
            <TaskList tasks={tasks} showAssignee={session.role === 'admin'} today={today()} />
          </section>
        </div>

        <section className="card h-fit p-5">
          <h2 className="mb-4 text-xs font-medium tracking-wide text-muted uppercase">Заявка</h2>
          <LeadEditor lead={lead} assignees={assignees} />
        </section>
      </div>
    </>
  );
}
