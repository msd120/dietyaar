import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { finalizeMediaUpload } from '@/services/media/media-service';

const schema = z.object({ assetId: z.string().cuid() });

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'MEDIA_INVALID' }, { status: 400 });
  try {
    const asset = await finalizeMediaUpload({
      userId: session.user.id,
      assetId: parsed.data.assetId,
    });
    return Response.json({ assetId: asset.id, state: asset.state });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'UNKNOWN' },
      { status: 400 },
    );
  }
}
