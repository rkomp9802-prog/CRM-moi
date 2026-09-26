import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProfileForm } from '@/components/profile/ProfileForm';

export const metadata = { title: 'Профиль — CRM' };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <>
      <PageHeader
        title="Профиль"
        subtitle={`В системе с ${new Date(user.created_at).toLocaleDateString('ru-RU')}`}
      />
      <ProfileForm user={user} />
    </>
  );
}
