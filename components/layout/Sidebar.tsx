'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/types/crm.types';

const links = [
  { href: '/dashboard', label: 'Дашборд' },
  { href: '/leads', label: 'Заявки' },
  { href: '/clients', label: 'Клиенты' },
  { href: '/tasks', label: 'Задачи' },
  { href: '/assistant', label: 'Ассистент' },
  { href: '/users', label: 'Сотрудники', adminOnly: true },
  { href: '/settings', label: 'Интеграции', adminOnly: true },
] as const;

interface Props {
  role: UserRole;
  overdueCount: number;
}

export function Sidebar({ role, overdueCount }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-5 py-5">
        <span className="text-sm font-semibold tracking-[0.2em] uppercase">CRM</span>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {links
          .filter((link) => !('adminOnly' in link && link.adminOnly) || role === 'admin')
          .map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                  active ? 'bg-canvas font-medium text-ink' : 'text-muted hover:bg-canvas hover:text-ink'
                }`}
              >
                {link.label}
                {link.href === '/tasks' && overdueCount > 0 && (
                  <span
                    title="Просроченных задач"
                    className="rounded bg-danger-soft px-1.5 py-0.5 text-xs font-medium text-danger"
                  >
                    {overdueCount}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
