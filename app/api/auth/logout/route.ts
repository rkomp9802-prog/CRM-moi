import { cookies } from 'next/headers';
import { apiRoute } from '@/lib/api';
import { SESSION_COOKIE } from '@/lib/auth';

export const POST = apiRoute<unknown>(async () => {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
});
