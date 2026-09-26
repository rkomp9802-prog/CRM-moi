'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { USER_ROLE_LABELS, type User } from '@/types/crm.types';

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState<string | null>(user.avatar_url);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== '' && password !== repeat) {
      setError('Новый пароль и повтор не совпадают');
      return;
    }

    setPending(true);

    const body: Record<string, unknown> = { name, email, avatar_url: avatar };
    if (password !== '') {
      body.password = password;
      body.current_password = currentPassword;
    }

    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setPending(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? 'Не удалось сохранить профиль');
      return;
    }

    setCurrentPassword('');
    setPassword('');
    setRepeat('');
    toast('Профиль сохранён', 'success');
    // Шапка и списки сотрудников берут данные с сервера — обновляем их.
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <section className="card p-5">
        <h2 className="mb-4 text-xs font-medium tracking-wide text-muted uppercase">Аватар</h2>
        <AvatarPicker name={name} value={avatar} onChange={setAvatar} />
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Данные</h2>

        <Field label="Имя">
          <Input value={name} onChange={(event) => setName(event.target.value)} required maxLength={200} />
        </Field>

        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={200}
          />
        </Field>

        <div>
          <span className="label">Роль</span>
          <p className="text-sm">
            {USER_ROLE_LABELS[user.role]}
            <span className="ml-2 text-muted">— меняет только администратор</span>
          </p>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Смена пароля</h2>
          <p className="mt-1 text-xs text-muted">Оставьте поля пустыми, если пароль менять не нужно.</p>
        </div>

        <Field label="Текущий пароль">
          <Input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </Field>

        <Field label="Новый пароль">
          <Input
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <Field label="Повторите новый пароль">
          <Input
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
          />
        </Field>
      </section>

      {error && (
        <p className="rounded-md border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Сохраняем…' : 'Сохранить'}
      </Button>
    </form>
  );
}
