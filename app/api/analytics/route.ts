import { apiRoute } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { getAnalytics } from '@/lib/analytics';

export const GET = apiRoute<unknown>(async () => {
  const session = await requireUser();
  return Response.json(await getAnalytics(session));
});
