import { headers } from 'next/headers';
import { z } from 'zod';
import { deleteCurrentAccount } from '@/services/identity/identity-service';
import { isSameOrigin } from '@/lib/request-security';

const schema = z.object({ password: z.string().min(1).max(128) });
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: 'DELETE_FAILED' }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'DELETE_FAILED' }, { status: 400 });
  try {
    const response = await deleteCurrentAccount({
      headers: await headers(),
      password: parsed.data.password,
    });
    if (!response.ok) return Response.json({ error: 'DELETE_FAILED' }, { status: 400 });
    return response;
  } catch {
    return Response.json({ error: 'DELETE_FAILED' }, { status: 400 });
  }
}
