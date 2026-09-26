import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Вход — CRM' };

export default async function LoginPage() {
  if (await getSession()) redirect('/dashboard');

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">CRM</p>
          <h1 className="mt-2 text-2xl font-semibold">Вход в систему</h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
