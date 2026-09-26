'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { USER_ROLE_LABELS, type User } from '@/types/crm.types';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

export function TopBar({ user }: { user: User }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
      <Link
        href="/profile"
        title="Открыть профиль"
        className="flex items-center gap-3 rounded-md px-2 py-1 -mx-2 transition hover:bg-canvas"
      >
        <Avatar name={user.name} src={user.avatar_url} />
        <span className="text-sm">
          <span className="font-medium">{user.name}</span>
          <span className="ml-2 text-muted">{USER_ROLE_LABELS[user.role]}</span>
        </span>
      </Link>

      <Button variant="ghost" onClick={logout}>
        Выйти
      </Button>
    </header>
  );
}
