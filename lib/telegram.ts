/**
 * Уведомления в Telegram о новых заявках.
 * Нужны TELEGRAM_BOT_TOKEN (от @BotFather) и TELEGRAM_CHAT_ID (куда слать).
 */

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/** Текст уходит с parse_mode=HTML, поэтому данные клиента экранируем. */
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('Не заданы TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID');

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { description?: string };
    throw new Error(body.description ?? `Telegram ответил кодом ${response.status}`);
  }
}

interface LeadNotification {
  name: string;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
  source: string;
}

/**
 * Уведомление о заявке с сайта. Намеренно не бросает исключение:
 * упавший Telegram не должен ломать приём заявки — клиент уже отправил форму.
 */
export async function notifyNewLead(lead: LeadNotification): Promise<void> {
  if (!telegramConfigured()) return;

  const lines = [
    '<b>Новая заявка с сайта</b>',
    '',
    `<b>Имя:</b> ${escapeHtml(lead.name)}`,
  ];
  if (lead.phone) lines.push(`<b>Телефон:</b> ${escapeHtml(lead.phone)}`);
  if (lead.email) lines.push(`<b>Email:</b> ${escapeHtml(lead.email)}`);
  if (lead.message) lines.push('', `<b>Сообщение:</b>`, escapeHtml(lead.message));
  lines.push('', `<i>Источник: ${escapeHtml(lead.source)}</i>`);

  try {
    await sendTelegramMessage(lines.join('\n'));
  } catch (error) {
    console.error('[telegram]', error);
  }
}
