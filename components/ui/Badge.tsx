import { LEAD_STATUS_LABELS, type LeadStatus } from '@/types/crm.types';

const statusStyles: Record<LeadStatus, string> = {
  new: 'bg-canvas text-muted border-line-strong',
  in_progress: 'bg-accent-soft text-accent border-accent/20',
  waiting: 'bg-warn-soft text-warn border-warn/20',
  won: 'bg-success-soft text-success border-success/20',
  lost: 'bg-danger-soft text-danger border-danger/20',
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}
