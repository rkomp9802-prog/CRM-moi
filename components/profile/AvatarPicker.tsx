'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import { fileToAvatarDataUrl } from '@/lib/image-resize';

interface Props {
  name: string;
  value: string | null;
  onChange: (value: string | null) => void;
}

type Mode = 'file' | 'link';

export function AvatarPicker({ name, value, onChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('file');
  const [link, setLink] = useState(value && !value.startsWith('data:') ? value : '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await fileToAvatarDataUrl(file));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Не удалось обработать файл');
    } finally {
      setBusy(false);
      // Сбрасываем input, иначе повторный выбор того же файла не вызовет onChange.
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function applyLink() {
    const trimmed = link.trim();
    if (trimmed === '') {
      setError('Вставьте ссылку на картинку');
      return;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      setError('Ссылка должна начинаться с http:// или https://');
      return;
    }
    setError(null);
    onChange(trimmed);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <Avatar name={name} src={value} size="lg" />

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex gap-1 rounded-md bg-canvas p-1">
          {(
            [
              ['file', 'С компьютера'],
              ['link', 'По ссылке'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                setError(null);
              }}
              className={`flex-1 rounded px-3 py-1.5 text-sm transition ${
                mode === id ? 'bg-surface font-medium text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'file' ? (
          <div className="space-y-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onFile(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              {busy ? 'Обрабатываем…' : 'Выбрать файл'}
            </Button>
            <p className="text-xs text-muted">
              Картинка обрезается по центру до квадрата и уменьшается до 256×256 прямо в браузере.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={link}
                onChange={(event) => setLink(event.target.value)}
                placeholder="https://example.com/photo.jpg"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    applyLink();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={applyLink}>
                Показать
              </Button>
            </div>
            <p className="text-xs text-muted">
              Сохраняется сама ссылка: если картинку удалят с того сайта, аватар пропадёт.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setLink('');
              setError(null);
            }}
            className="text-sm text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Убрать аватар
          </button>
        )}
      </div>
    </div>
  );
}
