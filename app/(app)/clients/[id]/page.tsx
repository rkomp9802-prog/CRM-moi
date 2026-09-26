import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClient } from '@/lib/clients';
import { listLeadsForClient } from '@/lib/leads';
import { listActiveUsers } from '@/lib/users';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { NewLeadButton } from '@/components/leads/NewLeadButton';
import { LEAD_SOURCE_LABELS } from '@/types/crm.types';

export default async function ClientPage({ params }: PageProps<'/clients/[id]'>) {
  const session = await requireUser();
  const { id } = await params;

  const client = await getClient(id);
  if (!client) notFound();

  const [leads, assignees] = await Promise.all([
    listLeadsForClient(id, session),
    session.role === 'admin' ? listActiveUsers() : Promise.resolve(undefined),
  ]);

  return (
    <>
      <PageHeader
        title={client.name}
        subtitle={`Клиент с ${new Date(client.created_at).toLocaleDateString('ru-RU')}`}
        actions={<NewLeadButton clients={[client]} assignees={assignees} fixedClientId={client.id} />}
      />

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <section className="card h-fit p-5">
          <h2 className="mb-4 text-xs font-medium tracking-wide text-muted uppercase">Контакты</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted">Телефон</dt>
              <dd className="mt-0.5">{client.phone}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="mt-0.5">{client.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted">Заметки</dt>
              <dd className="mt-0.5 whitespace-pre-wrap">{client.notes ?? '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="card overflow-hidden">
          <h2 className="border-b border-line px-5 py-3.5 text-xs font-medium tracking-wide text-muted uppercase">
            Заявки ({leads.length})
          </h2>

          {leads.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              У этого клиента пока нет заявок.
            </p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-line last:border-0 hover:bg-canvas">
                    <td className="px-5 py-3">
                      <Link href={`/leads/${lead.id}`} className="font-medium hover:text-accent">
                        {LEAD_SOURCE_LABELS[lead.source]}
                      </Link>
                      <div className="text-xs text-muted">
                        {new Date(lead.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {lead.value ? `${lead.value.toLocaleString('ru-RU')} сум` : '—'}
                    </td>
                    <td className="px-5 py-3 text-muted">{lead.assigned_to_name ?? 'Не назначен'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
