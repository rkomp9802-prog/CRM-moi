import { requireUser } from '@/lib/session';
import { geminiConfigured } from '@/lib/gemini';
import { PageHeader } from '@/components/ui/PageHeader';
import { AssistantChat } from '@/components/assistant/AssistantChat';

export const metadata = { title: 'Ассистент — CRM' };

export default async function AssistantPage() {
  const session = await requireUser();

  return (
    <>
      <PageHeader
        title="Ассистент"
        subtitle={
          session.role === 'admin'
            ? 'Видит все заявки и задачи компании'
            : 'Видит только ваши заявки и задачи'
        }
      />
      <AssistantChat configured={geminiConfigured()} />
    </>
  );
}
