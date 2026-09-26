import Link from 'next/link';
import { listClients } from '@/lib/clients';
import { requireUser } from '@/lib/session';
import { PageHeader, EmptyState } from '@/components/ui/PageHeader';
import { ClientsToolbar } from '@/components/clients/ClientsToolbar';

export const metadata = { title: 'Клиенты — CRM' };

export default async function ClientsPage({ searchParams }: PageProps<'/clients'>) {
  await requireUser();
  const { search } = await searchParams;
  const term = typeof search === 'string' ? search : '';
  const clients = await listClients(term);

  return (
    <>
      <PageHeader
        title="Клиенты"
        subtitle={`Всего: ${clients.length}`}
        actions={<ClientsToolbar initialSearch={term} />}
      />

      {clients.length === 0 ? (
        <EmptyState>
          {term ? 'По этому запросу никого не нашлось.' : 'Клиентов пока нет.'}
        </EmptyState>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Телефон</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Добавлен</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-line last:border-0 hover:bg-canvas">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.id}`} className="font-medium hover:text-accent">
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{client.phone}</td>
                  <td className="px-4 py-3 text-muted">{client.email ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(client.created_at).toLocaleDateString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
