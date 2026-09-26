'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { UserForm } from '@/components/forms/UserForm';
import { Avatar } from '@/components/ui/Avatar';
import { USER_ROLE_LABELS, type User, type UserRole } from '@/types/crm.types';

interface Props {
  users: User[];
  currentUserId: string;
}

export function UsersTable({ users, currentUserId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function patch(user: User, body: Record<string, unknown>) {
    setPendingId(user.id);

    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setPendingId(null);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      toast(payload.error ?? 'Не удалось изменить сотрудника');
      return;
    }

    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setOpen(true)}>+ Новый сотрудник</Button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Имя</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Роль</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={user.name} src={user.avatar_url} size="sm" />
                      {user.name}
                      {isSelf && <span className="text-xs text-muted">это вы</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{user.email}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={user.role}
                      disabled={isSelf || pendingId === user.id}
                      onChange={(event) => patch(user, { role: event.target.value as UserRole })}
                      className="w-40"
                    >
                      <option value="manager">{USER_ROLE_LABELS.manager}</option>
                      <option value="admin">{USER_ROLE_LABELS.admin}</option>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_active ? (
                      <span className="text-success">Активен</span>
                    ) : (
                      <span className="text-muted">Деактивирован</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isSelf && (
                      <Button
                        variant={user.is_active ? 'danger' : 'secondary'}
                        disabled={pendingId === user.id}
                        onClick={() => patch(user, { is_active: !user.is_active })}
                      >
                        {user.is_active ? 'Деактивировать' : 'Вернуть доступ'}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Новый сотрудник" onClose={() => setOpen(false)}>
        <UserForm
          onCancel={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
