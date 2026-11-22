import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getOwnedMediaAccess } from '@/services/media/media-service';

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const parsed = z.string().cuid().safeParse(new URL(request.url).searchParams.get('assetId'));
  if (!parsed.success) return Response.json({ error: 'MEDIA_NOT_FOUND' }, { status: 404 });
  try {
    return Response.json(
      await getOwnedMediaAccess({ userId: session.user.id, assetId: parsed.data }),
      {
        headers: { 'Cache-Control': 'private, no-store' },
      },
    );
  } catch {
    return Response.json({ error: 'MEDIA_NOT_FOUND' }, { status: 404 });
  }
}
