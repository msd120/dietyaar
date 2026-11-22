import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const required = [
  'DATABASE_URL',
  'DIRECT_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_STORAGE_BUCKET',
];

for (const name of required) {
  if (!process.env[name])
    throw new Error(`${name} is required for the Supabase connectivity test.`);
}

const runtime = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const migrator = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });
const suffix = crypto.randomUUID().replaceAll('-', '');
const table = `_dietyaar_connectivity_${suffix}`;
const objectPath = `connectivity-tests/${suffix}.png`;

const storage = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// A valid 1x1 transparent PNG.
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

let tableCreated = false;
let objectUploaded = false;

try {
  const [runtimeIdentity] = await runtime.$queryRawUnsafe(
    'select current_user as user_name, current_database() as database_name',
  );
  const [migratorIdentity] = await migrator.$queryRawUnsafe(
    'select current_user as user_name, current_database() as database_name',
  );

  await migrator.$executeRawUnsafe(`create table public.${table} (id integer primary key)`);
  tableCreated = true;
  await runtime.$executeRawUnsafe(`insert into public.${table} (id) values (1)`);
  const rows = await runtime.$queryRawUnsafe(`select id from public.${table}`);
  if (rows.length !== 1 || rows[0].id !== 1) throw new Error('Runtime database round-trip failed.');
  await runtime.$executeRawUnsafe(`delete from public.${table} where id = 1`);

  const bucket = storage.storage.from(process.env.SUPABASE_STORAGE_BUCKET);
  const uploaded = await bucket.upload(objectPath, png, {
    contentType: 'image/png',
    upsert: false,
  });
  if (uploaded.error) throw uploaded.error;
  objectUploaded = true;

  const publicUrl = bucket.getPublicUrl(objectPath).data.publicUrl;
  const publicResponse = await fetch(publicUrl, { cache: 'no-store' });
  if (publicResponse.ok) throw new Error('Private object was unexpectedly publicly readable.');

  const signed = await bucket.createSignedUrl(objectPath, 60);
  if (signed.error) throw signed.error;
  const response = await fetch(signed.data.signedUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Signed download failed with HTTP ${response.status}.`);
  const downloaded = Buffer.from(await response.arrayBuffer());
  if (!downloaded.equals(png)) throw new Error('Downloaded object did not match the upload.');

  console.log(
    JSON.stringify({
      database: {
        runtimeRole: runtimeIdentity.user_name,
        migrationRole: migratorIdentity.user_name,
        roundTrip: 'ok',
      },
      storage: { privateRoundTrip: 'ok' },
    }),
  );
} finally {
  if (objectUploaded) {
    const removed = await storage.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET)
      .remove([objectPath]);
    if (removed.error) console.error('Storage cleanup failed:', removed.error.message);
  }
  if (tableCreated) {
    await migrator.$executeRawUnsafe(`drop table if exists public.${table}`);
  }
  await Promise.allSettled([runtime.$disconnect(), migrator.$disconnect()]);
}
