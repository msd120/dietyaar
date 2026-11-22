import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/** Prisma CLI configuration (replaces the deprecated `package.json#prisma` block). */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Use the dedicated migration role for schema changes. Runtime Prisma
    // continues to use the least-privilege role from DATABASE_URL.
    url: env('DIRECT_URL'),
  },
});
