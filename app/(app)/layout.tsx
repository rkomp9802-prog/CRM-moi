import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { countOverdueTasks } from '@/lib/tasks';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const overdueCount = await countOverdueTasks(user);

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} overdueCount={overdueCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
