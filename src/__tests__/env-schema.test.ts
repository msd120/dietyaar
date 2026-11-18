import { describe, expect, it } from 'vitest';
import { parseServerEnv } from '@/lib/env-schema';

const core = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/dietyaar_test',
};

describe('server environment contract', () => {
  it('boots core mode without storage, worker, or AI credentials', () => {
    const env = parseServerEnv(core);

    expect(env.MEDIA_STORAGE_ENABLED).toBe(false);
    expect(env.WORKER_ENABLED).toBe(false);
    expect(env.AI_PLAN_IMAGE_ENABLED).toBe(false);
    expect(env.AI_MEAL_PHOTO_ENABLED).toBe(false);
    expect(env.AI_REFLECTION_ENABLED).toBe(false);
  });

  it('requires all private storage settings when media storage is enabled', () => {
    expect(() => parseServerEnv({ ...core, MEDIA_STORAGE_ENABLED: 'true' })).toThrow(
      /SUPABASE_URL is required/,
    );
  });

  it('requires worker and provider configuration when AI is enabled', () => {
    expect(() => parseServerEnv({ ...core, AI_REFLECTION_ENABLED: 'true' })).toThrow(
      /WORKER_ENABLED must be true/,
    );
  });

  it('requires media storage for image AI but not deterministic core mode', () => {
    expect(() =>
      parseServerEnv({
        ...core,
        WORKER_ENABLED: 'true',
        AI_PLAN_IMAGE_ENABLED: 'true',
        AI_PROVIDER: 'gapgpt',
        AI_PROVIDER_BASE_URL: 'https://api.gapgpt.app/v1',
        AI_PROVIDER_API_KEY: 'test-key',
        AI_PROVIDER_MODEL: 'test-model',
      }),
    ).toThrow(/MEDIA_STORAGE_ENABLED must be true/);
  });

  it('accepts a fully configured enhanced mode', () => {
    const env = parseServerEnv({
      ...core,
      MEDIA_STORAGE_ENABLED: 'true',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
      SUPABASE_STORAGE_BUCKET: 'private-media',
      WORKER_ENABLED: 'true',
      AI_PLAN_IMAGE_ENABLED: 'true',
      AI_PROVIDER: 'gapgpt',
      AI_PROVIDER_BASE_URL: 'https://api.gapgpt.app/v1',
      AI_PROVIDER_API_KEY: 'test-key',
      AI_PROVIDER_MODEL: 'test-model',
    });

    expect(env.MEDIA_STORAGE_ENABLED).toBe(true);
    expect(env.AI_PLAN_IMAGE_ENABLED).toBe(true);
  });

  it('rejects non-PostgreSQL database URLs', () => {
    expect(() => parseServerEnv({ ...core, DATABASE_URL: 'https://example.com' })).toThrow(
      /postgresql:\/\//,
    );
  });
});
