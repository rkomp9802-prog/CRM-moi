import type { NextRequest } from 'next/server';

/** Ошибка, которую можно безопасно показать клиенту вместе с HTTP-статусом. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const badRequest = (message: string) => new ApiError(400, message);
export const unauthorized = () => new ApiError(401, 'Требуется вход в систему');
export const forbidden = () => new ApiError(403, 'Недостаточно прав');
export const notFound = (what = 'Запись') => new ApiError(404, `${what} не найдена`);

type Handler<C> = (request: NextRequest, context: C) => Promise<Response>;

/**
 * Оборачивает route handler: ApiError превращается в понятный JSON-ответ,
 * всё остальное — в 500 без деталей наружу (детали остаются в логе сервера).
 */
export function apiRoute<C>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return Response.json({ error: error.message }, { status: error.status });
      }
      console.error('[api]', error);
      return Response.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
  };
}

export async function readJson(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw badRequest('Ожидался JSON-объект');
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw badRequest('Некорректный JSON в теле запроса');
  }
}
