import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/integration/**/*.integration.ts'],
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 20_000,
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, '../..') },
  },
});
