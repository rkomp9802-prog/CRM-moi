'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import type { Client } from '@/types/crm.types';

interface Props {
  onSuccess: (client: Client) => void;
  onCancel?: () => void;
}

export function ClientForm({ onSuccess, onCancel }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error ?? 'Не удалось сохранить клиента');
      setPending(false);
      return;
    }

    setPending(false);
    onSuccess(payload as Client);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Имя">
        <Input name="name" required maxLength={200} />
      </Field>
      <Field label="Телефон">
        <Input name="phone" required maxLength={50} placeholder="+998 90 000 00 00" />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" maxLength={200} />
      </Field>
      <Field label="Заметки">
        <Textarea name="notes" rows={3} />
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Сохраняем…' : 'Сохранить'}
        </Button>
      </div>
    </form>
  );
}
