import { redirect } from 'next/navigation';
import { listUsers } from '@/lib/users';
import { getSession } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { UsersTable } from '@/components/users/UsersTable';

export const metadata = { title: 'Сотрудники — CRM' };

export default async function UsersPage() {
  // Роль проверяется и здесь, а не только в proxy.ts: страница не должна
  // полагаться на то, что кто-то отсёк запрос раньше.
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  const users = await listUsers();

  return (
    <>
      <PageHeader
        title="Сотрудники"
        subtitle="Деактивация не удаляет сотрудника — его заявки и задачи остаются в системе"
      />
      <UsersTable users={users} currentUserId={session.userId} />
    </>
  );
}
