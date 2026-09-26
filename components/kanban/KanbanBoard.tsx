'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { LEAD_STATUSES, type LeadStatus, type LeadWithRelations } from '@/types/crm.types';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { KanbanColumn } from './KanbanColumn';

interface Props {
  initialLeads: LeadWithRelations[];
  showAssignee: boolean;
}

export function KanbanBoard({ initialLeads, showAssignee }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [leads, setLeads] = useState(initialLeads);
  const [lastServerLeads, setLastServerLeads] = useState(initialLeads);
  const [lostCandidate, setLostCandidate] = useState<LeadWithRelations | null>(null);
  const [reason, setReason] = useState('');

  // Данные приходят с сервера: после создания заявки или router.refresh() берём свежий список
  // и сбрасываем локальное оптимистичное состояние.
  if (lastServerLeads !== initialLeads) {
    setLastServerLeads(initialLeads);
    setLeads(initialLeads);
  }

  // Небольшой порог, чтобы обычный клик по карточке открывал заявку, а не начинал перетаскивание.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function moveLead(lead: LeadWithRelations, status: LeadStatus, notes?: string) {
    const snapshot = leads;
    // Оптимистично двигаем карточку, чтобы интерфейс отвечал сразу.
    setLeads((current) =>
      current.map((item) => (item.id === lead.id ? { ...item, status, notes: notes ?? item.notes } : item)),
    );

    const response = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes === undefined ? { status } : { status, notes }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      // Откатываем: иначе доска показывала бы статус, которого нет в базе.
      setLeads(snapshot);
      toast(payload.error ?? 'Не удалось изменить статус заявки');
      return;
    }

    router.refresh();
  }

  function onDragEnd(event: DragEndEvent) {
    const status = event.over?.id as LeadStatus | undefined;
    if (!status) return;

    const lead = leads.find((item) => item.id === event.active.id);
    if (!lead || lead.status === status) return;

    if (status === 'lost') {
      setReason('');
      setLostCandidate(lead);
      return;
    }

    void moveLead(lead, status);
  }

  function confirmLost() {
    if (!lostCandidate) return;
    const text = reason.trim();
    const notes = text
      ? `${lostCandidate.notes ? `${lostCandidate.notes}\n` : ''}Причина отказа: ${text}`
      : undefined;

    void moveLead(lostCandidate, 'lost', notes);
    setLostCandidate(null);
  }

  return (
    <>
      {/* Явный id: без него dnd-kit нумерует служебные aria-id по счётчику модуля,
          и они расходятся между серверным и клиентским рендером. */}
      <DndContext id="kanban" sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {LEAD_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={leads.filter((lead) => lead.status === status)}
              showAssignee={showAssignee}
            />
          ))}
        </div>
      </DndContext>

      <Modal
        open={lostCandidate !== null}
        title="Причина отказа"
        onClose={() => setLostCandidate(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Заявка клиента {lostCandidate?.client_name} переносится в «Отказ». Причина допишется к
            заметкам заявки.
          </p>
          <Textarea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Например: дорого, выбрал конкурента"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setLostCandidate(null)}>
              Отмена
            </Button>
            <Button onClick={confirmLost}>Перенести в «Отказ»</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
