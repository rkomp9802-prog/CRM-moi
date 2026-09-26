'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LeadForm } from '@/components/forms/LeadForm';
import type { Client, User } from '@/types/crm.types';

interface Props {
  clients: Client[];
  assignees?: User[];
  fixedClientId?: string;
  label?: string;
}

export function NewLeadButton({ clients, assignees, fixedClientId, label = '+ Новая заявка' }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>{label}</Button>
      <Modal open={open} title="Новая заявка" onClose={() => setOpen(false)}>
        <LeadForm
          clients={clients}
          assignees={assignees}
          fixedClientId={fixedClientId}
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
