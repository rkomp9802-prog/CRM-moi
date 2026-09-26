import { badRequest } from '@/lib/api';

/** Картинку храним прямо в базе, поэтому держим её маленькой. */
export const MAX_AVATAR_BYTES = 400 * 1024;
export const MAX_AVATAR_URL_LENGTH = 2000;

const DATA_URL = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/;

/**
 * Приводит значение аватара к одному из двух допустимых видов: data:image/... или http(s)-ссылка.
 * Всё остальное — включая javascript: и прочие схемы — отбрасывается: значение потом
 * подставляется в src картинки, и пропускать туда произвольную строку нельзя.
 */
export function normalizeAvatar(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') throw badRequest('Аватар должен быть строкой');

  const trimmed = value.trim();
  if (trimmed === '') return null;

  if (trimmed.startsWith('data:')) {
    const match = DATA_URL.exec(trimmed);
    if (!match) throw badRequest('Поддерживаются только картинки PNG, JPEG, WebP и GIF');

    // base64 раздувает данные примерно на треть — считаем исходный размер.
    const bytes = Math.floor((match[2].length * 3) / 4);
    if (bytes > MAX_AVATAR_BYTES) {
      throw badRequest(`Картинка больше ${Math.round(MAX_AVATAR_BYTES / 1024)} КБ`);
    }
    return trimmed;
  }

  if (trimmed.length > MAX_AVATAR_URL_LENGTH) throw badRequest('Ссылка слишком длинная');

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw badRequest('Ссылка на картинку некорректна');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw badRequest('Ссылка должна начинаться с http:// или https://');
  }

  return url.toString();
}

/** Инициалы для заглушки, когда аватара нет. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
