import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { requireTestDatabaseUrl } from './test-database-url.mjs';

const testDatabaseUrl = requireTestDatabaseUrl(process.env.TEST_DATABASE_URL, {
  ci: process.env.CI === 'true',
});

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prismaCli = path.join(repositoryRoot, 'node_modules', 'prisma', 'build', 'index.js');
const vitestCli = path.join(repositoryRoot, 'node_modules', 'vitest', 'vitest.mjs');
const env = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  // Prisma CLI reads DIRECT_URL from prisma.config.ts. Pin both URLs to the
  // validated test database so a developer's migration URL can never leak
  // into an integration run.
  DIRECT_URL: testDatabaseUrl,
  NODE_ENV: 'test',
};

async function run(cli, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(cli)} ${args.join(' ')} failed (${signal ?? code}).`));
    });
  });
}

await run(prismaCli, ['generate']);
await run(prismaCli, ['migrate', 'deploy']);
await run(vitestCli, ['run', '--config', 'src/__tests__/integration/vitest.config.mts']);
