'use client';

import { useDroppable } from '@dnd-kit/core';
import { LEAD_STATUS_LABELS, type LeadStatus, type LeadWithRelations } from '@/types/crm.types';
import { LeadCard } from './LeadCard';

interface Props {
  status: LeadStatus;
  leads: LeadWithRelations[];
  showAssignee: boolean;
}

export function KanbanColumn({ status, leads, showAssignee }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-64 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-medium tracking-wide text-muted uppercase">
          {LEAD_STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-faint">{leads.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[60vh] flex-col gap-2 rounded-lg border border-dashed p-2 transition ${
          isOver ? 'border-accent bg-accent-soft' : 'border-line bg-canvas'
        }`}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} showAssignee={showAssignee} />
        ))}
      </div>
    </div>
  );
}
