'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import {
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadStatus,
  type LeadWithRelations,
  type User,
} from '@/types/crm.types';

interface Props {
  lead: LeadWithRelations;
  /** Передаётся только админу — переназначать исполнителя может он один. */
  assignees?: User[];
}

export function LeadEditor({ lead, assignees }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [assignedTo, setAssignedTo] = useState(lead.assigned_to ?? '');
  const [source, setSource] = useState(lead.source);
  const [value, setValue] = useState(lead.value?.toString() ?? '');
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);

    const body: Record<string, unknown> = {
      status,
      source,
      value: value === '' ? null : Number(value),
      notes: notes.trim() === '' ? null : notes,
    };
    if (assignees) body.assigned_to = assignedTo || null;

    const response = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setPending(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      toast(payload.error ?? 'Не удалось сохранить заявку');
      return;
    }

    toast('Заявка сохранена', 'success');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Field label="Статус">
        <Select value={status} onChange={(event) => setStatus(event.target.value as LeadStatus)}>
          {LEAD_STATUSES.map((item) => (
            <option key={item} value={item}>
              {LEAD_STATUS_LABELS[item]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Источник">
        <Select
          value={source}
          onChange={(event) => setSource(event.target.value as typeof source)}
        >
          {LEAD_SOURCES.map((item) => (
            <option key={item} value={item}>
              {LEAD_SOURCE_LABELS[item]}
            </option>
          ))}
        </Select>
      </Field>

      {assignees ? (
        <Field label="Исполнитель">
          <Select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
            <option value="">Не назначен</option>
            {assignees.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <div>
          <span className="label">Исполнитель</span>
          <p className="text-sm">{lead.assigned_to_name ?? 'Не назначен'}</p>
        </div>
      )}

      <Field label="Сумма сделки">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>

      <Field label="Заметки">
        <Textarea rows={6} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Field>

      <Button onClick={save} disabled={pending} className="w-full">
        {pending ? 'Сохраняем…' : 'Сохранить'}
      </Button>
    </div>
  );
}
