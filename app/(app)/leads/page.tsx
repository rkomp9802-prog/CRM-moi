import { listLeads } from '@/lib/leads';
import { listClients } from '@/lib/clients';
import { listActiveUsers } from '@/lib/users';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { NewLeadButton } from '@/components/leads/NewLeadButton';

export const metadata = { title: 'Заявки — CRM' };

export default async function LeadsPage() {
  const session = await requireUser();
  const isAdmin = session.role === 'admin';

  const [leads, clients, assignees] = await Promise.all([
    listLeads(session),
    listClients(),
    isAdmin ? listActiveUsers() : Promise.resolve(undefined),
  ]);

  return (
    <>
      <PageHeader
        title="Заявки"
        subtitle={isAdmin ? `Всего: ${leads.length}` : `Назначено на вас: ${leads.length}`}
        actions={<NewLeadButton clients={clients} assignees={assignees} />}
      />

      <KanbanBoard initialLeads={leads} showAssignee={isAdmin} />
    </>
  );
}
