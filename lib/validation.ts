import { badRequest } from '@/lib/api';

export function requireString(
  body: Record<string, unknown>,
  field: string,
  label: string,
  maxLength = 500,
): string {
  const value = body[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw badRequest(`Поле «${label}» обязательно`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw badRequest(`Поле «${label}» длиннее ${maxLength} символов`);
  }
  return trimmed;
}

/** Необязательная строка: пустая строка и null означают «очистить поле». */
export function optionalString(
  body: Record<string, unknown>,
  field: string,
  label: string,
  maxLength = 5000,
): string | null | undefined {
  if (!(field in body)) return undefined;
  const value = body[field];
  if (value === null || value === '') return null;
  if (typeof value !== 'string') throw badRequest(`Поле «${label}» должно быть строкой`);
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (trimmed.length > maxLength) {
    throw badRequest(`Поле «${label}» длиннее ${maxLength} символов`);
  }
  return trimmed;
}

export function requireEnum<T extends string>(
  body: Record<string, unknown>,
  field: string,
  label: string,
  allowed: readonly T[],
): T {
  const value = body[field];
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw badRequest(`Недопустимое значение поля «${label}»`);
  }
  return value as T;
}

export function optionalEnum<T extends string>(
  body: Record<string, unknown>,
  field: string,
  label: string,
  allowed: readonly T[],
): T | undefined {
  if (!(field in body)) return undefined;
  return requireEnum(body, field, label, allowed);
}

export function optionalNumber(
  body: Record<string, unknown>,
  field: string,
  label: string,
): number | null | undefined {
  if (!(field in body)) return undefined;
  const value = body[field];
  if (value === null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw badRequest(`Поле «${label}» должно быть неотрицательным числом`);
  }
  return parsed;
}

/** Дата в формате YYYY-MM-DD — так её отдаёт <input type="date">. */
export function optionalDate(
  body: Record<string, unknown>,
  field: string,
  label: string,
): string | null | undefined {
  if (!(field in body)) return undefined;
  const value = body[field];
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw badRequest(`Поле «${label}» должно быть датой в формате ГГГГ-ММ-ДД`);
  }
  return value;
}

export function normalizeEmail(value: unknown, label = 'Email'): string {
  if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    throw badRequest(`Поле «${label}» должно быть корректным адресом почты`);
  }
  return value.trim().toLowerCase();
}
