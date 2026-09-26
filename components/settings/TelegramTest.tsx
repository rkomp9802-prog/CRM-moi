'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function TelegramTest({ configured }: { configured: boolean }) {
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function test() {
    setPending(true);
    setState(null);

    const response = await fetch('/api/integrations/telegram-test', { method: 'POST' });
    const payload = await response.json().catch(() => ({}));

    setPending(false);
    setState(
      response.ok
        ? { ok: true, text: 'Сообщение отправлено — проверьте чат' }
        : { ok: false, text: payload.error ?? 'Не получилось' },
    );
  }

  return (
    <div className="space-y-3">
      <Button variant="secondary" onClick={test} disabled={pending || !configured}>
        {pending ? 'Отправляем…' : 'Отправить тестовое сообщение'}
      </Button>

      {state && (
        <p className={`text-sm ${state.ok ? 'text-success' : 'text-danger'}`}>{state.text}</p>
      )}
    </div>
  );
}
