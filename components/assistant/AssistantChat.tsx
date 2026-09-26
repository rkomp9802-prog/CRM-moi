'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTIONS = [
  'Что мне сделать сегодня в первую очередь?',
  'Разбери мои заявки: где я теряю клиентов?',
  'Напиши сообщение клиенту, который давно в статусе «Ожидание»',
];

export function AssistantChat({ configured }: { configured: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const question = text.trim();
    if (question === '' || pending) return;

    const next: Message[] = [...messages, { role: 'user', text: question }];
    setMessages(next);
    setInput('');
    setError(null);
    setPending(true);

    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: next }),
    });

    const payload = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setError(payload.error ?? 'Ассистент не ответил');
      return;
    }

    setMessages([...next, { role: 'assistant', text: payload.answer }]);
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(input);
  }

  if (!configured) {
    return (
      <div className="card px-6 py-10 text-center">
        <p className="text-sm">Ассистент не настроен.</p>
        <p className="mt-2 text-sm text-muted">
          Получите ключ на aistudio.google.com и добавьте <code className="font-mono">GEMINI_API_KEY</code> в{' '}
          <code className="font-mono">.env.local</code>, затем перезапустите сервер.
        </p>
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="card min-h-[320px] flex-1 space-y-4 p-5">
        {messages.length === 0 ? (
          <div className="space-y-3 py-6">
            <p className="text-center text-sm text-muted">
              Помощник видит ваши заявки, клиентов и задачи. Спросите что-нибудь:
            </p>
            <div className="flex flex-col items-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-md border border-line px-3 py-1.5 text-sm text-muted transition hover:border-line-strong hover:text-ink"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-accent-soft text-ink'
                    : 'border border-line bg-canvas text-ink'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))
        )}

        {pending && <p className="text-sm text-muted">Думает…</p>}
        {error && (
          <p className="rounded-md border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <Textarea
          rows={2}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Спросите про заявки, задачи или попросите написать текст клиенту"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send(input);
            }
          }}
        />
        <Button type="submit" disabled={pending || input.trim() === ''}>
          {pending ? '…' : 'Отправить'}
        </Button>
      </form>

      <p className="text-xs text-muted">
        Данные заявок уходят в Google Gemini. Не спрашивайте о том, что нельзя передавать наружу.
      </p>
    </div>
  );
}
