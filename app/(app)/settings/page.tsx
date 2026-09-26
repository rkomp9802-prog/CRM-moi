import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { geminiConfigured } from '@/lib/gemini';
import { telegramConfigured } from '@/lib/telegram';
import { PageHeader } from '@/components/ui/PageHeader';
import { TelegramTest } from '@/components/settings/TelegramTest';

export const metadata = { title: 'Интеграции — CRM' };

function Status({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="text-sm text-success">Настроено</span>
  ) : (
    <span className="text-sm text-warn">Не настроено</span>
  );
}

function Panel({
  title,
  ok,
  children,
}: {
  title: string;
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Status ok={ok} />
      </div>
      <div className="space-y-3 text-sm text-muted">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  const gemini = geminiConfigured();
  const telegram = telegramConfigured();
  const intake = Boolean(process.env.INTAKE_API_KEY);

  return (
    <>
      <PageHeader
        title="Интеграции"
        subtitle="Значения задаются переменными окружения: локально в .env.local, на Vercel — в настройках проекта"
      />

      <div className="grid max-w-3xl gap-5">
        <Panel title="Ассистент (Google Gemini)" ok={gemini}>
          <p>
            Отвечает на вопросы по заявкам и задачам на странице «Ассистент». Ключ получают на
            aistudio.google.com.
          </p>
          <p className="font-mono text-xs">GEMINI_API_KEY, GEMINI_MODEL (необязательно)</p>
        </Panel>

        <Panel title="Уведомления в Telegram" ok={telegram}>
          <p>
            При заявке с сайта бот присылает сообщение в указанный чат. Токен берут у @BotFather,
            идентификатор чата — у @userinfobot.
          </p>
          <p className="font-mono text-xs">TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID</p>
          <TelegramTest configured={telegram} />
        </Panel>

        <Panel title="Приём заявок с сайта" ok={intake}>
          <p>
            Форма на сайте отправляет данные на <code className="font-mono">POST /api/public/leads</code> с
            заголовком <code className="font-mono">X-Api-Key</code>.
          </p>
          <p className="font-mono text-xs">INTAKE_API_KEY, INTAKE_ALLOWED_ORIGINS</p>
        </Panel>
      </div>
    </>
  );
}
