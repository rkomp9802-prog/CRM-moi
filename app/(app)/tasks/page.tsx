import Link from 'next/link';
import { listTasks, today } from '@/lib/tasks';
import { listActiveUsers } from '@/lib/users';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { TaskList } from '@/components/tasks/TaskList';
import { NewTaskButton } from '@/components/tasks/NewTaskButton';

export const metadata = { title: 'Задачи — CRM' };

export default async function TasksPage({ searchParams }: PageProps<'/tasks'>) {
  const session = await requireUser();
  const isAdmin = session.role === 'admin';
  const { scope } = await searchParams;
  const onlyMine = scope !== 'all';

  const [tasks, assignees] = await Promise.all([
    listTasks(session, onlyMine),
    isAdmin ? listActiveUsers() : Promise.resolve(undefined),
  ]);

  const now = today();
  const overdue = tasks.filter(
    (task) => task.status === 'pending' && task.due_date && task.due_date < now,
  ).length;

  return (
    <>
      <PageHeader
        title="Задачи"
        subtitle={overdue > 0 ? `Просрочено: ${overdue}` : 'Просроченных задач нет'}
        actions={<NewTaskButton assignees={assignees} />}
      />

      {isAdmin && (
        <div className="mb-4 flex gap-1 rounded-md bg-canvas p-1 text-sm sm:w-fit">
          {[
            { href: '/tasks', label: 'Мои задачи', active: onlyMine },
            { href: '/tasks?scope=all', label: 'Все', active: !onlyMine },
          ].map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded px-4 py-1.5 transition ${
                tab.active ? 'bg-surface font-medium shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <TaskList tasks={tasks} showAssignee={isAdmin && !onlyMine} today={now} />
      </div>
    </>
  );
}
