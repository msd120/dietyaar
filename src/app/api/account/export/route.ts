import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { buildAccountExport } from '@/services/account/export-service';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const archive = await buildAccountExport(session.user.id);
  return new Response(JSON.stringify(archive), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="dietyaar-export.json"',
      'Cache-Control': 'private, no-store',
    },
  });
}
