import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';

// В Next.js 16 middleware.ts переименован в proxy.ts и работает в Node-рантайме.
// Здесь только «оптимистичная» проверка: реальные права каждый route проверяет сам
// через requireUser()/requireAdmin() — см. lib/session.ts.

// Приём заявок с сайта сессии не требует — он закрыт ключом внутри самого роута.
const PUBLIC_API = ['/api/auth/login', '/api/public/leads'];
const ADMIN_ONLY = ['/users', '/api/users', '/settings', '/api/integrations'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api');

  if (PUBLIC_API.some((path) => pathname === path)) {
    return NextResponse.next();
  }

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    // Для API отвечаем JSON, иначе fetch на клиенте получил бы HTML страницы логина.
    if (isApi) {
      return NextResponse.json({ error: 'Требуется вход в систему' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/dashboard') loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.role !== 'admin' && ADMIN_ONLY.some((path) => pathname.startsWith(path))) {
    if (isApi) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/clients/:path*',
    '/tasks/:path*',
    '/users/:path*',
    '/profile/:path*',
    '/assistant/:path*',
    '/settings/:path*',
    '/api/:path*',
  ],
};
