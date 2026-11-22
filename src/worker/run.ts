import 'server-only';
import { randomUUID } from 'node:crypto';
import { env } from '@/lib/env';
import { processNextJob } from '@/worker/processor';

async function main() {
  if (!env.WORKER_ENABLED) throw new Error('Worker is disabled by configuration.');
  const workerId = `dietyaar-${randomUUID()}`;
  for (;;) {
    const processed = await processNextJob({ workerId, handlers: {} });
    if (!processed) await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

void main();
