import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/compatibility/**/*.compat.ts'],
    testTimeout: 15_000,
    pool: 'threads',
    maxWorkers: 1,
  },
});
