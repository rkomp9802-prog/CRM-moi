import { apiRoute, ApiError } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { sendTelegramMessage, telegramConfigured } from '@/lib/telegram';

export const POST = apiRoute<unknown>(async () => {
  await requireAdmin();

  if (!telegramConfigured()) {
    throw new ApiError(503, 'Не заданы TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID');
  }

  try {
    await sendTelegramMessage('<b>CRM</b>\nПроверка связи — уведомления работают.');
  } catch (error) {
    // Причину от Telegram показываем как есть: без неё настройку не отладить.
    throw new ApiError(502, error instanceof Error ? error.message : 'Telegram не ответил');
  }

  return Response.json({ ok: true });
});
