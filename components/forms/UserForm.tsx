'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { USER_ROLE_LABELS } from '@/types/crm.types';

interface Props {
  onSuccess: () => void;
  onCancel?: () => void;
}

/** Генерируем временный пароль здесь же, чтобы админу не пришлось его выдумывать. */
function suggestPassword(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(
    crypto.getRandomValues(new Uint32Array(12)),
    (n) => alphabet[n % alphabet.length],
  ).join('');
}

export function UserForm({ onSuccess, onCancel }: Props) {
  const [password, setPassword] = useState(suggestPassword);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        role: form.get('role'),
        password,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? 'Не удалось создать сотрудника');
      setPending(false);
      return;
    }

    setPending(false);
    onSuccess();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Имя">
        <Input name="name" required maxLength={200} />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" required maxLength={200} />
      </Field>
      <Field label="Роль">
        <Select name="role" defaultValue="manager">
          <option value="manager">{USER_ROLE_LABELS.manager}</option>
          <option value="admin">{USER_ROLE_LABELS.admin}</option>
        </Select>
      </Field>

      <Field label="Временный пароль">
        <div className="flex gap-2">
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            className="font-mono"
          />
          <Button type="button" variant="secondary" onClick={() => setPassword(suggestPassword())}>
            Другой
          </Button>
        </div>
      </Field>
      <p className="text-xs text-muted">
        Передайте пароль сотруднику лично — после создания он больше нигде не показывается.
      </p>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Создаём…' : 'Создать сотрудника'}
        </Button>
      </div>
    </form>
  );
}
