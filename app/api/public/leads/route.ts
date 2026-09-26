import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { badRequest, readJson, ApiError } from '@/lib/api';
import { createLeadFromWebsite } from '@/lib/leads';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Публичный приём заявок с формы обратной связи на сайте (раздел 13.1 спеки).
 * Единственный роут без сессии, поэтому вход закрыт ключом, списком разрешённых
 * доменов и ограничением частоты.
 */

const MAX_PER_IP = 10;
const WINDOW_MS = 10 * 60 * 1000;

function allowedOrigins(): string[] {
  return (process.env.INTAKE_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * CORS нужен, только если форма отправляет данные прямо из браузера посетителя.
 * Заголовки выдаём исключительно перечисленным доменам, чужим — ничего.
 */
function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  if (!origin || !allowedOrigins().includes(origin)) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function checkKey(request: NextRequest): void {
  const expected = process.env.INTAKE_API_KEY;
  if (!expected) {
    // Без ключа эндпоинт был бы открыт всему интернету — лучше честно не работать.
    throw new ApiError(503, 'Приём заявок не настроен: не задан INTAKE_API_KEY');
  }

  const provided =
    request.headers.get('x-api-key') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    '';

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ApiError(401, 'Неверный ключ доступа');
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

// Здесь не используется общий apiRoute: к ответам об ошибках тоже нужны CORS-заголовки,
// иначе браузер не покажет форме причину отказа.
export async function POST(request: NextRequest) {
  const headers = corsHeaders(request);

  try {
    checkKey(request);

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    if (!rateLimit(`intake:${ip}`, MAX_PER_IP, WINDOW_MS)) {
      throw new ApiError(429, 'Слишком много заявок подряд, попробуйте позже');
    }

    const body = await readJson(request);

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) throw badRequest('Поле «name» обязательно');
    if (name.length > 200) throw badRequest('Слишком длинное имя');

    const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 50) : null;
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : null;
    const message = typeof body.message === 'string' ? body.message.slice(0, 5000) : null;

    const { lead, clientCreated } = await createLeadFromWebsite({ name, phone, email, message });

    return Response.json({ ok: true, leadId: lead.id, clientCreated }, { status: 201, headers });
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ error: error.message }, { status: error.status, headers });
    }
    console.error('[intake]', error);
    return Response.json({ error: 'Внутренняя ошибка сервера' }, { status: 500, headers });
  }
}
