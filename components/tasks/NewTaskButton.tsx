'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TaskForm } from '@/components/forms/TaskForm';
import type { User } from '@/types/crm.types';

interface Props {
  assignees?: User[];
  leadId?: string;
  clientId?: string;
  label?: string;
  variant?: 'primary' | 'secondary';
}

export function NewTaskButton({ assignees, leadId, clientId, label = '+ Новая задача', variant = 'primary' }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal open={open} title="Новая задача" onClose={() => setOpen(false)}>
        <TaskForm
          assignees={assignees}
          leadId={leadId}
          clientId={clientId}
          onCancel={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
