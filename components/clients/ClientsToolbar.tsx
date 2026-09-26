'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ClientForm } from '@/components/forms/ClientForm';

export function ClientsToolbar({ initialSearch }: { initialSearch: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const query = search.trim();
    startTransition(() => router.push(query ? `/clients?search=${encodeURIComponent(query)}` : '/clients'));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form onSubmit={onSearch} className="flex gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по имени или телефону"
          className="w-64"
        />
        <Button type="submit" variant="secondary">
          Найти
        </Button>
      </form>

      <Button onClick={() => setOpen(true)}>+ Новый клиент</Button>

      <Modal open={open} title="Новый клиент" onClose={() => setOpen(false)}>
        <ClientForm
          onCancel={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
