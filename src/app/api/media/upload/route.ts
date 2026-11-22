import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createMediaUploadIntent } from '@/services/media/media-service';

const schema = z.object({
  purpose: z.enum(['PLAN_IMAGE', 'MEAL_IMAGE']),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  byteSize: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'MEDIA_INVALID' }, { status: 400 });
  try {
    return Response.json(
      await createMediaUploadIntent({ userId: session.user.id, ...parsed.data }),
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN';
    const status = code === 'FEATURE_DISABLED' ? 409 : code === 'NO_CONSENT' ? 403 : 400;
    return Response.json({ error: code }, { status });
  }
}
