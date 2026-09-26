'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import type { User } from '@/types/crm.types';

interface Props {
  /** Активные сотрудники — только для админа; менеджер ставит задачи себе. */
  assignees?: User[];
  leadId?: string;
  clientId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function TaskForm({ assignees, leadId, clientId, onSuccess, onCancel }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.get('title'),
        due_date: form.get('due_date') || null,
        assigned_to: assignees ? form.get('assigned_to') || null : undefined,
        lead_id: leadId ?? null,
        client_id: clientId ?? null,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? 'Не удалось создать задачу');
      setPending(false);
      return;
    }

    setPending(false);
    onSuccess();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Что нужно сделать">
        <Input name="title" required maxLength={300} placeholder="Например: перезвонить клиенту" />
      </Field>

      <Field label="Срок">
        <Input name="due_date" type="date" />
      </Field>

      {assignees && (
        <Field label="Исполнитель">
          <Select name="assigned_to" defaultValue="">
            <option value="">На себя</option>
            {assignees.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Создаём…' : 'Создать задачу'}
        </Button>
      </div>
    </form>
  );
}
