'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import {
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  type Client,
  type User,
} from '@/types/crm.types';

interface Props {
  clients: Client[];
  /** Активные сотрудники для назначения — передаются только админу. */
  assignees?: User[];
  /** Клиент уже известен (форма открыта из карточки клиента). */
  fixedClientId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function LeadForm({ clients, assignees, fixedClientId, onSuccess, onCancel }: Props) {
  const [mode, setMode] = useState<'existing' | 'new'>(
    fixedClientId || clients.length > 0 ? 'existing' : 'new',
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {
      source: form.get('source'),
      value: form.get('value') || null,
      notes: form.get('notes') || null,
    };

    if (fixedClientId) {
      body.client_id = fixedClientId;
    } else if (mode === 'existing') {
      body.client_id = form.get('client_id');
    } else {
      body.new_client = {
        name: form.get('new_client_name'),
        phone: form.get('new_client_phone'),
        email: form.get('new_client_email') || null,
      };
    }

    if (assignees) {
      body.assigned_to = form.get('assigned_to') || null;
    }

    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? 'Не удалось создать заявку');
      setPending(false);
      return;
    }

    setPending(false);
    onSuccess();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!fixedClientId && (
        <div>
          <span className="label">Клиент</span>
          <div className="mb-2 flex gap-1 rounded-md bg-canvas p-1">
            {(['existing', 'new'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`flex-1 rounded px-3 py-1.5 text-sm transition ${
                  mode === value ? 'bg-surface font-medium shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {value === 'existing' ? 'Существующий' : 'Новый'}
              </button>
            ))}
          </div>

          {mode === 'existing' ? (
            <Select name="client_id" required defaultValue="">
              <option value="" disabled>
                Выберите клиента
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} — {client.phone}
                </option>
              ))}
            </Select>
          ) : (
            <div className="space-y-3">
              <Input name="new_client_name" required placeholder="Имя клиента" maxLength={200} />
              <Input name="new_client_phone" required placeholder="Телефон" maxLength={50} />
              <Input name="new_client_email" type="email" placeholder="Email (необязательно)" />
            </div>
          )}
        </div>
      )}

      <Field label="Источник">
        <Select name="source" defaultValue="manual">
          {LEAD_SOURCES.map((source) => (
            <option key={source} value={source}>
              {LEAD_SOURCE_LABELS[source]}
            </option>
          ))}
        </Select>
      </Field>

      {assignees && (
        <Field label="Исполнитель">
          <Select name="assigned_to" defaultValue="">
            <option value="">Не назначен</option>
            {assignees.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Сумма сделки">
        <Input name="value" type="number" min="0" step="0.01" placeholder="Необязательно" />
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
          {pending ? 'Создаём…' : 'Создать заявку'}
        </Button>
      </div>
    </form>
  );
}
