'use client';

import Link from 'next/link';
import { useDraggable } from '@dnd-kit/core';
import { LEAD_SOURCE_LABELS, type LeadWithRelations } from '@/types/crm.types';

interface Props {
  lead: LeadWithRelations;
  showAssignee: boolean;
}

export function LeadCard({ lead, showAssignee }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={`card cursor-grab touch-none p-3 text-sm active:cursor-grabbing ${
        isDragging ? 'opacity-50 shadow-md' : ''
      }`}
    >
      <Link
        href={`/leads/${lead.id}`}
        className="font-medium hover:text-accent"
        draggable={false}
      >
        {lead.client_name}
      </Link>
      <p className="mt-1 text-xs text-muted">{LEAD_SOURCE_LABELS[lead.source]}</p>

      {lead.value != null && (
        <p className="mt-2 text-xs font-medium">{lead.value.toLocaleString('ru-RU')} сум</p>
      )}

      {showAssignee && (
        <p className="mt-2 border-t border-line pt-2 text-xs text-muted">
          {lead.assigned_to_name ?? 'Не назначен'}
        </p>
      )}
    </div>
  );
}
