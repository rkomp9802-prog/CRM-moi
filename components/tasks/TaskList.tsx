'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import type { TaskWithRelations } from '@/types/crm.types';

interface Props {
  tasks: TaskWithRelations[];
  showAssignee?: boolean;
  /** Сегодняшняя дата с сервера — чтобы подсветка просроченных не зависела от часов клиента. */
  today: string;
}

export function TaskList({ tasks: initialTasks, showAssignee = false, today }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [lastServerTasks, setLastServerTasks] = useState(initialTasks);

  // Свежий список с сервера вытесняет локальное оптимистичное состояние.
  if (lastServerTasks !== initialTasks) {
    setLastServerTasks(initialTasks);
    setTasks(initialTasks);
  }

  async function toggle(task: TaskWithRelations) {
    const status = task.status === 'done' ? 'pending' : 'done';
    const snapshot = tasks;
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, status } : item)),
    );

    const response = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setTasks(snapshot);
      toast(payload.error ?? 'Не удалось изменить задачу');
      return;
    }

    router.refresh();
  }

  if (tasks.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-muted">Задач нет.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {tasks.map((task) => {
        const overdue = task.status === 'pending' && !!task.due_date && task.due_date < today;

        return (
          <li key={task.id} className="flex items-start gap-3 px-5 py-3">
            <input
              type="checkbox"
              checked={task.status === 'done'}
              onChange={() => toggle(task)}
              aria-label={`Отметить «${task.title}» выполненной`}
              className="mt-1 size-4 accent-ink"
            />
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${task.status === 'done' ? 'text-muted line-through' : ''}`}>
                {task.title}
              </p>
              <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                {task.due_date && (
                  <span className={overdue ? 'font-medium text-danger' : ''}>
                    до {new Date(task.due_date).toLocaleDateString('ru-RU')}
                    {overdue && ' — просрочено'}
                  </span>
                )}
                {task.client_name && <span>{task.client_name}</span>}
                {showAssignee && <span>{task.assigned_to_name}</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
